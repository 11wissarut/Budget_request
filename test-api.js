// ทดสอบ API สำหรับคำของบประมาณ
const BASE_URL = 'http://localhost:4002'

async function testAPI() {
    console.log('🧪 ทดสอบ API คำของบประมาณ')
    console.log('─'.repeat(50))

    try {
        // 1. ทดสอบล็อกอิน
        console.log('1. ทดสอบล็อกอิน...')
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin'
            })
        })

        if (!loginResponse.ok) {
            throw new Error('ล็อกอินไม่สำเร็จ')
        }

        const loginData = await loginResponse.json()
        const token = loginData.token
        console.log('✅ ล็อกอินสำเร็จ')

        // 2. ทดสอบดึงรายการคำของบ
        console.log('2. ทดสอบดึงรายการคำของบ...')
        const getResponse = await fetch(`${BASE_URL}/api/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (getResponse.ok) {
            const requests = await getResponse.json()
            console.log(`✅ ดึงรายการสำเร็จ (${requests.length} รายการ)`)
        } else {
            console.log('❌ ดึงรายการไม่สำเร็จ')
        }

        // 3. ทดสอบสร้างคำของบใหม่
        console.log('3. ทดสอบสร้างคำของบใหม่...')
        const formData = new FormData()
        formData.append('title', 'ทดสอบคำของบ API')
        formData.append('category', 'ครุภัณฑ์')
        formData.append('fiscalYear', '2568')
        formData.append('amount', '50000')
        formData.append('note', 'ทดสอบจาก API script')

        const createResponse = await fetch(`${BASE_URL}/api/requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })

        if (createResponse.ok) {
            const newRequest = await createResponse.json()
            console.log('✅ สร้างคำของบสำเร็จ:', newRequest.id)
            
            // 4. ทดสอบอนุมัติ
            console.log('4. ทดสอบอนุมัติ...')
            const approveResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (approveResponse.ok) {
                console.log('✅ อนุมัติสำเร็จ')
            } else {
                console.log('❌ อนุมัติไม่สำเร็จ')
            }

            // 5. ทดสอบปฏิเสธ
            console.log('5. ทดสอบปฏิเสธ...')
            const rejectResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (rejectResponse.ok) {
                console.log('✅ ปฏิเสธสำเร็จ')
            } else {
                console.log('❌ ปฏิเสธไม่สำเร็จ')
            }

            // 6. ทดสอบลบคำของบ
            console.log('6. ทดสอบลบคำของบ...')
            const deleteResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (deleteResponse.ok) {
                console.log('✅ ลบคำของบสำเร็จ')
            } else {
                console.log('❌ ลบคำของบไม่สำเร็จ')
            }
        } else {
            const error = await createResponse.text()
            console.log('❌ สร้างคำของบไม่สำเร็จ:', error)
        }

        console.log('')
        console.log('🎉 ทดสอบ API เสร็จสิ้น')

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message)
    }
}

// รัน test
testAPI()
