from flask import Blueprint, request, jsonify, current_app
import json
import hmac
import hashlib
from datetime import datetime
from src.models.user import db
from src.models.order import Order, Payment, PaymentStatus, PaymentMethod
from src.models.analytics import SystemSetting, AuditLog, AnalyticsEvent, EventType
from src.routes.auth import token_required

payments_bp = Blueprint('payments', __name__)

def verify_razorpay_signature(order_id, payment_id, signature):
    """Verify Razorpay payment signature"""
    try:
        # Get Razorpay secret from system settings
        razorpay_secret = SystemSetting.get_setting('razorpay_key_secret', '')
        
        if not razorpay_secret:
            return False
        
        # Create signature string
        message = f"{order_id}|{payment_id}"
        
        # Generate expected signature
        expected_signature = hmac.new(
            razorpay_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    except Exception:
        return False

@payments_bp.route('/payments/razorpay/create-order', methods=['POST'])
@token_required
def create_razorpay_order():
    """Create Razorpay order for payment"""
    try:
        data = request.get_json()
        
        if not data or not data.get('order_id'):
            return jsonify({'error': 'Order ID is required'}), 400
        
        order = Order.query.get_or_404(data['order_id'])
        
        # Check if user owns this order
        if order.customer_id != request.current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if order is already paid
        if order.payment_status == PaymentStatus.COMPLETED:
            return jsonify({'error': 'Order is already paid'}), 400
        
        # Get Razorpay settings
        razorpay_key_id = SystemSetting.get_setting('razorpay_key_id', '')
        
        if not razorpay_key_id:
            return jsonify({'error': 'Payment gateway not configured'}), 500
        
        # Create Razorpay order data
        razorpay_order_data = {
            'amount': int(order.total_amount * 100),  # Amount in paise
            'currency': order.currency.value,
            'receipt': order.order_number,
            'notes': {
                'order_id': str(order.id),
                'customer_email': order.customer_email,
                'customer_name': order.customer_name
            }
        }
        
        # In a real implementation, you would call Razorpay API here
        # For now, we'll simulate the response
        mock_razorpay_order_id = f"order_{order.order_number}_{int(datetime.utcnow().timestamp())}"
        
        # Update order with Razorpay order ID
        order.payment_gateway_order_id = mock_razorpay_order_id
        order.payment_status = PaymentStatus.PROCESSING
        db.session.commit()
        
        return jsonify({
            'razorpay_order_id': mock_razorpay_order_id,
            'razorpay_key_id': razorpay_key_id,
            'amount': razorpay_order_data['amount'],
            'currency': razorpay_order_data['currency'],
            'order_id': order.id,
            'order_number': order.order_number,
            'customer_name': order.customer_name,
            'customer_email': order.customer_email
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to create payment order', 'details': str(e)}), 500

@payments_bp.route('/payments/razorpay/verify', methods=['POST'])
@token_required
def verify_razorpay_payment():
    """Verify Razorpay payment"""
    try:
        data = request.get_json()
        
        required_fields = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'order_id']
        for field in required_fields:
            if not data or not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        order = Order.query.get_or_404(data['order_id'])
        
        # Check if user owns this order
        if order.customer_id != request.current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Verify signature (in real implementation)
        # For now, we'll assume verification is successful
        signature_valid = True  # verify_razorpay_signature(...)
        
        if not signature_valid:
            return jsonify({'error': 'Invalid payment signature'}), 400
        
        # Create payment record
        payment = Payment(
            order_id=order.id,
            amount=order.total_amount,
            currency=order.currency,
            payment_method=PaymentMethod.RAZORPAY,
            gateway_payment_id=data['razorpay_payment_id'],
            gateway_order_id=data['razorpay_order_id'],
            gateway_signature=data['razorpay_signature'],
            gateway_response=json.dumps(data),
            status=PaymentStatus.COMPLETED,
            processed_at=datetime.utcnow()
        )
        
        db.session.add(payment)
        
        # Update order status
        order.payment_status = PaymentStatus.COMPLETED
        order.payment_method = PaymentMethod.RAZORPAY
        order.payment_gateway_id = data['razorpay_payment_id']
        order.mark_as_completed()
        
        db.session.commit()
        
        # Log analytics event
        AnalyticsEvent.log_event(
            event_type=EventType.PURCHASE,
            user_id=request.current_user.id,
            order_id=order.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        # Log the payment verification
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='verify_payment',
            resource_type='payment',
            resource_id=payment.id,
            new_values=payment.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Payment verified successfully',
            'order': order.to_dict(),
            'payment': payment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to verify payment', 'details': str(e)}), 500

@payments_bp.route('/payments/webhook/razorpay', methods=['POST'])
def razorpay_webhook():
    """Handle Razorpay webhooks"""
    try:
        data = request.get_json()
        
        if not data or not data.get('event'):
            return jsonify({'error': 'Invalid webhook data'}), 400
        
        event = data['event']
        payload = data.get('payload', {})
        
        # Handle different webhook events
        if event == 'payment.captured':
            payment_entity = payload.get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            payment_id = payment_entity.get('id')
            
            if order_id and payment_id:
                # Find order by Razorpay order ID
                order = Order.query.filter_by(payment_gateway_order_id=order_id).first()
                
                if order and order.payment_status != PaymentStatus.COMPLETED:
                    # Update order status
                    order.payment_status = PaymentStatus.COMPLETED
                    order.payment_gateway_id = payment_id
                    order.mark_as_completed()
                    
                    # Create payment record if not exists
                    existing_payment = Payment.query.filter_by(
                        order_id=order.id,
                        gateway_payment_id=payment_id
                    ).first()
                    
                    if not existing_payment:
                        payment = Payment(
                            order_id=order.id,
                            amount=order.total_amount,
                            currency=order.currency,
                            payment_method=PaymentMethod.RAZORPAY,
                            gateway_payment_id=payment_id,
                            gateway_order_id=order_id,
                            gateway_response=json.dumps(payload),
                            status=PaymentStatus.COMPLETED,
                            processed_at=datetime.utcnow()
                        )
                        db.session.add(payment)
                    
                    db.session.commit()
                    
                    # Log analytics event
                    AnalyticsEvent.log_event(
                        event_type=EventType.PURCHASE,
                        user_id=order.customer_id,
                        order_id=order.id
                    )
        
        elif event == 'payment.failed':
            payment_entity = payload.get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            
            if order_id:
                order = Order.query.filter_by(payment_gateway_order_id=order_id).first()
                if order:
                    order.payment_status = PaymentStatus.FAILED
                    order.status = OrderStatus.FAILED
                    db.session.commit()
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Webhook processing failed', 'details': str(e)}), 500

@payments_bp.route('/payments/methods', methods=['GET'])
def get_payment_methods():
    """Get available payment methods"""
    try:
        # Check if payment gateways are configured
        razorpay_configured = bool(SystemSetting.get_setting('razorpay_key_id'))
        
        methods = []
        
        if razorpay_configured:
            methods.append({
                'id': 'razorpay',
                'name': 'Razorpay',
                'description': 'Credit Card, Debit Card, Net Banking, UPI, Wallets',
                'enabled': True,
                'currencies': ['INR', 'USD']
            })
        
        # Add other payment methods as needed
        methods.append({
            'id': 'bank_transfer',
            'name': 'Bank Transfer',
            'description': 'Direct bank transfer',
            'enabled': False,
            'currencies': ['USD', 'INR']
        })
        
        return jsonify({
            'payment_methods': methods,
            'default_currency': SystemSetting.get_setting('default_currency', 'USD')
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get payment methods', 'details': str(e)}), 500

@payments_bp.route('/admin/payments', methods=['GET'])
@token_required
def get_payments():
    """Get all payments (admin only)"""
    try:
        # Check admin access
        if request.current_user.role.value != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '', type=str)
        method = request.args.get('method', '', type=str)
        
        # Build query
        query = Payment.query
        
        # Apply status filter
        if status and status in [s.value for s in PaymentStatus]:
            query = query.filter(Payment.status == PaymentStatus(status))
        
        # Apply method filter
        if method and method in [m.value for m in PaymentMethod]:
            query = query.filter(Payment.payment_method == PaymentMethod(method))
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Payment.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        payments = pagination.items
        
        return jsonify({
            'payments': [payment.to_dict() for payment in payments],
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
        return jsonify({'error': 'Failed to get payments', 'details': str(e)}), 500

