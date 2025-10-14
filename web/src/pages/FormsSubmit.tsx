import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Requests, api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { BudgetRequest } from '@/types';

/* -------------------------------------------------------------------------- */
/*   คอมโพเนนต์นี้สามารถใช้ได้ทั้งการ "สร้างคำของบประมาณใหม่" และ "แก้ไข"   */
/*   - ถ้า requestId มีค่า => โหมดแก้ไข                                         */
/*   - ถ้ามี onClose => โหมด Modal                                             */
/* -------------------------------------------------------------------------- */

interface FormsSubmitProps {
  requestId?: string | null;  // ใช้เมื่ออยู่ในโหมดแก้ไข
  onClose?: () => void;       // ใช้เมื่อเป็น modal
  onSuccess?: () => void;     // callback เมื่อส่งสำเร็จ
}

// โครงสร้างสำหรับไฟล์แนบ / ใบเสนอราคา
interface ManagedFile {
  id: number;
  file: File | null;
  existingFileName?: string;
  existingFilePath?: string;
}

// ค่าเริ่มต้นของฟอร์ม
const initialFormState = {
  title: '',
  fiscal_year: new Date().getFullYear() + 543, // ปีงบประมาณ (พ.ศ.)
  category: '' as 'EQUIPMENT' | 'CONSTRUCTION' | '',
  note: '',
  construction_type: 'IMPROVEMENT' as 'IMPROVEMENT' | 'NEW_CONSTRUCTION',
  equipment_type: 'REPLACEMENT' as 'BUILDING' | 'REPLACEMENT' | 'EFFICIENCY',
  quantity: 1,
  unit: '',
  price_per_unit: 0,
  total_amount: 0,
  quotations: [{ id: 1, file: null }] as ManagedFile[], // ใบเสนอราคา
  attachments: [] as ManagedFile[], // ไฟล์แนบ
};

