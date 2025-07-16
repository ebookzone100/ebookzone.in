from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta
import jwt
import functools
from src.models.user import db, User, UserRole
from src.models.analytics import AuditLog

auth_bp = Blueprint('auth', __name__)

def generate_token(user):
    """Generate JWT token for user"""
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role.value,
        'exp': datetime.utcnow() + timedelta(hours=24),  # Token expires in 24 hours
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require valid JWT token"""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        # Get user from database
        current_user = User.query.get(payload['user_id'])
        if not current_user or not current_user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Add current_user to request context
        request.current_user = current_user
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator to require admin role"""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'error': 'Authentication required'}), 401
        
        if request.current_user.role != UserRole.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated

def editor_or_admin_required(f):
    """Decorator to require editor or admin role"""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'error': 'Authentication required'}), 401
        
        if request.current_user.role not in [UserRole.ADMIN, UserRole.EDITOR]:
            return jsonify({'error': 'Editor or Admin access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Check password
        if not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate token
        token = generate_token(user)
        
        # Log the login
        AuditLog.log_action(
            user_id=user.id,
            action='login',
            resource_type='user',
            resource_id=user.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data or not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Create new user
        user = User(
            email=email,
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            phone=data.get('phone', '').strip() if data.get('phone') else None,
            address=data.get('address', '').strip() if data.get('address') else None,
            city=data.get('city', '').strip() if data.get('city') else None,
            state=data.get('state', '').strip() if data.get('state') else None,
            country=data.get('country', '').strip() if data.get('country') else None,
            postal_code=data.get('postal_code', '').strip() if data.get('postal_code') else None,
            role=UserRole.CUSTOMER  # Default role
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        token = generate_token(user)
        
        # Log the registration
        AuditLog.log_action(
            user_id=user.id,
            action='register',
            resource_type='user',
            resource_id=user.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current user information"""
    try:
        return jsonify({
            'user': request.current_user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get user info', 'details': str(e)}), 500

@auth_bp.route('/me', methods=['PUT'])
@token_required
def update_current_user():
    """Update current user information"""
    try:
        data = request.get_json()
        user = request.current_user
        
        # Store old values for audit log
        old_values = user.to_dict()
        
        # Update allowed fields
        updatable_fields = ['first_name', 'last_name', 'phone', 'address', 'city', 'state', 'country', 'postal_code']
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(user, field, data[field].strip() if isinstance(data[field], str) else data[field])
        
        # Handle password change
        if 'current_password' in data and 'new_password' in data:
            if not user.check_password(data['current_password']):
                return jsonify({'error': 'Current password is incorrect'}), 400
            user.set_password(data['new_password'])
        
        db.session.commit()
        
        # Log the update
        AuditLog.log_action(
            user_id=user.id,
            action='update_profile',
            resource_type='user',
            resource_id=user.id,
            old_values=old_values,
            new_values=user.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        if not data or not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        user = request.current_user
        
        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Set new password
        user.set_password(data['new_password'])
        db.session.commit()
        
        # Log the password change
        AuditLog.log_action(
            user_id=user.id,
            action='change_password',
            resource_type='user',
            resource_id=user.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password', 'details': str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_user_token():
    """Verify if a token is valid"""
    try:
        data = request.get_json()
        token = data.get('token') if data else None
        
        if not token:
            return jsonify({'valid': False, 'error': 'Token is required'}), 400
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 401
        
        # Check if user still exists and is active
        user = User.query.get(payload['user_id'])
        if not user or not user.is_active:
            return jsonify({'valid': False, 'error': 'User not found or inactive'}), 401
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """User logout endpoint (mainly for logging purposes)"""
    try:
        # Log the logout
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='logout',
            resource_type='user',
            resource_id=request.current_user.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Logout failed', 'details': str(e)}), 500

