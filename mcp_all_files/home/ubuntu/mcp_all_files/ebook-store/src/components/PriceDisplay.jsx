import { useState, useEffect } from 'react'
import currencyService from '../services/currencyService'

const PriceDisplay = ({ 
  price, 
  originalCurrency = 'USD', 
  className = '', 
  showOriginal = false,
  size = 'normal' 
}) => {
  const [displayPrice, setDisplayPrice] = useState('')
  const [currentCurrency, setCurrentCurrency] = useState('USD')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updatePrice = async () => {
      setIsLoading(true)
      await currencyService.initialize()
      const currency = currencyService.getCurrentCurrency()
      setCurrentCurrency(currency)
      
      const formatted = currencyService.formatPrice(price, currency)
      setDisplayPrice(formatted)
      setIsLoading(false)
    }

    updatePrice()

    // Listen for currency changes
    const handleCurrencyChange = (event) => {
      const newCurrency = event.detail
      setCurrentCurrency(newCurrency)
      const formatted = currencyService.formatPrice(price, newCurrency)
      setDisplayPrice(formatted)
    }

    window.addEventListener('currencyChanged', handleCurrencyChange)

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange)
    }
  }, [price, originalCurrency])

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm'
      case 'large':
        return 'text-xl font-bold'
      case 'xlarge':
        return 'text-2xl font-bold'
      default:
        return 'text-base font-semibold'
    }
  }

  const getOriginalPrice = () => {
    if (currentCurrency === originalCurrency) return null
    return currencyService.formatPrice(price, originalCurrency)
  }

  if (isLoading) {
    return (
      <div className={`${className} ${getSizeClasses()}`}>
        <span className="animate-pulse bg-gray-200 rounded px-2 py-1">Loading...</span>
      </div>
    )
  }

  return (
    <div className={`${className} ${getSizeClasses()}`}>
      <span className="text-teal-600">{displayPrice}</span>
      {showOriginal && getOriginalPrice() && (
        <span className="text-gray-500 text-sm ml-2 line-through">
          {getOriginalPrice()}
        </span>
      )}
    </div>
  )
}

export default PriceDisplay

