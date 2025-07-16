import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ShoppingCart, Play, Pause } from 'lucide-react'
import PaymentModal from '../components/PaymentModal'
import PriceDisplay from '../components/PriceDisplay'
import { fetchBooks } from '../data/books' // Import fetchBooks

const HomePage = () => {
  const [selectedBook, setSelectedBook] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentBookIndex, setCurrentBookIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [featuredBooks, setFeaturedBooks] = useState([]) // State for featured books

  useEffect(() => {
    const getBooks = async () => {
      const allBooks = await fetchBooks();
      setFeaturedBooks(allBooks.slice(0, 6)); // Take first 6 as featured
    };
    getBooks();
  }, []);

  // Auto-rotate books
  useEffect(() => {
    if (!isAutoPlay || featuredBooks.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentBookIndex((prev) => (prev + 1) % featuredBooks.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isAutoPlay, featuredBooks.length])

  const handlePurchase = (book) => {
    setSelectedBook(book)
    setShowPaymentModal(true)
  }

  const handlePaymentClose = () => {
    setShowPaymentModal(false)
    setSelectedBook(null)
  }

  const nextBook = () => {
    setCurrentBookIndex((prev) => (prev + 1) % featuredBooks.length)
  }

  const prevBook = () => {
    setCurrentBookIndex((prev) => (prev - 1 + featuredBooks.length) % featuredBooks.length)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Animated eBooks */}
      <section className="bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h1 className="text-5xl font-bold text-gray-800 leading-tight">
                Transform Your <span className="text-teal-700">Mental Health</span> Journey
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Discover life-changing eBooks designed to empower, educate, and inspire—from mastering emotions and building wealth to boosting productivity and unlocking your purpose. Our curated collection delivers actionable insights to help you break bad habits, attract success, and thrive in relationships, finances, and beyond. Dive in and transform your life, one eBook at a time!
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/books">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-800 transition-colors shadow-lg"
                  >
                    Explore Books
                  </motion.button>
                </Link>
                <Link to="/categories">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-teal-700 text-teal-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-700 hover:text-white transition-colors"
                  >
                    Browse Categories
                  </motion.button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-teal-700">27+</div>
                  <div className="text-gray-600">eBooks</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-teal-700">10K+</div>
                  <div className="text-gray-600">Happy Readers</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-teal-700">15+</div>
                  <div className="text-gray-600">Expert Authors</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Side - Animated eBook Display */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Main Book Display */}
              <div className="relative h-96 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {featuredBooks.length > 0 && (
                    <motion.div
                      key={currentBookIndex}
                      initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                      exit={{ opacity: 0, rotateY: -90, scale: 0.8 }}
                      transition={{ duration: 0.6 }}
                      className="relative"
                    >
                      {/* Book Cover */}
                      <div className="relative group cursor-pointer" onClick={() => handlePurchase(featuredBooks[currentBookIndex])}>
                        <div className="w-64 h-80 bg-white rounded-lg shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                          <img
                            src={featuredBooks[currentBookIndex]?.image}
                            alt={featuredBooks[currentBookIndex]?.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <h3 className="font-bold text-lg mb-2">{featuredBooks[currentBookIndex]?.title}</h3>
                              <div className="flex items-center justify-between">
                                <PriceDisplay 
                                  price={featuredBooks[currentBookIndex]?.price} 
                                  size="large"
                                  className="text-white"
                                />
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-full"
                                >
                                  <ShoppingCart className="h-5 w-5" />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Floating elements */}
                        {featuredBooks[currentBookIndex]?.bestseller && (
                          <motion.div
                            animate={{ y: [-10, 10, -10] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold"
                          >
                            Bestseller
                          </motion.div>
                        )}
                        
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute -bottom-4 -left-4 bg-teal-600 text-white p-3 rounded-full"
                        >
                          <Star className="h-5 w-5" />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Background Books */}
                <div className="absolute inset-0 -z-10">
                  {featuredBooks.slice(1, 4).map((book, index) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0.3, scale: 0.7 }}
                      animate={{ 
                        opacity: 0.3, 
                        scale: 0.7,
                        x: (index - 1) * 100,
                        y: index * 20,
                        rotate: (index - 1) * 15
                      }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="absolute w-48 h-60 bg-white rounded-lg shadow-lg overflow-hidden"
                    >
                      <img
                        src={book.image}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prevBook}
                  className="bg-white text-teal-700 p-3 rounded-full shadow-lg hover:bg-teal-50 transition-colors"
                >
                  ←
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className="bg-teal-700 text-white p-3 rounded-full shadow-lg hover:bg-teal-800 transition-colors"
                >
                  {isAutoPlay ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={nextBook}
                  className="bg-white text-teal-700 p-3 rounded-full shadow-lg hover:bg-teal-50 transition-colors"
                >
                  →
                </motion.button>
              </div>

              {/* Book Indicators */}
              <div className="flex justify-center space-x-2 mt-4">
                {featuredBooks.map((_, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => setCurrentBookIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentBookIndex ? 'bg-teal-700' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Books Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Featured Books
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our most popular titles that have transformed thousands of lives
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBooks.slice(0, 6).map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden group cursor-pointer"
                onClick={() => handlePurchase(book)}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    <PriceDisplay 
                      price={book.price} 
                      className="text-white font-semibold"
                    />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-700 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {book.description}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePurchase(book)}
                    className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Buy Now - </span>
                    <PriceDisplay 
                      price={book.price} 
                      className="text-white font-semibold"
                    />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-teal-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold text-white">
              Ready to Transform Your Life?
            </h2>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Join thousands of readers who have already started their journey to better mental health, personal growth, and financial wellness.
            </p>
            <Link to="/books">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-teal-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Your Journey Today
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentClose}
        book={selectedBook}
      />
    </div>
  )
}

export default HomePage


