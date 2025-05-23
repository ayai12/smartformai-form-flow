import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  // Use empty baseURL for local development with Vite's proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to handle authentication tokens if needed
api.interceptors.request.use(
  (config) => {
    // You could add auth token logic here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common error cases
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios here
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API request error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 