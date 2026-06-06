import React, { useState } from 'react';
import Icon from './icons';
import { Pill } from './components';
import { useAuth } from './AuthContext';
import { COURIERS, createShipment, generateLabelHtml } from './courier-api';

const SENDER = {
  name:     'Riverside Sleep & Respiratory',
  line1:    '14 Medical Drive',
  line2:    '',
  suburb:   'Riverside',
  state:    'VIC',
  postcode: '3000',
  phone:    '(03) 9456 7890',
};

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const fmtDate = iso => iso
  ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ── Dispatch Drawer ───────────────────────────────────────────────────────────

export const HstDispatchDrawer = ({ eq, onUpdate, onClose, patients = [] }) => {
  const { user } = useAuth();
  const [step,      setStep]      = useState('form'); // 'form' | 'label'
  const [patient,   setPatient]   = useState({ name: '', dob: '', phone: '', studyRef: '' });
  const [address,   setAddress]   = useState({ line1: '', line2: '', suburb: '', state: 'VIC', postcode: '' });
  const [patSearch, setPatSearch] = useState('');
  const [patDropOpen, setPatDropOpen] = useState(false);
  const [courierId, setCourierId] = useState('auspost');
  const [service,   setService]   = useState(COURIERS[0].services[0]);
  const [returnBy,  setReturnBy]  = useState(addDays(7));
  const [notes,     setNotes]     = useState('');
  const [tracking,  setTracking]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const courier    = COURIERS.find(c => c.id === courierId) ?? COURIERS[0];
  const setPat     = (k, v) => setPatient(p => ({ ...p, [k]: v }));

  const patResults = patSearch.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(patSearch.toLowerCase()) || p.mrn.toLowerCase().includes(patSearch.toLowerCase()))
    : patients;

  function selectPatient(p) {
    const latestHsat = (p.studies ?? []).slice().reverse().find(s => s.startsWith('HSAT'));
    setPatient({
      name: p.name,
      dob: p.dob ?? '',
      phone: p.contact?.phone ?? '',
      studyRef: latestHsat ?? '',
    });
    if (p.contact?.address) {
      setAddress({
        line1: p.contact.address.line1 ?? '',
        line2: p.contact.address.line2 ?? '',
        suburb: p.contact.address.suburb ?? '',
        state: p.contact.address.state || 'VIC',
        postcode: p.contact.address.postcode ?? '',
      });
    }
    setPatSearch(p.name);
    setPatDropOpen(false);
  }
  const setAddr    = (k, v) => setAddress(a => ({ ...a, [k]: v }));
  const missing = [
    !patient.name.trim()    && 'Patient name',
    !address.line1.trim()   && 'Street address',
    !address.suburb.trim()  && 'Suburb',
    !address.postcode.trim()&& 'Postcode',
  ].filter(Boolean);

  const handleGenerateLabel = async () => {
    if (missing.length > 0) {
      setError('Please fill in: ' + missing.join(', '));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await createShipment({ courierId, service, sender: SENDER, recipient: { ...patient, ...address }, reference: patient.studyRef });
      setTracking(result);
      setStep('label');
    } catch (e) {
      setError('Could not generate labels: ' + (e?.message ?? 'unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const printLabel = (isReturn = false) => {
    const html = generateLabelHtml({ courierId, service, sender: SENDER, recipient: { ...patient, ...address }, tracking, returnBy, reference: patient.studyRef, deviceId: eq.id, isReturn });
    const w = window.open('', '_blank', 'width=520,height=760,scrollbars=no,toolbar=no');
    w.document.write(html);
    w.document.close();
  };

  const handleConfirmDispatch = () => {
    const entry = {
      type: 'dispatch',
      date: new Date().toISOString().slice(0, 10),
      by:   user?.name ?? '',
      patient: { ...patient },
      address: { ...address },
      courier: courierId,
      service,
      trackingNumber:       tracking.trackingNumber,
      returnTrackingNumber: tracking.returnTrackingNumber,
      estimatedDelivery:    tracking.estimatedDelivery,
      returnBy,
      notes,
    };
    onUpdate({
      ...eq,
      status:     'Loan / out',
      hstStatus:  'Dispatched',
      hstHistory: [entry, ...(eq.hstHistory ?? [])],
    });
    onClose();
  };

  const stepDone = step === 'label';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="drawer-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>HST Dispatch · {eq.id}</div>
          <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{eq.manufacturer} {eq.model} · S/N {eq.serial}</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', gap: 0 }}>
        {[['form', '1', 'Patient & courier'], ['label', '2', 'Print & confirm']].map(([s, n, label], i) => (
          <React.Fragment key={s}>
            {i > 0 && <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 10px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
                background: step === s ? 'var(--accent)' : (s === 'form' && stepDone) ? 'var(--good)' : 'var(--surface-3)',
                color:      step === s ? '#fff'          : (s === 'form' && stepDone) ? '#fff' : 'var(--ink-3)',
              }}>
                {s === 'form' && stepDone ? '✓' : n}
              </div>
              <span style={{ fontSize: 11, fontWeight: step === s ? 600 : 400, color: step === s ? 'var(--ink)' : 'var(--ink-3)' }}>{label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="drawer-body">

        {/* ── STEP 1: form ── */}
        {step === 'form' && (<>

          {patients.length > 0 && (
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label className="form-label" style={{ marginBottom: 4 }}>Search patient record</label>
              <input
                className="form-input"
                placeholder="Name or MRN…"
                value={patSearch}
                onChange={e => { setPatSearch(e.target.value); setPatDropOpen(true); }}
                onFocus={() => setPatDropOpen(true)}
                onBlur={() => setTimeout(() => setPatDropOpen(false), 150)}
                style={{ paddingLeft: 30 }}
              />
              <Icon name="search" size={13} style={{ position: 'absolute', left: 9, top: 28, color: 'var(--ink-3)', pointerEvents: 'none' }} />
              {patDropOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto' }}>
                  {patResults.length === 0 && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink-3)' }}>No patients found</div>
                  )}
                  {patResults.map(p => (
                    <div key={p.id} onMouseDown={() => selectPatient(p)}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}
                      className="row-clickable">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.mrn} · {p.site}</div>
                      </div>
                      {p.contact?.address?.suburb && (
                        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{p.contact.address.suburb} {p.contact.address.postcode}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="user_plus" size={13} />Patient details
          </div>

          <div className="form-row">
            <div className="form-field" style={{ flex: 2 }}>
              <label className="form-label">Patient name <span style={{ color: 'var(--bad)' }}>*</span></label>
              <input className="form-input" value={patient.name} onChange={e => setPat('name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Date of birth</label>
              <input className="form-input" type="date" value={patient.dob} onChange={e => setPat('dob', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Phone</label>
              <input className="form-input" value={patient.phone} onChange={e => setPat('phone', e.target.value)} placeholder="04xx xxx xxx" />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Study reference</label>
              <input className="form-input" value={patient.studyRef} onChange={e => setPat('studyRef', e.target.value)} placeholder="HST-2026-XXXX" />
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, margin: '14px 0 10px', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="map_pin" size={13} />Delivery address <span style={{ color: 'var(--bad)', fontWeight: 400, fontSize: 11 }}>*</span>
          </div>

          <div className="form-field">
            <label className="form-label">Street address</label>
            <input className="form-input" value={address.line1} onChange={e => setAddr('line1', e.target.value)} placeholder="Street number and name" />
          </div>
          <div className="form-field">
            <label className="form-label">Unit / apartment (optional)</label>
            <input className="form-input" value={address.line2} onChange={e => setAddr('line2', e.target.value)} placeholder="Unit 2, Level 3, etc." />
          </div>
          <div className="form-row">
            <div className="form-field" style={{ flex: 2 }}>
              <label className="form-label">Suburb</label>
              <input className="form-input" value={address.suburb} onChange={e => setAddr('suburb', e.target.value)} placeholder="Suburb" />
            </div>
            <div className="form-field" style={{ flex: '0 0 80px' }}>
              <label className="form-label">State</label>
              <select className="form-input" value={address.state} onChange={e => setAddr('state', e.target.value)}>
                {AU_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ flex: '0 0 90px' }}>
              <label className="form-label">Postcode</label>
              <input className="form-input" value={address.postcode} onChange={e => setAddr('postcode', e.target.value)} placeholder="3000" maxLength={4} />
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, margin: '14px 0 10px', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="truck" size={13} />Courier & service
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {COURIERS.map(c => (
              <div key={c.id}
                onClick={() => { setCourierId(c.id); setService(c.services[0]); }}
                style={{
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${courierId === c.id ? c.color : 'var(--border)'}`,
                  background: courierId === c.id ? `${c.color}18` : 'var(--surface)',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.12s',
                }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: courierId === c.id ? 700 : 400, color: courierId === c.id ? 'var(--ink)' : 'var(--ink-2)' }}>{c.name}</span>
              </div>
            ))}
          </div>

          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Service level</label>
              <select className="form-input" value={service} onChange={e => setService(e.target.value)}>
                {courier.services.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Return by date</label>
              <input className="form-input" type="date" value={returnBy} onChange={e => setReturnBy(e.target.value)} />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Internal notes</label>
            <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Special instructions, study notes…"
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }} />
          </div>

          <div style={{ padding: '9px 12px', background: 'var(--accent-soft)', borderRadius: 8, fontSize: 11, color: 'var(--ink-2)', marginBottom: 16, lineHeight: 1.5 }}>
            <strong>Note:</strong> Labels use simulated tracking numbers. Configure real API credentials in Settings → Integrations to enable live label printing with FedEx, DHL, Australia Post, or StarTrack.
          </div>

          {error && (
            <div style={{ padding: '8px 10px', background: 'var(--bad-soft)', borderRadius: 6, fontSize: 11, color: 'var(--bad)', marginBottom: 10 }}>
              {error}
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%', opacity: loading ? 0.7 : 1 }} onClick={handleGenerateLabel} disabled={loading}>
            {loading
              ? <>Connecting to courier…</>
              : <><Icon name="package" size={13} />Generate shipping labels</>}
          </button>
        </>)}

        {/* ── STEP 2: label ── */}
        {step === 'label' && tracking && (<>

          <div style={{ padding: '12px 14px', background: 'var(--good-soft)', borderRadius: 10, border: '1px solid var(--good)', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--good)', marginBottom: 8 }}>Labels ready</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                ['Outbound tracking', tracking.trackingNumber],
                ['Return tracking',   tracking.returnTrackingNumber],
                ['Est. delivery',     fmtDate(tracking.estimatedDelivery)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Dispatch summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
              {[
                ['Patient',    patient.name],
                ['Study ref',  patient.studyRef || '—'],
                ['Deliver to', `${address.line1}, ${address.suburb} ${address.state} ${address.postcode}`],
                ['Courier',    `${courier.name} · ${service}`],
                ['Return by',  fmtDate(returnBy)],
                ['Device',     eq.id],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                  <div style={{ fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>Print labels</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => printLabel(false)}>
              <Icon name="download" size={13} />Outbound label
            </button>
            <button className="btn" style={{ flex: 1 }} onClick={() => printLabel(true)}>
              <Icon name="rotate_ccw" size={13} />Return label
            </button>
          </div>

          <div style={{ padding: '8px 10px', background: 'var(--warn-soft)', borderRadius: 6, fontSize: 11, color: 'var(--warn)', marginBottom: 16, lineHeight: 1.5 }}>
            Include <strong>both labels</strong> in the package. The return label allows the patient to send the device back without needing to arrange postage.
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flexShrink: 0 }} onClick={() => setStep('form')}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmDispatch}>
              <Icon name="send" size={13} />Confirm dispatch
            </button>
          </div>
        </>)}

      </div>
    </div>
  );
};

// ── Return & Process Drawer ───────────────────────────────────────────────────

export const HstReturnDrawer = ({ eq, onUpdate, onClose }) => {
  const { user } = useAuth();
  const lastDispatch = (eq.hstHistory ?? []).find(h => h.type === 'dispatch');

  const [receivedDate,    setReceivedDate]    = useState(new Date().toISOString().slice(0, 10));
  const [receivedBy,      setReceivedBy]      = useState(user?.name ?? '');
  const [condition,       setCondition]       = useState('Good');
  const [dataDownloaded,  setDataDownloaded]  = useState(false);
  const [cleaned,         setCleaned]         = useState(false);
  const [notes,           setNotes]           = useState('');

  const isDamaged = condition === 'Damaged';
  const canSave   = dataDownloaded && cleaned;

  const handleSave = () => {
    const entry = {
      type:           'return_processed',
      date:           new Date().toISOString().slice(0, 10),
      receivedDate,
      receivedBy,
      condition,
      dataDownloaded,
      cleaned,
      notes,
      studyRef:       lastDispatch?.patient?.studyRef ?? '',
      patient:        lastDispatch?.patient ?? null,
    };
    onUpdate({
      ...eq,
      status:     isDamaged ? 'Quarantined' : 'In service',
      hstStatus:  isDamaged ? 'Quarantined' : 'Available',
      hstHistory: [entry, ...(eq.hstHistory ?? [])],
    });
    onClose();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Return receipt · {eq.id}</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{eq.name}</div>
          {lastDispatch && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {lastDispatch.patient?.name} · {lastDispatch.patient?.studyRef ?? ''}
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">

        {lastDispatch && (
          <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 16, fontSize: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Last dispatch</div>
            <div style={{ color: 'var(--ink-2)' }}>{lastDispatch.patient?.name}</div>
            <div style={{ color: 'var(--ink-3)', marginTop: 2 }}>
              {(lastDispatch.courier ?? '').toUpperCase()} · <span className="mono">{lastDispatch.trackingNumber}</span>
              {lastDispatch.returnBy && <> · Return by {fmtDate(lastDispatch.returnBy)}</>}
            </div>
            {lastDispatch.address && (
              <div style={{ color: 'var(--ink-3)', marginTop: 2 }}>
                {lastDispatch.address.line1}, {lastDispatch.address.suburb} {lastDispatch.address.state}
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="package" size={13} />Return receipt
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Date received</label>
            <input className="form-input" type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Received by</label>
            <input className="form-input" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Name" />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Device condition on return</label>
          <select className="form-input" value={condition} onChange={e => setCondition(e.target.value)}>
            <option>Good</option>
            <option>Minor wear</option>
            <option>Needs cleaning</option>
            <option>Damaged</option>
          </select>
        </div>

        {isDamaged && (
          <div style={{ padding: '8px 10px', background: 'var(--bad-soft)', borderRadius: 6, fontSize: 11, color: 'var(--bad)', marginBottom: 12, lineHeight: 1.5 }}>
            Damaged devices are quarantined automatically. Raise an adverse incident report if patient harm may have occurred.
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, margin: '14px 0 10px', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="check" size={13} />Processing checklist
        </div>

        {[
          [dataDownloaded, setDataDownloaded, 'Data downloaded and study saved to system'],
          [cleaned,        setCleaned,        'Device cleaned and disinfected per SOP-EQ-003'],
        ].map(([val, setter, label]) => (
          <label key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
              border: `2px solid ${val ? 'var(--accent)' : 'var(--border)'}`,
              background: val ? 'var(--accent)' : 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.12s',
            }} onClick={() => setter(v => !v)}>
              {val && <Icon name="check" size={11} style={{ color: '#fff', strokeWidth: 3 }} />}
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 10, color: 'var(--bad)', marginLeft: 5 }}>required</span>
            </div>
          </label>
        ))}

        <div className="form-field">
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Accessories returned, issues observed, study quality notes…"
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }} />
        </div>

        {!canSave && (
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12, padding: '6px 8px', background: 'var(--surface-3)', borderRadius: 6 }}>
            Complete both processing steps to mark the device available for next dispatch.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={!canSave}>
            <Icon name={isDamaged ? 'alert' : 'check'} size={13} />
            {isDamaged ? 'Record return & quarantine' : 'Mark available for dispatch'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>

      </div>
    </div>
  );
};
