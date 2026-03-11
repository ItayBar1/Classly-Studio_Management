import React, { useState } from 'react';
import { Copy, Check, Link2 } from 'lucide-react';
import { BaseModal } from '../common/BaseModal';

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: string;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({ isOpen, onClose, link }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="קישור הזמנה לתלמיד" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <Link2 className="text-indigo-500 dark:text-indigo-400" size={20} />
          <p className="text-sm">שלח את הקישור הבא לתלמיד. הקישור תקף ל-7 ימים.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none select-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              copied
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied ? <><Check size={16} /> הועתק!</> : <><Copy size={16} /> העתק</>}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
