import { get, post, put, del } from '@/utils/request'

export const getMemberList = () => get('/member')

export const getMemberDetail = (id) => get(`/member/${id}`)

export const addMember = (data) => post('/member', data)

export const updateMember = (id, data) => put(`/member/${id}`, data)

export const deleteMember = (id) => del(`/member/${id}`)
