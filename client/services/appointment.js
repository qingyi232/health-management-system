import { get, post, put } from '@/utils/request'

export const getAppointmentList = (params) => get('/appointment', params)

export const getAppointmentDetail = (id) => get(`/appointment/${id}`)

export const createAppointment = (data) => post('/appointment', data)

export const cancelAppointment = (id) => put(`/appointment/${id}/cancel`)

export const completeAppointment = (id) => put(`/appointment/${id}/complete`)

export const getAvailableSlots = (doctorId, params) => get(`/appointment/slots/${doctorId}`, params)
