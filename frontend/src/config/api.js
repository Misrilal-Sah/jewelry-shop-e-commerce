// Centralized API Configuration
// This file provides a single source of truth for the backend API URL

// In development: uses localhost:5000 (from vite proxy or direct)
// In production: uses VITE_API_URL environment variable (Render URL)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Fetch wrapper that automatically prepends the API URL
 * 
 * Usage:
 *   import { apiFetch } from '../config/api';
 *   const res = await apiFetch('/api/products');
 * 
 * @param {string} endpoint - API endpoint (e.g., '/api/products')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>}
 */
export const apiFetch = async (endpoint, options = {}) => {
  // If endpoint is already a full URL, use it directly
  if (endpoint.startsWith('http')) {
    return fetch(endpoint, options);
  }
  
  // Otherwise, prepend the API URL
  const url = `${API_URL}${endpoint}`;
  return fetch(url, options);
};

// Export API_URL for cases where you need the raw URL
export { API_URL };
export default API_URL;
