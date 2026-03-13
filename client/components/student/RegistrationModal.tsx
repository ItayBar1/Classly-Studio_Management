import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { EnrollmentService } from "../../services/api";
import { ClassSession } from "../../types/types";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

// --- CheckoutForm (for payment) ---
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
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      setProcessing(false);
    }
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

// --- Main Modal Component ---
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
  const [step, setStep] = useState<'initial' | 'payment' | 'success'>('initial');
  
  // Store enrollment ID in case of cancellation
  const [pendingEnrollmentId, setPendingEnrollmentId] = useState<string | null>(null);

  const isFree = course && (course.price_ils === 0 || course.price_ils === null);

  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setClientSecret(null);
      setError(null);
      setPendingEnrollmentId(null);
    }
  }, [isOpen, course]);

  const handleInitiateRegistration = async () => {
    if (!course) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await EnrollmentService.register(course.id);

      // Store the pending enrollment ID created by the server
      if (res.enrollmentId) {
        setPendingEnrollmentId(res.enrollmentId);
      }

      if (res.clientSecret) {
        setClientSecret(res.clientSecret);
        setStep('payment');
      } else {
        handlePaymentSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "לא ניתן להתחיל הרשמה. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep('success');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000); 
  };

  // Smart close handler - deletes pending enrollment if abandoned
  const handleCloseModal = async () => {
    if (step === 'payment' && pendingEnrollmentId) {
      try {
        await EnrollmentService.cancelEnrollment(pendingEnrollmentId);
      } catch (err) {
        console.error("Failed to cleanup incomplete enrollment", err);
      }
    }
    onClose();
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
          <button onClick={handleCloseModal} disabled={loading || step === 'success'}>
            <X size={20} className={loading || step === 'success' ? "opacity-50" : ""} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 'success' ? (
            <div className="text-center py-8 animate-fadeIn">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800">
                ההרשמה הושלמה!
              </h2>
              <p className="text-slate-500 mt-2">הנך רשום לקורס בהצלחה.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">מחיר הקורס:</span>
                  <span className="font-bold text-lg">
                    {isFree ? "חינם" : `₪${course.price_ils}`}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-4">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {step === 'initial' && (
                <button
                  onClick={handleInitiateRegistration}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" /> מעבד...
                    </>
                  ) : isFree ? (
                    "הירשם בחינם"
                  ) : (
                    "המשך לתשלום"
                  )}
                </button>
              )}

              {step === 'payment' && clientSecret && (
                <div className="animate-fadeIn">
                  <Elements
                    stripe={stripePromise}
                    options={{ clientSecret, locale: "he" }}
                  >
                    <CheckoutForm
                      onSuccess={handlePaymentSuccess}
                      onError={setError}
                    />
                  </Elements>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};