// API Configuration
// Production'da Nginx proxy kullanır (/api)
// Development'ta localhost:5002 kullanır

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5002/api'
);

export default API_BASE_URL;
