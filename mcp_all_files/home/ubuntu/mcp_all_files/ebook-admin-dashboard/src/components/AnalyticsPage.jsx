import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  Eye
} from 'lucide-react';
import { authService } from '../services/api';

const AnalyticsPage = () => {
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [bookAnalytics, setBookAnalytics] = useState(null);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [userResponse, bookResponse, salesResponse] = await Promise.all([
        authService.getUserAnalytics(timeRange),
        authService.getBookAnalytics(),
        authService.getSalesAnalytics(timeRange)
      ]);
      
      setUserAnalytics(userResponse);
      setBookAnalytics(bookResponse);
      setSalesAnalytics(salesResponse);
    } catch (error) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType) => {
    try {
      const report = await authService.exportReport(reportType, 'json', timeRange);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export report: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* User Analytics */}
      {userAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Analytics</h3>
            <button
              onClick={() => exportReport('users')}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">{userAnalytics.summary?.total_users || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-900">{userAnalytics.activity_status?.active || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Avg Daily Registrations</p>
                  <p className="text-2xl font-bold text-purple-900">{userAnalytics.summary?.average_daily_registrations || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Top Customers */}
          {userAnalytics.top_customers && userAnalytics.top_customers.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Top Customers</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userAnalytics.top_customers.slice(0, 5).map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-4 py-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{customer.order_count}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">${customer.total_spent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book Analytics */}
      {bookAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Book Performance</h3>
            <button
              onClick={() => exportReport('books')}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Books</p>
                  <p className="text-2xl font-bold text-orange-900">{bookAnalytics.summary?.total_books || 0}</p>
                </div>
                <BookOpen className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Views</p>
                  <p className="text-2xl font-bold text-blue-900">{bookAnalytics.summary?.total_views || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Downloads</p>
                  <p className="text-2xl font-bold text-green-900">{bookAnalytics.summary?.total_downloads || 0}</p>
                </div>
                <Download className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-900">{bookAnalytics.summary?.average_rating || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Top Performing Books */}
          {bookAnalytics.book_performance && bookAnalytics.book_performance.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Top Performing Books</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookAnalytics.book_performance.slice(0, 10).map((book) => (
                      <tr key={book.id}>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {book.title}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{book.views}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{book.sales}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">${book.revenue}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{book.conversion_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Analytics */}
      {salesAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
            <button
              onClick={() => exportReport('sales')}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">${salesAnalytics.summary?.total_revenue || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900">{salesAnalytics.summary?.total_orders || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Period Revenue</p>
                  <p className="text-2xl font-bold text-purple-900">${salesAnalytics.summary?.period_revenue || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Period Orders</p>
                  <p className="text-2xl font-bold text-orange-900">{salesAnalytics.summary?.period_orders || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Daily Sales Trend */}
          {salesAnalytics.daily_sales && salesAnalytics.daily_sales.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Daily Sales Trend</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesAnalytics.daily_sales.slice(-10).map((day) => (
                      <tr key={day.date}>
                        <td className="px-4 py-2 text-sm text-gray-900">{day.date}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{day.orders}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">${day.revenue}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">${day.avg_order_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;

