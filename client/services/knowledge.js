import { get, post, del } from '@/utils/request'

export const getKnowledgeList = (params) => get('/knowledge', params)

export const getKnowledgeDetail = (id) => get(`/knowledge/${id}`)

export const getRecommendKnowledge = (memberId) => get(`/knowledge/recommend/${memberId}`)

export const getCategories = () => get('/knowledge/categories/list')

export const addFavorite = (id) => post(`/knowledge/favorite/${id}`)

export const removeFavorite = (id) => del(`/knowledge/favorite/${id}`)

export const getFavorites = () => get('/knowledge/favorites/list')

export const getAiAdvice = (memberId) => get(`/knowledge/ai/advice/${memberId}`)
