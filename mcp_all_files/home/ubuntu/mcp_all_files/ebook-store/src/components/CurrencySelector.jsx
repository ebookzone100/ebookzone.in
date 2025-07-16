import { useState, useEffect } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import currencyService from '../services/currencyService'

const CurrencySelector = ({ onCurrencyChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentCurrency, setCurrentCurrency] = useState('USD')
  const [supportedCurrencies, setSupportedCurrencies] = useState([])

  useEffect(() => {
    // Initialize currency service and load currencies
    const initializeCurrency = async () => {
      await currencyService.initialize()
      setCurrentCurrency(currencyService.getCurrentCurrency())
      setSupportedCurrencies(currencyService.getSupportedCurrencies())
    }

    initializeCurrency()
  }, [])

  const handleCurrencySelect = (currencyCode) => {
    currencyService.setCurrentCurrency(currencyCode)
    setCurrentCurrency(currencyCode)
    setIsOpen(false)
    
    // Notify parent component about currency change
    if (onCurrencyChange) {
      onCurrencyChange(currencyCode)
    }
  }

  const getCurrentCurrencyInfo = () => {
    return supportedCurrencies.find(c => c.code === currentCurrency) || supportedCurrencies[0]
  }

  const currentInfo = getCurrentCurrencyInfo()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors duration-200 bg-white border border-gray-200 rounded-lg hover:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
        aria-label="Select Currency"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">
          {currentInfo ? `${currentInfo.symbol} ${currentInfo.code}` : 'USD'}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Select Currency</h3>
              <p className="text-xs text-gray-500 mt-1">Prices will be converted automatically</p>
            </div>
            
            <div className="py-2">
              {supportedCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency.code)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between ${
                    currentCurrency === currency.code ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium">{currency.symbol}</span>
                    <div>
                      <div className="text-sm font-medium">{currency.code}</div>
                      <div className="text-xs text-gray-500">{currency.name}</div>
                    </div>
                  </div>
                  
                  {currentCurrency === currency.code && (
                    <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Exchange rates are updated hourly. Final charges may vary based on your payment method.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CurrencySelector

