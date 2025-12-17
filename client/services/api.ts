import axios from 'axios';

// ב-Vercel, ה-API יושב באותו דומיין ולכן מספיק '/api'
// בפיתוח לוקאלי, ייתכן ותצטרך את ה-URL המלא אם הפורטים שונים
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});