import { get, post } from '@/utils/request'

export const getHospitalList = (params) => get('/hospital', params)

export const getHospitalDetail = (id) => get(`/hospital/${id}`)

export const getDepartments = (hospitalId) => get(`/hospital/${hospitalId}/departments`)

export const getDoctors = (hospitalId, params) => get(`/hospital/${hospitalId}/doctors`, params)

export const getDoctorDetail = (id) => get(`/hospital/doctor/${id}`)

export const getNearbyHospitals = (params) => get('/hospital/nearby/list', params)

export const getDoctorSchedule = (doctorId, params) => get(`/hospital/doctor/${doctorId}/schedule`, params)

export const reverseGeocode = (params) => get('/hospital/geocode/reverse', params)

export const importHospital = (data) => post('/hospital/import', data)

export const getIpLocation = () => get('/hospital/location/ip')
