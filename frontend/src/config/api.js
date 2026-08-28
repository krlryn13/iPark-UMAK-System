// Dynamic API Base URL supporting VITE_API_BASE_URL, local dev on 5000, or single-server host
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:5000` 
    : '');

