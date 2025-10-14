import { useEffect, useState } from 'react';
const CATEGORY_DURABLE = 1;
const CATEGORY_LAND = 2;

export default function RequestForm(){
  const [categoryId, setCategoryId] = useState(CATEGORY_DURABLE);
  const [types, setTypes] = useState([]);
  const [typeId, setTypeId] = useState(null);
  const [qty, setQty] = useState(1);
  const [ppu, setPpu] = useState(0);
  const [files, setFiles] = useState([]);
  const [vendorNo, setVendorNo] = useState(1);
  const [vendorName, setVendorName] = useState('');
  const [vendorAmount, setVendorAmount] = useState('');

  const total = (Number(qty)||0) * (Number(ppu)||0);

  useEffect(()=>{
    (async ()=>{
      const r = await fetch('/api/types?category_id='+categoryId);
      const data = await r.json();
      setTypes(data);
      setTypeId(data.length? data[0].type_id : null);
    })();
  }, [categoryId]);

  async function handleSubmit(e){
    e.preventDefault();
    const payload = {
      name: e.target.name.value,
      list: e.target.list.value,
      quantity: Number(qty||0),
      unit: e.target.unit.value,
      price_per_unit: Number(ppu||0),
      note: e.target.note.value,
      year: Number(e.target.year.value||new Date().getFullYear()),
      department_id: Number(e.target.department_id.value||1),
      category_id: Number(categoryId),
      type_id: typeId || 0
    };
    const r = await fetch('/api/requests', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const { request_id } = await r.json();

    if (files && files.length){
      const fd = new FormData();
      fd.append('vendor_no', vendorNo);
      fd.append('vendor_name', vendorName);
      fd.append('amount', vendorAmount);
      for (const f of files) fd.append('files', f);
      await fetch(`/api/requests/${request_id}/quotations`, { method:'POST', body: fd });
    }
    alert('บันทึกสำเร็จ');
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* หมวด */}
      <select value={categoryId} onChange={e=>setCategoryId(Number(e.target.value))}>
        <option value={CATEGORY_DURABLE}>ครุภัณฑ์</option>
        <option value={CATEGORY_LAND}>ค่าที่ดินและสิ่งก่อสร้าง 1 ปี</option>
      </select>

      {/* ประเภท แสดงตามหมวด */}
      <select value={typeId||''} onChange={e=>setTypeId(Number(e.target.value))}>
        {types.map(t => <option key={t.type_id} value={t.type_id}>{t.name}</option>)}
      </select>

      <input name="name" placeholder="ชื่อคำขอ" required />
      <input name="list" placeholder="รายการ" required />

      <div className="grid grid-cols-3 gap-2">
        <input type="number" min="0" value={qty} onChange={e=>setQty(e.target.value)} placeholder="จำนวน" />
        <input name="unit" placeholder="หน่วย" />
        <input type="number" min="0" value={ppu} onChange={e=>setPpu(e.target.value)} placeholder="ราคาต่อหน่วย" />
      </div>

      <div>จำนวนเงิน (คำนวณ): <b>{total.toLocaleString()}</b></div>

      <textarea name="note" placeholder="บันทึก/เหตุผล"></textarea>
      <input name="year" type="number" defaultValue={2026} />
      <input name="department_id" type="number" defaultValue={1} />

      <fieldset className="p-3 border rounded">
        <legend>แนบใบเสนอราคา (หลายไฟล์)</legend>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" min="1" value={vendorNo} onChange={e=>setVendorNo(e.target.value)} placeholder="เจ้า #" />
          <input value={vendorName} onChange={e=>setVendorName(e.target.value)} placeholder="ผู้เสนอราคา" />
          <input type="number" value={vendorAmount} onChange={e=>setVendorAmount(e.target.value)} placeholder="ยอดเสนอรวม" />
        </div>
        <input type="file" multiple onChange={e=>setFiles([...e.target.files])} />
      </fieldset>

      <button className="btn btn-primary">บันทึก</button>
    </form>
  );
}