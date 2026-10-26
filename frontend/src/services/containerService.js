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


export const createContainer = async ({ image, name, port }) => {
  const body = { image }
  if (name) body.name = name
  if (port) body.port = port

  // Pulling an image can be slow, so allow up to 5 minutes for this request only
  const res = await api.post('/containers/create', body, { timeout: 300000 })
  return res.data
}