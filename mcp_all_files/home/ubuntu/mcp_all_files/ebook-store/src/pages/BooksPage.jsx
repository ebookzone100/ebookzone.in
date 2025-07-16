import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Star, ShoppingCart, Tag, Calendar, BookOpen } from 'lucide-react'
import { fetchBooks, fetchCategories, getBooksByCategory, searchBooks } from '../data/books'
import PaymentModal from '../components/PaymentModal'
import PriceDisplay from '../components/PriceDisplay'

const BooksPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [allBooks, setAllBooks] = useState([])
  const [filteredBooks, setFilteredBooks] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const booksData = await fetchBooks();
      setAllBooks(booksData);
      setFilteredBooks(booksData);

      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
    };
    loadData();
  }, []);

  useEffect(() => {
    let result = [...allBooks];

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(book => book.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(book => 
        book.title.toLowerCase().includes(lowerCaseQuery) ||
        book.description.toLowerCase().includes(lowerCaseQuery) ||
        (book.tags && book.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
      );
    }

    // Sort books
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        break;
    }

    setFilteredBooks(result);
  }, [selectedCategory, searchQuery, sortBy, allBooks]);

  const handlePurchase = (book) => {
    setSelectedBook(book)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (book) => {
    console.log('Payment successful for:', book.title)
    alert(`Thank you for purchasing "${book.title}"! Check your email for the download link.`)
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedBook(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">eBooks Collection</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our comprehensive library of expertly crafted eBooks covering mental health, 
            personal development, financial wellness, and more.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search books by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center space-x-2 text-gray-700 hover:text-blue-600"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>

            {/* Categories */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-gray-600">
            Showing {filteredBooks.length} of {allBooks.length} books
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </motion.div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {book.category}
                  </div>
                  {book.bestseller && (
                    <div className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                      Bestseller
                    </div>
                  )}
                </div>
                {book.originalPrice > book.price && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    Sale
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {book.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {book.description}
                </p>

                {/* Book Details */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{book.pages} pages</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(book.publishDate).getFullYear()}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {book.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-flex items-center space-x-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                  {book.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{book.tags.length - 2} more</span>
                  )}
                </div>

                {/* Rating and Reviews */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(book.rating)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">
                      {book.rating} ({book.reviews})
                    </span>
                  </div>
                </div>

                {/* Price and Purchase */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PriceDisplay 
                      price={book.price} 
                      size="large"
                      className="text-blue-600"
                    />
                    {book.originalPrice > book.price && (
                      <PriceDisplay 
                        price={book.originalPrice} 
                        size="small"
                        className="text-gray-500 line-through"
                      />
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePurchase(book)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-1 hover:shadow-lg transition-all duration-200"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Buy</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredBooks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <BookOpen className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Bundle Offer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Complete Collection Bundle</h2>
          <p className="text-xl mb-6 text-purple-100">
            Get all eBooks for one incredible price and save over 60%!
          </p>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <span className="text-3xl font-bold">$99.99</span>
            <span className="text-xl text-purple-200 line-through">$299.99</span>
            <span className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold">
              Save $200
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => alert('Bundle purchase coming soon with Razorpay integration!')}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all duration-200"
          >
            Buy Complete Bundle
          </motion.button>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        book={selectedBook}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

export default BooksPage


