import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../services/supabaseClient';
import { 
  CreditCard, 
  Calendar, 
  Search, 
  Download, 
  Plus, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';

// --- Types ---
interface PaymentRecord {
  id: string;
  amount_ils: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'; 
  payment_method: string;
  created_at: string;
  invoice_number: string | null;
  description?: string;
}

// טעינת Stripe (יש לוודא שהמפתח ב-.env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// --- Checkout Form Component (Stripe Elements) ---
const CheckoutForm: React.FC<{ onSuccess: () => void; onError: (msg: string) => void }> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // ב-SPA רגיל לרוב לא נרצה רידיירקט מלא אלא טיפול בקוד, 
        // אך לפי ה-PRD יש return_url. כאן נשתמש ב-redirect: 'if_required' לחוויה חלקה
        return_url: window.location.origin + '/payment/success',
      },
      redirect: 'if_required'
    });

    if (error) {
      onError(error.message || 'אירעה שגיאה בעיבוד התשלום');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
      setProcessing(false);
    } else {
      onError('התשלום לא הושלם. אנא נסה שנית.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <PaymentElement />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
      >
        {processing ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
        {processing ? 'מעבד תשלום...' : 'בצע תשלום מאובטח'}
      </button>
    </form>
  );
};

// --- Payment Modal ---
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshData: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, refreshData }) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // איפוס בעת פתיחה/סגירה
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setClientSecret(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const initiatePayment = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('אנא הזן סכום תקין לתשלום');
      return;
    }

    setLoadingSecret(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // שליחה לשרת ה-Express כפי שמוגדר ב-PRD
      // הנחת עבודה: השרת רץ בכתובת המוגדרת ב-VITE_API_URL
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${apiUrl}/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'ils',
          metadata: { description } // אופציונלי
        })
      });

      if (!response.ok) throw new Error('שגיאה ביצירת בקשת תשלום מול השרת');

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error(err);
      // Fallback לטובת הדגמה אם אין שרת Express פעיל כרגע:
      setError('לא ניתן להתחבר לשרת התשלומים. וודא שה-Backend רץ.');
    } finally {
      setLoadingSecret(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-right" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="text-indigo-400" /> תשלום חדש
            </h3>
            <p className="text-slate-400 text-sm mt-1">סליקה מאובטחת באמצעות Stripe</p>
          </div>
          <button onClick={onClose} className="hover:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {success ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
              </div>
              <h4 className="text-2xl font-bold text-slate-800 mb-2">התשלום בוצע בהצלחה!</h4>
              <p className="text-slate-500 mb-6">קבלה נשלחה לכתובת המייל שלך.</p>
              <button 
                onClick={() => { onClose(); refreshData(); }}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800"
              >
                חזור לאזור האישי
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Amount Input */}
              {!clientSecret ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">סכום לתשלום (₪)</label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-3 text-slate-400" size={18} />
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-medium"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">עבור (אופציונלי)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="לדוגמה: שיעור פרטי / חודש ינואר"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <button
                    onClick={initiatePayment}
                    disabled={loadingSecret}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {loadingSecret ? <Loader2 className="animate-spin" /> : 'המשך לפרטי אשראי'}
                  </button>
                </div>
              ) : (
                // Step 2: Stripe Elements
                <div className="animate-fadeIn">
                  <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-500 text-sm">סכום לתשלום:</span>
                    <span className="text-xl font-bold text-slate-900">₪{amount}</span>
                  </div>
                  
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' }, locale: 'he' }}>
                    <CheckoutForm 
                      onSuccess={() => setSuccess(true)} 
                      onError={(msg) => setError(msg)} 
                    />
                  </Elements>
                  
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mt-4">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setClientSecret(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm mt-4 w-full text-center"
                  >
                    חזור ושינוי סכום
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Payments Component ---
export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ totalPaid: 0, lastMonth: 0 });

const fetchPayments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount_ils,
          status,
          payment_method,
          created_at,
          invoice_number
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // המרה בטוחה לטיפוס המתוקן
        const safeData = data as unknown as PaymentRecord[];
        setPayments(safeData);
        
        // חישוב הסכום לפי הסטטוס הנכון במסד הנתונים (COMPLETED)
        const total = safeData
          .filter(p => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + p.amount_ils, 0);
          
        setStats({
          totalPaid: total,
          lastMonth: 0 
        });
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">שולם</span>;
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">ממתין</span>;
      case 'FAILED': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">נכשל</span>;
      case 'REFUNDED': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">זוכה</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        refreshData={fetchPayments} 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">תשלומים וחשבוניות</h2>
          <p className="text-slate-500">נהל את התשלומים והצג היסטוריית חיובים</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          תשלום חדש
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">סה"כ שולם (הצטברות)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">₪{stats.totalPaid.toLocaleString()}</h3>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">יתרה לתשלום</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">₪0.00</h3>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Filters Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="חפש לפי מספר חשבונית..."
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
              <Download size={16} /> ייצוא
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">תאריך</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">מספר חשבונית</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">שיטת תשלום</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">סכום</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">סטטוס</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">קבלה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />טוען נתונים...</td></tr>
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(payment.created_at).toLocaleDateString('he-IL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {payment.invoice_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {payment.payment_method === 'STRIPE' ? 'אשראי' : payment.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      ₪{payment.amount_ils.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                        הורד PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="font-medium">לא נמצאו תשלומים</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};