import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SectorDetail, Booking, BookingInput } from '../../types';
import { api } from '../../services/api';
import { X, AlertTriangle, Loader2, CheckCircle2, Calendar, Phone, User as UserIcon } from 'lucide-react';

interface BookingFormModalProps {
  sectorDetail: SectorDetail;
  initialBooking?: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  sectorDetail,
  initialBooking,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');
  const [statusVal, setStatusVal] = useState<'confirmed' | 'pending' | 'completed' | 'cancelled'>('confirmed');

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form fields
  useEffect(() => {
    if (initialBooking) {
      setCustomerName(initialBooking.customer_name);
      setPhone(initialBooking.phone);
      setDetails(initialBooking.details || {});
      setNotes(initialBooking.notes || '');
      setStatusVal(initialBooking.status);
    } else {
      // Default empty state with sensible defaults for select slots
      setCustomerName('');
      setPhone('');
      const defaultDetails: Record<string, any> = {};
      sectorDetail.slots.forEach((s) => {
        if (s.type === 'select' && s.options && s.options.length > 0) {
          defaultDetails[s.name] = s.options[0];
        }
      });
      setDetails(defaultDetails);
      setNotes('');
      setStatusVal('confirmed');
    }
    setConflictWarning(null);
    setErrorMsg(null);
  }, [initialBooking, sectorDetail, isOpen]);

  // Check conflicts when date or time slot changes
  const checkConflict = useCallback(async (currentDetails: Record<string, any>) => {
    if (!sectorDetail.has_scheduling) return;
    try {
      const res = await api.checkConflict(currentDetails, initialBooking?.id);
      if (res.has_conflict && res.conflict_message) {
        setConflictWarning(res.conflict_message);
      } else {
        setConflictWarning(null);
      }
    } catch (e) {
      console.warn('Conflict pre-check error:', e);
    }
  }, [sectorDetail.has_scheduling, initialBooking?.id]);

  const handleDetailChange = (name: string, value: any) => {
    const updated = { ...details, [name]: value };
    setDetails(updated);

    // Keep top-level customer_name and phone in sync if slot matches
    if (['citizen_name', 'patient_name', 'owner_name', 'guest_name', 'customer_name', 'student_name'].includes(name)) {
      setCustomerName(value);
    }
    if (name === 'phone') {
      setPhone(value);
    }

    if (sectorDetail.has_scheduling && (name === sectorDetail.schedule_date_key || name === sectorDetail.schedule_time_key)) {
      checkConflict(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    // Ensure customer name and phone are assigned
    const name = customerName.trim() || details['citizen_name'] || details['patient_name'] || details['owner_name'] || details['guest_name'] || 'Citizen';
    const tel = phone.trim() || details['phone'] || '9999999999';

    const payload: BookingInput = {
      customer_name: name,
      phone: tel,
      details: {
        ...details,
        customer_name: name,
        phone: tel,
      },
      notes: notes.trim() || undefined,
    };

    try {
      if (initialBooking) {
        await api.updateBooking(initialBooking.id, {
          ...payload,
          status: statusVal,
        });
      } else {
        await api.createBooking(payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to save booking');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left my-8"
          style={{
            boxShadow: `0 0 50px ${sectorDetail.accent_color}25, 0 25px 60px rgba(0,0,0,0.8)`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border"
                  style={{
                    color: sectorDetail.accent_color,
                    borderColor: `${sectorDetail.accent_color}40`,
                    backgroundColor: `${sectorDetail.accent_color}15`,
                  }}
                >
                  {sectorDetail.name}
                </span>
                {initialBooking && (
                  <span className="text-xs font-mono text-slate-400">
                    Ref: {initialBooking.reference_number}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white font-tamil">
                {initialBooking ? 'முன்பதிவு விவரங்களை மாற்று' : 'புதிய முன்பதிவு / கோரிக்கை பதிவு'}
              </h2>
              <p className="text-xs text-slate-400">
                {initialBooking ? 'Edit Booking / Service Request Details' : 'Register New Booking or Public Service Request'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conflict Alert Banner */}
          {conflictWarning && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Scheduling Conflict Detected</p>
                <p className="mt-0.5">{conflictWarning}</p>
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Primary Name & Phone Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-tamil">
                  பெயர் (Full Name) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      handleDetailChange('citizen_name', e.target.value);
                    }}
                    placeholder="e.g. S. Meenakshi"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-tamil">
                  அலைபேசி எண் (Phone Number) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      handleDetailChange('phone', e.target.value);
                    }}
                    placeholder="e.g. 9840123456"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Sector Slots */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-3">
                {sectorDetail.name} — Required Configuration Slots
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sectorDetail.slots
                  .filter((s) => !['citizen_name', 'patient_name', 'owner_name', 'guest_name', 'customer_name', 'student_name', 'phone'].includes(s.name))
                  .map((slot) => {
                    const value = details[slot.name] ?? '';

                    return (
                      <div
                        key={slot.name}
                        className={slot.type === 'text' && slot.name.includes('note') ? 'sm:col-span-2' : ''}
                      >
                        <label className="block text-xs font-semibold text-slate-300 mb-1 font-tamil">
                          {slot.label_ta} ({slot.label_en})
                          {slot.required && <span className="text-rose-400 ml-1">*</span>}
                        </label>

                        {slot.type === 'select' && slot.options ? (
                          <select
                            required={slot.required}
                            value={value}
                            onChange={(e) => handleDetailChange(slot.name, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="">-- Select option --</option>
                            {slot.options.map((opt) => (
                              <option key={opt} value={opt} className="bg-slate-900 text-white">
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : slot.type === 'date' ? (
                          <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                            <input
                              type="date"
                              required={slot.required}
                              value={value}
                              onChange={(e) => handleDetailChange(slot.name, e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                            />
                          </div>
                        ) : slot.type === 'number' ? (
                          <input
                            type="number"
                            min="1"
                            max="500"
                            required={slot.required}
                            value={value}
                            onChange={(e) => handleDetailChange(slot.name, parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            required={slot.required}
                            value={value}
                            onChange={(e) => handleDetailChange(slot.name, e.target.value)}
                            placeholder={`e.g. ${slot.label_en}`}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                          />
                        )}
                        {slot.description && (
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {slot.description}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Status (If Editing) & Operational Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              {initialBooking && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Booking Status
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none capitalize"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div className={initialBooking ? '' : 'sm:col-span-2'}>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Staff Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP patient, callback requested by 4 PM"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 flex items-center gap-1.5 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: sectorDetail.accent_color,
                  boxShadow: `0 0 20px ${sectorDetail.accent_color}40`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{initialBooking ? 'Update Record' : 'Confirm & Save'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

