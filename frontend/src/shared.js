// Use environment variable in production, fallback to localhost for development
export const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/';