export default function FormsSubmit({ requestId, onClose, onSuccess }: FormsSubmitProps) {
  const isModalMode = !!onClose;        // ถ้าเรียกจาก modal
  const isEditMode = !!requestId;       // ถ้าเป็นโหมดแก้ไข
  
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode); // โหลดข้อมูลเมื่อแก้ไข
  const user = getUser();
  const navigate = useNavigate();

  // ไฟล์แนบใหม่ (ที่เพิ่งเลือก)
  const [attachments, setAttachments] = useState<File[]>([]);
  // ไฟล์แนบที่มีอยู่แล้วในระบบ (จาก DB)
  const [existingAttachments, setExistingAttachments] = useState<ManagedFile[]>([]);

  /* -------------------------------------------------------------------------- */
  /*                     โหลดข้อมูลเดิมเมื่ออยู่ในโหมดแก้ไข                     */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    setForm(initialFormState);
    setAttachments([]);
    setExistingAttachments([]);

    if (isEditMode && requestId) {
      setIsLoading(true);
      Requests.get(requestId)
        .then((data: BudgetRequest) => {
          // map ข้อมูลที่ได้จาก API ไปยัง state ของฟอร์ม
          setForm(prev => ({
            ...prev,
            title: data.title,
            fiscal_year: data.fiscalYear,
            category: data.category as any,
            note: data.note || '',
            total_amount: data.totalAmount,
            construction_type: data.constructionType || 'IMPROVEMENT',
            equipment_type: data.details?.equipmentType || 'REPLACEMENT',
            quantity: data.details?.quantity || 1,
            unit: data.details?.unit || '',
            price_per_unit: data.details?.pricePerUnit || 0,
            quotations: data.quotations?.length
              ? data.quotations.map(q => ({
                  id: q.id,
                  file: null,
                  existingFileName: q.fileName,
                  existingFilePath: q.filePath,
                }))
              : [{ id: 1, file: null }],
          }));
          setExistingAttachments(data.attachments || []);
        })
        .catch(err => {
          console.error(err);
          alert('ไม่พบข้อมูลคำของบประมาณ');
          if (onClose) onClose();
        })
        .finally(() => setIsLoading(false));
    }
  }, [requestId, isEditMode, onClose]);

  /* -------------------------------------------------------------------------- */
  /*      อัพเดทจำนวนรวม (total_amount) อัตโนมัติเมื่อเป็นหมวดครุภัณฑ์        */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (form.category === 'EQUIPMENT') {
      const total = (form.quantity || 0) * (form.price_per_unit || 0);
      setForm(prev => ({ ...prev, total_amount: total }));
    }
  }, [form.category, form.quantity, form.price_per_unit]);

  /* -------------------------------------------------------------------------- */
  /*                               ฟังก์ชันจัดการฟอร์ม                          */
  /* -------------------------------------------------------------------------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // จัดการไฟล์ใบเสนอราคา
  const handleQuotationFileChange = (id: number, file: File | null) => {
    setForm(prev => ({
      ...prev,
      quotations: prev.quotations.map(q => q.id === id ? { ...q, file } : q)
    }));
  };

  const addQuotation = () => {
    setForm(prev => ({
      ...prev,
      quotations: [...prev.quotations, { id: Date.now(), file: null }]
    }));
  };

  const removeQuotation = (id: number) => {
    setForm(prev => ({
      ...prev,
      quotations: prev.quotations.length > 1
        ? prev.quotations.filter(q => q.id !== id)
        : [{ id: Date.now(), file: null }],
    }));
  };

  // จัดการไฟล์แนบ
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // ลบไฟล์แนบเก่าที่อยู่ในระบบ
  const removeExistingAttachment = async (id: number) => {
    if (!confirm('ต้องการลบไฟล์หรือไม่? การลบจะลบไฟล์ออกจากระบบอย่างถาวร')) return;
    try {
      await api(`/api/attachments/${id}`, { method: 'DELETE' });
      setExistingAttachments(prev => prev.filter(a => a.id !== id));
      alert('ลบไฟล์แนบสำเร็จ');
    } catch (error: any) {
      alert(`ข้อผิดพลาดในการลบไฟล์: ${error.message}`);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                          ฟังก์ชันส่งฟอร์ม (Submit)                         */
  /* -------------------------------------------------------------------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.title || !form.fiscal_year) {
      return alert('กรอกข้อมูลให้ครบถ้วน: ชื่อรายการ, งบประมาณ, และหมวด');
    }

    setIsSubmitting(true);
    const formData = new FormData();

    // เพิ่มค่าลงใน formData
    formData.append('title', form.title);
    formData.append('fiscal_year', String(form.fiscal_year));
    formData.append('category', form.category);
    formData.append('note', form.note);
    formData.append('total_amount', String(form.total_amount));
    if (user) formData.append('created_by', user.id);

    if (form.category === 'CONSTRUCTION') {
      formData.append('construction_type', form.construction_type);
    }

    if (form.category === 'EQUIPMENT') {
      formData.append('equipment_type', form.equipment_type);
      formData.append('quantity', String(form.quantity));
      formData.append('unit', form.unit);
      formData.append('price_per_unit', String(form.price_per_unit));
    }

    // ใบเสนอราคา
    form.quotations.forEach(q => {
      if (q.file) formData.append('quotations', q.file);
    });

    // ไฟล์แนบใหม่
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      if (isEditMode) {
        await api(`/api/requests/${requestId}`, { method: 'PUT', body: formData });
        alert('แก้ไขคำของบประมาณแล้ว');
      } else {
        await api('/api/requests', { method: 'POST', body: formData });
        alert('ส่งคำของบประมาณแล้ว');
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        if (!isEditMode) setForm(initialFormState); // reset ถ้าเป็นการสร้างใหม่
      }
      if (onClose) onClose();

    } catch (error: any) {
      console.error('Submit Error:', error);
      alert(`ข้อผิดพลาด: ${error.message || 'ไม่สามารถส่งข้อมูลได้'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ฟังก์ชันยกเลิก
  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1); // กลับหน้าก่อนหน้า
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                           ส่วน UI ของฟอร์มหลัก                             */
  /* -------------------------------------------------------------------------- */
  const formContent = (
    <div className={isModalMode ? '' : 'card p-4 lg:p-6'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">
          {isEditMode ? 'แก้ไขคำของบประมาณ' : 'ส่งคำของบประมาณ'}
        </h2>

        {/* ฟิลด์ข้อมูลทั่วไป */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">ชื่อรายการ</label>
            <input type="text" name="title" value={form.title} onChange={handleInputChange} className="input" required />
          </div>
          <div>
            <label className="label">งบประมาณ (ปี)</label>
            <input type="number" name="fiscal_year" value={form.fiscal_year} onChange={handleInputChange} className="input" required />
          </div>
        </div>

        <div>
          <label className="label">หมวด</label>
          <select name="category" value={form.category} onChange={handleInputChange} className="input" required>
            <option value="">-- เลือกหมวด --</option>
            <option value="CONSTRUCTION">ค่าวัสดุและสิ่งก่อสร้าง</option>
            <option value="EQUIPMENT">ครุภัณฑ์</option>
            <option value="UTILITIES">ค่าสาธารณูปโภค</option>
            <option value="TEMPORARY_PAY">ค่าจ้างชั่วคราว</option>
          </select>
        </div>

        {/* เฉพาะหมวดก่อสร้าง */}
        {form.category === 'CONSTRUCTION' && (
          <div className="p-4 border rounded-md bg-gray-50 space-y-4">
            <div className="font-medium">ค่าใช้จ่ายและสิ่งก่อสร้าง</div>
            <div>
              <label className="label">ประเภท</label>
              <select name="construction_type" value={form.construction_type} onChange={handleInputChange} className="input" required>
                <option value="IMPROVEMENT">ปรับปรุง</option>
                <option value="NEW_CONSTRUCTION">ก่อสร้างใหม่</option>
              </select>
            </div>
          </div>
        )}

        {/* เฉพาะหมวดครุภัณฑ์ */}
        {form.category === 'EQUIPMENT' && (
          <div className="p-4 border rounded-md bg-gray-50 space-y-4">
            <div className="font-medium">ครุภัณฑ์</div>
            <div>
              <label className="label">ประเภท</label>
              <select name="equipment_type" value={form.equipment_type} onChange={handleInputChange} className="input" required>
                <option value="BUILDING">ประจำอาคาร</option>
                <option value="REPLACEMENT">ทดแทน</option>
                <option value="EFFICIENCY">เพิ่มประสิทธิภาพ</option>
              </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="label">จำนวน</label><input type="number" name="quantity" value={form.quantity} onChange={handleInputChange} className="input" min="1" /></div>
              <div><label className="label">หน่วย</label><input type="text" name="unit" value={form.unit} onChange={handleInputChange} className="input" /></div>
              <div className="col-span-2"><label className="label">ราคาต่อหน่วย</label><input type="number" name="price_per_unit" value={form.price_per_unit} onChange={handleInputChange} className="input" min="0" /></div>
            </div>
          </div>
        )}

        {/* จำนวนรวม */}
        <div>
          <label className="label">จำนวนรวม (บาท)</label>
          <input type="number" name="total_amount" value={form.total_amount} onChange={handleInputChange} className="input bg-gray-100" readOnly={form.category === 'EQUIPMENT'} required />
        </div>

        {/* หมายเหตุ */}
        <div>
          <label className="label">หมายเหตุ</label>
          <textarea name="note" value={form.note} onChange={handleInputChange} className="input" rows={3}></textarea>
        </div>

        {/* ใบเสนอราคา */}
        <div>
          <label className="label">ใบเสนอราคา</label>
          <div className="space-y-3">
            {form.quotations.map((q, index) => (
              <div key={q.id} className="flex items-center gap-2 p-2 border rounded-md">
                <div className="flex-grow">
                  <span className="font-medium"> {index + 1}:</span>
                  {q.existingFileName && !q.file && (
                    <div className="text-sm text-gray-600">ไฟล์: {q.existingFileName} (เลือกไฟล์ใหม่หากต้องการแทนที่)</div>
                  )}
                  <input type="file" onChange={(e) => handleQuotationFileChange(q.id, e.target.files?.[0] || null)} className="input" />
                </div>
                {form.quotations.length > 1 && (
                  <button type="button" onClick={() => removeQuotation(q.id)} className="btn-danger-sm">-</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addQuotation} className="btn-secondary w-full">+ เพิ่มใบเสนอราคา</button>
          </div>
        </div>

        {/* ไฟล์ประกอบ */}
        <div>
          <label className="label">ไฟล์ประกอบ (ถ้ามี)</label>

          {/* ไฟล์ที่มีอยู่แล้ว */}
          {existingAttachments.length > 0 && (
            <div className="space-y-2 mb-2">
              <div className="text-sm font-medium text-gray-600">ไฟล์ที่มีอยู่:</div>
              {existingAttachments.map(file => (
                <div key={file.id} className="flex justify-between items-center p-2 border rounded-md bg-gray-50">
                  <span className="text-sm">{file.fileName}</span>
                  <button type="button" onClick={() => removeExistingAttachment(file.id)} className="btn-danger-sm">ลบ</button>
                </div>
              ))}
            </div>
          )}

          {/* ไฟล์ใหม่ */}
          {attachments.length > 0 && (
            <div className="space-y-2 mb-2">
              <div className="text-sm font-medium text-gray-600">ไฟล์ใหม่ที่จะอัปโหลด:</div>
              {attachments.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm">{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(index)} className="btn-danger-sm">-</button>
                </div>
              ))}
            </div>
          )}

          {/* ช่องเลือกไฟล์ */}
          <input type="file" multiple onChange={handleAttachmentChange} className="input" />
        </div>

        {/* ปุ่มบันทึก / ยกเลิก */}
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={handleCancel} className="btn-secondary" disabled={isSubmitting}>ยกเลิก</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'กำลังส่ง...' : (isEditMode ? 'แก้ไข' : 'ส่งคำของบประมาณ')}
          </button>
        </div>
      </form>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /*                         แสดงผลแบบ Modal หรือ Page                          */
  /* -------------------------------------------------------------------------- */
  if (isModalMode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {isLoading ? <p>Loading...</p> : formContent}
        </div>
      </div>
    );
  }

  return formContent;
}
