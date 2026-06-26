import request from './request'

export function submitFormRequest(data: { formSchema: any; formData: any }) { return request.post('/form-request/submit', data) }
export function getFormRequestList(params?: { page?: number; size?: number; status?: string }) { return request.get('/form-request/list', { params }) }
export function getFormRequestDetail(id: number) { return request.get('/form-request/' + id) }
export function approveFormRequest(id: number) { return request.put('/form-request/' + id + '/approve') }
export function rejectFormRequest(id: number, reason: string) { return request.put('/form-request/' + id + '/reject', { reason }) }
export function createProjectFromRequest(id: number) { return request.post('/form-request/' + id + '/create-project') }
