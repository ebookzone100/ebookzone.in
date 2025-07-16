from src.models.user import db
from datetime import datetime
import enum

class BookStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"

class BookCategory(enum.Enum):
    MENTAL_HEALTH = "Mental Health"
    PERSONAL_GROWTH = "Personal Growth"
    FINANCIAL_WELLNESS = "Financial Wellness"
    PRODUCTIVITY = "Productivity"
    STUDENTS = "Students"
    RELATIONSHIPS = "Relationships"
    ANXIETY_STRESS = "Anxiety & Stress"
    DEPRESSION_MOOD = "Depression & Mood"
    MINDFULNESS_MEDITATION = "Mindfulness & Meditation"
    RELATIONSHIPS_COMMUNICATION = "Relationships & Communication"
    SELF_ESTEEM_CONFIDENCE = "Self-Esteem & Confidence"
    TRAUMA_RECOVERY = "Trauma & Recovery"

# Association table for many-to-many relationship between books and categories
book_categories = db.Table('book_categories',
    db.Column('book_id', db.Integer, db.ForeignKey('books.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id'), primary_key=True)
)

class Author(db.Model):
    __tablename__ = 'authors'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    email = db.Column(db.String(120), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    books = db.relationship('Book', backref='author', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'bio': self.bio,
            'email': self.email,
            'website': self.website,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    icon = db.Column(db.String(50), nullable=True)
    color = db.Column(db.String(7), nullable=True)  # Hex color code
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'slug': self.slug,
            'icon': self.icon,
            'color': self.color,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Book(db.Model):
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    short_description = db.Column(db.String(500), nullable=True)
    
    # Pricing
    price_usd = db.Column(db.Float, nullable=False)
    sale_price_usd = db.Column(db.Float, nullable=True)
    is_on_sale = db.Column(db.Boolean, default=False, nullable=False)
    
    # Book details
    pages = db.Column(db.Integer, nullable=True)
    publication_year = db.Column(db.Integer, nullable=True)
    isbn = db.Column(db.String(20), nullable=True, unique=True)
    language = db.Column(db.String(20), default='English', nullable=False)
    
    # Media and files
    cover_image_url = db.Column(db.String(500), nullable=True)
    file_url = db.Column(db.String(500), nullable=True)  # PDF/EPUB file
    preview_url = db.Column(db.String(500), nullable=True)  # Preview/sample
    
    # SEO and metadata
    slug = db.Column(db.String(200), nullable=False, unique=True)
    meta_title = db.Column(db.String(200), nullable=True)
    meta_description = db.Column(db.String(500), nullable=True)
    keywords = db.Column(db.String(500), nullable=True)  # Comma-separated tags
    
    # Ratings and reviews
    rating = db.Column(db.Float, default=0.0, nullable=False)
    review_count = db.Column(db.Integer, default=0, nullable=False)
    
    # Status and visibility
    status = db.Column(db.Enum(BookStatus), default=BookStatus.ACTIVE, nullable=False)
    is_featured = db.Column(db.Boolean, default=False, nullable=False)
    is_bestseller = db.Column(db.Boolean, default=False, nullable=False)
    
    # Analytics
    view_count = db.Column(db.Integer, default=0, nullable=False)
    download_count = db.Column(db.Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = db.Column(db.DateTime, nullable=True)
    
    # Foreign keys
    author_id = db.Column(db.Integer, db.ForeignKey('authors.id'), nullable=True)
    
    # Relationships
    categories = db.relationship('Category', secondary=book_categories, lazy='subquery',
                               backref=db.backref('books', lazy=True))
    order_items = db.relationship('OrderItem', backref='book', lazy=True)
    
    @property
    def current_price(self):
        """Get current price (sale price if on sale, otherwise regular price)"""
        if self.is_on_sale and self.sale_price_usd:
            return self.sale_price_usd
        return self.price_usd
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage if on sale"""
        if self.is_on_sale and self.sale_price_usd and self.price_usd > 0:
            return round(((self.price_usd - self.sale_price_usd) / self.price_usd) * 100, 2)
        return 0
    
    def increment_view_count(self):
        """Increment view count"""
        self.view_count += 1
        db.session.commit()
    
    def increment_download_count(self):
        """Increment download count"""
        self.download_count += 1
        db.session.commit()
    
    def to_dict(self, include_analytics=False):
        """Convert book to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'short_description': self.short_description,
            'price_usd': self.price_usd,
            'sale_price_usd': self.sale_price_usd,
            'current_price': self.current_price,
            'is_on_sale': self.is_on_sale,
            'discount_percentage': self.discount_percentage,
            'pages': self.pages,
            'publication_year': self.publication_year,
            'isbn': self.isbn,
            'language': self.language,
            'cover_image_url': self.cover_image_url,
            'file_url': self.file_url,
            'preview_url': self.preview_url,
            'slug': self.slug,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'keywords': self.keywords,
            'rating': self.rating,
            'review_count': self.review_count,
            'status': self.status.value,
            'is_featured': self.is_featured,
            'is_bestseller': self.is_bestseller,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'author': self.author.to_dict() if self.author else None,
            'categories': [cat.to_dict() for cat in self.categories]
        }
        
        if include_analytics:
            data.update({
                'view_count': self.view_count,
                'download_count': self.download_count
            })
        
        return data
    
    def __repr__(self):
        return f'<Book {self.title}>'

