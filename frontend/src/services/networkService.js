import api from './api'

export const getNetworks = async () => {
  const res = await api.get('/networks')
  return res.data
}

export const createNetwork = async (name, driver = 'bridge') => {
  const res = await api.post('/networks/create', { name, driver })
  return res.data
}

export const removeNetwork = async (id) => {
  const res = await api.delete(`/networks/${encodeURIComponent(id)}`)
  return res.data
}