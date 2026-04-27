import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000; // 10 seconds timeout

export const API = import.meta.env.VITE_API_URL || 'https://freelance-pay-api.cyber-freelance.workers.dev/api';

export const apiHeaders = () => {
  return {}; // Placeholder for now, can be used for custom headers if needed
};
export const GOOGLE_CLIENT_ID = '724286936097-955reu9auegj24nm3qdmhr1vqhal36r9.apps.googleusercontent.com';
