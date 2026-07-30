import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000; // 10 seconds timeout

const LOCAL_API = '/api'; // Use Vite proxy for local dev
const CLOUD_API = '/api'; // Uses Cloudflare Pages function proxy

export const API = import.meta.env.VITE_API_URL || '/api';

export const apiHeaders = () => {
  return {}; // Placeholder for now, can be used for custom headers if needed
};
export const GOOGLE_CLIENT_ID = '724286936097-955reu9auegj24nm3qdmhr1vqhal36r9.apps.googleusercontent.com';
