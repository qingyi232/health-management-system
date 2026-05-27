import { get, post, del } from '@/utils/request'

export const getDeviceList = () => get('/device')

export const bindDevice = (data) => post('/device/bind', data)

export const unbindDevice = (id) => del(`/device/${id}`)

export const syncDevice = (id) => post(`/device/${id}/sync`)

export const getDeviceTypes = () => get('/device/types')
