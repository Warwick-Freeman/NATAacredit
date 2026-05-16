import React, { useState } from 'react';
import Icon from './icons';
import { Pill } from './components';
import { useAuth } from './AuthContext';
import { useTaskContext } from './TaskContext';

const STATUS_KIND = { 'In service': 'good', 'Quarantined': 'bad', 'Loan / out': 'warn', 'Decommissioned': 'outline' };
const RESULT_KIND = { Pass: 'good', 'Conditional pass': 'warn', Fail: 'bad' };

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
};

function addMonths(iso, n) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function verifyStatus(nextVerify) {
  const diff = (new Date(nextVerify) - new Date()) / 86400000;
  if (diff < 0)   return 'bad';
  if (diff < 30)  return 'warn';
  return 'good';
}

// ── FRM-005 channel definitions ───────────────────────────────────────────────

const ALL_CHANNELS = [
  { id: 'eeg_gain',        label: 'EEG gain',            method: '50 μV square wave',    expected: '5 mm ±10%',       unit: 'mm'       },
  { id: 'eog_gain',        label: 'EOG gain',            method: '50 μV square wave',    expected: '5 mm ±10%',       unit: 'mm'       },
  { id: 'chin_emg',        label: 'Chin EMG gain',       method: '50 μV square wave',    expected: '5 mm ±10%',       unit: 'mm'       },
  { id: 'eeg_filter',      label: 'EEG filter response', method: '0.3–35 Hz sweep',      expected: '±3 dB',           unit: 'dB'       },
  { id: 'spo2',            label: 'SpO₂ simulator',      method: 'R-Cal simulator',      expected: '±2%',             unit: '%'        },
  { id: 'pap_pressure',    label: 'PAP pressure',        method: 'Reference manometer',  expected: '±0.5 cmH₂O',     unit: 'cmH₂O'   },
  { id: 'sound_level',     label: 'Sound level',         method: '94 dB reference',      expected: '94 ±2 dB',        unit: 'dB'       },
  { id: 'position_sensor', label: 'Position sensor',     method: '4-position rotation',  expected: '4/4 correct',     unit: 'positions'},
  { id: 'microphone',      label: 'Microphone',          method: 'Test tone playback',   expected: 'Signal detected', unit: ''         },
  { id: 'video_sync',      label: 'Video sync',          method: 'Clap-marker test',     expected: '<1 s offset',     unit: 's'        },
];

const CHANNEL_IDS_BY_TYPE = {
  'PSG Amplifier':       ['eeg_gain', 'eog_gain', 'chin_emg', 'eeg_filter', 'spo2'],
  'Oximeter':            ['spo2'],
  'CPAP':                ['pap_pressure'],
  'BiPAP':               ['pap_pressure'],
  'PAP Device':          ['pap_pressure'],
  'Sound Level Meter':   ['sound_level', 'microphone'],
  'Body Position Monitor': ['position_sensor'],
  'Video System':        ['video_sync'],
};

function getChannelDefs(type) {
  if (!type) return [];
  const key = Object.keys(CHANNEL_IDS_BY_TYPE).find(k => type.toLowerCase().includes(k.toLowerCase()));
  if (key) {
    const ids = CHANNEL_IDS_BY_TYPE[key];
    return ALL_CHANNELS.filter(c => ids.includes(c.id));
  }
  if (/psg|amplifier/i.test(type)) return ALL_CHANNELS.filter(c => ['eeg_gain','eog_gain','chin_emg','eeg_filter','spo2'].includes(c.id));
  if (/oxi|spo2/i.test(type))      return ALL_CHANNELS.filter(c => c.id === 'spo2');
  if (/cpap|bipap|pap|pressure/i.test(type)) return ALL_CHANNELS.filter(c => c.id === 'pap_pressure');
  if (/sound/i.test(type))         return ALL_CHANNELS.filter(c => ['sound_level','microphone'].includes(c.id));
  if (/position/i.test(type))      return ALL_CHANNELS.filter(c => c.id === 'position_sensor');
  if (/video/i.test(type))         return ALL_CHANNELS.filter(c => c.id === 'video_sync');
  return [];
}

function initChannels(eq) {
  return getChannelDefs(eq.type).map(c => ({ ...c, measured: '', pass: 'Pass' }));
}

function deriveOverallResult(channels) {
  if (channels.some(c => c.pass === 'Fail'))    return 'Fail';
  if (channels.some(c => c.pass === 'Conditional pass')) return 'Conditional pass';
  return 'Pass';
}

// ── Channel history table (collapsed in history cards) ────────────────────────

