// Main application logic
class App {
    constructor() {
        this.currentPage = 'dashboard'
        this.init()
    }

    init() {
        this.setupEventListeners()
        this.checkAuth()
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this))

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', Auth.logout)

        // Navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', this.handleNavigation.bind(this))
        })

        // Add buttons
        document.getElementById('add-user-btn')?.addEventListener('click', this.showAddUserModal.bind(this))

        // Budget request form
        document.getElementById('budget-request-form')?.addEventListener('submit', this.submitBudgetRequest.bind(this))

        // Approve form
        document.getElementById('approve-form')?.addEventListener('submit', this.submitApproval.bind(this))

        // Modal events
        document.getElementById('cancel-user')?.addEventListener('click', this.hideUserModal.bind(this))
        document.getElementById('cancel-request')?.addEventListener('click', this.hideRequestModal.bind(this))
        document.getElementById('user-form')?.addEventListener('submit', this.handleUserSubmit.bind(this))
        document.getElementById('request-form')?.addEventListener('submit', this.handleRequestSubmit.bind(this))
        document.getElementById('submit-form')?.addEventListener('submit', this.handleFileSubmit.bind(this))
        document.getElementById('budget-request-form')?.addEventListener('submit', this.handleBudgetRequestForm.bind(this))

        // Search and filter events
        document.getElementById('search-requests')?.addEventListener('input', this.filterRequests.bind(this))
        document.getElementById('filter-category')?.addEventListener('change', this.filterRequests.bind(this))
        document.getElementById('filter-status')?.addEventListener('change', this.filterRequests.bind(this))
        document.getElementById('filter-year')?.addEventListener('change', this.filterRequests.bind(this))
        document.getElementById('search-forms')?.addEventListener('input', this.filterForms.bind(this))

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed')) {
                this.hideUserModal()
                this.hideRequestModal()
            }
        })


    }

    async checkAuth() {
        const loading = document.getElementById('loading')
        const loginPage = document.getElementById('login-page')
        const mainApp = document.getElementById('main-app')

        if (Auth.isLoggedIn()) {
            const user = Auth.getUser()
            this.setupUserInterface(user)
            this.showPage('dashboard')
            
            loginPage.classList.add('hidden')
            mainApp.classList.remove('hidden')
        } else {
            loginPage.classList.remove('hidden')
            mainApp.classList.add('hidden')
        }
        
        loading.classList.add('hidden')
    }

    setupUserInterface(user) {
        // แสดงข้อมูลผู้ใช้
        document.getElementById('user-name').textContent = user.name
        document.getElementById('user-role').textContent = this.getRoleDisplayName(user.role)

        // แสดง/ซ่อนเมนูตามสิทธิ์
        this.setupNavigation(user.role)
    }

    getRoleDisplayName(role) {
        const roleNames = {
            admin: 'ผู้ดูแลระบบ',
            planner: 'งานแผน',
            procurement: 'งานพัสดุ',
            board: 'กรรมการ/ผู้บริหาร'
        }
        return roleNames[role] || role
    }

    setupNavigation(role) {
        // แสดง/ซ่อนเมนูตามสิทธิ์
        const navItems = {
            'nav-users': Auth.hasPermission('users'),
            'nav-manage-requests': Auth.hasPermission('manage_requests'),
            'nav-requests': Auth.hasPermission('requests'),
            'nav-forms-submit': Auth.hasPermission('forms_submit')
        }

        Object.entries(navItems).forEach(([id, show]) => {
            const element = document.getElementById(id)
            if (element) {
                element.classList.toggle('hidden', !show)
            }
        })
    }

    async handleLogin(e) {
        e.preventDefault()
        
        const username = document.getElementById('username').value
        const password = document.getElementById('password').value
        const submitBtn = e.target.querySelector('button[type="submit"]')
        
        try {
            submitBtn.disabled = true
            submitBtn.textContent = 'กำลังเข้าสู่ระบบ...'
            
            await Auth.login(username, password)
            window.location.reload()
        } catch (error) {
            alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
        } finally {
            submitBtn.disabled = false
            submitBtn.textContent = 'เข้าสู่ระบบ'
        }
    }

    handleNavigation(e) {
        e.preventDefault()
        const page = e.target.getAttribute('data-page')
        if (page) {
            this.showPage(page)
        }
    }

    showPage(pageName) {
        // ซ่อนหน้าทั้งหมด
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden')
        })

        // ลบ active class จากเมนูทั้งหมด
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active')
        })

        // แสดงหน้าที่เลือก
        const targetPage = document.getElementById(`page-${pageName}`)
        if (targetPage) {
            targetPage.classList.remove('hidden')
        }

        // เพิ่ม active class ให้เมนูที่เลือก
        const activeMenuItem = document.querySelector(`[data-page="${pageName}"]`)
        if (activeMenuItem) {
            activeMenuItem.classList.add('active')
        }

        this.currentPage = pageName
        this.loadPageData(pageName)
    }

    async loadPageData(pageName) {
        try {
            switch (pageName) {
                case 'dashboard':
                    await this.loadDashboard()
                    break
                case 'users':
                    await this.loadUsers()
                    break
                case 'manage-requests':
                    await this.loadManageRequests()
                    break
                case 'requests':
                    await this.loadRequests()
                    break
                case 'forms-download':
                    await this.loadForms()
                    break
                case 'forms-submit':
                    await this.loadSubmissions()
                    break
            }
        } catch (error) {
            console.error('Error loading page data:', error)
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูล')
        }
    }

    async loadDashboard() {
        try {
            // โหลดสถิติ
            const stats = await StatsAPI.get()
            document.getElementById('stat-total').textContent = stats.total
            document.getElementById('stat-pending').textContent = stats.pending
            document.getElementById('stat-approved').textContent = stats.approved

            // โหลดคำขอล่าสุด
            const requests = await RequestsAPI.list()
            const recentRequests = requests.slice(0, 5)
            
            const container = document.getElementById('recent-requests')
            container.innerHTML = recentRequests.map(req => `
                <div class="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                        <h4 class="font-medium">${req.title}</h4>
                        <p class="text-sm text-gray-600">${req.category} - ปี ${req.fiscalYear}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-medium">${req.amount.toLocaleString()} บาท</p>
                        <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(req.status)}">
                            ${this.getStatusText(req.status)}
                        </span>
                    </div>
                </div>
            `).join('')
        } catch (error) {
            console.error('Error loading dashboard:', error)
        }
    }

    async loadUsers() {
        try {
            const users = await UsersAPI.list()
            const tbody = document.getElementById('users-table')
            
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.username}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${this.getRoleDisplayName(user.role)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="app.editUser('${user.id}')" class="text-blue-600 hover:text-blue-900 mr-3">แก้ไข</button>
                        <button onclick="app.deleteUser('${user.id}')" class="text-red-600 hover:text-red-900">ลบ</button>
                    </td>
                </tr>
            `).join('')
        } catch (error) {
            console.error('Error loading users:', error)
        }
    }

    async loadManageRequests() {
        try {
            const requests = await RequestsAPI.list()
            this.allManageRequests = requests
            this.displayManageRequests(requests)

            // อัปเดตคำอธิบายตามสิทธิ์ผู้ใช้
            const user = Auth.getUser()
            const canEdit = user && (user.role === 'admin' || user.role === 'planner')
            const description = document.getElementById('manage-requests-description')
            if (description) {
                description.textContent = canEdit ?
                    'จัดการคำของบที่ส่งมาจากหน้าส่งแบบฟอร์ม (เพิ่ม/แก้ไข/ลบ) - สามารถแก้ไขได้เฉพาะคำของบที่ยังไม่ได้รับการพิจารณา' :
                    'ตรวจสอบรายการคำของบและดูสถานะของรายการงบที่ได้รับการอนุมัติหรืออยู่ระหว่างพิจารณา (ดูได้อย่างเดียว)'
            }

            // Setup search
            const searchInput = document.getElementById('manage-requests-search')
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase()
                    const filtered = requests.filter(r =>
                        r.title.toLowerCase().includes(query) ||
                        r.category.toLowerCase().includes(query)
                    )
                    this.displayManageRequests(filtered)
                })
            }
        } catch (error) {
            console.error('Error loading manage requests:', error)
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูลคำขอ')
        }
    }

    async loadRequests() {
        try {
            const requests = await RequestsAPI.list()
            this.allRequests = requests
            this.displayRequests(requests)
        } catch (error) {
            console.error('Error loading requests:', error)
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูลคำขอ')
        }
    }

    displayManageRequests(requests) {
        const tbody = document.getElementById('manage-requests-table')
        if (!tbody) return

        const user = Auth.getUser()
        const canEdit = user && (user.role === 'admin' || user.role === 'planner')
        const canView = user && (user.role === 'admin' || user.role === 'planner' || user.role === 'procurement')

        tbody.innerHTML = requests.map(request => {
            const statusBadge = request.status === 'approved' ?
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">อนุมัติ</span>' :
                request.status === 'rejected' ?
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">ปฏิเสธ</span>' :
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">รอพิจารณา</span>'

            const canEditThis = canEdit && request.status === 'pending'

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${request.title}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.category}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.fiscalYear}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Number(request.amount).toLocaleString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(request.createdAt).toLocaleDateString('th-TH')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${canEdit ? `
                            <button onclick="app.editManageRequest('${request.id}')"
                                    class="text-blue-600 hover:text-blue-900 mr-3"
                                    ${!canEditThis ? 'disabled style="opacity:0.5"' : ''}>
                                แก้ไข
                            </button>
                            <button onclick="app.deleteManageRequest('${request.id}')"
                                    class="text-red-600 hover:text-red-900"
                                    ${!canEditThis ? 'disabled style="opacity:0.5"' : ''}>
                                ลบ
                            </button>
                        ` : '<span class="text-xs text-gray-500">อ่านอย่างเดียว</span>'}
                    </td>
                </tr>
            `
        }).join('')
    }

    async editManageRequest(id) {
        const request = this.allManageRequests?.find(r => r.id === id)
        if (!request) return

        if (request.status !== 'pending') {
            alert('ไม่สามารถแก้ไขคำของบที่ถูกพิจารณาแล้ว')
            return
        }

        const title = prompt('ชื่อรายการ:', request.title)
        if (title === null) return

        const category = prompt('หมวดหมู่ (ครุภัณฑ์/ก่อสร้าง/วัสดุ/อื่นๆ):', request.category)
        if (category === null) return

        const fiscalYear = prompt('ปีงบประมาณ:', request.fiscalYear)
        if (fiscalYear === null) return

        const amount = prompt('วงเงิน (บาท):', request.amount)
        if (amount === null) return

        const note = prompt('หมายเหตุ:', request.note || '')
        if (note === null) return

        try {
            const response = await fetch(`http://localhost:4002/api/requests/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify({
                    title,
                    category,
                    fiscalYear: parseInt(fiscalYear),
                    amount: parseFloat(amount),
                    note
                })
            })

            if (response.ok) {
                alert('แก้ไขคำของบเรียบร้อยแล้ว')
                this.loadManageRequests()
            } else {
                alert('เกิดข้อผิดพลาดในการแก้ไข')
            }
        } catch (error) {
            console.error('Error editing request:', error)
            alert('เกิดข้อผิดพลาดในการแก้ไข')
        }
    }

    async deleteManageRequest(id) {
        const request = this.allManageRequests?.find(r => r.id === id)
        if (!request) return

        if (request.status !== 'pending') {
            alert('ไม่สามารถลบคำของบที่ถูกพิจารณาแล้ว')
            return
        }

        if (confirm('คุณแน่ใจหรือไม่ที่จะลบคำของบนี้?')) {
            try {
                const response = await fetch(`http://localhost:4002/api/requests/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${Auth.getToken()}`
                    }
                })

                if (response.ok) {
                    alert('ลบคำของบเรียบร้อยแล้ว')
                    this.loadManageRequests()
                } else {
                    alert('เกิดข้อผิดพลาดในการลบ')
                }
            } catch (error) {
                console.error('Error deleting request:', error)
                alert('เกิดข้อผิดพลาดในการลบ')
            }
        }
    }

    displayRequests(requests) {
        const tbody = document.getElementById('requests-table')
        if (!tbody) return

        tbody.innerHTML = requests.map(request => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${request.title}
                    ${request.note ? `<div class="text-xs text-gray-500 mt-1">${request.note}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.fiscalYear}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.amount.toLocaleString()} บาท</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${request.approvedAmount ?
                        `<span class="text-green-600 font-medium">${Number(request.approvedAmount).toLocaleString()} บาท</span>` :
                        '<span class="text-gray-400">-</span>'
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${request.fileUrl ? `
                        <a href="${request.fileUrl}" download class="text-blue-600 hover:text-blue-800 text-xs">
                            📎 ดาวน์โหลดไฟล์
                        </a>
                    ` : '<span class="text-gray-400 text-xs">ไม่มีไฟล์</span>'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(request.status)}">
                        ${this.getStatusText(request.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${this.formatDate(request.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${Auth.hasPermission('requests') ? `
                        <button onclick="app.showApproveModal('${request.id}', '${request.title}', ${request.amount})"
                                class="text-green-600 hover:text-green-900 mr-2 text-xs">
                            อนุมัติ
                        </button>
                        <button onclick="app.rejectRequest('${request.id}')"
                                class="text-red-600 hover:text-red-900 mr-2 text-xs">
                            ปฏิเสธ
                        </button>
                        <button onclick="app.deleteRequest('${request.id}')"
                                class="text-gray-600 hover:text-gray-900 text-xs">
                            ลบ
                        </button>
                    ` : '<span class="text-gray-400">ไม่มีสิทธิ์</span>'}
                </td>
            </tr>
        `).join('')
    }

    filterRequests() {
        if (!this.allRequests) return

        const searchTerm = document.getElementById('search-requests')?.value.toLowerCase() || ''
        const categoryFilter = document.getElementById('filter-category')?.value || ''
        const statusFilter = document.getElementById('filter-status')?.value || ''
        const yearFilter = document.getElementById('filter-year')?.value || ''

        const filtered = this.allRequests.filter(request => {
            const matchesSearch = request.title.toLowerCase().includes(searchTerm)
            const matchesCategory = !categoryFilter || request.category === categoryFilter
            const matchesStatus = !statusFilter || request.status === statusFilter
            const matchesYear = !yearFilter || request.fiscalYear.toString() === yearFilter

            return matchesSearch && matchesCategory && matchesStatus && matchesYear
        })

        this.displayRequests(filtered)
    }

    async loadForms() {
        try {
            const forms = await FormsAPI.list()
            this.allForms = forms
            this.displayForms(forms)
        } catch (error) {
            console.error('Error loading forms:', error)
            this.showNoFormsMessage()
        }
    }

    displayForms(forms) {
        const grid = document.getElementById('forms-grid')
        const noMessage = document.getElementById('no-forms-message')

        if (!grid) return

        if (forms.length === 0) {
            grid.innerHTML = ''
            noMessage?.classList.remove('hidden')
            return
        }

        noMessage?.classList.add('hidden')
        grid.innerHTML = forms.map(form => `
            <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div class="flex items-center mb-4">
                    <div class="text-red-500 text-3xl mr-3">📄</div>
                    <div class="flex-1">
                        <h3 class="text-lg font-medium text-gray-900">${form.name}</h3>
                        <p class="text-sm text-gray-500">ขนาด: ${form.size || 'ไฟล์แบบฟอร์ม'}</p>
                    </div>
                </div>
                <button onclick="app.downloadFile('${form.url}', '${form.fileName || form.name}')"
                   class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-center block">
                    ดาวน์โหลด
                </button>
            </div>
        `).join('')
    }

    async downloadFile(url, fileName) {
        try {
            const token = Auth.getToken()
            const response = await fetch(url, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            })

            if (!response.ok) {
                throw new Error('ไม่สามารถดาวน์โหลดไฟล์ได้')
            }

            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            console.error('Download error:', error)
            alert('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์: ' + error.message)
        }
    }

    showNoFormsMessage() {
        const grid = document.getElementById('forms-grid')
        const noMessage = document.getElementById('no-forms-message')

        if (grid) grid.innerHTML = ''
        noMessage?.classList.remove('hidden')
    }

    filterForms() {
        if (!this.allForms) return

        const searchTerm = document.getElementById('search-forms')?.value.toLowerCase() || ''
        const filtered = this.allForms.filter(form =>
            form.name.toLowerCase().includes(searchTerm)
        )

        this.displayForms(filtered)
    }

    async loadSubmissions() {
        try {
            const submissions = await SubmissionsAPI.list()
            this.displaySubmissions(submissions)
        } catch (error) {
            console.error('Error loading submissions:', error)
        }
    }

    displaySubmissions(submissions) {
        const container = document.getElementById('submitted-forms')
        if (!container) return

        if (submissions.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">ยังไม่มีแบบฟอร์มที่ส่ง</p>'
            return
        }

        container.innerHTML = submissions.map(submission => `
            <div class="border rounded-lg p-4 hover:bg-gray-50">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${submission.name}</h4>
                        <p class="text-sm text-gray-500">${submission.fileName}</p>
                        ${submission.note ? `<p class="text-sm text-gray-600 mt-1">${submission.note}</p>` : ''}
                        <p class="text-xs text-gray-400 mt-2">${this.formatDate(submission.createdAt)}</p>
                    </div>
                    <a href="${submission.fileUrl}" target="_blank"
                       class="text-blue-600 hover:text-blue-800 text-sm">ดาวน์โหลด</a>
                </div>
            </div>
        `).join('')
    }

    getStatusColor(status) {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    getStatusText(status) {
        const texts = {
            pending: 'รอดำเนินการ',
            approved: 'อนุมัติ',
            rejected: 'ปฏิเสธ'
        }
        return texts[status] || status
    }

    // Modal functions
    showAddUserModal() {
        document.getElementById('user-modal-title').textContent = 'เพิ่มผู้ใช้'
        document.getElementById('user-form').reset()
        document.getElementById('user-id').value = ''
        document.getElementById('password-hint').classList.add('hidden')
        document.getElementById('user-password').required = true
        document.getElementById('user-modal').classList.remove('hidden')
    }

    showAddRequestModal() {
        document.getElementById('request-modal-title').textContent = 'เพิ่มคำขอบประมาณ'
        document.getElementById('request-form').reset()
        document.getElementById('request-id').value = ''
        document.getElementById('request-status-div').classList.add('hidden')
        document.getElementById('request-modal').classList.remove('hidden')
    }

    hideUserModal() {
        document.getElementById('user-modal').classList.add('hidden')
    }

    hideRequestModal() {
        document.getElementById('request-modal').classList.add('hidden')
    }

    // User CRUD operations
    async editUser(id) {
        try {
            const users = await UsersAPI.list()
            const user = users.find(u => u.id === id)
            if (!user) return

            document.getElementById('user-modal-title').textContent = 'แก้ไขผู้ใช้'
            document.getElementById('user-id').value = user.id
            document.getElementById('user-name').value = user.name
            document.getElementById('user-username').value = user.username
            document.getElementById('user-password').value = ''
            document.getElementById('user-role').value = user.role
            document.getElementById('password-hint').classList.remove('hidden')
            document.getElementById('user-password').required = false
            document.getElementById('user-modal').classList.remove('hidden')
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้')
        }
    }

    async deleteUser(id) {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
            try {
                await UsersAPI.delete(id)
                this.loadUsers()
                alert('ลบผู้ใช้เรียบร้อยแล้ว')
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการลบผู้ใช้')
            }
        }
    }

    async handleUserSubmit(e) {
        e.preventDefault()

        const id = document.getElementById('user-id').value
        const userData = {
            name: document.getElementById('user-name').value,
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
            role: document.getElementById('user-role').value
        }

        try {
            if (id) {
                // Update existing user
                if (!userData.password) delete userData.password
                await UsersAPI.update(id, userData)
                alert('แก้ไขผู้ใช้เรียบร้อยแล้ว')
            } else {
                // Create new user
                await UsersAPI.create(userData)
                alert('เพิ่มผู้ใช้เรียบร้อยแล้ว')
            }

            this.hideUserModal()
            this.loadUsers()
        } catch (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message)
        }
    }

    // Request CRUD operations
    async editRequest(id) {
        try {
            const request = this.allRequests?.find(r => r.id === id)
            if (!request) return

            document.getElementById('request-modal-title').textContent = 'แก้ไขคำขอบประมาณ'
            document.getElementById('request-id').value = request.id
            document.getElementById('request-title').value = request.title
            document.getElementById('request-category').value = request.category
            document.getElementById('request-year').value = request.fiscalYear
            document.getElementById('request-amount').value = request.amount
            document.getElementById('request-status').value = request.status
            document.getElementById('request-status-div').classList.remove('hidden')
            document.getElementById('request-modal').classList.remove('hidden')
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูลคำขอ')
        }
    }

    async deleteRequest(id) {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบคำขอนี้?')) {
            try {
                await RequestsAPI.delete(id)
                this.loadRequests()
                alert('ลบคำขอเรียบร้อยแล้ว')
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการลบคำขอ')
            }
        }
    }

    async handleRequestSubmit(e) {
        e.preventDefault()

        const id = document.getElementById('request-id').value
        const requestData = {
            title: document.getElementById('request-title').value,
            category: document.getElementById('request-category').value,
            fiscalYear: parseInt(document.getElementById('request-year').value),
            amount: parseFloat(document.getElementById('request-amount').value)
        }

        if (id) {
            requestData.status = document.getElementById('request-status').value
        }

        try {
            if (id) {
                await RequestsAPI.update(id, requestData)
                alert('แก้ไขคำขอเรียบร้อยแล้ว')
            } else {
                await RequestsAPI.create(requestData)
                alert('เพิ่มคำขอเรียบร้อยแล้ว')
            }

            this.hideRequestModal()
            this.loadRequests()
        } catch (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message)
        }
    }

    // File upload
    async handleFileSubmit(e) {
        e.preventDefault()

        const name = document.getElementById('submission-name').value
        const note = document.getElementById('submission-note').value
        const file = document.getElementById('submission-file').files[0]

        if (!file) {
            alert('กรุณาเลือกไฟล์')
            return
        }

        // Check file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('ไฟล์มีขนาดใหญ่เกิน 10MB')
            return
        }

        const formData = new FormData()
        formData.append('name', name)
        formData.append('note', note)
        formData.append('file', file)

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]')
            submitBtn.disabled = true
            submitBtn.textContent = 'กำลังอัปโหลด...'

            await SubmissionsAPI.create(formData)
            alert('ส่งแบบฟอร์มเรียบร้อยแล้ว')

            document.getElementById('submit-form').reset()
            this.loadSubmissions()
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการส่งแบบฟอร์ม: ' + error.message)
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]')
            submitBtn.disabled = false
            submitBtn.textContent = 'ส่งแบบฟอร์ม'
        }
    }

    // Handle budget request form
    async handleBudgetRequestForm(e) {
        e.preventDefault()

        const title = document.getElementById('request-title').value
        const category = document.getElementById('request-category').value
        const fiscalYear = document.getElementById('request-fiscal-year').value
        const amount = document.getElementById('request-amount').value
        const note = document.getElementById('request-note').value
        const file = document.getElementById('request-file').files[0]

        if (!title || !category || !fiscalYear || !amount) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน')
            return
        }

        if (file && file.size > 10 * 1024 * 1024) {
            alert('ไฟล์มีขนาดใหญ่เกิน 10MB')
            return
        }

        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('category', category)
            formData.append('fiscalYear', fiscalYear)
            formData.append('amount', amount)
            formData.append('note', note)
            if (file) {
                formData.append('file', file)
            }

            const submitBtn = e.target.querySelector('button[type="submit"]')
            submitBtn.disabled = true
            submitBtn.textContent = 'กำลังส่ง...'

            await RequestsAPI.create(formData)
            alert('ส่งคำของบประมาณสำเร็จ!')
            document.getElementById('budget-request-form').reset()
            // เปลี่ยนไปหน้าจัดการคำของบประมาณ
            this.showPage('requests')
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message)
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]')
            submitBtn.disabled = false
            submitBtn.textContent = 'ส่งคำของบประมาณ'
        }
    }

    // Submit budget request
    async submitBudgetRequest(e) {
        e.preventDefault()

        const title = document.getElementById('request-title').value
        const category = document.getElementById('request-category').value
        const fiscalYear = document.getElementById('request-fiscal-year').value
        const amount = document.getElementById('request-amount').value
        const note = document.getElementById('request-note').value
        const fileInput = document.getElementById('request-file')
        const file = fileInput.files[0]

        if (!title || !category || !fiscalYear || !amount) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน')
            return
        }

        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('category', category)
            formData.append('fiscalYear', fiscalYear)
            formData.append('amount', amount)
            formData.append('note', note)
            if (file) {
                formData.append('file', file)
            }

            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            })

            if (response.ok) {
                alert('ส่งคำของบประมาณเรียบร้อยแล้ว')
                document.getElementById('budget-request-form').reset()
                // รีเฟรชรายการคำของบ
                if (this.currentPage === 'requests') {
                    this.loadRequests()
                }
            } else {
                const error = await response.text()
                alert('เกิดข้อผิดพลาด: ' + error)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล')
        }
    }

    // Show approve modal
    showApproveModal(id, title, originalAmount) {
        this.currentApproveId = id
        document.getElementById('approve-title').value = title
        document.getElementById('approve-original-amount').value = Number(originalAmount).toLocaleString() + ' บาท'
        document.getElementById('approve-amount').value = originalAmount
        document.getElementById('approve-note').value = ''
        document.getElementById('approve-modal').classList.remove('hidden')
    }

    // Hide approve modal
    hideApproveModal() {
        document.getElementById('approve-modal').classList.add('hidden')
        this.currentApproveId = null
    }

    // Submit approval
    async submitApproval(e) {
        e.preventDefault()

        if (!this.currentApproveId) return

        const approvedAmount = document.getElementById('approve-amount').value
        const note = document.getElementById('approve-note').value

        try {
            const response = await fetch(`/api/requests/${this.currentApproveId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    approvedAmount: parseFloat(approvedAmount),
                    approvalNote: note
                })
            })

            if (response.ok) {
                this.hideApproveModal()
                this.loadRequests()
                alert('อนุมัติคำของบเรียบร้อยแล้ว')
            } else {
                alert('เกิดข้อผิดพลาดในการอนุมัติ')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('เกิดข้อผิดพลาดในการอนุมัติ')
        }
    }

    // Reject request
    async rejectRequest(id) {
        if (confirm('คุณแน่ใจหรือไม่ที่จะปฏิเสธคำของบนี้?')) {
            try {
                const response = await fetch(`/api/requests/${id}/reject`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (response.ok) {
                    this.loadRequests()
                    alert('ปฏิเสธคำของบเรียบร้อยแล้ว')
                } else {
                    alert('เกิดข้อผิดพลาดในการปฏิเสธ')
                }
            } catch (error) {
                console.error('Error:', error)
                alert('เกิดข้อผิดพลาดในการปฏิเสธ')
            }
        }
    }

    // Delete request
    async deleteRequest(id) {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบคำของบนี้?')) {
            try {
                const response = await fetch(`/api/requests/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (response.ok) {
                    this.loadRequests()
                    alert('ลบคำของบเรียบร้อยแล้ว')
                } else {
                    alert('เกิดข้อผิดพลาดในการลบคำของบ')
                }
            } catch (error) {
                console.error('Error:', error)
                alert('เกิดข้อผิดพลาดในการลบคำของบ')
            }
        }
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }


}

// เริ่มต้นแอปพลิเคชัน
const app = new App()
