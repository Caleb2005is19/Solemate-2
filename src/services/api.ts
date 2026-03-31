import axios from 'axios';
import axiosRetry from 'axios-retry';

const api = axios.create({
  baseURL: '/',
  timeout: 10000,
});

// Configure retry logic for transient errors
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // exponential backoff: 1s, 2s, 3s
  },
  retryCondition: (error) => {
    // Only retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status ? error.response.status >= 500 : false);
  },
});

export default api;
