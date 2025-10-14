import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:4002';

// 📌 กำหนดโครงสร้างข้อมูลของแบบฟอร์ม
interface DownloadableForm {
  id: number;
  title: string;
  fileName: string;
  filePath: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                     Modal สำหรับอัปโหลดแบบฟอร์มใหม่                       */
/* -------------------------------------------------------------------------- */
const UploadModal = ({
  onClose,
  onUploadSuccess,
}: {
  onClose: () => void;
  onUploadSuccess: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 📌 ฟังก์ชันอัปโหลดไฟล์
  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      return alert('กรุณากรอกชื่อเรื่องและเลือกไฟล์');
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    setIsUploading(true);
    try {
      await api('/api/forms', { method: 'POST', body: formData });
      alert('อัปโหลดฟอร์มสำเร็จ');
      onUploadSuccess(); // ✅ refresh list หลังอัปโหลดสำเร็จ
      onClose();         // ✅ ปิด modal
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">เพิ่มแบบฟอร์มใหม่</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label">ชื่อเรื่องแบบฟอร์ม</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">ไฟล์</label>
            <input
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="input"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isUploading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isUploading}
            >
              {isUploading ? 'กำลังอัปโหลด...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                         หน้าแสดงรายการแบบฟอร์มหลัก                        */
/* -------------------------------------------------------------------------- */
export default function FormsDownload() {
  const [forms, setForms] = useState<DownloadableForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 📌 ฟังก์ชัน normalize ข้อมูลจาก API ให้เป็นโครงสร้างที่เรากำหนดไว้
  const normalize = (d: any): DownloadableForm => ({
    id: d.id,
    title: d.title,
    filePath: d.filePath || d.file_path || d.path,
    fileName: d.fileName || d.file_name || d.originalname || d.name,
    createdAt: d.createdAt || d.created_at,
  });

  // 📌 ฟังก์ชันดึงรายการฟอร์มจาก API
  const fetchForms = () => {
    setIsLoading(true);
    api('/api/forms')
      .then(data => {
        setForms((Array.isArray(data) ? data : []).map(normalize));
      })
      .catch(error => {
        console.error('Failed to fetch forms:', error);
        alert('ไม่สามารถโหลดรายการแบบฟอร์มได้');
      })
      .finally(() => setIsLoading(false));
  };

  // ✅ โหลดข้อมูลตอน mount
  useEffect(() => {
    fetchForms();
  }, []);

  // 📌 ฟังก์ชันลบฟอร์ม
  const handleDelete = async (formId: number) => {
    if (!confirm('คุณต้องการลบแบบฟอร์มนี้ใช่หรือไม่?')) return;
    try {
      await api(`/api/forms/${formId}`, { method: 'DELETE' });
      alert('ลบแบบฟอร์มสำเร็จ');
      fetchForms(); // ✅ refresh list หลังลบสำเร็จ
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  return (
    <div className="card p-4">
      {/* ส่วนหัวของหน้า */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">คลังแบบฟอร์ม</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          + เพิ่มแบบฟอร์ม
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        ดาวน์โหลดแบบฟอร์มต่างๆ สำหรับการขอใช้งบประมาณ
      </p>

      {/* แสดงผลการโหลดข้อมูล */}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3">
          {forms.length > 0 ? (
            forms.map((form, idx) => (
              <li
                key={form.id}
                className="flex items-center justify-between rounded-xl border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 font-semibold text-blue-700">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium">{form.title}</div>
                    <div className="text-xs text-slate-500">{form.fileName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* ปุ่มดาวน์โหลด */}
                  <a
                    href={`${BASE_URL}/api/download?path=${encodeURIComponent(form.filePath)}&filename=${encodeURIComponent(form.fileName)}`}
                    className="btn-secondary-sm"
                  >
                    ดาวน์โหลด
                  </a>
                  {/* ปุ่มลบ */}
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="btn-danger-sm"
                  >
                    ลบ
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="text-center py-8 text-gray-500">
              ไม่มีแบบฟอร์มให้ดาวน์โหลด
            </li>
          )}
        </ul>
      )}

      {/* Modal สำหรับอัปโหลด */}
      {isModalOpen && (
        <UploadModal
          onClose={() => setIsModalOpen(false)}
          onUploadSuccess={fetchForms}
        />
      )}
    </div>
  );
}
