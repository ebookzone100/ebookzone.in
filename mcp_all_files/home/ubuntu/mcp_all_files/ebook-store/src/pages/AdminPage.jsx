import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Upload, Save, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext' // Import useAuth

const AdminPage = () => {
  const { user, token } = useAuth() // Get user and token from AuthContext
  const [books, setBooks] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '', // Changed to category_id
    page_count: '', // Changed to page_count
    publication_date: '', // Changed to publication_date
    tags: '',
    average_rating: '', // Changed to average_rating
    review_count: '', // Changed to review_count
    cover_image_url: '', // Changed to cover_image_url
    is_bestseller: false,
    is_on_sale: false,
    sale_price: '',
    author_id: '' // Added author_id
  })
  const [categories, setCategories] = useState([]) // State for categories
  const [authors, setAuthors] = useState([]) // State for authors

  const MCP_API_BASE_URL = 'https://w5hni7c7oloe.manus.space/api'

  useEffect(() => {
    if (user && token) {
      fetchBooks()
      fetchCategoriesData()
      fetchAuthorsData()
    }
  }, [user, token])

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${MCP_API_BASE_URL}/books`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBooks(data.books)
      } else {
        console.error('Failed to fetch books:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    }
  }

  const fetchCategoriesData = async () => {
    try {
      const response = await fetch(`${MCP_API_BASE_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        console.error('Failed to fetch categories:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchAuthorsData = async () => {
    try {
      const response = await fetch(`${MCP_API_BASE_URL}/authors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAuthors(data.authors)
      } else {
        console.error('Failed to fetch authors:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingBook ? `${MCP_API_BASE_URL}/books/${editingBook.id}` : `${MCP_API_BASE_URL}/books`
      const method = editingBook ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
          page_count: parseInt(formData.page_count),
          average_rating: formData.average_rating ? parseFloat(formData.average_rating) : null,
          review_count: formData.review_count ? parseInt(formData.review_count) : null,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag).join(',') // Convert array back to comma-separated string
        })
      })

      if (response.ok) {
        await fetchBooks()
        resetForm()
        alert(editingBook ? 'Book updated successfully!' : 'Book added successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error saving book: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('Error saving book:', error)
      alert('Error saving book')
    }
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      description: book.description,
      price: book.price.toString(),
      category_id: book.category_id,
      page_count: book.page_count?.toString() || '',
      publication_date: book.publication_date || '',
      tags: book.tags || '',
      average_rating: book.average_rating?.toString() || '',
      review_count: book.review_count?.toString() || '',
      cover_image_url: book.cover_image_url || '',
      is_bestseller: book.is_bestseller,
      is_on_sale: book.is_on_sale,
      sale_price: book.sale_price?.toString() || '',
      author_id: book.author_id
    })
    setShowAddForm(true)
  }

  const handleDelete = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        const response = await fetch(`${MCP_API_BASE_URL}/books/${bookId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          await fetchBooks()
          alert('Book deleted successfully!')
        } else {
          const errorData = await response.json()
          alert(`Error deleting book: ${errorData.message || response.statusText}`)
        }
      } catch (error) {
        console.error('Error deleting book:', error)
        alert('Error deleting book')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category_id: '',
      page_count: '',
      publication_date: '',
      tags: '',
      average_rating: '',
      review_count: '',
      cover_image_url: '',
      is_bestseller: false,
      is_on_sale: false,
      sale_price: '',
      author_id: ''
    })
    setEditingBook(null)
    setShowAddForm(false)
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700">You must be logged in as an administrator to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Book Management</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"
            >
              <Plus size={20} />
              Add New Book
            </motion.button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-6 mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author *
                  </label>
                  <select
                    name="author_id"
                    value={formData.author_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Author</option>
                    {authors.map(author => (
                      <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pages
                  </label>
                  <input
                    type="number"
                    name="page_count"
                    value={formData.page_count}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    name="publication_date"
                    value={formData.publication_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    name="average_rating"
                    value={formData.average_rating}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reviews Count
                  </label>
                  <input
                    type="number"
                    name="review_count"
                    value={formData.review_count}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Price (if on sale)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., mental health, self-help, productivity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="text"
                    name="cover_image_url"
                    value={formData.cover_image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_bestseller"
                      checked={formData.is_bestseller}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Bestseller
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_on_sale"
                      checked={formData.is_on_sale}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    On Sale
                  </label>
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"
                  >
                    <Save size={20} />
                    {editingBook ? 'Update Book' : 'Add Book'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Books List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {book.title}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(book)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                  {book.description}
                </p>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-teal-600 font-semibold">
                    ${book.price}
                    {book.is_on_sale && book.sale_price && (
                      <span className="text-red-500 ml-2">${book.sale_price}</span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">{book.category_name}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{book.page_count} pages</span>
                  <span>{new Date(book.publication_date).getFullYear()}</span>
                </div>
                
                <div className="flex gap-2 mt-2">
                  {book.is_bestseller && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      Bestseller
                    </span>
                  )}
                  {book.is_on_sale && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                      Sale
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {books.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No books found. Add your first book!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPage


