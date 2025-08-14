// Authentication utilities
class Auth {
    static TOKEN_KEY = 'brm_token'
    static USER_KEY = 'brm_user'

    // เก็บ session หลังล็อกอิน
    static setSession(data) {
        localStorage.setItem(this.TOKEN_KEY, data.token)
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user))
    }

    // ลบ session
    static clearSession() {
        localStorage.removeItem(this.TOKEN_KEY)
        localStorage.removeItem(this.USER_KEY)
    }

    // ดึง token
    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY)
    }

    // ดึงข้อมูลผู้ใช้
    static getUser() {
        const userStr = localStorage.getItem(this.USER_KEY)
        return userStr ? JSON.parse(userStr) : null
    }

    // ตรวจสอบว่าล็อกอินแล้วหรือไม่
    static isLoggedIn() {
        return !!this.getToken()
    }

    // ตรวจสอบสิทธิ์เข้าถึงโมดูล
    static hasPermission(module) {
        const user = this.getUser()
        if (!user) return false

        const rolePermissions = {
            admin: ['dashboard', 'users', 'requests', 'forms_download', 'forms_submit'],
            planner: ['dashboard', 'requests', 'forms_download', 'forms_submit'],
            procurement: ['dashboard', 'forms_download', 'forms_submit'],
            board: ['dashboard', 'forms_download']
        }

        const userPermissions = rolePermissions[user.role] || []
        return userPermissions.includes(module)
    }

    // ล็อกอิน
    static async login(username, password) {
        try {
            const response = await fetch('http://localhost:4002/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Login failed')
            }

            const data = await response.json()
            this.setSession(data)
            return data
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    // ออกจากระบบ
    static logout() {
        this.clearSession()
        window.location.reload()
    }
}
