import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetchCategories } from '../data/books'

const CategoriesPage = () => {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const getCategories = async () => {
      const fetchedCategories = await fetchCategories();
      // Remove 'All' from the categories list for display on this page
      setCategories(fetchedCategories.filter(cat => cat !== 'All').map(cat => ({ name: cat })));
    };
    getCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <h1 className="text-5xl font-bold text-gray-800 leading-tight">
              Browse by Category
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Find books tailored to your specific mental health needs
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => {
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <Link to={`/books?category=${encodeURIComponent(category.name)}`}>
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:scale-105">
                      {/* Header with gradient */}
                      <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute top-6 left-6">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            {/* Icon placeholder */}
                          </div>
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                            <span className="text-white font-semibold text-sm">
                              Books
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-700 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Explore books in this category
                        </p>
                        
                        <div className="flex items-center justify-between pt-4">
                          <span className="text-sm text-gray-500">
                            books available
                          </span>
                          <div className="text-teal-600 font-semibold group-hover:text-teal-700 transition-colors">
                            Explore →
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-teal-700">{categories.length}</div>
              <div className="text-gray-600">Total Categories</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-teal-700">25+</div>
              <div className="text-gray-600">Total Books</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-teal-700">5+</div>
              <div className="text-gray-600">Expert Authors</div>
            </motion.div>
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
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Browse our complete collection or use our search feature to find the perfect book for your mental health journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/books">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-teal-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Browse All Books
                </motion.button>
              </Link>
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-teal-700 transition-colors"
                >
                  Get Recommendations
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default CategoriesPage

