import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Overview & Analytics'
    },
    {
      path: '/users',
      icon: Users,
      label: 'Users',
      description: 'User Management'
    },
    {
      path: '/books',
      icon: BookOpen,
      label: 'Books',
      description: 'Content Management'
    },
    {
      path: '/orders',
      icon: ShoppingCart,
      label: 'Orders',
      description: 'Order Management'
    },
    {
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      description: 'Reports & Insights'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'System Configuration'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">eBookZone</h1>
                <p className="text-xs text-gray-500">Master Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {isOpen && (
                  <div className="ml-3">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats */}
        {isOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">System Status</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Server</span>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Database</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

