from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from sqlalchemy import or_, desc, asc
import os
import uuid
from datetime import datetime
from src.models.user import db
from src.models.book import Book, Author, Category, BookStatus
from src.models.analytics import AuditLog, AnalyticsEvent, EventType
from src.routes.auth import token_required, admin_required, editor_or_admin_required

books_bp = Blueprint('books', __name__)

# File upload configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'epub', 'mobi'}
UPLOAD_FOLDER = 'uploads'

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file, folder='books'):
    """Save uploaded file and return the file path"""
    if file and allowed_file(file.filename):
        # Create unique filename
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
        
        # Create upload directory if it doesn't exist
        upload_path = os.path.join(current_app.static_folder, UPLOAD_FOLDER, folder)
        os.makedirs(upload_path, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_path, unique_filename)
        file.save(file_path)
        
        # Return relative path for URL
        return f"/{UPLOAD_FOLDER}/{folder}/{unique_filename}"
    return None

@books_bp.route('/books', methods=['GET'])
def get_books():
    """Get all books with pagination, filtering, and search"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        category = request.args.get('category', '', type=str)
        author_id = request.args.get('author_id', type=int)
        status = request.args.get('status', '', type=str)
        featured = request.args.get('featured', type=bool)
        bestseller = request.args.get('bestseller', type=bool)
        sort_by = request.args.get('sort_by', 'created_at', type=str)
        sort_order = request.args.get('sort_order', 'desc', type=str)
        
        # Build query
        query = Book.query
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                Book.title.ilike(search_term),
                Book.description.ilike(search_term),
                Book.keywords.ilike(search_term)
            ))
        
        # Apply category filter
        if category:
            query = query.join(Book.categories).filter(Category.slug == category)
        
        # Apply author filter
        if author_id:
            query = query.filter(Book.author_id == author_id)
        
        # Apply status filter
        if status and status in [s.value for s in BookStatus]:
            query = query.filter(Book.status == BookStatus(status))
        else:
            # Default to active books for public API
            query = query.filter(Book.status == BookStatus.ACTIVE)
        
        # Apply featured filter
        if featured is not None:
            query = query.filter(Book.is_featured == featured)
        
        # Apply bestseller filter
        if bestseller is not None:
            query = query.filter(Book.is_bestseller == bestseller)
        
        # Apply sorting
        if sort_by in ['title', 'price_usd', 'rating', 'created_at', 'view_count']:
            if sort_order == 'asc':
                query = query.order_by(asc(getattr(Book, sort_by)))
            else:
                query = query.order_by(desc(getattr(Book, sort_by)))
        else:
            query = query.order_by(desc(Book.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        books = pagination.items
        
        return jsonify({
            'books': [book.to_dict() for book in books],
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
        return jsonify({'error': 'Failed to get books', 'details': str(e)}), 500

@books_bp.route('/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """Get specific book by ID"""
    try:
        book = Book.query.get_or_404(book_id)
        
        # Increment view count
        book.increment_view_count()
        
        # Log analytics event
        user_id = getattr(request, 'current_user', None)
        user_id = user_id.id if user_id else None
        
        AnalyticsEvent.log_event(
            event_type=EventType.BOOK_VIEW,
            user_id=user_id,
            book_id=book.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({'book': book.to_dict(include_analytics=True)}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get book', 'details': str(e)}), 500

@books_bp.route('/books', methods=['POST'])
@token_required
@editor_or_admin_required
def create_book():
    """Create new book"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'price_usd']
        for field in required_fields:
            if not data or not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if book with same title exists
        existing_book = Book.query.filter_by(title=data['title']).first()
        if existing_book:
            return jsonify({'error': 'Book with this title already exists'}), 409
        
        # Create slug from title
        import re
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', data['title'].lower())
        slug = re.sub(r'\s+', '-', slug.strip())
        
        # Ensure slug is unique
        base_slug = slug
        counter = 1
        while Book.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Create new book
        book = Book(
            title=data['title'].strip(),
            description=data.get('description', '').strip() if data.get('description') else None,
            short_description=data.get('short_description', '').strip() if data.get('short_description') else None,
            price_usd=float(data['price_usd']),
            sale_price_usd=float(data['sale_price_usd']) if data.get('sale_price_usd') else None,
            is_on_sale=bool(data.get('is_on_sale', False)),
            pages=int(data['pages']) if data.get('pages') else None,
            publication_year=int(data['publication_year']) if data.get('publication_year') else None,
            isbn=data.get('isbn', '').strip() if data.get('isbn') else None,
            language=data.get('language', 'English').strip(),
            cover_image_url=data.get('cover_image_url', '').strip() if data.get('cover_image_url') else None,
            file_url=data.get('file_url', '').strip() if data.get('file_url') else None,
            preview_url=data.get('preview_url', '').strip() if data.get('preview_url') else None,
            slug=slug,
            meta_title=data.get('meta_title', '').strip() if data.get('meta_title') else None,
            meta_description=data.get('meta_description', '').strip() if data.get('meta_description') else None,
            keywords=data.get('keywords', '').strip() if data.get('keywords') else None,
            rating=float(data['rating']) if data.get('rating') else 0.0,
            review_count=int(data['review_count']) if data.get('review_count') else 0,
            status=BookStatus(data['status']) if data.get('status') and data['status'] in [s.value for s in BookStatus] else BookStatus.ACTIVE,
            is_featured=bool(data.get('is_featured', False)),
            is_bestseller=bool(data.get('is_bestseller', False)),
            author_id=int(data['author_id']) if data.get('author_id') else None,
            published_at=datetime.utcnow() if data.get('status') == 'active' else None
        )
        
        db.session.add(book)
        db.session.flush()  # Get the book ID
        
        # Handle categories
        if data.get('category_ids'):
            categories = Category.query.filter(Category.id.in_(data['category_ids'])).all()
            book.categories = categories
        
        db.session.commit()
        
        # Log the creation
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='create_book',
            resource_type='book',
            resource_id=book.id,
            new_values=book.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Book created successfully',
            'book': book.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create book', 'details': str(e)}), 500

