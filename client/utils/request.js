const BASE_URL = 'http://localhost:3000/api'
const SERVER_URL = 'http://localhost:3000'

export const getServerUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return SERVER_URL + path
}

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data)
          } else {
            uni.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.reLaunch({
            url: '/pages/login/login'
          })
          reject(res.data)
        } else {
          uni.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          })
          reject(res.data)
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

export const get = (url, data) => request({ url, method: 'GET', data })
export const post = (url, data) => request({ url, method: 'POST', data })
export const put = (url, data) => request({ url, method: 'PUT', data })
export const del = (url, data) => request({ url, method: 'DELETE', data })

export const uploadFile = (urlOrOpts, filePath, name = 'file', formData = {}) => {
  let url, fPath, fName, fData
  if (typeof urlOrOpts === 'object') {
    url = urlOrOpts.url; fPath = urlOrOpts.filePath; fName = urlOrOpts.name || 'file'; fData = urlOrOpts.formData || {}
  } else {
    url = urlOrOpts; fPath = filePath; fName = name; fData = formData
  }
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    if (!fPath) {
      return post(url, fData).then(resolve).catch(reject)
    }
    uni.uploadFile({
      url: BASE_URL + url,
      filePath: fPath,
      name: fName,
      formData: fData,
      header: { 'Authorization': token ? `Bearer ${token}` : '' },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 200) {
          resolve(data)
        } else {
          uni.showToast({ title: data.message || '上传失败', icon: 'none' })
          reject(data)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '上传失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export default request
