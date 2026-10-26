import api from './api'

export const getVolumes = async () => {
  const res = await api.get('/volumes')
  return res.data
}

export const createVolume = async (name) => {
  const res = await api.post('/volumes/create', { name })
  return res.data
}

export const removeVolume = async (name) => {
  const res = await api.delete(`/volumes/${encodeURIComponent(name)}`)
  return res.data
}