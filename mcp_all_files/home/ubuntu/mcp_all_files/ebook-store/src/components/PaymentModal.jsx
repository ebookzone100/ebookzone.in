import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, CheckCircle, Globe } from 'lucide-react';
import currencyService from '../services/currencyService';
import PriceDisplay from './PriceDisplay';
import { useAuth } from '../context/AuthContext';

const MCP_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Define types for Razorpay response
const PaymentModal = ({ isOpen, onClose, book, onSuccess }) => {
  const { user, token } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [convertedPrice, setConvertedPrice] = useState(0);
  const [orderId, setOrderId] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then(setRazorpayLoaded);
  }, []);

  useEffect(() => {
    const updateCurrency = async () => {
      await currencyService.initialize()
      const currency = currencyService.getCurrentCurrency()
      setCurrentCurrency(currency)
      setConvertedPrice(currencyService.convertPrice(book?.price || 0, 'USD', currency))
    }

    if (book) {
      updateCurrency()
    }

    const handleCurrencyChange = (event) => {
      const newCurrency = event.detail
      setCurrentCurrency(newCurrency)
      setConvertedPrice(currencyService.convertPrice(book?.price || 0, 'USD', newCurrency))
    }

    window.addEventListener('currencyChanged', handleCurrencyChange)

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange)
    }
  }, [book])

  const createOrder = async () => {
    if (!user || !token) {
      alert('Please log in to make a purchase.');
      return null;
    }

    try {
      const response = await fetch(`${MCP_API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          items: [{
            book_id: book.id,
            quantity: 1,
            price: book.price
          }],
          currency: currentCurrency,
          total_amount: convertedPrice
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOrderId(data.order.id);
        return data.order;
      } else {
        const errorData = await response.json();
        alert(`Failed to create order: ${errorData.message || response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
      return null;
    }
  };

  const initiateRazorpayPayment = async () => {
    try {
      setIsProcessing(true);
      const order = await createOrder();

      if (!order) {
        setIsProcessing(false);
        return;
      }

      // Create Razorpay order
      const response = await fetch(`${MCP_API_BASE_URL}/payments/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_id: order.id })
      });

      if (!response.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const razorpayOrder = await response.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "eBookZone",
        description: book.title,
        image: './favicon.ico',
        order_id: razorpayOrder.order_id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch(`${MCP_API_BASE_URL}/payments/razorpay/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyResponse.ok) {
              setPaymentSuccess(true);
              onSuccess && onSuccess();
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: {
          color: '#6366f1'
        }
      };
      handler: async function (response) {
        // Handle successful payment
        try {
          const verifyResponse = await fetch(`${MCP_API_BASE_URL}/payments/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.id // Our internal order ID
            })
          });

          if (verifyResponse.ok) {
            setPaymentSuccess(true);
            setTimeout(() => {
              onSuccess(book);
              setPaymentSuccess(false);
              setIsProcessing(false);
              onClose();
            }, 2000);
          } else {
            const errorData = await verifyResponse.json();
            alert(`Payment verification failed: ${errorData.message || verifyResponse.statusText}`);
            setIsProcessing(false);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          alert('Payment verification failed. Please try again.');
          setIsProcessing(false);
        }
      },
      prefill: {
        name: user ? user.name : '',
        email: user ? user.email : '',
        contact: ''
      },
      notes: {
        currency: currentCurrency,
        original_price_usd: book.price,
        internal_order_id: order.id
      },
      theme: {
        color: '#0d9488'
      }
    };

    if (typeof window.Razorpay !== 'undefined') {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      alert('Razorpay SDK not loaded. Cannot proceed with payment.');
      setIsProcessing(false);
    }
  };

  if (!book) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Complete Purchase</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {paymentSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600 mb-4">
                    Thank you for your purchase. You can now download your eBook.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      Download link has been sent to your email.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Book Details */}
                  <div className="flex items-start space-x-4 mb-6">
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-20 h-28 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{book.title}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{book.description}</p>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          Paying in {currencyService.getCurrencyName(currentCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Book Price:</span>
                      <PriceDisplay 
                        price={book.price} 
                        className="font-semibold"
                      />
                    </div>
                    {currentCurrency !== 'USD' && (
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-gray-500">Original Price (USD):</span>
                        <span className="text-gray-500">${book.price}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-600">$0.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total:</span>
                        <PriceDisplay 
                          price={book.price} 
                          size="large"
                          className="font-bold text-teal-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Lock className="h-4 w-4 text-green-500" />
                      <span>SSL Encrypted</span>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={initiateRazorpayPayment}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <span>Pay with Razorpay</span>
                      </>
                    )}
                  </motion.button>

                  {/* Payment Methods */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 mb-2">Powered by Razorpay</p>
                    <p className="text-xs text-gray-500">
                      Supports Credit Cards, Debit Cards, Net Banking, UPI & Wallets
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Multi-currency payments supported
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PaymentModal


