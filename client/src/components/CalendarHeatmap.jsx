import React, { useState } from 'react';
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

function getIntensity(seconds) {
  if (!seconds || seconds === 0) return 0;
  if (seconds < 60) return 1;
  if (seconds < 180) return 2;
  if (seconds < 300) return 3;
  return 4;
}

function getHeatColor(intensity) {
  const colors = [
    'rgba(255,255,255,0.05)', // 0 - empty
    '#8B6914',                 // 1 - warm amber
    '#B8860B',                 // 2 - gold
    '#D4A017',                 // 3 - bright gold
    '#FFD700',                 // 4 - deep gold
  ];
  return colors[intensity] || colors[0];
}

export default function CalendarHeatmap({ sessions = [], onMonthChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = getDay(startOfMonth(currentDate));

  // Build session map
  const sessionMap = {};
  sessions.forEach(s => {
    const day = new Date(s.session_date).getDate();
    sessionMap[day] = {
      seconds: s.total_seconds,
      mantras: s.mantras_chanted,
    };
  });

  function prevMonth() {
    const d = new Date(year, month - 1, 1);
    setCurrentDate(d);
    onMonthChange?.(d.getFullYear(), d.getMonth() + 1);
  }

  function nextMonth() {
    const d = new Date(year, month + 1, 1);
    setCurrentDate(d);
    onMonthChange?.(d.getFullYear(), d.getMonth() + 1);
  }

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded" style={{ color: 'var(--text-secondary)' }}>
          <CaretLeft size={18} />
        </button>
        <h3 className="font-serif text-base" style={{ color: 'var(--text-primary)' }}>
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <button onClick={nextMonth} className="p-1 rounded" style={{ color: 'var(--text-secondary)' }}>
          <CaretRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map(d => (
          <div key={d} className="text-center text-xs font-sans" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for first week */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const session = sessionMap[day];
          const intensity = session ? getIntensity(session.seconds) : 0;
          const isToday = new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={day}
              title={session ? `${session.mantras} — ${Math.round(session.seconds / 60)} min` : ''}
              className="aspect-square rounded flex items-center justify-center text-xs font-sans cursor-default"
              style={{
                background: getHeatColor(intensity),
                color: intensity > 0 ? '#1a1a2e' : 'var(--text-secondary)',
                fontWeight: isToday ? 700 : 400,
                outline: isToday ? '2px solid var(--text-accent)' : 'none',
                outlineOffset: '1px',
                fontSize: '13px',
                transition: 'background 0.2s',
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs font-sans" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Less</span>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: getHeatColor(i) }} />
        ))}
        <span className="text-xs font-sans" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>More</span>
      </div>
    </div>
  );
}
