import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone } from 'lucide-react'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission logic here (e.g., send to an API endpoint)
    console.log('Form submitted:', formData)
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    })
  }

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
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Have questions or need support? Reach out to us, and we'll be happy to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white p-8 rounded-xl shadow-lg"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Send Us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  ></textarea>
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-teal-700 transition-colors shadow-md"
                >
                  Send Message
                </motion.button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white p-8 rounded-xl shadow-lg space-y-8"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Get in Touch
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Mail className="h-7 w-7 text-teal-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Email Us</h3>
                    <p className="text-gray-600">ebookzone100@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <MapPin className="h-7 w-7 text-teal-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Our Location</h3>
                    <p className="text-gray-600">Guwahati, Assam, India</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="h-7 w-7 text-teal-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Call Us</h3>
                    <p className="text-gray-600">+1 (555) 123-4567 (Example)</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Frequently Asked Questions
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li>
                    <span className="font-semibold text-gray-700">Q: How do I purchase an eBook?</span><br/>
                    A: Simply click the "Buy Now" button on any eBook page and follow the secure checkout process.
                  </li>
                  <li>
                    <span className="font-semibold text-gray-700">Q: What payment methods do you accept?</span><br/>
                    A: We accept all major credit/debit cards and other local payment options via Razorpay.
                  </li>
                  <li>
                    <span className="font-semibold text-gray-700">Q: Can I read eBooks on any device?</span><br/>
                    A: Yes, our eBooks are typically in PDF format, compatible with most devices and e-readers.
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage

