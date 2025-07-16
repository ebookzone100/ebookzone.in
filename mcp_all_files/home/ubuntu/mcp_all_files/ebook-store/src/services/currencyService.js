class CurrencyService {
  constructor() {
    this.baseCurrency = 'USD';
    this.supportedCurrencies = [
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
      { code: 'GBP', symbol: '£', name: 'British Pound' },
      { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
      { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
      { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
      { code: 'MXN', symbol: '$', name: 'Mexican Peso' }
    ];
    this.exchangeRates = {};
    this.lastUpdated = null;
    this.currentCurrency = this.loadCurrencyFromStorage() || 'USD';
    this.MCP_API_BASE_URL = 'https://w5hni7c7oloe.manus.space/api';
  }

  loadCurrencyFromStorage() {
    try {
      return localStorage.getItem('selectedCurrency');
    } catch (error) {
      console.warn('Could not load currency from storage:', error);
      return null;
    }
  }

  saveCurrencyToStorage(currency) {
    try {
      localStorage.setItem('selectedCurrency', currency);
    } catch (error) {
      console.warn('Could not save currency to storage:', error);
    }
  }

  getCurrentCurrency() {
    return this.currentCurrency;
  }

  setCurrentCurrency(currency) {
    if (this.supportedCurrencies.find(c => c.code === currency)) {
      this.currentCurrency = currency;
      this.saveCurrencyToStorage(currency);
      return true;
    }
    return false;
  }

  getSupportedCurrencies() {
    return this.supportedCurrencies;
  }

  getCurrencySymbol(currencyCode = this.currentCurrency) {
    const currency = this.supportedCurrencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '$';
  }

  getCurrencyName(currencyCode = this.currentCurrency) {
    const currency = this.supportedCurrencies.find(c => c.code === currencyCode);
    return currency ? currency.name : 'US Dollar';
  }

  async fetchExchangeRates() {
    try {
      const response = await fetch(`${this.MCP_API_BASE_URL}/settings/exchange-rates`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates from MCP server');
      }

      const data = await response.json();
      this.exchangeRates = data.rates;
      this.lastUpdated = new Date();
      
      return this.exchangeRates;
    } catch (error) {
      console.error('Error fetching exchange rates from MCP server:', error);
      
      this.exchangeRates = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        INR: 83.12,
        CAD: 1.35,
        AUD: 1.52,
        JPY: 149.50,
        CNY: 7.24,
        BRL: 4.95,
        MXN: 17.12
      };
      this.lastUpdated = new Date();
      
      return this.exchangeRates;
    }
  }

  convertPrice(price, fromCurrency = this.baseCurrency, toCurrency = this.currentCurrency) {
    if (fromCurrency === toCurrency) {
      return price;
    }

    if (!this.exchangeRates || Object.keys(this.exchangeRates).length === 0) {
      console.warn('Exchange rates not loaded, returning original price');
      return price;
    }

    let usdPrice = price;
    if (fromCurrency !== 'USD') {
      const fromRate = this.exchangeRates[fromCurrency];
      if (!fromRate) {
        console.warn(`Exchange rate not found for ${fromCurrency}`);
        return price;
      }
      usdPrice = price / fromRate;
    }

    if (toCurrency === 'USD') {
      return usdPrice;
    }

    const toRate = this.exchangeRates[toCurrency];
    if (!toRate) {
      console.warn(`Exchange rate not found for ${toCurrency}`);
      return price;
    }

    return usdPrice * toRate;
  }

  formatPrice(price, currencyCode = this.currentCurrency) {
    const convertedPrice = this.convertPrice(price, this.baseCurrency, currencyCode);
    const symbol = this.getCurrencySymbol(currencyCode);
    
    let decimals = 2;
    if (currencyCode === 'JPY' || currencyCode === 'KRW') {
      decimals = 0;
    }

    const formattedNumber = convertedPrice.toFixed(decimals);
    
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      return formatter.format(convertedPrice);
    } catch (error) {
      return `${symbol}${formattedNumber}`;
    }
  }

  getExchangeRate(currencyCode) {
    return this.exchangeRates[currencyCode] || 1;
  }

  needsUpdate() {
    if (!this.lastUpdated) return true;
    const oneHour = 60 * 60 * 1000;
    return (new Date() - this.lastUpdated) > oneHour;
  }

  async initialize() {
    if (this.needsUpdate()) {
      await this.fetchExchangeRates();
    }
    return this;
  }

  getCurrencyInfo(currencyCode = this.currentCurrency) {
    const currency = this.supportedCurrencies.find(c => c.code === currencyCode);
    if (!currency) return null;

    return {
      code: currency.code,
      symbol: currency.symbol,
      name: currency.name,
      rate: this.getExchangeRate(currency.code)
    };
  }

  async detectUserCurrency() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const countryToCurrency = {
        'US': 'USD',
        'CA': 'CAD',
        'GB': 'GBP',
        'IN': 'INR',
        'AU': 'AUD',
        'JP': 'JPY',
        'CN': 'CNY',
        'BR': 'BRL',
        'MX': 'MXN',
        'DE': 'EUR',
        'FR': 'EUR',
        'IT': 'EUR',
        'ES': 'EUR',
        'NL': 'EUR'
      };
      
      const detectedCurrency = countryToCurrency[data.country_code] || 'USD';
      return detectedCurrency;
    } catch (error) {
      console.warn('Could not detect user currency:', error);
      return 'USD';
    }
  }
}

const currencyService = new CurrencyService();

export default currencyService;


