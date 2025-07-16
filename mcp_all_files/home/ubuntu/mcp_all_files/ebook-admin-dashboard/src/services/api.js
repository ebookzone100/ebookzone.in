const API_BASE_URL = 'https://w5hni7c7oloe.manus.space/api';

class ApiService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Dashboard analytics
  async getDashboardData(days = 30) {
    return this.request(`/analytics/dashboard?days=${days}`);
  }

  // User management
  async getUsers(page = 1, perPage = 20, search = '') {
    return this.request(`/admin/users?page=${page}&per_page=${perPage}&search=${search}`);
  }

  async getUserStats() {
    return this.request('/admin/stats/users');
  }

  async createUser(userData) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Book management
  async getBooks(page = 1, perPage = 20, search = '', category = '', status = '') {
    const params = new URLSearchParams({
      page,
      per_page: perPage,
      search,
      category,
      status,
    });
    return this.request(`/books?${params}`);
  }

  async getBook(bookId) {
    return this.request(`/books/${bookId}`);
  }

  async createBook(bookData) {
    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  async updateBook(bookId, bookData) {
    return this.request(`/books/${bookId}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  }

  async deleteBook(bookId) {
    return this.request(`/books/${bookId}`, {
      method: 'DELETE',
    });
  }

  async getBookStats() {
    return this.request('/books/stats');
  }

  // Authors
  async getAuthors(page = 1, perPage = 50, search = '') {
    return this.request(`/authors?page=${page}&per_page=${perPage}&search=${search}`);
  }

  async createAuthor(authorData) {
    return this.request('/authors', {
      method: 'POST',
      body: JSON.stringify(authorData),
    });
  }

  async updateAuthor(authorId, authorData) {
    return this.request(`/authors/${authorId}`, {
      method: 'PUT',
      body: JSON.stringify(authorData),
    });
  }

  async deleteAuthor(authorId) {
    return this.request(`/authors/${authorId}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(page = 1, perPage = 50, search = '') {
    return this.request(`/categories?page=${page}&per_page=${perPage}&search=${search}`);
  }

  async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(categoryId, categoryData) {
    return this.request(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(categoryId) {
    return this.request(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Order management
  async getOrders(page = 1, perPage = 20, search = '', status = '', paymentStatus = '') {
    const params = new URLSearchParams({
      page,
      per_page: perPage,
      search,
      status,
      payment_status: paymentStatus,
    });
    return this.request(`/admin/orders?${params}`);
  }

  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId, statusData) {
    return this.request(`/admin/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async getOrderStats() {
    return this.request('/orders/stats');
  }

  // Analytics
  async getUserAnalytics(days = 30) {
    return this.request(`/analytics/users?days=${days}`);
  }

  async getBookAnalytics() {
    return this.request('/analytics/books');
  }

  async getSalesAnalytics(days = 30) {
    return this.request(`/analytics/sales?days=${days}`);
  }

  async getAnalyticsEvents(page = 1, perPage = 50, eventType = '', days = 7) {
    const params = new URLSearchParams({
      page,
      per_page: perPage,
      event_type: eventType,
      days,
    });
    return this.request(`/analytics/events?${params}`);
  }

  async exportReport(reportType, format = 'json', days = 30) {
    return this.request('/analytics/reports/export', {
      method: 'POST',
      body: JSON.stringify({
        report_type: reportType,
        format,
        days,
      }),
    });
  }

  // File upload
  async uploadFiles(formData) {
    return this.request('/books/upload', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
  }

  // Payment methods
  async getPaymentMethods() {
    return this.request('/payments/methods');
  }

  async getPayments(page = 1, perPage = 20, status = '', method = '') {
    const params = new URLSearchParams({
      page,
      per_page: perPage,
      status,
      method,
    });
    return this.request(`/admin/payments?${params}`);
  }
}

export const authService = new ApiService();
export default ApiService;

