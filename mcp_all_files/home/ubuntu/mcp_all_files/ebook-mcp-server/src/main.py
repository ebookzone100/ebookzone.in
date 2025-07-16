import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
import os

# Production settings
PROD_DOMAIN = 'ebookzone100.github.io'
ALLOWED_ORIGINS = [
    f'https://{PROD_DOMAIN}',
    'http://localhost:5173',  # Development
    'http://localhost:5174',  # Development admin
]

# Import all models to ensure they are registered with SQLAlchemy
from src.models.user import db, User, UserRole
from src.models.book import Book, Author, Category, BookStatus, BookCategory
from src.models.order import Order, OrderItem, Payment, OrderStatus, PaymentStatus, PaymentMethod, Currency
from src.models.analytics import AnalyticsEvent, DailySummary, SystemSetting, AuditLog, EventType

# Import routes
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.admin import admin_bp
from src.routes.books import books_bp
from src.routes.authors import authors_bp
from src.routes.categories import categories_bp
from src.routes.orders import orders_bp
from src.routes.payments import payments_bp
from src.routes.analytics import analytics_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Production configurations
app.config['SERVER_NAME'] = os.getenv('SERVER_NAME', 'localhost:5000')
app.config['PREFERRED_URL_SCHEME'] = 'https'
if os.getenv('FLASK_ENV') == 'production':
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(books_bp, url_prefix='/api')
app.register_blueprint(authors_bp, url_prefix='/api')
app.register_blueprint(categories_bp, url_prefix='/api')
app.register_blueprint(orders_bp, url_prefix='/api')
app.register_blueprint(payments_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file upload

# Initialize database
db.init_app(app)

def create_default_data():
    """Create default data for the MCP system"""
    
    # Create default admin user
    admin_user = User.query.filter_by(email='admin@ebookzone.in').first()
    if not admin_user:
        admin_user = User(
            email='admin@ebookzone.in',
            first_name='Admin',
            last_name='User',
            role=UserRole.ADMIN,
            is_active=True,
            email_verified=True
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
    
    # Create default author
    default_author = Author.query.filter_by(name='eBookZone Team').first()
    if not default_author:
        default_author = Author(
            name='eBookZone Team',
            bio='Expert authors specializing in mental health, personal development, and financial wellness.',
            email='authors@ebookzone.in'
        )
        db.session.add(default_author)
    
    # Create default categories
    default_categories = [
        {'name': 'Mental Health', 'slug': 'mental-health', 'description': 'Books focused on mental wellness and psychological health', 'icon': '🧠', 'color': '#4F46E5'},
        {'name': 'Personal Growth', 'slug': 'personal-growth', 'description': 'Self-improvement and personal development resources', 'icon': '🌱', 'color': '#059669'},
        {'name': 'Financial Wellness', 'slug': 'financial-wellness', 'description': 'Financial literacy and wealth building guides', 'icon': '💰', 'color': '#DC2626'},
        {'name': 'Productivity', 'slug': 'productivity', 'description': 'Time management and productivity enhancement', 'icon': '⚡', 'color': '#7C2D12'},
        {'name': 'Students', 'slug': 'students', 'description': 'Educational resources for students', 'icon': '🎓', 'color': '#1D4ED8'},
        {'name': 'Relationships', 'slug': 'relationships', 'description': 'Relationship building and communication skills', 'icon': '❤️', 'color': '#BE185D'},
        {'name': 'Anxiety & Stress', 'slug': 'anxiety-stress', 'description': 'Tools and techniques to manage anxiety and reduce stress', 'icon': '🧘', 'color': '#0891B2'},
        {'name': 'Depression & Mood', 'slug': 'depression-mood', 'description': 'Understanding and overcoming depression with expert guidance', 'icon': '🌈', 'color': '#7C3AED'},
        {'name': 'Mindfulness & Meditation', 'slug': 'mindfulness-meditation', 'description': 'Cultivate inner peace and present-moment awareness', 'icon': '🕯️', 'color': '#059669'},
        {'name': 'Self-Esteem & Confidence', 'slug': 'self-esteem-confidence', 'description': 'Boost your self-worth and develop unshakeable confidence', 'icon': '💪', 'color': '#EA580C'},
        {'name': 'Trauma & Recovery', 'slug': 'trauma-recovery', 'description': 'Healing from trauma with compassionate, evidence-based approaches', 'icon': '🌸', 'color': '#DB2777'}
    ]
    
    for cat_data in default_categories:
        existing_cat = Category.query.filter_by(slug=cat_data['slug']).first()
        if not existing_cat:
            category = Category(**cat_data)
            db.session.add(category)
    
    # Create default system settings
    default_settings = [
        {'key': 'site_name', 'value': 'eBookZone', 'description': 'Website name', 'setting_type': 'string'},
        {'key': 'site_tagline', 'value': 'Empowering Lives Through Knowledge', 'description': 'Website tagline', 'setting_type': 'string'},
        {'key': 'contact_email', 'value': 'ebookzone100@gmail.com', 'description': 'Contact email address', 'setting_type': 'string'},
        {'key': 'default_currency', 'value': 'USD', 'description': 'Default currency for pricing', 'setting_type': 'string'},
        {'key': 'razorpay_key_id', 'value': '', 'description': 'Razorpay API Key ID', 'setting_type': 'string'},
        {'key': 'razorpay_key_secret', 'value': '', 'description': 'Razorpay API Key Secret', 'setting_type': 'string'},
        {'key': 'max_download_limit', 'value': '5', 'description': 'Maximum downloads per purchase', 'setting_type': 'integer'},
        {'key': 'download_expiry_days', 'value': '365', 'description': 'Download link expiry in days', 'setting_type': 'integer'},
        {'key': 'enable_analytics', 'value': 'true', 'description': 'Enable analytics tracking', 'setting_type': 'boolean'},
        {'key': 'maintenance_mode', 'value': 'false', 'description': 'Enable maintenance mode', 'setting_type': 'boolean'}
    ]
    
    for setting_data in default_settings:
        existing_setting = SystemSetting.query.filter_by(key=setting_data['key']).first()
        if not existing_setting:
            setting = SystemSetting(**setting_data)
            db.session.add(setting)
    
    db.session.commit()
    print("Default data created successfully!")

with app.app_context():
    # Create all tables
    db.create_all()
    
    # Create default data
    create_default_data()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'message': 'eBookZone MCP Server is running'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

