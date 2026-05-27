import { get, post, put, del } from '@/utils/request'

export const getFamilyList = () => get('/family')

export const createFamily = (data) => post('/family', data)

export const getFamilyMembers = (familyId) => get(`/family/${familyId}/members`)

export const getFamilyHealthMembers = (familyId) => get(`/family/${familyId}/health-members`)

export const inviteMember = (familyId, phone) => post(`/family/${familyId}/invite`, { phone })

export const getMyInvitations = () => get('/family/invitations/my')

export const acceptInvitation = (id) => put(`/family/invitations/${id}/accept`)

export const rejectInvitation = (id) => put(`/family/invitations/${id}/reject`)

export const removeFamilyMember = (familyId, userId) => del(`/family/${familyId}/members/${userId}`)

export const leaveFamily = (familyId) => del(`/family/${familyId}/leave`)

export const getSharedHealth = (familyId, memberId) => get(`/family/${familyId}/health/${memberId}`)
