import { BookOpen, Heart, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-semibold text-white">eBookZone</h3>
            <p className="mt-4 text-gray-400">
              Empowering lives through knowledge and personal growth.
            </p>
            <p className="mt-2 text-gray-400">
              email: ebookzone100@gmail.com
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/books" className="text-gray-300 hover:text-white transition-colors">eBooks Collection</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter/Social */}
          <div>
            <h3 className="text-xl font-semibold text-white">Stay Connected</h3>
            <p className="mt-4 text-gray-400">
              Follow us on social media for updates and new releases.
            </p>
            <div className="flex space-x-4 mt-4">
              {/* Placeholder for social media icons */}
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-twitter"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500">
          <p>&copy; 2025 eBookZone Store. All rights reserved. | Secure payments powered by Razorpay</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer


