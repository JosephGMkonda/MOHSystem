
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/home', label: 'Dashboard', icon: '📊' },
    { path: '/workforce', label: 'Workforce', icon: '👥' },
    // { path: '/deployments', label: 'Deployments', icon: '🚑' },
    // { path: '/analytics', label: 'Analytics', icon: '📈' },
    //  { path: '/deployment-history', icon: '📚', label: 'Deployment History' },
  ];

  return (
    <div className="w-64 bg-blue-50 border-r border-blue-200 flex flex-col">
      
      <div className="p-6 border-b border-blue-200 bg-white">
        <h1 className="text-xl font-bold text-gray-800">Malawi MOH</h1>
        <p className="text-sm text-gray-600 mt-1">Outbreak Response System</p>
      </div>
      
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-100 border border-blue-300 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-white hover:border hover:border-blue-200 hover:text-blue-600 hover:shadow-sm'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      

      <div className="p-4 border-t border-blue-200 bg-white">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border hover:border-red-200 rounded-lg transition-all duration-200 font-medium"
        >
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;