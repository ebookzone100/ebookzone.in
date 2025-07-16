from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc, func
from src.models.user import db
from src.models.book import Category, Book, book_categories
from src.models.analytics import AuditLog
from src.routes.auth import token_required, admin_required, editor_or_admin_required

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories with pagination and search"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '', type=str)
        active_only = request.args.get('active_only', True, type=bool)
        
        # Build query
        query = Category.query
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                Category.name.ilike(search_term),
                Category.description.ilike(search_term)
            ))
        
        # Apply active filter
        if active_only:
            query = query.filter(Category.is_active == True)
        
        # Order by name
        query = query.order_by(Category.name)
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        categories = pagination.items
        
        # Add book count for each category
        categories_data = []
        for category in categories:
            category_dict = category.to_dict()
            # Count books in this category
            book_count = db.session.query(func.count(book_categories.c.book_id)).filter(
                book_categories.c.category_id == category.id
            ).scalar()
            category_dict['book_count'] = book_count or 0
            categories_data.append(category_dict)
        
        return jsonify({
            'categories': categories_data,
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
        return jsonify({'error': 'Failed to get categories', 'details': str(e)}), 500

@categories_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """Get specific category by ID"""
    try:
        category = Category.query.get_or_404(category_id)
        category_dict = category.to_dict()
        
        # Add books in this category
        books = category.books
        category_dict['books'] = [book.to_dict() for book in books]
        category_dict['book_count'] = len(books)
        
        return jsonify({'category': category_dict}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get category', 'details': str(e)}), 500

@categories_bp.route('/categories/slug/<slug>', methods=['GET'])
def get_category_by_slug(slug):
    """Get category by slug"""
    try:
        category = Category.query.filter_by(slug=slug).first_or_404()
        category_dict = category.to_dict()
        
        # Add books in this category
        books = category.books
        category_dict['books'] = [book.to_dict() for book in books]
        category_dict['book_count'] = len(books)
        
        return jsonify({'category': category_dict}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get category', 'details': str(e)}), 500

@categories_bp.route('/categories', methods=['POST'])
@token_required
@editor_or_admin_required
def create_category():
    """Create new category"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'slug']
        for field in required_fields:
            if not data or not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if category with same name or slug exists
        existing_name = Category.query.filter_by(name=data['name']).first()
        if existing_name:
            return jsonify({'error': 'Category with this name already exists'}), 409
        
        existing_slug = Category.query.filter_by(slug=data['slug']).first()
        if existing_slug:
            return jsonify({'error': 'Category with this slug already exists'}), 409
        
        # Create new category
        category = Category(
            name=data['name'].strip(),
            description=data.get('description', '').strip() if data.get('description') else None,
            slug=data['slug'].strip(),
            icon=data.get('icon', '').strip() if data.get('icon') else None,
            color=data.get('color', '').strip() if data.get('color') else None,
            is_active=bool(data.get('is_active', True))
        )
        
        db.session.add(category)
        db.session.commit()
        
        # Log the creation
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='create_category',
            resource_type='category',
            resource_id=category.id,
            new_values=category.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create category', 'details': str(e)}), 500

@categories_bp.route('/categories/<int:category_id>', methods=['PUT'])
@token_required
@editor_or_admin_required
def update_category(category_id):
    """Update category"""
    try:
        category = Category.query.get_or_404(category_id)
        data = request.get_json()
        
        # Store old values for audit log
        old_values = category.to_dict()
        
        # Update allowed fields
        updatable_fields = ['name', 'description', 'slug', 'icon', 'color', 'is_active']
        for field in updatable_fields:
            if field in data and data[field] is not None:
                if field == 'is_active':
                    setattr(category, field, bool(data[field]))
                else:
                    value = data[field].strip() if isinstance(data[field], str) else data[field]
                    setattr(category, field, value if value else None)
        
        # Check for duplicate name (excluding current category)
        if 'name' in data and data['name']:
            existing_name = Category.query.filter(
                Category.name == data['name'].strip(),
                Category.id != category.id
            ).first()
            if existing_name:
                return jsonify({'error': 'Category with this name already exists'}), 409
        
        # Check for duplicate slug (excluding current category)
        if 'slug' in data and data['slug']:
            existing_slug = Category.query.filter(
                Category.slug == data['slug'].strip(),
                Category.id != category.id
            ).first()
            if existing_slug:
                return jsonify({'error': 'Category with this slug already exists'}), 409
        
        db.session.commit()
        
        # Log the update
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='update_category',
            resource_type='category',
            resource_id=category.id,
            old_values=old_values,
            new_values=category.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Category updated successfully',
            'category': category.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update category', 'details': str(e)}), 500

@categories_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_category(category_id):
    """Delete category (admin only)"""
    try:
        category = Category.query.get_or_404(category_id)
        
        # Check if category has books
        book_count = len(category.books)
        if book_count > 0:
            return jsonify({
                'error': f'Cannot delete category. {book_count} books are associated with this category.'
            }), 400
        
        # Store category data for audit log
        category_data = category.to_dict()
        
        db.session.delete(category)
        db.session.commit()
        
        # Log the deletion
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='delete_category',
            resource_type='category',
            resource_id=category_id,
            old_values=category_data,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({'message': 'Category deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete category', 'details': str(e)}), 500

@categories_bp.route('/categories/<int:category_id>/toggle-status', methods=['POST'])
@token_required
@editor_or_admin_required
def toggle_category_status(category_id):
    """Toggle category active status"""
    try:
        category = Category.query.get_or_404(category_id)
        
        # Store old values for audit log
        old_values = category.to_dict()
        
        # Toggle status
        category.is_active = not category.is_active
        db.session.commit()
        
        # Log the status change
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='toggle_category_status',
            resource_type='category',
            resource_id=category.id,
            old_values=old_values,
            new_values=category.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        status = 'activated' if category.is_active else 'deactivated'
        return jsonify({
            'message': f'Category {status} successfully',
            'category': category.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle category status', 'details': str(e)}), 500

@categories_bp.route('/categories/stats', methods=['GET'])
@token_required
@editor_or_admin_required
def get_category_stats():
    """Get category statistics"""
    try:
        total_categories = Category.query.count()
        active_categories = Category.query.filter_by(is_active=True).count()
        inactive_categories = Category.query.filter_by(is_active=False).count()
        
        # Categories with books
        categories_with_books = db.session.query(Category.id).join(
            book_categories, Category.id == book_categories.c.category_id
        ).distinct().count()
        
        # Top categories by book count
        top_categories = db.session.query(
            Category.id,
            Category.name,
            func.count(book_categories.c.book_id).label('book_count')
        ).outerjoin(book_categories).group_by(
            Category.id, Category.name
        ).order_by(
            func.count(book_categories.c.book_id).desc()
        ).limit(5).all()
        
        top_categories_data = [
            {
                'id': category.id,
                'name': category.name,
                'book_count': category.book_count
            }
            for category in top_categories
        ]
        
        return jsonify({
            'total_categories': total_categories,
            'active_categories': active_categories,
            'inactive_categories': inactive_categories,
            'categories_with_books': categories_with_books,
            'categories_without_books': total_categories - categories_with_books,
            'top_categories': top_categories_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get category stats', 'details': str(e)}), 500

