import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Search, ShoppingCart, User, LogOut, LogIn } from 'lucide-react'
import CurrencySelector from './CurrencySelector'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleCurrencyChange = (newCurrency) => {
    // Force a re-render of components that display prices
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: newCurrency }))
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-teal-700">eBookZone</div>
            <div className="text-sm text-orange-400 italic hidden sm:block"></div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-gray-700 hover:text-teal-600 transition-colors font-medium ${
                isActive('/') ? 'text-teal-600 border-b-2 border-teal-600' : ''
              }`}
            >
              Home
            </Link>
            <Link 
              to="/books" 
              className={`text-gray-700 hover:text-teal-600 transition-colors font-medium ${
                isActive('/books') ? 'text-teal-600 border-b-2 border-teal-600' : ''
              }`}
            >
              Books
            </Link>
            <Link 
              to="/categories" 
              className={`text-gray-700 hover:text-teal-600 transition-colors font-medium ${
                isActive('/categories') ? 'text-teal-600 border-b-2 border-teal-600' : ''
              }`}
            >
              Categories
            </Link>
            <Link 
              to="/about" 
              className={`text-gray-700 hover:text-teal-600 transition-colors font-medium ${
                isActive('/about') ? 'text-teal-600 border-b-2 border-teal-600' : ''
              }`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`text-gray-700 hover:text-teal-600 transition-colors font-medium ${
                isActive('/contact') ? 'text-teal-600 border-b-2 border-teal-600' : ''
              }`}
            >
              Contact
            </Link>
            <Link 
              to="/admin" 
              className={`text-orange-600 hover:text-orange-700 transition-colors font-semibold ${
                isActive('/admin') ? 'text-orange-700 border-b-2 border-orange-700' : ''
              }`}
            >
              Admin
            </Link>
          </div>

          {/* Search, Currency Selector, and Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent w-64"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <CurrencySelector onCurrencyChange={handleCurrencyChange} />
            
            {user ? (
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-700" />
                <span className="text-gray-700 font-medium">{user.name}</span>
                <button 
                  onClick={logout} 
                  className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </Link>
            )}

            <button className="relative p-2 text-gray-700 hover:text-teal-600 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-teal-600 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to="/"
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/books"
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Books
              </Link>
              <Link
                to="/categories"
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Categories
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <Link
                to="/admin"
                className="block px-3 py-2 text-orange-600 hover:text-orange-700 transition-colors font-semibold"
                onClick={() => setIsOpen(false)}
              >
                Admin
              </Link>
              
              {/* Mobile Search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Mobile Currency Selector */}
              <div className="px-3 py-2">
                <CurrencySelector onCurrencyChange={handleCurrencyChange} />
              </div>

              {user ? (
                <button 
                  onClick={() => { logout(); setIsOpen(false); }} 
                  className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors block px-3 py-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout ({user.name})</span>
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors block px-3 py-2"
                  onClick={() => setIsOpen(false)}
                >
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar


