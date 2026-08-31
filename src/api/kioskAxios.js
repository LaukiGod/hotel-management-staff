import axios from 'axios'
import { tenantApiBase } from '../config/api'
import { getActiveTenant, getToken } from './client'

/**
 * The kiosk's axios instance. baseURL cannot be fixed at module load any more —
 * it depends on which restaurant the kiosk is running for — so it is resolved
 * per request from the active tenant.
 */
export const kioskAxios = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

kioskAxios.interceptors.request.use((config) => {
  const slug = getActiveTenant()
  if (!slug) {
    return Promise.reject(new Error('No restaurant selected — open the kiosk under /r/:slug'))
  }

  config.baseURL = tenantApiBase(slug)

  const token = getToken(slug)
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})
