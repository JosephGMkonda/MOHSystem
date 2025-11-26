import axios from 'axios';

export const getAuthConfig = () => {
  let token = localStorage.getItem('token'); 
  
  if (!token) {
    token = localStorage.getItem('authToken');
  }
  if (!token) {
    token = localStorage.getItem('access');
  }

  if (!token) {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        token = user.token || user.access;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  console.log('🔐 Token being used:', token ? `${token.substring(0, 20)}...` : 'No token found');

  if (!token) {
    console.warn('No authentication token found in localStorage');
    return {};
  }

  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  };
};

// Create axios instance with base URL
export const authAxios = axios.create({
  baseURL: 'https://mohsystem.onrender.com/api/',
});

// Add request interceptor to include auth token
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('access');
    
    console.log('🔐 Interceptor - Adding token to request:', config.method?.toUpperCase(), config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to headers');
    } else {
      console.warn('❌ No token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
authAxios.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      message: error.message
    };
    
    console.error('❌ Response error details:', errorDetails);
    
    // Log the actual response data if available
    if (error.response?.data) {
      console.error('❌ Response data:', error.response.data);
    }
    
    if (error.response?.status === 401) {
      console.warn('🛑 Authentication failed - redirecting to login');
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('access');
      localStorage.removeItem('user');
      // You might want to redirect to login page here
      // window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.warn('🚫 Access forbidden - insufficient permissions');
    } else if (error.response?.status === 404) {
      console.warn('🔍 Endpoint not found - check API URL');
    } else if (error.response?.status === 400) {
      console.warn('📝 Bad request - check request parameters');
    } else if (error.response?.status === 500) {
      console.warn('💥 Server error - backend issue');
    }
    
    return Promise.reject(error);
  }
);