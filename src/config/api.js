const RAW_MAIN_DOMAIN = import.meta.env.VITE_MAIN_DOMAIN || 'http://localhost:5000'
const MAIN_DOMAIN = String(RAW_MAIN_DOMAIN).replace(/\/+$/, '')
const API_BASE_URL = import.meta.env.VITE_API_URL || `${MAIN_DOMAIN}/api`

export { MAIN_DOMAIN, API_BASE_URL }

