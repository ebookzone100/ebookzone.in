import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Download,
  Star
} from 'lucide-react';
import { authService } from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await authService.getDashboardData(timeRange);
      setDashboardData(data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
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

  const { overview, top_books, recent_activity, revenue_trend } = dashboardData || {};

  const statCards = [
    {
      title: 'Total Users',
      value: overview?.total_users || 0,
      change: overview?.new_users || 0,
      changeLabel: 'new this period',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Books',
      value: overview?.active_books || 0,
      change: overview?.total_books || 0,
      changeLabel: 'total books',
      icon: BookOpen,
      color: 'green'
    },
    {
      title: 'Total Orders',
      value: overview?.total_orders || 0,
      change: overview?.pending_orders || 0,
      changeLabel: 'pending',
      icon: ShoppingCart,
      color: 'orange'
    },
    {
      title: 'Revenue',
      value: `$${overview?.total_revenue || 0}`,
      change: `$${overview?.recent_revenue || 0}`,
      changeLabel: 'this period',
      icon: DollarSign,
      color: 'purple'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to eBookZone Master Control Program</p>
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
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">{stat.change}</span> {stat.changeLabel}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          {revenue_trend && revenue_trend.length > 0 ? (
            <div className="space-y-3">
              {revenue_trend.slice(-7).map((day, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{day.date}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">${day.revenue}</span>
                    <span className="text-xs text-gray-500">({day.orders} orders)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No revenue data available</p>
          )}
        </div>

        {/* Top Books */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Books</h3>
          {top_books && top_books.length > 0 ? (
            <div className="space-y-3">
              {top_books.slice(0, 5).map((book, index) => (
                <div key={book.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.sales_count} sales</p>
                  </div>
                  <span className="text-sm font-medium text-green-600">${book.revenue}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data available</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recent_activity && recent_activity.length > 0 ? (
          <div className="space-y-3">
            {recent_activity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {activity.event_type.replace('_', ' ')} event
                    {activity.book_id && ` for book #${activity.book_id}`}
                    {activity.order_id && ` for order #${activity.order_id}`}
                  </p>
                  <p className="text-xs text-gray-500">{activity.created_at}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium">Add User</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium">Add Book</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <span className="text-sm font-medium">View Orders</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