@books_bp.route('/books/<int:book_id>', methods=['PUT'])
@token_required
@editor_or_admin_required
def update_book(book_id):
    """Update book"""
    try:
        book = Book.query.get_or_404(book_id)
        data = request.get_json()
        
        # Store old values for audit log
        old_values = book.to_dict()
        
        # Update allowed fields
        updatable_fields = [
            'title', 'description', 'short_description', 'price_usd', 'sale_price_usd', 
            'is_on_sale', 'pages', 'publication_year', 'isbn', 'language',
            'cover_image_url', 'file_url', 'preview_url', 'meta_title', 
            'meta_description', 'keywords', 'rating', 'review_count',
            'status', 'is_featured', 'is_bestseller', 'author_id'
        ]
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                if field == 'status' and data[field] in [s.value for s in BookStatus]:
                    setattr(book, field, BookStatus(data[field]))
                elif field in ['is_on_sale', 'is_featured', 'is_bestseller']:
                    setattr(book, field, bool(data[field]))
                elif field in ['price_usd', 'sale_price_usd', 'rating']:
                    setattr(book, field, float(data[field]))
                elif field in ['pages', 'publication_year', 'review_count', 'author_id']:
                    setattr(book, field, int(data[field]) if data[field] else None)
                else:
                    value = data[field].strip() if isinstance(data[field], str) else data[field]
                    setattr(book, field, value if value else None)
        
        # Handle slug update if title changed
        if 'title' in data and data['title']:
            import re
            new_slug = re.sub(r'[^a-zA-Z0-9\s-]', '', data['title'].lower())
            new_slug = re.sub(r'\s+', '-', new_slug.strip())
            
            # Ensure slug is unique (excluding current book)
            base_slug = new_slug
            counter = 1
            while Book.query.filter(Book.slug == new_slug, Book.id != book.id).first():
                new_slug = f"{base_slug}-{counter}"
                counter += 1
            book.slug = new_slug
        
        # Handle categories
        if 'category_ids' in data:
            if data['category_ids']:
                categories = Category.query.filter(Category.id.in_(data['category_ids'])).all()
                book.categories = categories
            else:
                book.categories = []
        
        # Update published_at if status changed to active
        if 'status' in data and data['status'] == 'active' and not book.published_at:
            book.published_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log the update
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='update_book',
            resource_type='book',
            resource_id=book.id,
            old_values=old_values,
            new_values=book.to_dict(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({
            'message': 'Book updated successfully',
            'book': book.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update book', 'details': str(e)}), 500

@books_bp.route('/books/<int:book_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_book(book_id):
    """Delete book (admin only)"""
    try:
        book = Book.query.get_or_404(book_id)
        
        # Store book data for audit log
        book_data = book.to_dict()
        
        db.session.delete(book)
        db.session.commit()
        
        # Log the deletion
        AuditLog.log_action(
            user_id=request.current_user.id,
            action='delete_book',
            resource_type='book',
            resource_id=book_id,
            old_values=book_data,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        return jsonify({'message': 'Book deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete book', 'details': str(e)}), 500

@books_bp.route('/books/upload', methods=['POST'])
@token_required
@editor_or_admin_required
def upload_book_files():
    """Upload book files (cover, ebook file, preview)"""
    try:
        files = {}
        
        # Handle cover image upload
        if 'cover' in request.files:
            cover_file = request.files['cover']
            if cover_file and allowed_file(cover_file.filename):
                cover_path = save_uploaded_file(cover_file, 'covers')
                if cover_path:
                    files['cover_url'] = cover_path
        
        # Handle ebook file upload
        if 'ebook' in request.files:
            ebook_file = request.files['ebook']
            if ebook_file and allowed_file(ebook_file.filename):
                ebook_path = save_uploaded_file(ebook_file, 'ebooks')
                if ebook_path:
                    files['file_url'] = ebook_path
        
        # Handle preview file upload
        if 'preview' in request.files:
            preview_file = request.files['preview']
            if preview_file and allowed_file(preview_file.filename):
                preview_path = save_uploaded_file(preview_file, 'previews')
                if preview_path:
                    files['preview_url'] = preview_path
        
        if not files:
            return jsonify({'error': 'No valid files uploaded'}), 400
        
        return jsonify({
            'message': 'Files uploaded successfully',
            'files': files
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to upload files', 'details': str(e)}), 500

@books_bp.route('/books/stats', methods=['GET'])
@token_required
@editor_or_admin_required
def get_book_stats():
    """Get book statistics"""
    try:
        total_books = Book.query.count()
        active_books = Book.query.filter_by(status=BookStatus.ACTIVE).count()
        draft_books = Book.query.filter_by(status=BookStatus.DRAFT).count()
        featured_books = Book.query.filter_by(is_featured=True).count()
        bestseller_books = Book.query.filter_by(is_bestseller=True).count()
        
        # Average rating
        from sqlalchemy import func
        avg_rating = db.session.query(func.avg(Book.rating)).scalar() or 0
        
        # Total views and downloads
        total_views = db.session.query(func.sum(Book.view_count)).scalar() or 0
        total_downloads = db.session.query(func.sum(Book.download_count)).scalar() or 0
        
        return jsonify({
            'total_books': total_books,
            'active_books': active_books,
            'draft_books': draft_books,
            'featured_books': featured_books,
            'bestseller_books': bestseller_books,
            'average_rating': round(float(avg_rating), 2),
            'total_views': total_views,
            'total_downloads': total_downloads
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get book stats', 'details': str(e)}), 500

