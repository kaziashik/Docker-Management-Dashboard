import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})



// Turns any Axios error into a simple, readable message for the UI
export function getErrorMessage(error) {
  if (error.response) {
    // Backend answered with an error status (400, 404, 409, 503...)
    const data = error.response.data
    return data?.error || data?.message || `Request failed (${error.response.status})`
  }
  if (error.request) {
    // Request was sent but nobody answered
    return 'Cannot reach the backend. Is it running on port 5000?'
  }
  return error.message
}

export default api