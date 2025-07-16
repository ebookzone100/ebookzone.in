from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import or_, desc
from datetime import datetime, timedelta
import uuid
import json
from src.models.user import db, User
from src.models.book import Book
from src.models.order import Order, OrderItem, Payment, OrderStatus, PaymentStatus, PaymentMethod, Currency
from src.models.analytics import AuditLog, AnalyticsEvent, EventType
from src.routes.auth import token_required, admin_required

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/orders', methods=['GET'])
@token_required
def get_user_orders():
    """Get current user's orders"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '', type=str)
        
        # Build query for current user's orders
        query = Order.query.filter_by(customer_id=request.current_user.id)
        
        # Apply status filter
        if status and status in [s.value for s in OrderStatus]:
            query = query.filter(Order.status == OrderStatus(status))
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Order.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        orders = pagination.items
        
        return jsonify({
            'orders': [order.to_dict() for order in orders],
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
        return jsonify({'error': 'Failed to get orders', 'details': str(e)}), 500

@orders_bp.route('/orders/<int:order_id>', methods=['GET'])
@token_required
def get_order(order_id):
    """Get specific order by ID"""
    try:
        order = Order.query.get_or_404(order_id)
        
        # Check if user owns this order or is admin
        if order.customer_id != request.current_user.id and request.current_user.role.value != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({'order': order.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get order', 'details': str(e)}), 500

@orders_bp.route('/orders', methods=['POST'])
@token_required
def create_order():
    """Create new order"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('items'):
            return jsonify({'error': 'Order items are required'}), 400
        
        # Create new order
        order = Order(
            customer_id=request.current_user.id,
            customer_email=request.current_user.email,
            customer_name=request.current_user.full_name,
            billing_address=data.get('billing_address'),
            billing_city=data.get('billing_city'),
            billing_state=data.get('billing_state'),
            billing_country=data.get('billing_country'),
            billing_postal_code=data.get('billing_postal_code'),
            currency=Currency(data.get('currency', 'USD')),
            notes=data.get('notes'),
            subtotal=0.0,  # Initialize with 0, will be calculated later
            total_amount=0.0  # Initialize with 0, will be calculated later
        )
        
        db.session.add(order)
        db.session.flush()  # Get the order ID
        
        # Add order items
        total_amount = 0
        for item_data in data['items']:
            book_id = item_data.get('book_id')
            quantity = item_data.get('quantity', 1)
            
            if not book_id:
                return jsonify({'error': 'Book ID is required for each item'}), 400
            
            book = Book.query.get(book_id)
            if not book:
                return jsonify({'error': f'Book with ID {book_id} not found'}), 404
            
            if book.status.value != 'active':
                return jsonify({'error': f'Book "{book.title}" is not available for purchase'}), 400
            
            # Use current price (sale price if on sale)
            unit_price = book.current_price
            total_price = unit_price * quantity
            total_amount += total_price
            
            # Create order item
            order_item = OrderItem(
                order_id=order.id,
                book_id=book.id,
                book_title=book.title,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                download_expires_at=datetime.utcnow() + timedelta(days=365)  # 1 year expiry
            )
            db.session.add(order_item)
        
        # Calculate order totals
        order.subtotal = total_amount
        order.total_amount = total_amount  # No tax or discount for now
        
        db.session.commit()
        
        # Log the order creation
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='create_order',
            resource_type='order',
            resource_id=order.id,
            new_values=order.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create order', 'details': str(e)}), 500

@orders_bp.route('/orders/<int:order_id>/payment', methods=['POST'])
@token_required
def process_payment():
    """Process payment for order"""
    try:
        data = request.get_json()
        order_id = request.view_args['order_id']
        
        order = Order.query.get_or_404(order_id)
        
        # Check if user owns this order
        if order.customer_id != request.current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if order is already paid
        if order.payment_status == PaymentStatus.COMPLETED:
            return jsonify({'error': 'Order is already paid'}), 400
        
        # Validate payment data
        required_fields = ['payment_method', 'gateway_payment_id']
        for field in required_fields:
            if not data or not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create payment record
        payment = Payment(
            order_id=order.id,
            amount=order.total_amount,
            currency=order.currency,
            payment_method=PaymentMethod(data['payment_method']),
            gateway_payment_id=data['gateway_payment_id'],
            gateway_order_id=data.get('gateway_order_id'),
            gateway_signature=data.get('gateway_signature'),
            gateway_response=json.dumps(data.get('gateway_response', {})),
            status=PaymentStatus.COMPLETED,  # Assuming payment is successful
            processed_at=datetime.utcnow()
        )
        
        db.session.add(payment)
        
        # Update order status
        order.payment_status = PaymentStatus.COMPLETED
        order.payment_method = PaymentMethod(data['payment_method'])
        order.payment_gateway_id = data['gateway_payment_id']
        order.payment_gateway_order_id = data.get('gateway_order_id')
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
        
        # Log the payment
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='process_payment',
            resource_type='order',
            resource_id=order.id,
            new_values={'payment_id': payment.id, 'amount': payment.amount},
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Payment processed successfully',
            'order': order.to_dict(),
            'payment': payment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to process payment', 'details': str(e)}), 500

