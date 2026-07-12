import React, { useState, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import {
  Bell, CheckCircle2, Clock, ChevronLeft, ChevronRight,
  AlertTriangle, SkipForward, Calendar, Sun, Sunset, Moon as MoonIcon,
  CloudSun, X
} from 'lucide-react';
import Modal from '../components/Modal';

export default function RemindersHub() {
  const { reminders = [], handleLogAdherence } = useGlobalContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showReasonModal, setShowReasonModal] = useState(null); // reminderId
  const [skipReason, setSkipReason] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Calendar helpers
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const isToday = (d) => isSameDay(d, new Date());

  // Get dates that have reminders (for calendar dots)
  const datesWithReminders = useMemo(() => {
    const dates = new Set();
    reminders.forEach(r => {
      const d = new Date(r.scheduledAt);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [reminders]);

  // Filter reminders for selected date
  const dayReminders = useMemo(() => {
    return reminders.filter(r => {
      const d = new Date(r.scheduledAt);
      return isSameDay(d, selectedDate);
    }).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [reminders, selectedDate]);

  // Group by time of day
  const grouped = useMemo(() => {
    const groups = { morning: [], afternoon: [], evening: [], night: [] };
    dayReminders.forEach(r => {
      const hour = new Date(r.scheduledAt).getHours();
      if (hour < 12) groups.morning.push(r);
      else if (hour < 15) groups.afternoon.push(r);
      else if (hour < 19) groups.evening.push(r);
      else groups.night.push(r);
    });
    return groups;
  }, [dayReminders]);

  const groupMeta = {
    morning: { label: 'Morning', icon: Sun, color: 'amber' },
    afternoon: { label: 'Afternoon', icon: CloudSun, color: 'blue' },
    evening: { label: 'Evening', icon: Sunset, color: 'purple' },
    night: { label: 'Night', icon: MoonIcon, color: 'indigo' },
  };

  const pendingCount = dayReminders.filter(r => r.status === 'pending').length;
  const takenCount = dayReminders.filter(r => r.status === 'taken').length;

  const handleSkipWithReason = (reminderId) => {
    handleLogAdherence(reminderId, 'missed', skipReason || '');
    setShowReasonModal(null);
    setSkipReason('');
  };

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Reminders</h1>
        <p className="text-gray-500 font-medium mt-1">Manage your medication schedule</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calendar + Stats */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Mini Calendar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-extrabold text-gray-900">
                {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </h3>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for first week offset */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                const hasReminders = datesWithReminders.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all relative ${
                      isSelected
                        ? 'bg-gray-900 text-white font-bold shadow-sm'
                        : isTodayDate
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                    {hasReminders && !isSelected && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isTodayDate ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Today button */}
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setCalendarMonth(new Date());
              }}
              className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Today
            </button>
          </div>

          {/* Day Stats */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Day Summary
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Total Doses</span>
                <span className="text-sm font-bold text-gray-900">{dayReminders.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Taken</span>
                <span className="text-sm font-bold text-emerald-600">{takenCount}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500 font-medium">Pending</span>
                <span className="text-sm font-bold text-amber-600">{pendingCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Reminders List */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Date Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900">
              {isToday(selectedDate)
                ? "Today's Reminders"
                : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <span className="text-sm font-medium text-gray-400">{dayReminders.length} doses</span>
          </div>

          {dayReminders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
              <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No reminders for this day</p>
              <p className="text-sm text-gray-300 mt-1">Select a different date or upload a prescription</p>
            </div>
          ) : (
            Object.entries(grouped).map(([key, items]) => {
              if (items.length === 0) return null;
              const meta = groupMeta[key];
              const Icon = meta.icon;
              return (
                <div key={key}>
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-2 mt-2">
                    <Icon className={`w-4 h-4 text-${meta.color}-500`} />
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{meta.label}</h3>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Reminder Cards */}
                  <div className="flex flex-col gap-2">
                    {items.map(r => {
                      const time = new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isPending = r.status === 'pending';
                      const isTaken = r.status === 'taken';
                      const isMissed = r.status === 'missed';
                      const isOverdue = isPending && new Date(r.scheduledAt) < new Date();

                      return (
                        <div key={r.id} className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 transition-all ${
                          isTaken ? 'border-emerald-200 bg-emerald-50/30' :
                          isMissed ? 'border-red-200 bg-red-50/30' :
                          isOverdue ? 'border-amber-200 bg-amber-50/30' :
                          'border-gray-200 hover:shadow-md'
                        }`}>
                          {/* Time */}
                          <div className="w-16 text-center shrink-0">
                            <span className={`text-sm font-bold ${isOverdue ? 'text-amber-600' : isTaken ? 'text-emerald-600' : 'text-gray-900'}`}>
                              {time}
                            </span>
                          </div>

                          <div className="w-px h-10 bg-gray-200 shrink-0" />

                          {/* Medicine Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-semibold truncate ${isTaken ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
                                {r.medicine?.name || 'Unknown Medication'}
                              </h4>
                              {isOverdue && !isTaken && !isMissed && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 font-medium">
                              {r.medicine?.genericName || r.medicine?.category || 'Medication'}
                              {r.dosage ? ` · ${r.dosage}` : ''}
                              {r.channel ? ` · ${r.channel}` : ''}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isTaken ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                              </span>
                            ) : isMissed ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
                                Skipped
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleLogAdherence(r.id, 'taken')}
                                  className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                                >
                                  Take
                                </button>
                                <button
                                  onClick={() => setShowReasonModal(r.id)}
                                  className="px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                                >
                                  Skip
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* History Table */}
          {dayReminders.filter(r => r.status !== 'pending').length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-2">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Activity Log
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Medication</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dayReminders.filter(r => r.status !== 'pending').map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-2.5 text-sm text-gray-600 font-medium">
                        {new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 font-medium">{r.medicine?.name || 'Unknown'}</td>
                      <td className="px-4 py-2.5">
                        {r.status === 'taken' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold">
                            <SkipForward className="w-3.5 h-3.5" /> Skipped
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Skip Reason Modal */}
      <Modal 
        isOpen={!!showReasonModal} 
        onClose={() => setShowReasonModal(null)} 
        title="Skip Dose"
        icon={AlertTriangle}
      >
        <p className="text-sm text-gray-500 mb-4">Optionally provide a reason for skipping this dose. This helps your healthcare provider understand your adherence patterns.</p>
        <textarea
          value={skipReason}
          onChange={(e) => setSkipReason(e.target.value)}
          placeholder="E.g., Side effects, forgot, ran out of medication..."
          rows={3}
          className="w-full p-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 resize-none mb-4"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowReasonModal(null)}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSkipWithReason(showReasonModal)}
            className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            Confirm Skip
          </button>
        </div>
      </Modal>
    </div>
  );
}
