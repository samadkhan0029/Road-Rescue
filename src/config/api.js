const API_BASE_URL = import.meta.env.VITE_API_URL || 
                      (typeof window !== 'undefined' && window.location.origin) || 
                      'http://localhost:5001';

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
export const socketUrl = API_BASE_URL;

export default API_BASE_URL;
