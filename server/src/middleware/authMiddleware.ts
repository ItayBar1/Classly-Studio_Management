import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

// הרחבת ה-Type של Request כדי לכלול את המשתמש
declare global {
  namespace Express {
    interface Request {
      user?: any;
      studioId?: string;
    }
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. אימות הטוקן מול Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 2. שליפת פרטי המשתמש והרול מהטבלה הציבורית שלנו
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !userData) {
      return res.status(403).json({ error: 'User profile not found' });
    }

    // 3. הצמדת המשתמש ל-Request להמשך הטיפול
    req.user = userData;
    req.studioId = userData.studio_id;

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error during auth' });
  }
};

// Middleware לבדיקת הרשאות (Role)
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};