export const RAZORPAY_CONFIG = {
  key: process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_demo_key',
  currency: 'USD',
  name: "Dr. Sarah's eBook Store",
  description: 'Premium eBooks on Mental Health & Personal Development',
  image: '/logo.png',
  theme: {
    color: '#3B82F6'
  }
}

const MCP_API_BASE_URL = 'https://w5hni7c7oloe.manus.space/api';

export const paymentAPI = {
  createOrder: async (bookData) => {
    const response = await fetch(`${MCP_API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is stored in localStorage
      },
      body: JSON.stringify({
        book_id: bookData.id,
        quantity: 1,
        total_amount: bookData.price
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  verifyPayment: async (paymentData) => {
    const response = await fetch(`${MCP_API_BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature,
        order_id: paymentData.order_id
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getDownloadLink: async (bookId, transactionId) => {
    const response = await fetch(`${MCP_API_BASE_URL}/orders/download/${bookId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

export const initiatePayment = async (book, userDetails = {}) => {
  try {
    const order = await paymentAPI.createOrder(book);
    const options = {
      ...RAZORPAY_CONFIG,
      amount: order.amount * 100, // Amount in paise
      order_id: order.id,
      description: book.title,
      prefill: {
        name: userDetails.name || '',
        email: userDetails.email || '',
        contact: userDetails.phone || ''
      },
      notes: {
        book_id: book.id,
        book_title: book.title,
        book_category: book.category
      }
    };

    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        ...options,
        handler: function (response) {
          resolve({ ...response, order_id: order.id });
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'));
          }
        }
      });
      rzp.open();
    });
  } catch (error) {
    console.error('Payment initiation failed:', error);
    throw error;
  }
}

export const handlePaymentSuccess = async (paymentResponse, book) => {
  try {
    const verification = await paymentAPI.verifyPayment({
      ...paymentResponse,
      book_id: book.id,
      order_id: paymentResponse.razorpay_order_id
    });

    if (verification.success) {
      const downloadData = await paymentAPI.getDownloadLink(
        book.id,
        paymentResponse.razorpay_payment_id
      );

      return {
        success: true,
        downloadUrl: downloadData.download_url,
        transactionId: paymentResponse.razorpay_payment_id,
        message: 'Payment successful! Your eBook is ready for download.'
      };
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    return {
      success: false,
      message: 'Payment verification failed. Please contact support.'
    };
  }
}

export const initiateBundlePayment = async (books, userDetails = {}) => {
  const bundlePrice = books.reduce((sum, book) => sum + book.price, 0);
  const bundleData = {
    id: 'bundle_complete',
    title: 'Complete eBook Collection Bundle',
    price: bundlePrice,
    books: books
  };

  return initiatePayment(bundleData, userDetails);
}

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}


