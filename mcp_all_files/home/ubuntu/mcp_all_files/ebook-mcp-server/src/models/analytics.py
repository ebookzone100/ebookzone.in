from src.models.user import db
from datetime import datetime, date
import enum

class EventType(enum.Enum):
    PAGE_VIEW = "page_view"
    BOOK_VIEW = "book_view"
    BOOK_DOWNLOAD = "book_download"
    SEARCH = "search"
    PURCHASE = "purchase"
    USER_REGISTRATION = "user_registration"
    USER_LOGIN = "user_login"

class AnalyticsEvent(db.Model):
    __tablename__ = 'analytics_events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.Enum(EventType), nullable=False)
    
    # User information
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(100), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    
    # Event data
    page_url = db.Column(db.String(500), nullable=True)
    referrer_url = db.Column(db.String(500), nullable=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    search_query = db.Column(db.String(200), nullable=True)
    
    # Additional metadata
    event_metadata = db.Column(db.Text, nullable=True)  # JSON string for additional data
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='analytics_events')
    book = db.relationship('Book', backref='analytics_events')
    order = db.relationship('Order', backref='analytics_events')
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type.value,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'page_url': self.page_url,
            'referrer_url': self.referrer_url,
            'book_id': self.book_id,
            'order_id': self.order_id,
            'search_query': self.search_query,
            'metadata': self.event_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def log_event(event_type, user_id=None, book_id=None, order_id=None, search_query=None, 
                  page_url=None, referrer_url=None, session_id=None, ip_address=None, 
                  user_agent=None, metadata=None):
        """Log an analytics event"""
        event = AnalyticsEvent(
            event_type=event_type,
            user_id=user_id,
            book_id=book_id,
            order_id=order_id,
            search_query=search_query,
            page_url=page_url,
            referrer_url=referrer_url,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            event_metadata=metadata
        )
        db.session.add(event)
        db.session.commit()
        return event

class DailySummary(db.Model):
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True, index=True)
    
    # User metrics
    new_users = db.Column(db.Integer, default=0, nullable=False)
    active_users = db.Column(db.Integer, default=0, nullable=False)
    total_users = db.Column(db.Integer, default=0, nullable=False)
    
    # Traffic metrics
    page_views = db.Column(db.Integer, default=0, nullable=False)
    unique_visitors = db.Column(db.Integer, default=0, nullable=False)
    book_views = db.Column(db.Integer, default=0, nullable=False)
    
    # Sales metrics
    orders_count = db.Column(db.Integer, default=0, nullable=False)
    revenue_usd = db.Column(db.Float, default=0.0, nullable=False)
    books_sold = db.Column(db.Integer, default=0, nullable=False)
    
    # Popular content
    top_book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=True)
    top_search_query = db.Column(db.String(200), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    top_book = db.relationship('Book', backref='daily_summaries')
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'new_users': self.new_users,
            'active_users': self.active_users,
            'total_users': self.total_users,
            'page_views': self.page_views,
            'unique_visitors': self.unique_visitors,
            'book_views': self.book_views,
            'orders_count': self.orders_count,
            'revenue_usd': self.revenue_usd,
            'books_sold': self.books_sold,
            'top_book_id': self.top_book_id,
            'top_search_query': self.top_search_query,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'top_book': self.top_book.to_dict() if self.top_book else None
        }

class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    value = db.Column(db.Text, nullable=True)
    description = db.Column(db.String(500), nullable=True)
    setting_type = db.Column(db.String(20), default='string', nullable=False)  # string, integer, float, boolean, json
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def get_value(self):
        """Get typed value based on setting_type"""
        if self.value is None:
            return None
        
        if self.setting_type == 'integer':
            return int(self.value)
        elif self.setting_type == 'float':
            return float(self.value)
        elif self.setting_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.setting_type == 'json':
            import json
            return json.loads(self.value)
        else:
            return self.value
    
    def set_value(self, value):
        """Set value with proper type conversion"""
        if value is None:
            self.value = None
        elif self.setting_type == 'json':
            import json
            self.value = json.dumps(value)
        else:
            self.value = str(value)
    
    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'value': self.get_value(),
            'raw_value': self.value,
            'description': self.description,
            'setting_type': self.setting_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_setting(key, default=None):
        """Get setting value by key"""
        setting = SystemSetting.query.filter_by(key=key).first()
        if setting:
            return setting.get_value()
        return default
    
    @staticmethod
    def set_setting(key, value, description=None, setting_type='string'):
        """Set setting value by key"""
        setting = SystemSetting.query.filter_by(key=key).first()
        if not setting:
            setting = SystemSetting(key=key, description=description, setting_type=setting_type)
            db.session.add(setting)
        
        setting.set_value(value)
        if description:
            setting.description = description
        if setting_type:
            setting.setting_type = setting_type
        
        db.session.commit()
        return setting

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)  # book, user, order, etc.
    resource_id = db.Column(db.Integer, nullable=True)
    
    # Change details
    old_values = db.Column(db.Text, nullable=True)  # JSON string
    new_values = db.Column(db.Text, nullable=True)  # JSON string
    
    # Request details
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='audit_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': self.user.to_dict() if self.user else None
        }
    
    @staticmethod
    def log_action(user_id, action, resource_type, resource_id=None, old_values=None, new_values=None, ip_address=None, user_agent=None):
        """Log an audit action"""
        import json
        
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=json.dumps(old_values) if old_values else None,
            new_values=json.dumps(new_values) if new_values else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log)
        db.session.commit()
        return log

