import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware.js';

const router = Router();
router.get('/', authRequired, async (req,res)=>{
  const { category_id } = req.query;
  try{
    if (!category_id){
      const [rows] = await pool.query(`SELECT type_id, name, category_id FROM types ORDER BY category_id, name`);
      return res.json(rows);
    } else {
      const [rows] = await pool.query(`SELECT type_id, name, category_id FROM types WHERE category_id=? ORDER BY name`, [Number(category_id)]);
      return res.json(rows);
    }
  }catch(e){ console.error(e); res.status(500).json({message:'error'});}
});
export default router;