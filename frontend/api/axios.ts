import axios from 'axios';

export const $api = axios.create({
    // baseURL: 'https://atocheniy-test-app-api.hf.space/api',
    baseURL: 'http://localhost:5223/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

$api.interceptors.response.use(
    (response) => response,
    (error) => {
       if (typeof window !== 'undefined') {
        const isAuthRequest = error.config.url.includes('/auth/login') || 
                              error.config.url.includes('/auth/register');

          if (error.response && error.response.status === 401 && !isAuthRequest) {
              console.warn("Сессия истекла");
              
              document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

              if (!window.location.pathname.includes('/login') && 
                  !window.location.pathname.includes('/register')) {
                  window.location.href = '/login';
              }
          }
        }

        return Promise.reject(error);
    }   
);

$api.interceptors.request.use(async (config) => {
    if (typeof window !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
        const token = match ? match[2] : null;

        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default $api;