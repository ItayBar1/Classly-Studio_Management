import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { PaymentService, EnrollmentService } from "../../services/api";
import { ClassSession } from "../../types/types";

// טעינת Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

// --- CheckoutForm (עבור תשלום) ---
const CheckoutForm = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "שגיאה בתשלום");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        disabled={!stripe || processing}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
      >
        {processing ? <Loader2 className="animate-spin" /> : "שלם וסיים הרשמה"}
      </button>
    </form>
  );
};

// --- המודל הראשי ---
interface RegistrationModalProps {
  course: ClassSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  // בדיקה אם הקורס חינם
  const isFree =
    course && (course.price_ils === 0 || course.price_ils === null);

  useEffect(() => {
    if (isOpen && course) {
      // אם הקורס חינם, אין צורך לייצר כוונת תשלום
      if (isFree) {
        setClientSecret(null);
        setError(null);
        return;
      }

      // יצירת כוונת תשלום רק אם יש מחיר
      const createIntent = async () => {
        setLoading(true);
        setError(null);
        try {
          // ווידוא שהמחיר תקין לפני השליחה
          if (!course.price_ils || course.price_ils <= 0) {
            throw new Error("מחיר הקורס אינו תקין");
          }

          const data = await PaymentService.createIntent({
            amount: course.price_ils,
            currency: "ils",
            description: `הרשמה לקורס: ${course.name}`,
          });

          setClientSecret(data.clientSecret);
        } catch (err: any) {
          console.error(err);
          // הצגת הודעה ברורה יותר אם השגיאה הגיעה מהשרת
          const serverMsg = err.response?.data?.error;
          setError(serverMsg || "לא ניתן להתחבר לשרת התשלומים.");
        } finally {
          setLoading(false);
        }
      };

      createIntent();
    } else {
      setClientSecret(null);
      setPaymentSuccess(false);
      setError(null);
    }
  }, [isOpen, course, isFree]);

  const handleRegistration = async () => {
    // פונקציה המטפלת בסיום ההרשמה (גם לתשלום וגם לחינם)
    try {
      if (course) {
        await EnrollmentService.register(course.id);
      }
      setPaymentSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Error finalizing enrollment:", err);
      setError("ההרשמה נכשלה. אנא נסה שוב או פנה לשירות לקוחות.");
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold">הרשמה ל{course.name}</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {paymentSuccess ? (
            <div className="text-center py-8 animate-fadeIn">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800">
                ההרשמה הושלמה!
              </h2>
              <p className="text-slate-500 mt-2">קבלה נשלחה למייל שלך.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">מחיר הקורס:</span>
                  <span className="font-bold text-lg">
                    {course.price_ils === 0 ? "חינם" : `₪${course.price_ils}`}
                  </span>
                </div>
              </div>

              {loading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-4">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* תרחיש תשלום: הצגת טופס Stripe */}
              {clientSecret && !loading && !isFree && (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, locale: "he" }}
                >
                  <CheckoutForm
                    onSuccess={handleRegistration}
                    onError={setError}
                  />
                </Elements>
              )}

              {/* תרחיש חינם: הצגת כפתור הרשמה רגיל */}
              {isFree && !loading && (
                <button
                  onClick={handleRegistration}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                  הירשם בחינם
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
