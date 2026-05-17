import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../icons';
import { PageHeader, Drawer, Pill } from '../components';
import { useLocation } from '../LocationContext';
import { useNexusData } from '../NexusDataContext';
import { useAuth } from '../AuthContext';
import {
  fetchAppointments, createAppointment, updateAppointment, deleteAppointment,
  fetchRooms,
} from '../api';
import { SEED_PATIENTS, ageFromDob } from './page-patients';

// ── Constants ─────────────────────────────────────────────────────────────────

const HOUR_H = 56; // px per hour
const DAY_START = 0; // midnight
const DAY_END = 24;
const TOTAL_H = (DAY_END - DAY_START) * HOUR_H;

const APPT_TYPES = [
  { id: 'psg',       label: 'Full PSG',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: 'pulse',     defaultDuration: 10, defaultStart: 21, equipType: 'PSG Amplifier' },
  { id: 'titration', label: 'Titration',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  icon: 'activity',  defaultDuration: 9,  defaultStart: 21, equipType: 'CPAP Titration Device' },
  { id: 'hsat',      label: 'HSAT',          color: '#0d9488', bg: 'rgba(13,148,136,0.12)',  icon: 'heart',     defaultDuration: 1,  defaultStart: 9,  equipType: 'HSAT Device' },
  { id: 'consult',   label: 'Consultation',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: 'users',     defaultDuration: 1,  defaultStart: 9,  equipType: null },
];

const STATUS_META = {
  scheduled:  { label: 'Scheduled',  kind: 'outline' },
  confirmed:  { label: 'Confirmed',  kind: 'good'    },
  completed:  { label: 'Completed',  kind: 'outline' },
  cancelled:  { label: 'Cancelled',  kind: 'bad'     },
};

function typeOf(id) { return APPT_TYPES.find(t => t.id === id) ?? APPT_TYPES[0]; }

// ── Date helpers ──────────────────────────────────────────────────────────────

function isoDate(d) { return d.toISOString().slice(0, 10); }
function isoDateTime(d) { return d.toISOString().slice(0, 16).replace('T', 'T'); }

