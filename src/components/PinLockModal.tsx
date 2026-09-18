import React, { useState } from 'react';
import { Lock, ShieldCheck, Delete, X } from 'lucide-react';
import { hashPin, verifyPin } from '../utils/security';

interface Props {
  isOpen: boolean;
  mode: 'unlock' | 'setup';
  correctPinHash?: string;
  onSuccess: (newPinHash?: string) => void;
  onCancel?: () => void;
}

export const PinLockModal: React.FC<Props> = ({
  isOpen,
  mode,
  correctPinHash,
  onSuccess,
  onCancel,
}) => {
  if (!isOpen) return null;

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleKeyPress = (num: string) => {
    if (error) setError('');
    const current = isConfirming ? confirmPin : pin;
    if (current.length < 4) {
      const next = current + num;
      if (isConfirming) {
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            onSuccess(hashPin(pin));
          } else {
            setError('PINs do not match. Try again.');
            setPin('');
            setConfirmPin('');
            setIsConfirming(false);
          }
        }
      } else {
        setPin(next);
        if (next.length === 4) {
          if (mode === 'setup') {
            setIsConfirming(true);
          } else {
            // Check hash in unlock mode using salted verifyPin
            if (verifyPin(next, correctPinHash)) {
              onSuccess();
            } else {
              setError('Incorrect PIN. Please try again.');
              setPin('');
            }
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (error) setError('');
    if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const currentPin = isConfirming ? confirmPin : pin;

  return (
    <div
      id="modal-pin-lock"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4"
    >
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 text-center space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        {mode === 'setup' && onCancel && (
          <div className="flex justify-end -mt-2 -mr-2">
            <button
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-xs">
          {mode === 'setup' ? (
            <ShieldCheck className="w-7 h-7" />
          ) : (
            <Lock className="w-7 h-7" />
          )}
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'setup'
              ? isConfirming
                ? 'Confirm Your 4-Digit PIN'
                : 'Create 4-Digit PIN'
              : 'Enter PIN to Unlock'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'setup'
              ? isConfirming
                ? 'Re-enter the 4-digit passcode'
                : 'Secure your financial records'
              : 'My Expense Tracker'}
          </p>
        </div>

        {/* PIN Indicator Dots */}
        <div className="flex justify-center space-x-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                i < currentPin.length
                  ? 'bg-teal-600 border-teal-600 scale-110'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[220px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(n)}
              className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center shadow-2xs"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center shadow-2xs"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center shadow-2xs"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
