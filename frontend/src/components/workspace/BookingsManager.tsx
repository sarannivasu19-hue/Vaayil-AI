import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { SectorDetail, Booking } from '../../types';
import type { TNDistrict } from '../../data/tamilNaduDistricts';
import { api } from '../../services/api';
import { BookingFormModal } from './BookingFormModal';
import {
  Search,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  Calendar,
  Phone,
  User as UserIcon,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Loader2,
  Tag,
  AlertCircle,
  RefreshCw,
  MapPin,
} from 'lucide-react';

interface BookingsManagerProps {
  sectorDetail: SectorDetail;
  district?: TNDistrict | null;
}

export const BookingsManager: React.FC<BookingsManagerProps> = ({ sectorDetail, district }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterByDistrict, setFilterByDistrict] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const districtFilter = filterByDistrict && district ? district.en : undefined;
      const data = await api.getBookings(searchTerm, statusFilter, districtFilter);
      setBookings(data);
    } catch (err: unknown) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, filterByDistrict, district]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleLoadDemo = async () => {
    try {
      setIsDemoLoading(true);
      setFeedbackMsg(null);
      const data = await api.loadDemoBookings();
      setBookings(data);
      setFeedbackMsg({
        text: `Loaded ${data.length} synthetic sample bookings for ${sectorDetail.name}!`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : 'Failed to load demo data',
        type: 'error',
      });
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${booking.reference_number}?`)) {
      return;
    }
    try {
      await api.cancelBooking(booking.id);
      fetchBookings();
      setFeedbackMsg({ text: `Booking ${booking.reference_number} cancelled.`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  // Stats calculation
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 border border-amber-500/40 text-amber-300">
            <Clock className="w-3 h-3 text-amber-400" />
            Pending
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/70 border border-blue-500/40 text-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            Completed
          </span>
        );
      case 'cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 border border-rose-500/40 text-rose-300">
            <XCircle className="w-3 h-3 text-rose-400" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border"
              style={{
                color: sectorDetail.accent_color,
                borderColor: `${sectorDetail.accent_color}40`,
                backgroundColor: `${sectorDetail.accent_color}15`,
              }}
            >
              {sectorDetail.id}
            </span>
            <span className="text-xs text-[#9AA7BE] font-mono">{sectorDetail.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-tamil tracking-tight">
            முன்பதிவுகள் & சேவைக் கோரிக்கைகள்
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Bookings, Citizen Complaints & Service Appointments Management
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleLoadDemo}
            disabled={isDemoLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Load synthetic sample bookings tailored to this sector"
          >
            {isDemoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>⚡ Load Demo Data</span>
          </button>

          <button
            onClick={() => {
              setSelectedBooking(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
            style={{
              backgroundColor: sectorDetail.accent_color,
              boxShadow: `0 0 25px ${sectorDetail.accent_color}40`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>New Booking / Request</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </motion.div>
      )}

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl glass-panel border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Records</span>
          <p className="text-2xl font-extrabold text-white mt-1">{totalCount}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">Confirmed</span>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1">{confirmedCount}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-amber-500/30">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">Pending</span>
          <p className="text-2xl font-extrabold text-amber-300 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-rose-500/30">
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400">Cancelled</span>
          <p className="text-2xl font-extrabold text-rose-300 mt-1">{cancelledCount}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, reference number or notes..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-950/60 rounded-xl border border-white/10 shrink-0">
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {district && (
          <button
            onClick={() => setFilterByDistrict(!filterByDistrict)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
              filterByDistrict
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={`Toggle filtering records for ${district.en}`}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{district.en}</span>
          </button>
        )}

        <button
          onClick={fetchBookings}
          title="Refresh bookings list"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors cursor-pointer shrink-0 hidden sm:flex items-center justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bookings Table / Card View */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
          <p className="text-xs">Loading {sectorDetail.name} records...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-16 px-4 rounded-3xl glass-panel border border-white/10 text-center max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Bookings Found</h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            {searchTerm || statusFilter !== 'all'
              ? 'No records match your active search or filter criteria.'
              : 'There are no active bookings or complaints registered in this sector yet.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleLoadDemo}
              disabled={isDemoLoading}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Synthetic Demo Data</span>
            </button>
            <button
              onClick={() => {
                setSelectedBooking(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              Create New
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {bookings.map((booking) => {
            const details = booking.details || {};

            return (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Customer Info & Sector Specific Tags */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-950 border border-white/15 text-cyan-300">
                      {booking.reference_number}
                    </span>
                    {getStatusBadge(booking.status)}
                    {booking.notes && booking.notes.includes('Synthetic Demo Data') && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/30">
                        Synthetic Demo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-white">
                    <span className="text-base font-bold flex items-center gap-1.5 truncate font-tamil">
                      <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      {booking.customer_name}
                    </span>
                    <span className="text-xs text-slate-300 font-mono flex items-center gap-1 shrink-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {booking.phone}
                    </span>
                  </div>

                  {/* Render Sector Slots Chips dynamically */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(details)
                      .filter(([k]) => !['citizen_name', 'patient_name', 'owner_name', 'guest_name', 'customer_name', 'student_name', 'phone'].includes(k))
                      .map(([key, val]) => {
                        const slotDef = sectorDetail.slots.find((s) => s.name === key);
                        const label = slotDef ? slotDef.label_en : key.replace('_', ' ');

                        return (
                          <div
                            key={key}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-950/80 border border-white/10 text-[11px] text-slate-300"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-500" />
                            <span className="text-slate-500 font-mono text-[10px]">{label}:</span>
                            <span className="font-medium text-slate-200">{String(val)}</span>
                          </div>
                        );
                      })}
                  </div>

                  {booking.notes && !booking.notes.includes('Synthetic Demo Data') && (
                    <p className="text-xs text-slate-400 italic pt-1">
                      Note: {booking.notes}
                    </p>
                  )}
                </div>

                {/* Right: Actions & Timestamps */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(booking.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(booking)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dynamic Modal for Create / Edit */}
      <BookingFormModal
        sectorDetail={sectorDetail}
        initialBooking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchBookings}
      />
    </div>
  );
};
