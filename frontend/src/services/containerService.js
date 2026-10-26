import api from './api'

export const getContainers = async () => {
  const res = await api.get('/containers')
  return res.data
}

export const startContainer = async (id) => {
  const res = await api.post(`/containers/${id}/start`)
  return res.data
}

export const stopContainer = async (id) => {
  const res = await api.post(`/containers/${id}/stop`)
  return res.data
}

export const restartContainer = async (id) => {
  const res = await api.post(`/containers/${id}/restart`)
  return res.data
}

export const removeContainer = async (id) => {
  const res = await api.delete(`/containers/${id}`)
  return res.data
}