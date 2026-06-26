import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  userInfo: {
    id: number
    username: string
    role: string
  }
}

export interface RegisterParams {
  username: string
  password: string
  confirmPassword: string
}

/** 用户注册 */
export function registerApi(data: RegisterParams) {
  return request.post<{ code: number; data: { id: number }; message: string }>('/auth/register', data)
}

/** 用户登录 */
export function loginApi(data: LoginParams) {
  return request.post<{ code: number; data: LoginResult; message: string }>('/auth/login', data)
}

/** 获取当前用户信息 */
export function getProfileApi() {
  return request.get('/auth/profile')
}
