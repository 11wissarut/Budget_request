// ทดสอบการอนุมัติคำของบประมาณ
const BASE_URL = 'http://localhost:4002'

async function testApproval() {
    console.log('🧪 ทดสอบการอนุมัติคำของบประมาณ')
    console.log('─'.repeat(50))

    try {
        // 1. ล็อกอิน
        console.log('1. ล็อกอิน...')
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

        const loginData = await loginResponse.json()
        const token = loginData.token
        console.log('✅ ล็อกอินสำเร็จ')

        // 2. สร้างคำของบ
        console.log('2. สร้างคำของบ...')
        const formData = new FormData()
        formData.append('title', 'ทดสอบการอนุมัติ')
        formData.append('category', 'ครุภัณฑ์')
        formData.append('fiscalYear', '2568')
        formData.append('amount', '100000')
        formData.append('note', 'ทดสอบการอนุมัติวงเงิน')

        const createResponse = await fetch(`${BASE_URL}/api/requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })

        const newRequest = await createResponse.json()
        console.log('✅ สร้างคำของบสำเร็จ:', newRequest.id)

        // 3. ทดสอบอนุมัติพร้อมแก้ไขวงเงิน
        console.log('3. ทดสอบอนุมัติพร้อมแก้ไขวงเงิน...')
        const approveResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                approvedAmount: 75000,
                approvalNote: 'อนุมัติบางส่วน เนื่องจากงบประมาณจำกัด'
            })
        })

        if (approveResponse.ok) {
            const approvedRequest = await approveResponse.json()
            console.log('✅ อนุมัติสำเร็จ')
            console.log('   วงเงินที่ขอ:', Number(approvedRequest.amount).toLocaleString(), 'บาท')
            console.log('   วงเงินที่อนุมัติ:', Number(approvedRequest.approvedAmount).toLocaleString(), 'บาท')
            console.log('   หมายเหตุ:', approvedRequest.approvalNote || 'ไม่มี')
        } else {
            console.log('❌ อนุมัติไม่สำเร็จ')
        }

        // 4. ดึงรายการเพื่อตรวจสอบ
        console.log('4. ตรวจสอบรายการ...')
        const getResponse = await fetch(`${BASE_URL}/api/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        const requests = await getResponse.json()
        const approvedRequest = requests.find(r => r.id === newRequest.id)
        
        if (approvedRequest) {
            console.log('✅ ตรวจสอบข้อมูลสำเร็จ')
            console.log('   สถานะ:', approvedRequest.status)
            console.log('   วงเงินที่ขอ:', Number(approvedRequest.amount).toLocaleString(), 'บาท')
            console.log('   วงเงินที่อนุมัติ:', Number(approvedRequest.approvedAmount || 0).toLocaleString(), 'บาท')
            console.log('   หมายเหตุการอนุมัติ:', approvedRequest.approvalNote || 'ไม่มี')
        }

        // 5. ลบคำของบ
        console.log('5. ลบคำของบ...')
        const deleteResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (deleteResponse.ok) {
            console.log('✅ ลบคำของบสำเร็จ')
        }

        console.log('')
        console.log('🎉 ทดสอบการอนุมัติเสร็จสิ้น')

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message)
    }
}

testApproval()
