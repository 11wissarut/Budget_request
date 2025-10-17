// API utilities
class API {
    static BASE_URL = 'http://localhost:4002'

    // ส่ง HTTP request พร้อม JWT token
    static async request(path, options = {}) {
        const token = Auth.getToken()
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        try {
            const response = await fetch(`${this.BASE_URL}${path}`, {
                ...options,
                headers
            })

            if (!response.ok) {
                if (response.status === 401) {
                    Auth.logout()
                    return
                }
                const error = await response.text()
                throw new Error(error || response.statusText)
            }

            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                return await response.json()
            }
            return await response.text()
        } catch (error) {
            console.error('API request error:', error)
            throw error
        }
    }

    // GET request
    static get(path) {
        return this.request(path)
    }

    // POST request
    static post(path, data) {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    // POST FormData request
    static postFormData(path, formData) {
        return this.request(path, {
            method: 'POST',
            body: formData
        })
    }

    // PUT request
    static put(path, data) {
        return this.request(path, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    // DELETE request
    static delete(path) {
        return this.request(path, {
            method: 'DELETE'
        })
    }

    // Upload file
    static async upload(path, formData) {
        const token = Auth.getToken()
        const headers = {}

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        try {
            const response = await fetch(`${this.BASE_URL}${path}`, {
                method: 'POST',
                headers,
                body: formData
            })

            if (!response.ok) {
                if (response.status === 401) {
                    Auth.logout()
                    return
                }
                const error = await response.text()
                throw new Error(error || response.statusText)
            }

            return await response.json()
        } catch (error) {
            console.error('Upload error:', error)
            throw error
        }
    }
}

// API endpoints
class UsersAPI {
    static list() {
        return API.get('/api/users')
    }

    static create(data) {
        return API.post('/api/users', data)
    }

    static update(id, data) {
        return API.put(`/api/users/${id}`, data)
    }

    static delete(id) {
        return API.delete(`/api/users/${id}`)
    }
}

class RequestsAPI {
    static list() {
        return API.get('/api/requests')
    }

    static create(data) {
        // รองรับทั้ง JSON และ FormData
        if (data instanceof FormData) {
            return API.postFormData('/api/requests', data)
        }
        return API.post('/api/requests', data)
    }

    static update(id, data) {
        return API.put(`/api/requests/${id}`, data)
    }

    static delete(id) {
        return API.delete(`/api/requests/${id}`)
    }
}

class SubmissionsAPI {
    static list() {
        return API.get('/api/submissions')
    }

    static create(formData) {
        return API.upload('/api/submissions', formData)
    }
}

class FormsAPI {
    static list() {
        return API.get('/api/forms')
    }
}

class StatsAPI {
    static get() {
        return API.get('/api/stats')
    }
}
