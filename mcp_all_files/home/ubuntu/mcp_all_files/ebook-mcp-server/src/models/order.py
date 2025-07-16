from src.models.user import db
from datetime import datetime
import enum
import uuid

class OrderStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class PaymentMethod(enum.Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    WALLET = "wallet"

class Currency(enum.Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    INR = "INR"

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Customer information
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_name = db.Column(db.String(100), nullable=False)
    
    # Billing information
    billing_address = db.Column(db.Text, nullable=True)
    billing_city = db.Column(db.String(50), nullable=True)
    billing_state = db.Column(db.String(50), nullable=True)
    billing_country = db.Column(db.String(50), nullable=True)
    billing_postal_code = db.Column(db.String(20), nullable=True)
    
    # Order totals
    subtotal = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, default=0.0, nullable=False)
    discount_amount = db.Column(db.Float, default=0.0, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.Enum(Currency), default=Currency.USD, nullable=False)
    
    # Order status
    status = db.Column(db.Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    # Payment information
    payment_status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=True)
    payment_gateway_id = db.Column(db.String(100), nullable=True)  # Razorpay payment ID
    payment_gateway_order_id = db.Column(db.String(100), nullable=True)  # Razorpay order ID
    
    # Notes and metadata
    notes = db.Column(db.Text, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super(Order, self).__init__(**kwargs)
        if not self.order_number:
            self.order_number = self.generate_order_number()
    
    @staticmethod
    def generate_order_number():
        """Generate unique order number"""
        return f"EB{datetime.utcnow().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
    
    def add_item(self, book, quantity=1, price=None):
        """Add item to order"""
        if price is None:
            price = book.current_price
        
        # Check if item already exists
        existing_item = OrderItem.query.filter_by(order_id=self.id, book_id=book.id).first()
        if existing_item:
            existing_item.quantity += quantity
            existing_item.total_price = existing_item.quantity * existing_item.unit_price
        else:
            item = OrderItem(
                order_id=self.id,
                book_id=book.id,
                book_title=book.title,
                quantity=quantity,
                unit_price=price,
                total_price=quantity * price
            )
            db.session.add(item)
        
        self.calculate_totals()
    
    def calculate_totals(self):
        """Calculate order totals"""
        self.subtotal = sum(item.total_price for item in self.items)
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
    
    def mark_as_completed(self):
        """Mark order as completed"""
        self.status = OrderStatus.COMPLETED
        self.payment_status = PaymentStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        
        # Increment download count for books
        for item in self.items:
            if item.book:
                item.book.increment_download_count()
    
    def to_dict(self, include_items=True):
        """Convert order to dictionary"""
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'customer_email': self.customer_email,
            'customer_name': self.customer_name,
            'billing_address': self.billing_address,
            'billing_city': self.billing_city,
            'billing_state': self.billing_state,
            'billing_country': self.billing_country,
            'billing_postal_code': self.billing_postal_code,
            'subtotal': self.subtotal,
            'tax_amount': self.tax_amount,
            'discount_amount': self.discount_amount,
            'total_amount': self.total_amount,
            'currency': self.currency.value,
            'status': self.status.value,
            'payment_status': self.payment_status.value,
            'payment_method': self.payment_method.value if self.payment_method else None,
            'payment_gateway_id': self.payment_gateway_id,
            'payment_gateway_order_id': self.payment_gateway_order_id,
            'notes': self.notes,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
        
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        
        return data
    
    def __repr__(self):
        return f'<Order {self.order_number}>'

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    
    # Item details (stored for historical purposes)
    book_title = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    # Download information
    download_count = db.Column(db.Integer, default=0, nullable=False)
    download_limit = db.Column(db.Integer, default=5, nullable=False)  # Max downloads allowed
    download_expires_at = db.Column(db.DateTime, nullable=True)  # Download expiry
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def can_download(self):
        """Check if item can be downloaded"""
        if self.download_expires_at and datetime.utcnow() > self.download_expires_at:
            return False
        return self.download_count < self.download_limit
    
    def record_download(self):
        """Record a download"""
        if self.can_download():
            self.download_count += 1
            db.session.commit()
            return True
        return False
    
    def to_dict(self):
        """Convert order item to dictionary"""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'book_id': self.book_id,
            'book_title': self.book_title,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price,
            'download_count': self.download_count,
            'download_limit': self.download_limit,
            'download_expires_at': self.download_expires_at.isoformat() if self.download_expires_at else None,
            'can_download': self.can_download(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'book': self.book.to_dict() if self.book else None
        }
    
    def __repr__(self):
        return f'<OrderItem {self.book_title}>'

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    
    # Payment details
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.Enum(Currency), default=Currency.USD, nullable=False)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Gateway information
    gateway_payment_id = db.Column(db.String(100), nullable=True)
    gateway_order_id = db.Column(db.String(100), nullable=True)
    gateway_signature = db.Column(db.String(200), nullable=True)
    gateway_response = db.Column(db.Text, nullable=True)  # JSON response from gateway
    
    # Refund information
    refund_amount = db.Column(db.Float, default=0.0, nullable=False)
    refund_reason = db.Column(db.String(500), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    processed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        """Convert payment to dictionary"""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'amount': self.amount,
            'currency': self.currency.value,
            'payment_method': self.payment_method.value,
            'status': self.status.value,
            'gateway_payment_id': self.gateway_payment_id,
            'gateway_order_id': self.gateway_order_id,
            'gateway_signature': self.gateway_signature,
            'refund_amount': self.refund_amount,
            'refund_reason': self.refund_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }
    
    def __repr__(self):
        return f'<Payment {self.gateway_payment_id}>'

