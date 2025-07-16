import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw,
  Database,
  Shield,
  Mail,
  Globe,
  CreditCard,
  Bell,
  Users,
  BookOpen
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [generalSettings, setGeneralSettings] = useState({
    site_name: 'eBookZone',
    site_description: 'Your premier destination for digital books',
    admin_email: 'admin@ebookzone.in',
    support_email: 'support@ebookzone.in',
    timezone: 'UTC',
    currency: 'USD',
    language: 'en'
  });

  const [paymentSettings, setPaymentSettings] = useState({
    razorpay_enabled: false,
    razorpay_key_id: '',
    razorpay_key_secret: '',
    bank_transfer_enabled: true,
    tax_rate: 0,
    processing_fee: 0
  });

  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: 'noreply@ebookzone.in',
    from_name: 'eBookZone'
  });

  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: 24,
    max_login_attempts: 5,
    password_min_length: 8,
    require_email_verification: true,
    enable_two_factor: false,
    api_rate_limit: 100
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database }
  ];

  const handleSaveSettings = async (settingsType) => {
    setLoading(true);
    setMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage(`${settingsType} settings saved successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
            <input
              type="text"
              value={generalSettings.site_name}
              onChange={(e) => setGeneralSettings({...generalSettings, site_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
            <input
              type="email"
              value={generalSettings.admin_email}
              onChange={(e) => setGeneralSettings({...generalSettings, admin_email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
            <textarea
              value={generalSettings.site_description}
              onChange={(e) => setGeneralSettings({...generalSettings, site_description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
            <select
              value={generalSettings.currency}
              onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={generalSettings.timezone}
              onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Kolkata">India</option>
            </select>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => handleSaveSettings('General')}
        disabled={loading}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? 'Saving...' : 'Save General Settings'}
      </button>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Gateways</h3>
        
        {/* Razorpay Settings */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Razorpay</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={paymentSettings.razorpay_enabled}
                onChange={(e) => setPaymentSettings({...paymentSettings, razorpay_enabled: e.target.checked})}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Enable Razorpay</span>
            </label>
          </div>
          
          {paymentSettings.razorpay_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key ID</label>
                <input
                  type="text"
                  value={paymentSettings.razorpay_key_id}
                  onChange={(e) => setPaymentSettings({...paymentSettings, razorpay_key_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="rzp_test_..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Secret</label>
                <input
                  type="password"
                  value={paymentSettings.razorpay_key_secret}
                  onChange={(e) => setPaymentSettings({...paymentSettings, razorpay_key_secret: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter secret key"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bank Transfer Settings */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Bank Transfer</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={paymentSettings.bank_transfer_enabled}
                onChange={(e) => setPaymentSettings({...paymentSettings, bank_transfer_enabled: e.target.checked})}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Enable Bank Transfer</span>
            </label>
          </div>
        </div>

        {/* Fees and Taxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={paymentSettings.tax_rate}
              onChange={(e) => setPaymentSettings({...paymentSettings, tax_rate: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Processing Fee ($)</label>
            <input
              type="number"
              step="0.01"
              value={paymentSettings.processing_fee}
              onChange={(e) => setPaymentSettings({...paymentSettings, processing_fee: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      <button
        onClick={() => handleSaveSettings('Payment')}
        disabled={loading}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? 'Saving...' : 'Save Payment Settings'}
      </button>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
            <input
              type="number"
              value={securitySettings.session_timeout}
              onChange={(e) => setSecuritySettings({...securitySettings, session_timeout: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
            <input
              type="number"
              value={securitySettings.max_login_attempts}
              onChange={(e) => setSecuritySettings({...securitySettings, max_login_attempts: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
            <input
              type="number"
              value={securitySettings.password_min_length}
              onChange={(e) => setSecuritySettings({...securitySettings, password_min_length: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Rate Limit (per minute)</label>
            <input
              type="number"
              value={securitySettings.api_rate_limit}
              onChange={(e) => setSecuritySettings({...securitySettings, api_rate_limit: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="space-y-4 mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={securitySettings.require_email_verification}
              onChange={(e) => setSecuritySettings({...securitySettings, require_email_verification: e.target.checked})}
              className="mr-3"
            />
            <span className="text-sm text-gray-700">Require email verification for new accounts</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={securitySettings.enable_two_factor}
              onChange={(e) => setSecuritySettings({...securitySettings, enable_two_factor: e.target.checked})}
              className="mr-3"
            />
            <span className="text-sm text-gray-700">Enable two-factor authentication</span>
          </label>
        </div>
      </div>
      
      <button
        onClick={() => handleSaveSettings('Security')}
        disabled={loading}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? 'Saving...' : 'Save Security Settings'}
      </button>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">MCP Version:</span>
            <span className="text-sm text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Database Status:</span>
            <span className="text-sm text-green-600">Connected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Server Status:</span>
            <span className="text-sm text-green-600">Online</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Last Backup:</span>
            <span className="text-sm text-gray-900">2025-07-11 08:00:00</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
        <div className="space-y-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Database className="w-4 h-4 mr-2" />
            Create Database Backup
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear System Cache
          </button>
          <button className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart System
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure system preferences and settings</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'payment' && renderPaymentSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'system' && renderSystemSettings()}
          {activeTab === 'email' && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Email settings configuration coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

