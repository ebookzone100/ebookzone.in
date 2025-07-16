from flask import Blueprint, request, jsonify
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta, date
from collections import defaultdict
import json
from src.models.user import db, User, UserRole
from src.models.book import Book, Author, Category
from src.models.order import Order, OrderItem, Payment, OrderStatus, PaymentStatus
from src.models.analytics import AnalyticsEvent, DailySummary, AuditLog, EventType
from src.routes.auth import token_required, admin_required

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/dashboard', methods=['GET'])
@token_required
@admin_required
def get_dashboard_data():
    """Get comprehensive dashboard analytics"""
    try:
        # Date range parameters
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # User Analytics
        total_users = User.query.count()
        new_users = User.query.filter(User.created_at >= start_date).count()
        active_users = User.query.filter(User.is_active == True).count()
        
        # Book Analytics
        total_books = Book.query.count()
        active_books = Book.query.filter_by(status='active').count()
        featured_books = Book.query.filter_by(is_featured=True).count()
        
        # Order Analytics
        total_orders = Order.query.count()
        completed_orders = Order.query.filter_by(status=OrderStatus.COMPLETED).count()
        pending_orders = Order.query.filter_by(status=OrderStatus.PENDING).count()
        
        # Revenue Analytics
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        recent_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= start_date
        ).scalar() or 0
        
        # Average Order Value
        avg_order_value = db.session.query(func.avg(Order.total_amount)).filter(
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        # Top Books by Sales
        top_books = db.session.query(
            Book.id,
            Book.title,
            func.count(OrderItem.id).label('sales_count'),
            func.sum(OrderItem.total_price).label('total_revenue')
        ).join(OrderItem).join(Order).filter(
            Order.payment_status == PaymentStatus.COMPLETED
        ).group_by(Book.id, Book.title).order_by(
            func.count(OrderItem.id).desc()
        ).limit(5).all()
        
        top_books_data = [
            {
                'id': book.id,
                'title': book.title,
                'sales_count': book.sales_count,
                'revenue': float(book.total_revenue or 0)
            }
            for book in top_books
        ]
        
        # Recent Activity (Analytics Events)
        recent_events = AnalyticsEvent.query.filter(
            AnalyticsEvent.created_at >= start_date
        ).order_by(desc(AnalyticsEvent.created_at)).limit(10).all()
        
        recent_activity = [
            {
                'event_type': event.event_type.value,
                'user_id': event.user_id,
                'book_id': event.book_id,
                'order_id': event.order_id,
                'created_at': event.created_at.isoformat()
            }
            for event in recent_events
        ]
        
        # Daily Revenue Trend (last 30 days)
        daily_revenue = db.session.query(
            func.date(Order.created_at).label('date'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('orders')
        ).filter(
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= start_date
        ).group_by(func.date(Order.created_at)).order_by('date').all()
        
        revenue_trend = [
            {
                'date': day.date.isoformat() if hasattr(day.date, 'isoformat') else str(day.date),
                'revenue': float(day.revenue or 0),
                'orders': day.orders
            }
            for day in daily_revenue
        ]
        
        return jsonify({
            'overview': {
                'total_users': total_users,
                'new_users': new_users,
                'active_users': active_users,
                'total_books': total_books,
                'active_books': active_books,
                'featured_books': featured_books,
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'pending_orders': pending_orders,
                'total_revenue': round(float(total_revenue), 2),
                'recent_revenue': round(float(recent_revenue), 2),
                'average_order_value': round(float(avg_order_value), 2)
            },
            'top_books': top_books_data,
            'recent_activity': recent_activity,
            'revenue_trend': revenue_trend,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard data', 'details': str(e)}), 500

@analytics_bp.route('/analytics/users', methods=['GET'])
@token_required
@admin_required
def get_user_analytics():
    """Get detailed user analytics"""
    try:
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # User Registration Trend
        daily_registrations = db.session.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('registrations')
        ).filter(
            User.created_at >= start_date
        ).group_by(func.date(User.created_at)).order_by('date').all()
        
        registration_trend = [
            {
                'date': day.date.isoformat() if hasattr(day.date, 'isoformat') else str(day.date),
                'registrations': day.registrations
            }
            for day in daily_registrations
        ]
        
        # User Role Distribution
        role_distribution = db.session.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role).all()
        
        role_data = [
            {
                'role': role.role.value,
                'count': role.count
            }
            for role in role_distribution
        ]
        
        # Active vs Inactive Users
        active_count = User.query.filter_by(is_active=True).count()
        inactive_count = User.query.filter_by(is_active=False).count()
        
        # Top Customers by Orders
        top_customers = db.session.query(
            User.id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_amount).label('total_spent')
        ).join(Order).filter(
            Order.payment_status == PaymentStatus.COMPLETED
        ).group_by(User.id, User.first_name, User.last_name, User.email).order_by(
            func.sum(Order.total_amount).desc()
        ).limit(10).all()
        
        top_customers_data = [
            {
                'id': customer.id,
                'name': f"{customer.first_name} {customer.last_name}",
                'email': customer.email,
                'order_count': customer.order_count,
                'total_spent': float(customer.total_spent or 0)
            }
            for customer in top_customers
        ]
        
        return jsonify({
            'registration_trend': registration_trend,
            'role_distribution': role_data,
            'activity_status': {
                'active': active_count,
                'inactive': inactive_count
            },
            'top_customers': top_customers_data,
            'summary': {
                'total_users': User.query.count(),
                'new_users_period': len(registration_trend),
                'average_daily_registrations': round(sum(day['registrations'] for day in registration_trend) / max(len(registration_trend), 1), 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user analytics', 'details': str(e)}), 500

@analytics_bp.route('/analytics/books', methods=['GET'])
@token_required
@admin_required
def get_book_analytics():
    """Get detailed book analytics"""
    try:
        # Book Performance
        book_performance = db.session.query(
            Book.id,
            Book.title,
            Book.view_count,
            Book.download_count,
            func.count(OrderItem.id).label('sales_count'),
            func.sum(OrderItem.total_price).label('revenue')
        ).select_from(Book).outerjoin(OrderItem, Book.id == OrderItem.book_id).outerjoin(
            Order, OrderItem.order_id == Order.id
        ).filter(
            or_(Order.payment_status == PaymentStatus.COMPLETED, Order.payment_status.is_(None))
        ).group_by(Book.id, Book.title, Book.view_count, Book.download_count).order_by(
            func.count(OrderItem.id).desc()
        ).limit(20).all()
        
        performance_data = [
            {
                'id': book.id,
                'title': book.title,
                'views': book.view_count or 0,
                'downloads': book.download_count or 0,
                'sales': book.sales_count or 0,
                'revenue': float(book.revenue or 0),
                'conversion_rate': round((book.sales_count or 0) / max(book.view_count or 1, 1) * 100, 2)
            }
            for book in book_performance
        ]
        
        # Category Performance
        category_performance = db.session.query(
            Category.id,
            Category.name,
            func.count(Book.id).label('book_count'),
            func.sum(Book.view_count).label('total_views'),
            func.count(OrderItem.id).label('total_sales')
        ).select_from(Category).outerjoin(
            Book.categories
        ).outerjoin(OrderItem, Book.id == OrderItem.book_id).outerjoin(
            Order, OrderItem.order_id == Order.id
        ).filter(
            or_(Order.payment_status == PaymentStatus.COMPLETED, Order.payment_status.is_(None))
        ).group_by(Category.id, Category.name).order_by(
            func.count(OrderItem.id).desc()
        ).all()
        
        category_data = [
            {
                'id': cat.id,
                'name': cat.name,
                'book_count': cat.book_count or 0,
                'total_views': cat.total_views or 0,
                'total_sales': cat.total_sales or 0
            }
            for cat in category_performance
        ]
        
        # Author Performance
        author_performance = db.session.query(
            Author.id,
            Author.name,
            func.count(Book.id).label('book_count'),
            func.sum(Book.view_count).label('total_views'),
            func.count(OrderItem.id).label('total_sales'),
            func.sum(OrderItem.total_price).label('total_revenue')
        ).select_from(Author).outerjoin(Book, Author.id == Book.author_id).outerjoin(
            OrderItem, Book.id == OrderItem.book_id
        ).outerjoin(Order, OrderItem.order_id == Order.id).filter(
            or_(Order.payment_status == PaymentStatus.COMPLETED, Order.payment_status.is_(None))
        ).group_by(Author.id, Author.name).order_by(
            func.sum(OrderItem.total_price).desc()
        ).all()
        
        author_data = [
            {
                'id': author.id,
                'name': author.name,
                'book_count': author.book_count or 0,
                'total_views': author.total_views or 0,
                'total_sales': author.total_sales or 0,
                'total_revenue': float(author.total_revenue or 0)
            }
            for author in author_performance
        ]
        
        return jsonify({
            'book_performance': performance_data,
            'category_performance': category_data,
            'author_performance': author_data,
            'summary': {
                'total_books': Book.query.count(),
                'total_views': db.session.query(func.sum(Book.view_count)).scalar() or 0,
                'total_downloads': db.session.query(func.sum(Book.download_count)).scalar() or 0,
                'average_rating': round(float(db.session.query(func.avg(Book.rating)).scalar() or 0), 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get book analytics', 'details': str(e)}), 500

@analytics_bp.route('/analytics/sales', methods=['GET'])
@token_required
@admin_required
def get_sales_analytics():
    """Get detailed sales analytics"""
    try:
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # Daily Sales Trend
        daily_sales = db.session.query(
            func.date(Order.created_at).label('date'),
            func.count(Order.id).label('orders'),
            func.sum(Order.total_amount).label('revenue'),
            func.avg(Order.total_amount).label('avg_order_value')
        ).filter(
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= start_date
        ).group_by(func.date(Order.created_at)).order_by('date').all()
        
        sales_trend = [
            {
                'date': day.date.isoformat() if hasattr(day.date, 'isoformat') else str(day.date),
                'orders': day.orders,
                'revenue': float(day.revenue or 0),
                'avg_order_value': round(float(day.avg_order_value or 0), 2)
            }
            for day in daily_sales
        ]
        
        # Payment Method Distribution
        payment_methods = db.session.query(
            Order.payment_method,
            func.count(Order.id).label('count'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(
            Order.payment_status == PaymentStatus.COMPLETED
        ).group_by(Order.payment_method).all()
        
        payment_data = [
            {
                'method': method.payment_method.value if method.payment_method else 'Unknown',
                'count': method.count,
                'revenue': float(method.revenue or 0)
            }
            for method in payment_methods
        ]
        
        # Order Status Distribution
        order_status = db.session.query(
            Order.status,
            func.count(Order.id).label('count')
        ).group_by(Order.status).all()
        
        status_data = [
            {
                'status': status.status.value,
                'count': status.count
            }
            for status in order_status
        ]
        
        # Monthly Revenue Comparison (last 12 months)
        monthly_revenue = db.session.query(
            func.strftime('%Y-%m', Order.created_at).label('month'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('orders')
        ).filter(
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= datetime.utcnow() - timedelta(days=365)
        ).group_by(func.strftime('%Y-%m', Order.created_at)).order_by('month').all()
        
        monthly_data = [
            {
                'month': month.month,
                'revenue': float(month.revenue or 0),
                'orders': month.orders
            }
            for month in monthly_revenue
        ]
        
        return jsonify({
            'daily_sales': sales_trend,
            'payment_methods': payment_data,
            'order_status': status_data,
            'monthly_revenue': monthly_data,
            'summary': {
                'total_revenue': float(db.session.query(func.sum(Order.total_amount)).filter(Order.payment_status == PaymentStatus.COMPLETED).scalar() or 0),
                'total_orders': Order.query.filter_by(payment_status=PaymentStatus.COMPLETED).count(),
                'period_revenue': sum(day['revenue'] for day in sales_trend),
                'period_orders': sum(day['orders'] for day in sales_trend),
                'growth_rate': 0  # Calculate based on previous period comparison
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get sales analytics', 'details': str(e)}), 500

@analytics_bp.route('/analytics/events', methods=['GET'])
@token_required
@admin_required
def get_analytics_events():
    """Get analytics events with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        event_type = request.args.get('event_type', '', type=str)
        user_id = request.args.get('user_id', type=int)
        book_id = request.args.get('book_id', type=int)
        days = request.args.get('days', 7, type=int)
        
        # Build query
        query = AnalyticsEvent.query
        
        # Apply filters
        if event_type and event_type in [e.value for e in EventType]:
            query = query.filter(AnalyticsEvent.event_type == EventType(event_type))
        
        if user_id:
            query = query.filter(AnalyticsEvent.user_id == user_id)
        
        if book_id:
            query = query.filter(AnalyticsEvent.book_id == book_id)
        
        # Date filter
        if days > 0:
            start_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(AnalyticsEvent.created_at >= start_date)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(AnalyticsEvent.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        events = pagination.items
        
        # Event type summary
        event_summary = db.session.query(
            AnalyticsEvent.event_type,
            func.count(AnalyticsEvent.id).label('count')
        ).filter(
            AnalyticsEvent.created_at >= datetime.utcnow() - timedelta(days=days)
        ).group_by(AnalyticsEvent.event_type).all()
        
        summary_data = [
            {
                'event_type': event.event_type.value,
                'count': event.count
            }
            for event in event_summary
        ]
        
        return jsonify({
            'events': [event.to_dict() for event in events],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            },
            'summary': summary_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get analytics events', 'details': str(e)}), 500

@analytics_bp.route('/analytics/reports/export', methods=['POST'])
@token_required
@admin_required
def export_analytics_report():
    """Export analytics report in various formats"""
    try:
        data = request.get_json()
        
        report_type = data.get('report_type', 'dashboard')
        format_type = data.get('format', 'json')  # json, csv
        days = data.get('days', 30)
        
        if report_type == 'dashboard':
            # Get dashboard data
            dashboard_response = get_dashboard_data()
            report_data = dashboard_response[0].get_json()
        elif report_type == 'users':
            user_response = get_user_analytics()
            report_data = user_response[0].get_json()
        elif report_type == 'books':
            book_response = get_book_analytics()
            report_data = book_response[0].get_json()
        elif report_type == 'sales':
            sales_response = get_sales_analytics()
            report_data = sales_response[0].get_json()
        else:
            return jsonify({'error': 'Invalid report type'}), 400
        
        # Add export metadata
        export_data = {
            'report_type': report_type,
            'generated_at': datetime.utcnow().isoformat(),
            'generated_by': request.current_user.email,
            'period_days': days,
            'data': report_data
        }
        
        if format_type == 'json':
            return jsonify(export_data), 200
        else:
            return jsonify({'error': 'Format not supported yet'}), 400
        
    except Exception as e:
        return jsonify({'error': 'Failed to export report', 'details': str(e)}), 500

