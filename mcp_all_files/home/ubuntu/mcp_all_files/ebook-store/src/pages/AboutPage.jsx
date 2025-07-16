import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-50 to-blue-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <h1 className="text-5xl font-bold text-gray-800 leading-tight">
              About eBookZone
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover life-changing eBooks designed to empower, educate, and inspire—from mastering emotions and building wealth to boosting productivity and unlocking your purpose. Our curated collection delivers actionable insights to help you break bad habits, attract success, and thrive in relationships, finances, and beyond. Dive in and transform your life, one eBook at a time!
            </p>
          </motion.div>
        </div>
        {/* Background Image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('/library-books.jpg')` }}
        ></div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-gray-800">
                Our Mission
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                We publish these eBooks with one mission: to make growth accessible. Whether you're a student, leader, or lifelong learner, our guides blend wisdom with simplicity, giving you the tools to take charge of your future. Dive in, explore, and start your journey to a better you—one eBook at a time!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle className="h-6 w-6 text-teal-600" />
                  <span>Expert-curated selection</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle className="h-6 w-6 text-teal-600" />
                  <span>Evidence-based resources</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle className="h-6 w-6 text-teal-600" />
                  <span>Compassionate approach</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle className="h-6 w-6 text-teal-600" />
                  <span>Secure & private shopping</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-96 rounded-xl overflow-hidden shadow-lg"
            >
              <img
                src="/library-books.jpg"
                alt="Our Mission"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <p className="text-white text-2xl font-semibold text-center p-4">
                  "The right book at the right time can be transformative."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-xl shadow-md text-center space-y-4"
            >
              <h3 className="text-2xl font-semibold text-teal-700">Quality</h3>
              <p className="text-gray-600">Every book is carefully reviewed and selected by our expert team</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white p-8 rounded-xl shadow-md text-center space-y-4"
            >
              <h3 className="text-2xl font-semibold text-teal-700">Accessibility</h3>
              <p className="text-gray-600">Making mental health resources available to everyone, everywhere</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-8 rounded-xl shadow-md text-center space-y-4"
            >
              <h3 className="text-2xl font-semibold text-teal-700">Compassion</h3>
              <p className="text-gray-600">Understanding that healing is a personal and unique journey</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white p-8 rounded-xl shadow-md text-center space-y-4"
            >
              <h3 className="text-2xl font-semibold text-teal-700">Privacy</h3>
              <p className="text-gray-600">Your personal journey and information are always protected</p>
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
              Start Your Transformation Today
            </h2>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Browse our carefully curated collection and find the perfect eBook to guide you on your path to personal growth and success.
            </p>
            <a 
              href="/books"
              className="inline-block bg-white text-teal-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Explore eBooks
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage

