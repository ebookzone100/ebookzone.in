from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc
from src.models.user import db
from src.models.book import Author, Book
from src.models.analytics import AuditLog
from src.routes.auth import token_required, admin_required, editor_or_admin_required

authors_bp = Blueprint('authors', __name__)

@authors_bp.route('/authors', methods=['GET'])
def get_authors():
    """Get all authors with pagination and search"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        
        # Build query
        query = Author.query
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                Author.name.ilike(search_term),
                Author.bio.ilike(search_term),
                Author.email.ilike(search_term)
            ))
        
        # Order by name
        query = query.order_by(Author.name)
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        authors = pagination.items
        
        # Add book count for each author
        authors_data = []
        for author in authors:
            author_dict = author.to_dict()
            author_dict['book_count'] = Book.query.filter_by(author_id=author.id).count()
            authors_data.append(author_dict)
        
        return jsonify({
            'authors': authors_data,
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
        return jsonify({'error': 'Failed to get authors', 'details': str(e)}), 500

@authors_bp.route('/authors/<int:author_id>', methods=['GET'])
def get_author(author_id):
    """Get specific author by ID"""
    try:
        author = Author.query.get_or_404(author_id)
        author_dict = author.to_dict()
        
        # Add books by this author
        books = Book.query.filter_by(author_id=author.id).all()
        author_dict['books'] = [book.to_dict() for book in books]
        author_dict['book_count'] = len(books)
        
        return jsonify({'author': author_dict}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get author', 'details': str(e)}), 500

@authors_bp.route('/authors', methods=['POST'])
@token_required
@editor_or_admin_required
def create_author():
    """Create new author"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('name'):
            return jsonify({'error': 'Author name is required'}), 400
        
        # Check if author with same name exists
        existing_author = Author.query.filter_by(name=data['name']).first()
        if existing_author:
            return jsonify({'error': 'Author with this name already exists'}), 409
        
        # Create new author
        author = Author(
            name=data['name'].strip(),
            bio=data.get('bio', '').strip() if data.get('bio') else None,
            email=data.get('email', '').strip() if data.get('email') else None,
            website=data.get('website', '').strip() if data.get('website') else None,
            image_url=data.get('image_url', '').strip() if data.get('image_url') else None
        )
        
        db.session.add(author)
        db.session.commit()
        
        # Log the creation
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='create_author',
            resource_type='author',
            resource_id=author.id,
            new_values=author.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Author created successfully',
            'author': author.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create author', 'details': str(e)}), 500

@authors_bp.route('/authors/<int:author_id>', methods=['PUT'])
@token_required
@editor_or_admin_required
def update_author(author_id):
    """Update author"""
    try:
        author = Author.query.get_or_404(author_id)
        data = request.get_json()
        
        # Store old values for audit log
        old_values = author.to_dict()
        
        # Update allowed fields
        updatable_fields = ['name', 'bio', 'email', 'website', 'image_url']
        for field in updatable_fields:
            if field in data and data[field] is not None:
                value = data[field].strip() if isinstance(data[field], str) else data[field]
                setattr(author, field, value if value else None)
        
        # Check for duplicate name (excluding current author)
        if 'name' in data and data['name']:
            existing_author = Author.query.filter(
                Author.name == data['name'].strip(),
                Author.id != author.id
            ).first()
            if existing_author:
                return jsonify({'error': 'Author with this name already exists'}), 409
        
        db.session.commit()
        
        # Log the update
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='update_author',
            resource_type='author',
            resource_id=author.id,
            old_values=old_values,
            new_values=author.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Author updated successfully',
            'author': author.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update author', 'details': str(e)}), 500

@authors_bp.route('/authors/<int:author_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_author(author_id):
    """Delete author (admin only)"""
    try:
        author = Author.query.get_or_404(author_id)
        
        # Check if author has books
        book_count = Book.query.filter_by(author_id=author.id).count()
        if book_count > 0:
            return jsonify({
                'error': f'Cannot delete author. {book_count} books are associated with this author.'
            }), 400
        
        # Store author data for audit log
        author_data = author.to_dict()
        
        db.session.delete(author)
        db.session.commit()
        
        # Log the deletion
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='delete_author',
            resource_type='author',
            resource_id=author_id,
            old_values=author_data,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({'message': 'Author deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete author', 'details': str(e)}), 500

@authors_bp.route('/authors/stats', methods=['GET'])
@token_required
@editor_or_admin_required
def get_author_stats():
    """Get author statistics"""
    try:
        total_authors = Author.query.count()
        
        # Authors with books
        from sqlalchemy import func
        authors_with_books = db.session.query(Author.id).join(Book).distinct().count()
        
        # Top authors by book count
        top_authors = db.session.query(
            Author.id,
            Author.name,
            func.count(Book.id).label('book_count')
        ).outerjoin(Book).group_by(Author.id, Author.name).order_by(
            func.count(Book.id).desc()
        ).limit(5).all()
        
        top_authors_data = [
            {
                'id': author.id,
                'name': author.name,
                'book_count': author.book_count
            }
            for author in top_authors
        ]
        
        return jsonify({
            'total_authors': total_authors,
            'authors_with_books': authors_with_books,
            'authors_without_books': total_authors - authors_with_books,
            'top_authors': top_authors_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get author stats', 'details': str(e)}), 500

