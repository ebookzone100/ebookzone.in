from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc
from datetime import datetime
from src.models.user import db, User, UserRole
from src.models.analytics import AuditLog
from src.routes.auth import token_required, admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users():
    """Get all users with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        role = request.args.get('role', '', type=str)
        status = request.args.get('status', '', type=str)
        
        # Build query
        query = User.query
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                User.email.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term)
            ))
        
        # Apply role filter
        if role and role in [r.value for r in UserRole]:
            query = query.filter(User.role == UserRole(role))
        
        # Apply status filter
        if status == 'active':
            query = query.filter(User.is_active == True)
        elif status == 'inactive':
            query = query.filter(User.is_active == False)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(User.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        users = pagination.items
        
        return jsonify({
            'users': [user.to_dict() for user in users],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get users', 'details': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(user_id):
    """Get specific user by ID"""
    try:
        user = User.query.get_or_404(user_id)
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get user', 'details': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user():
    """Create new user (admin only)"""
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
        
        # Validate role
        role = UserRole.CUSTOMER  # Default
        if 'role' in data and data['role']:
            try:
                role = UserRole(data['role'])
            except ValueError:
                return jsonify({'error': 'Invalid role'}), 400
        
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
            role=role,
            is_active=data.get('is_active', True),
            email_verified=data.get('email_verified', False)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Log the creation
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='create_user',
            resource_type='user',
            resource_id=user.id,
            new_values=user.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user', 'details': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(user_id):
    """Update user (admin only)"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # Store old values for audit log
        old_values = user.to_dict()
        
        # Update allowed fields
        updatable_fields = ['first_name', 'last_name', 'phone', 'address', 'city', 'state', 'country', 'postal_code', 'is_active', 'email_verified']
        for field in updatable_fields:
            if field in data and data[field] is not None:
                if field in ['is_active', 'email_verified']:
                    setattr(user, field, bool(data[field]))
                else:
                    setattr(user, field, data[field].strip() if isinstance(data[field], str) else data[field])
        
        # Handle role change
        if 'role' in data and data['role']:
            try:
                new_role = UserRole(data['role'])
                user.role = new_role
            except ValueError:
                return jsonify({'error': 'Invalid role'}), 400
        
        # Handle password change
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        # Log the update
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='update_user',
            resource_type='user',
            resource_id=user.id,
            old_values=old_values,
            new_values=user.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update user', 'details': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(user_id):
    """Delete user (admin only)"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Prevent admin from deleting themselves
        if user.id == request.current_user.id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Store user data for audit log
        user_data = user.to_dict()
        
        db.session.delete(user)
        db.session.commit()
        
        # Log the deletion
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='delete_user',
            resource_type='user',
            resource_id=user_id,
            old_values=user_data,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete user', 'details': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@token_required
@admin_required
def toggle_user_status(user_id):
    """Toggle user active status"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Prevent admin from deactivating themselves
        if user.id == request.current_user.id:
            return jsonify({'error': 'Cannot deactivate your own account'}), 400
        
        # Store old values for audit log
        old_values = user.to_dict()
        
        # Toggle status
        user.is_active = not user.is_active
        db.session.commit()
        
        # Log the status change
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='toggle_user_status',
            resource_type='user',
            resource_id=user.id,
            old_values=old_values,
            new_values=user.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        status = 'activated' if user.is_active else 'deactivated'
        return jsonify({
            'message': f'User {status} successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle user status', 'details': str(e)}), 500

@admin_bp.route('/stats/users', methods=['GET'])
@token_required
@admin_required
def get_user_stats():
    """Get user statistics"""
    try:
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        inactive_users = User.query.filter_by(is_active=False).count()
        
        # Count by role
        admin_count = User.query.filter_by(role=UserRole.ADMIN).count()
        editor_count = User.query.filter_by(role=UserRole.EDITOR).count()
        customer_count = User.query.filter_by(role=UserRole.CUSTOMER).count()
        
        # Recent registrations (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = User.query.filter(User.created_at >= thirty_days_ago).count()
        
        return jsonify({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'recent_registrations': recent_registrations,
            'by_role': {
                'admin': admin_count,
                'editor': editor_count,
                'customer': customer_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user stats', 'details': str(e)}), 500

@admin_bp.route('/audit-logs', methods=['GET'])
@token_required
@admin_required
def get_audit_logs():
    """Get audit logs with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action = request.args.get('action', '', type=str)
        resource_type = request.args.get('resource_type', '', type=str)
        user_id = request.args.get('user_id', type=int)
        
        # Build query
        query = AuditLog.query
        
        # Apply filters
        if action:
            query = query.filter(AuditLog.action == action)
        
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(AuditLog.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        logs = pagination.items
        
        return jsonify({
            'logs': [log.to_dict() for log in logs],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get audit logs', 'details': str(e)}), 500

