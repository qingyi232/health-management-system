import { get, post, put, del } from '@/utils/request'

export const getHealthData = (memberId, params) => get(`/health/data/${memberId}`, params)

export const addHealthData = (data) => post('/health/data', data)

export const deleteHealthData = (id) => del(`/health/data/${id}`)

export const getLatestHealth = (memberId) => get(`/health/latest/${memberId}`)

export const getTrendData = (memberId, params) => get(`/analysis/trend/${memberId}`, params)

export const getStatistics = (memberId) => get(`/analysis/statistics/${memberId}`)

export const getAlerts = (memberId, params) => get(`/analysis/alerts/${memberId}`, params)

export const markAlertRead = (id) => put(`/analysis/alerts/${id}/read`)

export const getUnreadAlertCount = () => get('/analysis/alerts/unread/count')

export const getHealthReport = (memberId, params) => get(`/analysis/report/${memberId}`, params)
