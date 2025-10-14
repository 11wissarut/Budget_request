import { useEffect, useState } from 'react';

export default function FormsPage(){
  const [items,setItems] = useState([]);
  const [cat,setCat] = useState(0);
  const [year,setYear] = useState('');
  const [showAdd,setShowAdd] = useState(false);
  const [title,setTitle] = useState('');
  const [file,setFile] = useState(null);
  const [formCat,setFormCat] = useState(0);
  const [formYear,setFormYear] = useState('');

  async function load(){
    const q = new URLSearchParams();
    if (cat) q.set('category_id', cat);
    if (year) q.set('year', year);
    const r = await fetch('/api/forms?'+q.toString());
    setItems(await r.json());
  }
  useEffect(()=>{ load(); }, [cat, year]);

  async function addForm(e){
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', title);
    if (formCat) fd.append('category_id', formCat);
    if (formYear) fd.append('year', formYear);
    if (file) fd.append('file', file);
    await fetch('/api/forms', { method:'POST', body: fd });
    setShowAdd(false); setTitle(''); setFile(null); setFormCat(0); setFormYear('');
    load();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <select value={cat} onChange={e=>setCat(Number(e.target.value))}>
          <option value="0">ทุกหมวด</option>
          <option value="1">ครุภัณฑ์</option>
          <option value="2">ค่าที่ดินและสิ่งก่อสร้าง 1 ปี</option>
        </select>
        <input placeholder="ปี" value={year} onChange={e=>setYear(e.target.value)} />
        <button onClick={()=>setShowAdd(true)}>+ เพิ่มแบบฟอร์ม</button>
      </div>

      {showAdd && (
        <form onSubmit={addForm} className="p-3 border rounded space-y-2">
          <input placeholder="ชื่อแบบฟอร์ม" value={title} onChange={e=>setTitle(e.target.value)} required />
          <div className="flex gap-2">
            <select value={formCat} onChange={e=>setFormCat(Number(e.target.value))}>
              <option value="0">ไม่ระบุหมวด</option>
              <option value="1">ครุภัณฑ์</option>
              <option value="2">ค่าที่ดินและสิ่งก่อสร้าง 1 ปี</option>
            </select>
            <input placeholder="ปี" value={formYear} onChange={e=>setFormYear(e.target.value)} />
          </div>
          <input type="file" onChange={e=>setFile(e.target.files[0])} />
          <div className="flex gap-2">
            <button type="submit">บันทึก</button>
            <button type="button" onClick={()=>setShowAdd(false)}>ยกเลิก</button>
          </div>
        </form>
      )}

      <table className="w-full border">
        <thead><tr><th>ชื่อ</th><th>หมวด</th><th>ปี</th><th>ไฟล์</th></tr></thead>
        <tbody>
          {items.map(it=>(
            <tr key={it.form_id}>
              <td>{it.title}</td>
              <td>{it.category_id===1?'ครุภัณฑ์': it.category_id===2?'ค่าที่ดินและสิ่งก่อสร้าง 1 ปี':'-'}</td>
              <td>{it.year||'-'}</td>
              <td>{it.file_path? <a href={'/'+it.file_path} target="_blank" rel="noreferrer">เปิด</a> : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}