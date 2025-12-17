import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const CourseController = {
  // קבלת כל הקורסים (מסונן לפי הרשאה)
  getAll: async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const studioId = req.studioId;
      
      let query = supabaseAdmin.from('classes').select('*').eq('studio_id', studioId);

      // לוגיקה עסקית לפי תפקיד (כפי שביקשת שהשרת ינהל)
      if (user.role === 'STUDENT') {
        // סטודנט רואה רק קורסים פעילים
        query = query.eq('is_active', true);
        // אופציונלי: להסתיר שדות רגישים אם יש
      } else if (user.role === 'INSTRUCTOR') {
        // מדריך רואה רק את הקורסים שלו
        query = query.eq('instructor_id', user.id);
      }
      // ADMIN רואה הכל (אין פילטר נוסף)

      const { data, error } = await query;

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  },

  // יצירת קורס (רק לאדמין)
  create: async (req: Request, res: Response) => {
    try {
      const { name, description, instructor_id, start_time, end_time, price_ils } = req.body;
      
      // ולידציה בסיסית
      if (!name || !instructor_id || !price_ils) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await supabaseAdmin
        .from('classes')
        .insert([{
          studio_id: req.studioId, // נלקח אוטומטית מהיוזר המחובר
          name,
          description,
          instructor_id,
          start_time,
          end_time,
          price_ils
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create course' });
    }
  }
};