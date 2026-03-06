// Use environment variable in production, fallback to localhost for development
const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';
export const baseUrl = isProduction
    ? 'https://collegetracker-api-301955187113.us-central1.run.app/'
    : (process.env.REACT_APP_API_URL || 'http://localhost:8000/');