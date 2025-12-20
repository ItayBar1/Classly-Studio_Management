import React from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string; // e.g., 'max-w-2xl'
}

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'max-w-2xl'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-right">
            <div className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className="bg-indigo-600 p-6 flex justify-between items-center text-white shrink-0">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>

                {/* Footer (Optional) */}
                {footer && (
                    <div className="p-6 pt-4 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
