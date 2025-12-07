'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'owner' | 'manager' | 'staff' | 'auditor';
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth(); // Get current user
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Set the document title when the component mounts
  useEffect(() => {
    document.title = 'Settings - Egg Farm Pro';
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Egg Farm Pro';
    };
  }, []);

  // Check if user has permission to view user management
  const canManageUsers = user && (user.role === 'owner' || user.role === 'manager');
  // Only owner can create/delete users
  const isOwner = user && user.role === 'owner';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      // In a real app, you would get the current user ID from auth context
      // For now, we'll just get the first user as an example
      const data = await userAPI.getAll();
      if (data.length > 0) {
        setCurrentUser(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      Promise.all([fetchUsers(), fetchCurrentUser()]);
    }
  }, [canManageUsers]);

  const handleAddUser = () => {
    if (!isOwner) return; // Only owner can add users
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    // Prevent non-owners from editing owner accounts
    if (user.role === 'owner' && !isOwner) {
      alert('Only owners can edit owner accounts');
      return;
    }
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!isOwner) {
      alert('Only owners can delete users');
      return;
    }
    
    if (currentUser && currentUser._id === id) {
      alert('You cannot delete your own account');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(id);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formEntries = Object.fromEntries(formData.entries());

    // Create properly typed user data object
    const userData = {
      ...formEntries,
      isActive: formEntries.isActive === 'true'
    };

    try {
      if (editingUser) {
        await userAPI.update(editingUser._id, userData);
      } else {
        if (!isOwner) {
          alert('Only owners can create new users');
          return;
        }
        await userAPI.create(userData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      // Provide more specific error messages
      let errorMessage = 'Failed to save user. Please check the form data and try again.';
      
      if (error.message) {
        // If it's a network error or JSON parsing error
        if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid data provided. Please check all fields are filled correctly.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Access denied. Only owners can create users.';
        } else if (error.message.includes('409') || error.message.includes('exists')) {
          errorMessage = 'Username or email already exists. Please use different credentials.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleChangePassword = async (userId: string) => {
    const currentPassword = prompt('Enter current password:');
    if (!currentPassword) return;

    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    const confirmPassword = prompt('Confirm new password:');
    if (!confirmPassword) return;

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await userAPI.changePassword(userId, { 
        currentPassword, 
        newPassword 
      });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    }
  };

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Notifications
            </button>
            {canManageUsers && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Users
              </button>
            )}
            <button
              onClick={() => setActiveTab('privacy')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'privacy'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'help'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Help & Support
            </button>
            <button
              onClick={() => setActiveTab('ai-tools')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ai-tools'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              AI Tools
            </button>
          </nav>
        </div>

        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 border rounded-lg flex flex-col items-center ${
                        theme === 'light'
                          ? 'border-green-500 ring-2 ring-green-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="w-16 h-16 bg-white border rounded mb-2 flex items-center justify-center">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 border rounded-lg flex flex-col items-center ${
                        theme === 'dark'
                          ? 'border-green-500 ring-2 ring-green-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="w-16 h-16 bg-gray-800 border rounded mb-2 flex items-center justify-center">
                        <div className="w-8 h-8 bg-gray-600 rounded"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`p-4 border rounded-lg flex flex-col items-center ${
                        theme === 'system'
                          ? 'border-green-500 ring-2 ring-green-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-300 border rounded mb-2 flex items-center justify-center">
                        <div className="w-8 h-8 bg-gray-400 rounded"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Language & Region</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Marathi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time Zone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white">
                    <option>(GMT+05:30) India Standard Time</option>
                    <option>(GMT+00:00) Greenwich Mean Time</option>
                    <option>(GMT-05:00) Eastern Standard Time</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates about your account</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('email')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notifications.email ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        notifications.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your devices</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('push')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notifications.push ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        notifications.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">SMS Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive SMS alerts for important events</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('sms')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notifications.sms ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        notifications.sms ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Types</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="sales-notifications"
                      name="sales-notifications"
                      type="checkbox"
                      className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="sales-notifications" className="font-medium text-gray-700 dark:text-gray-300">
                      Sales Updates
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">Get notified about new sales and payments</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="expense-notifications"
                      name="expense-notifications"
                      type="checkbox"
                      className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="expense-notifications" className="font-medium text-gray-700 dark:text-gray-300">
                      Expense Alerts
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">Get notified about high expenses and budget alerts</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="vaccination-notifications"
                      name="vaccination-notifications"
                      type="checkbox"
                      className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="vaccination-notifications" className="font-medium text-gray-700 dark:text-gray-300">
                      Vaccination Reminders
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">Get reminders for upcoming vaccinations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && canManageUsers && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">User Management</h2>
              {isOwner && (
                <button
                  onClick={handleAddUser}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                  Add User
                </button>
              )}
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Username
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((userItem) => (
                      <tr key={userItem._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                          {userItem.username}
                          {currentUser && currentUser._id === userItem._id && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {userItem.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userItem.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                            userItem.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            userItem.role === 'auditor' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleChangePassword(userItem._id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Password
                          </button>
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Edit
                          </button>
                          {/* Only owners can delete users and users can't delete themselves */}
                          {isOwner && (!currentUser || currentUser._id !== userItem._id) && (
                            <button
                              onClick={() => handleDeleteUser(userItem._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {users.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No users found.</p>
                </div>
              )}
            </div>

            {/* Modal for adding/editing users */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {editingUser ? 'Edit User' : 'Add New User'}
                    </h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="px-6 py-4">
                    <div className="mb-4">
                      <label htmlFor="user-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        id="user-username"
                        name="username"
                        defaultValue={editingUser?.username || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="user-email"
                        name="email"
                        defaultValue={editingUser?.email || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    {!editingUser && (
                      <div className="mb-4">
                        <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          id="user-password"
                          name="password"
                          required={!editingUser}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role
                      </label>
                      <select
                        id="user-role"
                        name="role"
                        defaultValue={editingUser?.role || 'staff'}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        // Prevent non-owners from changing roles to owner
                        disabled={!isOwner && editingUser?.role === 'owner'}
                      >
                        <option value="owner" disabled={!isOwner && editingUser?.role !== 'owner'}>Owner</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                        <option value="auditor">Auditor</option>
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="user-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        id="user-status"
                        name="isActive"
                        defaultValue={editingUser?.isActive ? 'true' : 'false'}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {editingUser ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Privacy Settings</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="profile-visibility"
                      name="profile-visibility"
                      type="checkbox"
                      className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="profile-visibility" className="font-medium text-gray-700 dark:text-gray-300">
                      Make profile public
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">Allow other users to view your profile information</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="activity-status"
                      name="activity-status"
                      type="checkbox"
                      className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="activity-status" className="font-medium text-gray-700 dark:text-gray-300">
                      Show activity status
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">Display your online/offline status to other users</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Management</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Export Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Download a copy of your data</p>
                  </div>
                  <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Export
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and data</p>
                  </div>
                  <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'help' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Help & Support</h2>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Welcome to EggMind AI Support</h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <p>Ask our AI assistant any questions about farm management, EggMind features, or troubleshooting.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Ask EggMind AI</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ask anything about egg farming, EggMind features, or get help with a specific issue..."
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <button className="btn btn-primary">
                        Ask EggMind AI
                      </button>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Powered by EggMind AI v1.0
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Common Questions</h3>
                  </div>
                  <div className="card-body">
                    <ul className="space-y-3">
                      <li>
                        <button className="text-left w-full text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium">
                          How do I add a new client?
                        </button>
                      </li>
                      <li>
                        <button className="text-left w-full text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium">
                          How do I record a vaccination?
                        </button>
                      </li>
                      <li>
                        <button className="text-left w-full text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium">
                          How do I generate reports?
                        </button>
                      </li>
                      <li>
                        <button className="text-left w-full text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium">
                          How do I use the AI features?
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Contact Support</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Email Support</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">support@eggmind.com</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Phone Support</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">+91 98765 43210</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Response Time</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Within 24 hours</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'ai-tools' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AI Tools</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Text-to-Image Generator */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Text-to-Image Generator</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Describe what you want to generate
                        </label>
                        <textarea
                          placeholder="e.g., A healthy chicken laying eggs in a clean coop with straw bedding"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <button className="btn btn-primary">
                          Generate Image
                        </button>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Powered by EggMind AI
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[200px] flex items-center justify-center">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm">Generated images will appear here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Other AI Tools */}
                <div className="space-y-6">
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">AI Feed Optimizer</h3>
                    </div>
                    <div className="card-body">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Optimize your feed consumption based on flock size, age, and production goals.
                      </p>
                      <button className="btn btn-primary btn-sm">
                        Analyze Feed Plan
                      </button>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Disease Predictor</h3>
                    </div>
                    <div className="card-body">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Predict potential health issues based on environmental factors and flock behavior.
                      </p>
                      <button className="btn btn-primary btn-sm">
                        Run Health Analysis
                      </button>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Profit Calculator</h3>
                    </div>
                    <div className="card-body">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Calculate potential profits based on current market rates and production estimates.
                      </p>
                      <button className="btn btn-primary btn-sm">
                        Calculate Profits
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}