function weekMonday(d) {
  const day = new Date(d);
  const dow = day.getDay();
  day.setDate(day.getDate() - (dow === 0 ? 6 : dow - 1));
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDayHeader(d) {
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(iso) {
  if (!iso) return '';
  const [h, m] = iso.slice(11, 16).split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')}${ampm}`;
}

function minutesFromMidnight(isoDatetime) {
  const [h, m] = isoDatetime.slice(11, 16).split(':').map(Number);
  return h * 60 + m;
}

function isToday(d) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

// ── Appointment block (on calendar) ──────────────────────────────────────────

function ApptBlock({ appt, dayDate, onClick }) {
  const meta = typeOf(appt.type);
  const dayIso = isoDate(dayDate);
  const nextDayIso = isoDate(addDays(dayDate, 1));

  const startIso = appt.start.slice(0, 10);
  const endIso   = appt.end.slice(0, 10);

  // Determine visible segment on this day
  let segStartMin, segEndMin;

  if (startIso === dayIso && endIso === dayIso) {
    segStartMin = minutesFromMidnight(appt.start);
    segEndMin   = minutesFromMidnight(appt.end);
  } else if (startIso === dayIso && endIso !== dayIso) {
    // starts today, ends tomorrow or later — clip to midnight
    segStartMin = minutesFromMidnight(appt.start);
    segEndMin   = 24 * 60;
  } else if (endIso === dayIso && startIso !== dayIso) {
    // ends today, started yesterday — clip from midnight
    segStartMin = 0;
    segEndMin   = minutesFromMidnight(appt.end);
  } else {
    return null;
  }

  if (segEndMin <= segStartMin) return null;

  const top    = (segStartMin / 60) * HOUR_H;
  const height = Math.max(((segEndMin - segStartMin) / 60) * HOUR_H, 18);
  const isContinuation = startIso !== dayIso;
  const continuesNext  = endIso !== dayIso && endIso !== dayIso;

  return (
    <div
      onClick={() => onClick(appt)}
      style={{
        position: 'absolute', left: 3, right: 3, top, height,
        background: meta.bg, border: `1.5px solid ${meta.color}`,
        borderRadius: 6, padding: '3px 6px', cursor: 'pointer',
        overflow: 'hidden', zIndex: 1,
        borderTop: isContinuation ? `1.5px dashed ${meta.color}` : undefined,
        borderBottom: continuesNext ? `1.5px dashed ${meta.color}` : undefined,
        transition: 'filter 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'none'}
      title={`${meta.label} — ${appt.patientName}\n${fmtTime(appt.start)} → ${fmtTime(appt.end)}`}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: meta.color, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {appt.patientName}
      </div>
      {height > 32 && (
        <div style={{ fontSize: 10, color: meta.color, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {meta.label}{appt.roomId ? ` · ${appt.roomId}` : ''}
        </div>
      )}
    </div>
  );
}

// ── Week calendar ─────────────────────────────────────────────────────────────

function WeekCalendar({ weekDays, appointments, onClickSlot, onClickAppt }) {
  const scrollRef = useRef(null);
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => i + DAY_START);

  // Scroll to 7am on mount
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_H - 20;
  }, []);

  // Current time indicator
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMin / 60) * HOUR_H;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
      {/* Day header row */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ width: 52, flexShrink: 0 }} />
        {weekDays.map((d, i) => (
          <div key={i} style={{
            flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: 12, fontWeight: 500,
            color: isToday(d) ? 'var(--accent-ink)' : 'var(--ink-2)',
            borderLeft: '1px solid var(--border)',
            background: isToday(d) ? 'var(--accent-soft)' : 'transparent',
          }}>
            {fmtDayHeader(d)}
          </div>
        ))}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
        <div style={{ display: 'flex', height: TOTAL_H, position: 'relative' }}>
          {/* Time axis */}
          <div style={{ width: 52, flexShrink: 0, position: 'relative' }}>
            {hours.map(h => (
              <div key={h} style={{
                position: 'absolute', top: h * HOUR_H - 7, right: 8,
                fontSize: 10, color: 'var(--ink-4)', lineHeight: 1,
                display: h === 0 ? 'none' : undefined,
              }}>
                {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((d, di) => (
            <div key={di} style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--border)' }}>
              {/* Hour lines */}
              {hours.map(h => (
                <React.Fragment key={h}>
                  <div style={{ position: 'absolute', top: h * HOUR_H, left: 0, right: 0, borderTop: `1px solid var(--border)`, pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: h * HOUR_H + HOUR_H / 2, left: 0, right: 0, borderTop: `1px dashed var(--border)`, opacity: 0.5, pointerEvents: 'none' }} />
                </React.Fragment>
              ))}

              {/* Click-to-book overlay */}
              <div
                style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const hour = Math.floor((clickY / HOUR_H) + DAY_START);
                  onClickSlot(d, hour);
                }}
              />

              {/* Today line */}
              {isToday(d) && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: nowTop,
                  borderTop: '2px solid var(--bad)', zIndex: 3, pointerEvents: 'none',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bad)', marginTop: -5, marginLeft: -4 }} />
                </div>
              )}

              {/* Appointment blocks */}
              {appointments.map(a => (
                <ApptBlock key={`${a.id}-${di}`} appt={a} dayDate={d} onClick={onClickAppt} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Patients store (seed + locally created) ───────────────────────────────────

const CUSTOM_KEY = 'nexus_patients_custom';

function loadCustomPatients() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) ?? []; } catch { return []; }
}

function saveCustomPatients(list) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

function usePatientsStore() {
  const [custom, setCustom] = useState(loadCustomPatients);
  const all = [...SEED_PATIENTS, ...custom];

  const addPatient = (p) => {
    const next = [...custom, p];
    setCustom(next);
    saveCustomPatients(next);
    return p;
  };

  return { patients: all, addPatient };
}

// ── Patient picker combobox ───────────────────────────────────────────────────

const NEW_ID = '__new__';

function PatientPicker({ value, patientId, onChange, patients }) {
  const [query,    setQuery]    = useState(value ?? '');
  const [open,     setOpen]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPat,   setNewPat]   = useState({ name: '', dob: '', sex: 'M', mrn: '' });
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.mrn ?? '').toLowerCase().includes(query.toLowerCase()))
    : patients;

  const selectPatient = (p) => {
    setQuery(p.name);
    setOpen(false);
    setShowForm(false);
    onChange({ name: p.name, patientId: p.id });
  };

  const handleInput = (v) => {
    setQuery(v);
    setOpen(true);
    setShowForm(false);
    if (!v) onChange({ name: '', patientId: '' });
    else onChange({ name: v, patientId: '' });
  };

  const handleCreateNew = () => {
    setShowForm(true);
    setOpen(false);
    setNewPat(n => ({ ...n, name: query }));
  };

  const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          style={{ ...inputStyle, paddingRight: 28 }}
          value={query}
          placeholder="Search by name or MRN…"
          onChange={e => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {patientId && (
          <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
            <Icon name="check" size={13} style={{ color: 'var(--good)' }} />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {filtered.length === 0 && !query && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink-3)' }}>Start typing to search patients…</div>
          )}
          {filtered.map(p => (
            <div key={p.id} onMouseDown={() => selectPatient(p)} style={{
              padding: '8px 12px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
              borderBottom: '1px solid var(--border)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft)',
                color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{p.initials ?? p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {p.dob ? `DOB ${p.dob}` : ''}
                  {p.mrn ? ` · ${p.mrn}` : ''}
                  {p.sex ? ` · ${p.sex}` : ''}
                </div>
              </div>
              {p.id === patientId && <Icon name="check" size={13} style={{ color: 'var(--good)', flexShrink: 0 }} />}
            </div>
          ))}
          {filtered.length === 0 && query && (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--ink-3)' }}>No matches for "{query}"</div>
          )}
          <div onMouseDown={handleCreateNew} style={{
            padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--accent-ink)', fontSize: 13, fontWeight: 500,
            borderTop: filtered.length > 0 ? '1px solid var(--border)' : undefined,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="plus" size={13} />
            New patient{query ? `: "${query}"` : ''}
          </div>
        </div>
      )}

      {/* Inline new-patient form */}
      {showForm && (
        <div style={{
          marginTop: 8, padding: 12, border: '1px solid var(--accent)', borderRadius: 8,
          background: 'var(--accent-soft)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-ink)', marginBottom: 10 }}>New patient details</div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Full name *</label>
            <input style={inputStyle} value={newPat.name} onChange={e => setNewPat(n => ({ ...n, name: e.target.value }))} placeholder="e.g. J. Smith" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Date of birth</label>
              <input style={inputStyle} type="date" value={newPat.dob} onChange={e => setNewPat(n => ({ ...n, dob: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Sex</label>
              <select style={inputStyle} value={newPat.sex} onChange={e => setNewPat(n => ({ ...n, sex: e.target.value }))}>
                <option value="M">M</option><option value="F">F</option><option value="O">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>MRN</label>
              <input style={inputStyle} value={newPat.mrn} onChange={e => setNewPat(n => ({ ...n, mrn: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn" style={{ fontSize: 12 }} onClick={() => { setShowForm(false); }}>Cancel</button>
            <button className="btn btn-primary" style={{ fontSize: 12 }}
              onClick={() => {
                if (!newPat.name.trim()) return;
                const p = {
                  id: `PAT-C${Date.now()}`,
                  name: newPat.name.trim(),
                  initials: newPat.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
                  dob: newPat.dob || null,
                  sex: newPat.sex,
                  mrn: newPat.mrn || null,
                  studies: [],
                  status: 'active',
                };
                onChange({ name: p.name, patientId: p.id, newPatient: p });
                setQuery(p.name);
                setShowForm(false);
              }}
            >
              Add patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Auto-pick helpers ─────────────────────────────────────────────────────────

function roomsForType(rooms, type, siteIdVal) {
  return rooms.filter(r => {
    if (r.siteId !== siteIdVal) return false;
    if (type === 'hsat') return false;
    if (type === 'consult') return r.type === 'consult' || r.type === 'general';
    if (type === 'psg')     return r.type === 'psg'     || r.type === 'general';
    if (type === 'titration') return r.type === 'titration' || r.type === 'general';
    return false;
  });
}

function equipForType(equipment, type, siteIdVal) {
  const m = typeOf(type);
  if (!m.equipType) return [];
  return equipment.filter(e => e.type === m.equipType && e.site === siteIdVal);
}

function autoPick(type, siteIdVal, startStr, endStr, rooms, equipment, appointments, excludeId) {
  const freeRoom = roomsForType(rooms, type, siteIdVal).find(r =>
    !appointments.some(a => a.id !== excludeId && a.roomId === r.roomId && a.start < endStr && a.end > startStr)
  ) ?? roomsForType(rooms, type, siteIdVal)[0];

  const freeEquip = equipForType(equipment, type, siteIdVal).find(e =>
    !appointments.some(a => a.id !== excludeId && a.equipmentId === e.assetId && a.start < endStr && a.end > startStr)
  ) ?? equipForType(equipment, type, siteIdVal)[0];

  return { roomId: freeRoom?.roomId ?? '', equipmentId: freeEquip?.assetId ?? '' };
}

// ── Appointment form ──────────────────────────────────────────────────────────

function AppointmentForm({ appt, rooms, equipment, appointments, siteId, patients, addPatient, onSave, onDelete, onClose }) {
  const isNew = !appt?.id;
  const defType = appt?.type ?? 'psg';
  const defTypeMeta = typeOf(defType);

  const [form, setForm] = useState(() => {
    const today      = isoDate(new Date());
    const startH     = defTypeMeta.defaultStart;
    const endH       = startH + defTypeMeta.defaultDuration;
    const endDate    = endH >= 24 ? isoDate(addDays(new Date(), 1)) : today;
    const endHH      = endH >= 24 ? endH - 24 : endH;
    const initType   = appt?.type   ?? 'psg';
    const initSite   = appt?.siteId ?? siteId ?? 'RML';
    const startStr   = appt?.start  ?? `${today}T${String(startH).padStart(2,'0')}:00`;
    const endStr     = appt?.end    ?? `${endDate}T${String(endHH).padStart(2,'0')}:00`;

    const picked = !appt?.id
      ? autoPick(initType, initSite, startStr, endStr, rooms, equipment, appointments, null)
      : { roomId: appt.roomId ?? '', equipmentId: appt.equipmentId ?? '' };

    return {
      type:        initType,
      patientName: appt?.patientName ?? '',
      patientId:   appt?.patientId   ?? '',
      start:       startStr,
      end:         endStr,
      roomId:      picked.roomId,
      equipmentId: picked.equipmentId,
      physician:   appt?.physician   ?? '',
      technician:  appt?.technician  ?? '',
      notes:       appt?.notes       ?? '',
      status:      appt?.status      ?? 'scheduled',
      siteId:      initSite,
    };
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // If rooms/equipment weren't loaded when the form mounted, fill them once they arrive
  useEffect(() => {
    if (!isNew) return;
    setForm(f => {
      const picked = autoPick(f.type, f.siteId, f.start, f.end, rooms, equipment, appointments, null);
      const updates = {};
      if (!f.roomId      && picked.roomId)      updates.roomId      = picked.roomId;
      if (!f.equipmentId && picked.equipmentId) updates.equipmentId = picked.equipmentId;
      return Object.keys(updates).length ? { ...f, ...updates } : f;
    });
  }, [rooms.length, equipment.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const meta = typeOf(form.type);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onTypeChange = (newType) => {
    const m         = typeOf(newType);
    const startDate = form.start.slice(0, 10);
    const startH    = m.defaultStart;
    const endH      = startH + m.defaultDuration;
    const endDate   = endH >= 24 ? isoDate(addDays(new Date(startDate), 1)) : startDate;
    const endHH     = endH >= 24 ? endH - 24 : endH;
    const newStart  = `${startDate}T${String(startH).padStart(2,'0')}:00`;
    const newEnd    = `${endDate}T${String(endHH).padStart(2,'0')}:00`;
    const picked    = autoPick(newType, form.siteId, newStart, newEnd, rooms, equipment, appointments, appt?.id);
    setForm(f => ({ ...f, type: newType, start: newStart, end: newEnd, roomId: picked.roomId, equipmentId: picked.equipmentId }));
  };

  // Conflict check: room double-booking
  const roomConflict = form.roomId ? appointments.filter(a =>
    a.id !== appt?.id && a.roomId === form.roomId &&
    a.start < form.end && a.end > form.start
  ) : [];

  const equipConflict = form.equipmentId ? appointments.filter(a =>
    a.id !== appt?.id && a.equipmentId === form.equipmentId &&
    a.start < form.end && a.end > form.start
  ) : [];

  const relevantRooms = roomsForType(rooms, form.type, form.siteId);
  const relevantEquip = equipForType(equipment, form.type, form.siteId);

  const handleSave = async () => {
    if (!form.patientName.trim()) { setError('Patient name is required.'); return; }
    if (!form.start || !form.end)  { setError('Start and end times are required.'); return; }
    if (form.end <= form.start)    { setError('End time must be after start time.'); return; }
    setSaving(true); setError('');
    try {
      await onSave(form);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 };
  const fieldStyle = { marginBottom: 14 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
        <div style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{isNew ? 'New appointment' : 'Edit appointment'}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><Icon name="x" size={16} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
        {/* Type */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Appointment type</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {APPT_TYPES.map(t => (
              <button key={t.id} onClick={() => onTypeChange(t.id)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: `1.5px solid ${form.type === t.id ? t.color : 'var(--border)'}`,
                background: form.type === t.id ? t.bg : 'var(--surface)',
                color: form.type === t.id ? t.color : 'var(--ink-3)',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Patient */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Patient</label>
          <PatientPicker
            value={form.patientName}
            patientId={form.patientId}
            patients={patients}
            onChange={({ name, patientId, newPatient }) => {
              set('patientName', name);
              set('patientId', patientId ?? '');
              if (newPatient) addPatient(newPatient);
            }}
          />
        </div>

        {/* Site */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Site</label>
          <select style={inputStyle} value={form.siteId} onChange={e => {
            const newSite = e.target.value;
            const picked = autoPick(form.type, newSite, form.start, form.end, rooms, equipment, appointments, appt?.id);
            setForm(f => ({ ...f, siteId: newSite, roomId: picked.roomId, equipmentId: picked.equipmentId }));
          }}>
            <option value="RML">Riverside Main Lab</option>
            <option value="EPL">Eastside Paediatric Lab</option>
            <option value="HSN">Home Service – North</option>
          </select>
        </div>

        {/* Date/Time row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, ...fieldStyle }}>
          <div>
            <label style={labelStyle}>Start</label>
            <input style={inputStyle} type="datetime-local" value={form.start} onChange={e => set('start', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>End</label>
            <input style={inputStyle} type="datetime-local" value={form.end} onChange={e => set('end', e.target.value)} />
          </div>
        </div>

        {/* Room */}
        {form.type !== 'hsat' && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Room</label>
            <select style={inputStyle} value={form.roomId} onChange={e => set('roomId', e.target.value)}>
              <option value="">— No room —</option>
              {relevantRooms.map(r => (
                <option key={r.id} value={r.roomId}>{r.name} ({r.type})</option>
              ))}
            </select>
            {roomConflict.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--bad)', marginTop: 4 }}>
                Conflict: {roomConflict.map(a => a.patientName).join(', ')} already in this room
              </div>
            )}
          </div>
        )}

        {/* Equipment */}
        {meta.equipType && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Equipment</label>
            <select style={inputStyle} value={form.equipmentId} onChange={e => set('equipmentId', e.target.value)}>
              <option value="">— No equipment —</option>
              {relevantEquip.map(e => (
                <option key={e.id} value={e.assetId}>{e.name} ({e.assetId}){e.verifyStatus === 'bad' ? ' ⚠ overdue' : ''}</option>
              ))}
            </select>
            {equipConflict.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--bad)', marginTop: 4 }}>
                Conflict: {equipConflict.map(a => a.patientName).join(', ')} already using this equipment
              </div>
            )}
          </div>
        )}

        {/* HSAT address */}
        {form.type === 'hsat' && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Patient address / notes</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. 14 River St, Northside. Deliver and set up device." />
          </div>
        )}

        {/* Physician + Technician */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, ...fieldStyle }}>
          <div>
            <label style={labelStyle}>Physician</label>
            <input style={inputStyle} value={form.physician} onChange={e => set('physician', e.target.value)} placeholder="Dr. Name" />
          </div>
          <div>
            <label style={labelStyle}>Technician</label>
            <input style={inputStyle} value={form.technician} onChange={e => set('technician', e.target.value)} placeholder="Name" />
          </div>
        </div>

        {/* Status */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Notes (non-HSAT) */}
        {form.type !== 'hsat' && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" />
          </div>
        )}

        {error && <div style={{ fontSize: 12, color: 'var(--bad)', marginBottom: 10 }}>{error}</div>}
      </div>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        {!isNew && (
          <button className="btn" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}
            onClick={() => onDelete(appt.id)}>
            <Icon name="x" size={13} />Delete
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Book appointment' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
      {APPT_TYPES.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-2)' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color }} />
          {t.label}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const SchedulerPage = () => {
  const { siteId } = useLocation();
  const { data }   = useNexusData();
  const { user }   = useAuth();
  const { patients, addPatient } = usePatientsStore();

  const [weekStart,  setWeekStart]  = useState(() => weekMonday(new Date()));
  const [appts,      setAppts]      = useState([]);
  const [rooms,      setRooms]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing,    setEditing]    = useState(null);   // null = new
  const [prefillSlot, setPrefillSlot] = useState(null); // { date, hour }

  const weekEnd  = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Active site filter — if global is 'all' default to RML for scheduler
  const activeSite = siteId === 'all' ? null : siteId;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([
        fetchAppointments(activeSite, isoDate(addDays(weekStart, -1)), isoDate(addDays(weekEnd, 1))),
        fetchRooms(null),
      ]);
      setAppts(a ?? []);
      setRooms(r ?? []);
    } catch { /* handled by api.js */ }
    setLoading(false);
  }, [weekStart, activeSite]);

  useEffect(() => { loadData(); }, [loadData]);

  const goWeek = (delta) => setWeekStart(w => addDays(w, delta * 7));

  const openNew = (date, hour) => {
    setEditing(null);
    setPrefillSlot({ date, hour });
    setDrawerOpen(true);
  };

  const openEdit = (appt) => {
    setEditing(appt);
    setPrefillSlot(null);
    setDrawerOpen(true);
  };

  const handleSave = async (form) => {
    if (editing) {
      await updateAppointment(editing.id, form);
    } else {
      await createAppointment(form);
    }
    setDrawerOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    await deleteAppointment(id);
    setDrawerOpen(false);
    loadData();
  };


  // Equipment from global data, filtered to relevant site
  const EQUIP_SITE_MAP = {
    'Riverside Main': 'RML', 'Riverside Main Lab': 'RML',
    'Eastside Paed.': 'EPL', 'Eastside Paediatric Lab': 'EPL',
    'Home Service N.': 'HSN', 'Home Service – North': 'HSN',
  };
  const allEquipment = (data?.equipment ?? []).map(e => ({
    id: e.id, assetId: e.id, name: e.name, type: e.type,
    site: EQUIP_SITE_MAP[e.site] ?? e.site,
    verifyStatus: e.verifyStatus,
  }));

  // Appointments visible in this week
  const fromIso = isoDate(addDays(weekStart, -1));
  const toIso   = isoDate(addDays(weekEnd, 1));
  const visibleAppts = appts.filter(a => {
    if (activeSite && a.siteId !== activeSite) return false;
    return a.start <= toIso + 'T23:59' && a.end >= fromIso + 'T00:00';
  });

  // Prefill start time for new appointment
  const prefillStart = prefillSlot
    ? `${isoDate(prefillSlot.date)}T${String(prefillSlot.hour).padStart(2, '0')}:00`
    : undefined;

  const editingWithPrefill = editing ?? (prefillSlot ? {
    start: prefillStart,
    siteId: activeSite ?? 'RML',
  } : null);

  const fmtWeekRange = () => {
    const opts = { day: 'numeric', month: 'short' };
    return `${weekStart.toLocaleDateString('en-AU', opts)} – ${weekEnd.toLocaleDateString('en-AU', { ...opts, year: 'numeric' })}`;
  };

  const roomsForSite = rooms.filter(r => !activeSite || r.siteId === activeSite);

  return (
    <div className="page page-wide">
      <PageHeader
        title="Scheduler"
        subtitle={fmtWeekRange()}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Legend />
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div style={{ display: 'flex', gap: 2 }}>
              <button className="btn" style={{ padding: '5px 9px' }} onClick={() => goWeek(-1)} title="Previous week"><Icon name="chev_left" size={14} /></button>
              <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setWeekStart(weekMonday(new Date()))}>Today</button>
              <button className="btn" style={{ padding: '5px 9px' }} onClick={() => goWeek(1)}  title="Next week"><Icon name="chev_right" size={14} /></button>
            </div>
            <button className="btn btn-primary" onClick={() => openNew(new Date(), 9)}>
              <Icon name="plus" size={14} />New appointment
            </button>
          </div>
        }
      />

      {/* Site filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { id: null,  label: 'All sites' },
          { id: 'RML', label: 'Riverside Main' },
          { id: 'EPL', label: 'Eastside Paed.' },
          { id: 'HSN', label: 'Home Service N.' },
        ].map(s => (
          <div key={s.id ?? 'all'} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'default',
            border: `1.5px solid ${activeSite === s.id ? 'var(--accent)' : 'var(--border)'}`,
            background: activeSite === s.id ? 'var(--accent-soft)' : 'var(--surface)',
            color: activeSite === s.id ? 'var(--accent-ink)' : 'var(--ink-2)',
          }}>
            {s.label}
            {/* appointment count badge */}
            {appts.filter(a => (s.id ? a.siteId === s.id : true) && a.start >= isoDate(weekStart) && a.start <= isoDate(weekEnd) + 'T23:59').length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--surface-3)', borderRadius: 8, padding: '1px 5px' }}>
                {appts.filter(a => (s.id ? a.siteId === s.id : true) && a.start >= isoDate(weekStart) && a.start <= isoDate(weekEnd) + 'T23:59').length}
              </span>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', height: 300, fontSize: 13, color: 'var(--ink-3)' }}>Loading schedule…</div>
      ) : (
        <WeekCalendar
          weekDays={weekDays}
          appointments={visibleAppts}
          onClickSlot={openNew}
          onClickAppt={openEdit}
        />
      )}

      {/* Appointment form drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <AppointmentForm
          key={editing?.id ?? 'new'}
          appt={editing ? editing : prefillSlot ? { start: prefillStart, siteId: activeSite ?? 'RML' } : null}
          rooms={rooms}
          equipment={allEquipment}
          appointments={appts}
          siteId={activeSite ?? 'RML'}
          patients={patients}
          addPatient={addPatient}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

    </div>
  );
};

export default SchedulerPage;