@orders_bp.route('/orders/<int:order_id>/items/<int:item_id>/download', methods=['POST'])
@token_required
def download_book(order_id, item_id):
    """Download book from completed order"""
    try:
        order = Order.query.get_or_404(order_id)
        
        # Check if user owns this order
        if order.customer_id != request.current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if order is completed
        if order.status != OrderStatus.COMPLETED:
            return jsonify({'error': 'Order is not completed'}), 400
        
        # Get order item
        order_item = OrderItem.query.filter_by(id=item_id, order_id=order.id).first_or_404()
        
        # Check if download is allowed
        if not order_item.can_download():
            return jsonify({
                'error': 'Download limit exceeded or expired',
                'download_count': order_item.download_count,
                'download_limit': order_item.download_limit,
                'expires_at': order_item.download_expires_at.isoformat() if order_item.download_expires_at else None
            }), 403
        
        # Record download
        if not order_item.record_download():
            return jsonify({'error': 'Failed to record download'}), 500
        
        # Get book file URL
        book = order_item.book
        if not book or not book.file_url:
            return jsonify({'error': 'Book file not available'}), 404
        
        # Log analytics event
        AnalyticsEvent.log_event(
            event_type=EventType.BOOK_DOWNLOAD,
            user_id=request.current_user.id,
            book_id=book.id,
            order_id=order.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Download authorized',
            'download_url': book.file_url,
            'book_title': book.title,
            'downloads_remaining': order_item.download_limit - order_item.download_count,
            'expires_at': order_item.download_expires_at.isoformat() if order_item.download_expires_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to process download', 'details': str(e)}), 500

@orders_bp.route('/admin/orders', methods=['GET'])
@token_required
@admin_required
def get_all_orders():
    """Get all orders (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        status = request.args.get('status', '', type=str)
        payment_status = request.args.get('payment_status', '', type=str)
        
        # Build query
        query = Order.query
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                Order.order_number.ilike(search_term),
                Order.customer_email.ilike(search_term),
                Order.customer_name.ilike(search_term)
            ))
        
        # Apply status filter
        if status and status in [s.value for s in OrderStatus]:
            query = query.filter(Order.status == OrderStatus(status))
        
        # Apply payment status filter
        if payment_status and payment_status in [s.value for s in PaymentStatus]:
            query = query.filter(Order.payment_status == PaymentStatus(payment_status))
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Order.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        orders = pagination.items
        
        return jsonify({
            'orders': [order.to_dict() for order in orders],
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
        return jsonify({'error': 'Failed to get orders', 'details': str(e)}), 500

@orders_bp.route('/admin/orders/<int:order_id>', methods=['PUT'])
@token_required
@admin_required
def update_order_status(order_id):
    """Update order status (admin only)"""
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json()
        
        # Store old values for audit log
        old_values = order.to_dict()
        
        # Update allowed fields
        if 'status' in data and data['status'] in [s.value for s in OrderStatus]:
            order.status = OrderStatus(data['status'])
        
        if 'payment_status' in data and data['payment_status'] in [s.value for s in PaymentStatus]:
            order.payment_status = PaymentStatus(data['payment_status'])
        
        if 'admin_notes' in data:
            order.admin_notes = data['admin_notes']
        
        # Mark as completed if both statuses are completed
        if (order.status == OrderStatus.COMPLETED and 
            order.payment_status == PaymentStatus.COMPLETED and 
            not order.completed_at):
            order.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log the update
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='update_order_status',
            resource_type='order',
            resource_id=order.id,
            old_values=old_values,
            new_values=order.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update order', 'details': str(e)}), 500

@orders_bp.route('/orders/stats', methods=['GET'])
@token_required
@admin_required
def get_order_stats():
    """Get order statistics (admin only)"""
    try:
        from sqlalchemy import func
        
        # Basic counts
        total_orders = Order.query.count()
        completed_orders = Order.query.filter_by(status=OrderStatus.COMPLETED).count()
        pending_orders = Order.query.filter_by(status=OrderStatus.PENDING).count()
        failed_orders = Order.query.filter_by(status=OrderStatus.FAILED).count()
        
        # Revenue calculations
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        # Recent orders (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_orders = Order.query.filter(Order.created_at >= thirty_days_ago).count()
        recent_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.created_at >= thirty_days_ago,
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        # Average order value
        avg_order_value = db.session.query(func.avg(Order.total_amount)).filter(
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        return jsonify({
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'pending_orders': pending_orders,
            'failed_orders': failed_orders,
            'total_revenue': round(float(total_revenue), 2),
            'recent_orders': recent_orders,
            'recent_revenue': round(float(recent_revenue), 2),
            'average_order_value': round(float(avg_order_value), 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get order stats', 'details': str(e)}), 500

