import { get, post, put, del } from '@/utils/request'

export const getMedicalRecords = (memberId) => get(`/record/medical/${memberId}`)

export const addMedicalRecord = (data) => post('/record/medical', data)

export const updateMedicalRecord = (id, data) => put(`/record/medical/${id}`, data)

export const deleteMedicalRecord = (id) => del(`/record/medical/${id}`)

export const getCheckupReports = (memberId) => get(`/record/checkup/${memberId}`)

export const deleteCheckupReport = (id) => del(`/record/checkup/${id}`)
