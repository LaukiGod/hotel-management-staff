import axios from 'axios'
import { API_BASE_URL } from '../config/api'

export const kioskAxios = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