const ChannelTable = ({ channels }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 10 }}>
    <thead>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        {['Channel', 'Expected', 'Measured', 'Result'].map(h => (
          <th key={h} style={{ textAlign: 'left', padding: '3px 6px', color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {channels.map((c, i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--border-faint, var(--border))' }}>
          <td style={{ padding: '3px 6px', fontWeight: 500 }}>{c.label}</td>
          <td style={{ padding: '3px 6px', color: 'var(--ink-3)' }}>{c.expected}</td>
          <td style={{ padding: '3px 6px' }}>{c.measured || '—'}{c.measured && c.unit ? ` ${c.unit}` : ''}</td>
          <td style={{ padding: '3px 6px' }}>
            <span style={{ color: c.pass === 'Fail' ? 'var(--bad)' : c.pass === 'Conditional pass' ? 'var(--warn)' : 'var(--good)', fontWeight: 600 }}>
              {c.pass === 'Conditional pass' ? 'Cond.' : c.pass}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ── History card ──────────────────────────────────────────────────────────────

const HistoryCard = ({ v }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChannels = v.channels && v.channels.length > 0;
  const color = v.result === 'Fail' ? 'bad' : v.result === 'Conditional pass' ? 'warn' : 'good';
  return (
    <div style={{
      padding: '10px 12px',
      background: `var(--${color}-soft)`,
      borderRadius: 8,
      borderLeft: `3px solid var(--${color})`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtDate(v.date)}</span>
        <Pill kind={RESULT_KIND[v.result] || 'outline'}>{v.result}</Pill>
        {v.ncRef && <span className="mono" style={{ fontSize: 10, color: 'var(--bad)', background: 'var(--bad-soft)', borderRadius: 4, padding: '1px 5px' }}>{v.ncRef}</span>}
        <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 'auto' }}>{v.by}</span>
        {hasChannels && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: 'var(--ink-3)', fontSize: 11 }}>
            {expanded ? 'Hide checks' : 'View checks'}
          </button>
        )}
      </div>
      {v.notes && <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: expanded ? 4 : 0 }}>{v.notes}</div>}
      {expanded && hasChannels && <ChannelTable channels={v.channels} />}
    </div>
  );
};

// ── Main drawer ───────────────────────────────────────────────────────────────

const HST_STATUS_KIND = { 'Available': 'good', 'Dispatched': 'warn', 'Quarantined': 'bad' };

const EquipmentDetailDrawer = ({ eq, onUpdate, onClose, onOpenHstDispatch, onOpenHstReturn }) => {
  const { user } = useAuth();
  const { openCreateTask } = useTaskContext();
  const [showRecord, setShowRecord] = useState(eq.verifyStatus === 'bad');
  const [record, setRecord] = useState({
    date:     new Date().toISOString().slice(0, 10),
    by:       user?.name || '',
    result:   'Pass',
    notes:    '',
    ncRef:    '',
    channels: initChannels(eq),
  });

  const setRec = (k, v) => setRecord(r => ({ ...r, [k]: v }));

  const setChannel = (idx, field, value) => {
    setRecord(r => {
      const channels = r.channels.map((c, i) => i === idx ? { ...c, [field]: value } : c);
      const result = channels.length > 0 ? deriveOverallResult(channels) : r.result;
      return { ...r, channels, result };
    });
  };

  const submitVerification = () => {
    if (!record.date || !record.result) return;
    const nextVerify = addMonths(record.date, eq.verifyInterval);
    const newEntry   = {
      date:     record.date,
      by:       record.by,
      result:   record.result,
      notes:    record.notes,
      ncRef:    record.ncRef || null,
      channels: record.channels.length > 0 ? record.channels : undefined,
    };
    const newStatus  = record.result === 'Fail' ? 'Quarantined'
                     : eq.status === 'Quarantined' ? 'In service'
                     : eq.status;
    onUpdate({
      ...eq,
      lastVerify:          record.date,
      nextVerify,
      verifyStatus:        record.result === 'Fail' ? 'bad' : verifyStatus(nextVerify),
      status:              newStatus,
      verificationHistory: [newEntry, ...(eq.verificationHistory || [])],
    });
    setShowRecord(false);
    setRecord({
      date: new Date().toISOString().slice(0, 10),
      by: user?.name || '',
      result: 'Pass',
      notes: '',
      ncRef: '',
      channels: initChannels(eq),
    });
  };

  const toggleQuarantine = () => {
    const next = eq.status === 'Quarantined' ? 'In service' : 'Quarantined';
    onUpdate({ ...eq, status: next, verifyStatus: next === 'Quarantined' ? 'bad' : verifyStatus(eq.nextVerify) });
  };

  const diffDays = Math.round((new Date(eq.nextVerify) - new Date()) / 86400000);
  const overdueBy = diffDays < 0 ? Math.abs(diffDays) : 0;
  const hasChannels = record.channels.length > 0;
  const needsNcRef  = record.result === 'Fail' || record.result === 'Conditional pass';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="drawer-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Equipment · cl. 5.3</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{eq.id}</span>
            <Pill kind={STATUS_KIND[eq.status] || 'outline'} dot>{eq.status}</Pill>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {eq.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{eq.manufacturer} {eq.model}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
          {eq.status !== 'Decommissioned' && (
            <button className="btn" style={{ fontSize: 11, padding: '3px 8px', whiteSpace: 'nowrap' }}
              onClick={() => openCreateTask({
                title: `Re-verify ${eq.id} — ${eq.name}`,
                clause: '5.3.4',
                source: eq.id,
                sourceType: 'equipment',
                priority: eq.verifyStatus === 'bad' ? 'critical' : 'high',
              })}>
              <Icon name="plus" size={11} />Schedule task
            </button>
          )}
        </div>
      </div>

      {/* Verification status banner */}
      {eq.verifyStatus !== 'good' && (
        <div style={{
          padding: '10px 22px',
          background: eq.verifyStatus === 'bad' ? 'var(--bad-soft)' : 'var(--warn-soft)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="alert" size={15} style={{ color: eq.verifyStatus === 'bad' ? 'var(--bad)' : 'var(--warn)', flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: eq.verifyStatus === 'bad' ? 'var(--bad)' : 'var(--warn)', fontWeight: 500 }}>
            {eq.verifyStatus === 'bad'
              ? `Verification overdue by ${overdueBy} day${overdueBy !== 1 ? 's' : ''}`
              : `Verification due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`}
          </div>
          <button className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 10px' }}
            onClick={() => setShowRecord(true)}>
            Record now
          </button>
        </div>
      )}

      <div className="drawer-body">
        {/* Metadata grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20 }}>
          {[
            ['Type',              eq.type],
            ['Site',              eq.site],
            ['Serial',            eq.serial],
            ['ARTG',              eq.artg],
            ['Purchase date',     fmtDate(eq.purchaseDate)],
            ['Verify interval',   `${eq.verifyInterval} months`],
            ['Last verified',     fmtDate(eq.lastVerify)],
            ['Next verification', fmtDate(eq.nextVerify)],
            ['Next maintenance',  fmtDate(eq.nextMaint)],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>{v || '—'}</div>
            </div>
          ))}
        </div>

        {eq.notes && (
          <div style={{ padding: '10px 12px', background: 'var(--warn-soft)', borderRadius: 8, fontSize: 12, marginBottom: 20, color: 'var(--warn)' }}>
            <strong>Note: </strong>{eq.notes}
          </div>
        )}

        {/* HST workflow section */}
        {eq.hstEnabled && (() => {
          const activeDispatch = eq.hstStatus === 'Dispatched'
            ? (eq.hstHistory ?? []).find(h => h.type === 'dispatch')
            : null;
          return (
            <div style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Icon name="truck" size={13} style={{ color: 'var(--ink-3)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>Home sleep testing</span>
                <Pill kind={HST_STATUS_KIND[eq.hstStatus] ?? 'outline'} dot>{eq.hstStatus ?? 'Available'}</Pill>
              </div>
              {activeDispatch ? (
                <div style={{ fontSize: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{activeDispatch.patient?.name}</div>
                  <div style={{ color: 'var(--ink-3)', marginBottom: 2 }}>
                    {activeDispatch.patient?.studyRef} · {[activeDispatch.address?.suburb, activeDispatch.address?.state].filter(Boolean).join(', ')}
                  </div>
                  <div style={{ color: 'var(--ink-3)', marginBottom: 2 }}>
                    <span style={{ textTransform: 'uppercase' }}>{activeDispatch.courier}</span> · <span className="mono">{activeDispatch.trackingNumber}</span>
                  </div>
                  {activeDispatch.returnBy && (
                    <div style={{ color: new Date(activeDispatch.returnBy) < new Date() ? 'var(--bad)' : 'var(--ink-3)' }}>
                      Return by {fmtDate(activeDispatch.returnBy)}
                      {new Date(activeDispatch.returnBy) < new Date() && ' — overdue'}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
                  {eq.hstStatus === 'Available' ? 'Ready to dispatch to a patient.' : 'Not available for dispatch.'}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {eq.hstStatus === 'Available' && eq.status !== 'Quarantined' && onOpenHstDispatch && (
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: 11 }} onClick={onOpenHstDispatch}>
                    <Icon name="send" size={11} />Dispatch to patient
                  </button>
                )}
                {eq.hstStatus === 'Dispatched' && onOpenHstReturn && (
                  <button className="btn" style={{ flex: 1, fontSize: 11 }} onClick={onOpenHstReturn}>
                    <Icon name="rotate_ccw" size={11} />Record return
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => setShowRecord(v => !v)}>
            <Icon name="check" size={13} />Record verification
          </button>
          <button
            className={`btn${eq.status === 'Quarantined' ? ' btn-primary' : ''}`}
            onClick={toggleQuarantine}
            title={eq.status === 'Quarantined' ? 'Return to service' : 'Quarantine device'}>
            <Icon name="alert" size={13} />
            {eq.status === 'Quarantined' ? 'Return to service' : 'Quarantine'}
          </button>
        </div>

        {/* Record verification form */}
        {showRecord && (
          <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
              Record verification — {eq.id}
            </div>

            {/* Date + Performed by */}
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={record.date}
                  onChange={e => setRec('date', e.target.value)} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Performed by</label>
                <input className="form-input" value={record.by}
                  onChange={e => setRec('by', e.target.value)} placeholder="Name" />
              </div>
            </div>

            {/* Channel checks table (FRM-005) */}
            {hasChannels && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Channel checks (FRM-005)
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-3)' }}>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: 'var(--ink-2)', width: '28%' }}>Channel</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: 'var(--ink-2)', width: '22%' }}>Expected</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: 'var(--ink-2)', width: '22%' }}>Measured</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: 'var(--ink-2)', width: '28%' }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.channels.map((ch, i) => (
                        <tr key={ch.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 500 }}>
                            {ch.label}
                            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>{ch.method}</div>
                          </td>
                          <td style={{ padding: '6px 10px', color: 'var(--ink-3)' }}>{ch.expected}</td>
                          <td style={{ padding: '4px 6px' }}>
                            <input
                              className="form-input"
                              value={ch.measured}
                              onChange={e => setChannel(i, 'measured', e.target.value)}
                              placeholder={ch.unit || '—'}
                              style={{ fontSize: 11, padding: '4px 7px', margin: 0 }}
                            />
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            <select
                              className="form-input"
                              value={ch.pass}
                              onChange={e => setChannel(i, 'pass', e.target.value)}
                              style={{
                                fontSize: 11, padding: '4px 7px', margin: 0,
                                color: ch.pass === 'Fail' ? 'var(--bad)' : ch.pass === 'Conditional pass' ? 'var(--warn)' : 'var(--good)',
                                fontWeight: 600,
                              }}>
                              <option value="Pass">Pass</option>
                              <option value="Conditional pass">Conditional pass</option>
                              <option value="Fail">Fail</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                  Overall result is derived automatically from channel results.
                </div>
              </div>
            )}

            {/* Overall result (manual when no channels, derived when channels present) */}
            {!hasChannels && (
              <div className="form-field">
                <label className="form-label">Result</label>
                <select className="form-input" value={record.result} onChange={e => setRec('result', e.target.value)}>
                  <option>Pass</option>
                  <option>Conditional pass</option>
                  <option>Fail</option>
                </select>
              </div>
            )}

            {/* Derived result display */}
            {hasChannels && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Overall result:</span>
                <Pill kind={RESULT_KIND[record.result] || 'outline'}>{record.result}</Pill>
              </div>
            )}

            {/* NC reference (when result not Pass) */}
            {needsNcRef && (
              <div className="form-field">
                <label className="form-label">NC / CAPA reference {record.result === 'Fail' ? '(required)' : '(optional)'}</label>
                <input className="form-input" value={record.ncRef}
                  onChange={e => setRec('ncRef', e.target.value)}
                  placeholder="e.g. NC-2026-014" />
              </div>
            )}

            <div className="form-field">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={record.notes}
                onChange={e => setRec('notes', e.target.value)}
                placeholder="Observations, calibrator used, corrective action taken…"
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }} />
            </div>

            {record.result === 'Fail' && (
              <div style={{ fontSize: 11, color: 'var(--bad)', marginBottom: 10, padding: '6px 8px', background: 'var(--bad-soft)', borderRadius: 6 }}>
                A Fail result will automatically quarantine this device.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitVerification}
                disabled={record.result === 'Fail' && !record.ncRef}>
                Save verification record
              </button>
              <button className="btn" onClick={() => setShowRecord(false)}>Cancel</button>
            </div>
            {record.result === 'Fail' && !record.ncRef && (
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 6, textAlign: 'center' }}>
                Enter an NC reference number to save a Fail result.
              </div>
            )}
          </div>
        )}

        {/* Verification history */}
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={13} />Verification history
        </div>
        {(eq.verificationHistory || []).length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '10px 0' }}>No verification records yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(eq.verificationHistory || []).map((v, i) => (
              <HistoryCard key={i} v={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentDetailDrawer;
