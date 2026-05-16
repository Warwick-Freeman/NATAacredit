import React, { useState } from 'react';
import Icon from './icons';
import { Pill, Avatar } from './components';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { DME_PROVIDERS, DX_LIST, generateOrderHtml } from './dme-order';
import { patchStudyStatus } from './api';

// ─── prescription defaults by study type ────────────────────────────────────────

function initRxForm(study) {
  const isPsg = study.type?.includes('PSG') || study.type?.includes('HSAT');
  const dx = {};
  DX_LIST.forEach(d => { dx[d.key] = false; });
  dx.dx_osa = isPsg;

  return {
    equipmentType: 'CPAP',
    pressureMode: 'APAP',
    pMin: 6,
    pMax: 12,
    ipap: '',
    epap: '',
    ipapMax: '',
    humidifier: true,
    mask: '',
    ahi: '',
    o2Nadir: '',
    ess: '',
    dmeProvider: DME_PROVIDERS[0].name,
    dmeProviderFax: DME_PROVIDERS[0].fax,
    dmeProviderEmail: DME_PROVIDERS[0].email,
    orderType: 'New',
    lengthOfNeed: 'Indefinite',
    physicianNpi: 'MED-24891',
    physicianPhone: '02 9555 0100',
    orderingDate: new Date().toLocaleDateString('en-AU'),
    stat: false,
    includeLogo: true,
    comments: '',
    numMonths: '',
    followUpPhysician: '',
    studyType: study.type ?? 'PSG',
    studyDate: '',
    ...dx,
  };
}

function openDmeHtml(html, mrn) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `DME-Order-${mrn}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// ─── study drawer ───────────────────────────────────────────────────────────────

const StudyDrawer = ({ data, studyId, onClose, onStudyUpdated }) => {
  const { site } = useLocation();
  const { user } = useAuth();

  const [rxOpen, setRxOpen] = useState(false);
  const [rx, setRx] = useState(null);
  const [signed, setSigned] = useState(false);
  const [dmeNote, setDmeNote] = useState('');

  if (!studyId || !data) return null;
  const study = data.studies.find(s => s.id === studyId);
  if (!study) return null;

  const setRxField = (k, v) => setRx(r => {
    const next = { ...r, [k]: v };
    if (k === 'dmeProvider') {
      const prov = DME_PROVIDERS.find(p => p.name === v) ?? {};
      next.dmeProviderFax = prov.fax ?? '';
      next.dmeProviderEmail = prov.email ?? '';
    }
    return next;
  });

  const openPrescriptionPanel = () => {
    if (!rx) setRx(initRxForm(study));
    setRxOpen(o => !o);
  };

  const generateDmeOrder = () => {
    const patient = {
      name: study.patient,
      mrn: study.id,
      dob: '',
      age: '',
      sex: '',
      physician: study.physician,
      diagnoses: [],
    };
    const form = {
      ...rx,
      orderingPhysician: study.physician,
    };
    const html = generateOrderHtml(form, patient, site, user);
    openDmeHtml(html, study.id);
    setDmeNote('DME order opened — print or save as PDF from your browser.');
  };

  const signFinal = async (withDme = false) => {
    if (withDme && rx) generateDmeOrder();
    const signedDays = study.due != null ? Math.max(0, 10 - study.due) : undefined;
    try {
      await patchStudyStatus(study.id, 'Final', signedDays);
    } catch (_) {}
    setSigned(true);
    onStudyUpdated?.();
  };

  // shared styles
  const lbl = { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', marginBottom: 3, display: 'block' };
  const inp = { fontSize: 12, padding: '6px 9px' };
  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 };
  const row3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 };

  return (
    <>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{study.type}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{study.id}</span>
            <Pill kind={study.status === 'Final' ? 'good' : study.status === 'Awaiting sign-off' ? 'warn' : 'info'}>{study.status}</Pill>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>
            {study.patient} · {study.patientInitials} · Site {study.siteCode}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">
        {/* SLA banner */}
        <div className={`banner ${study.sla === 'bad' ? 'warn' : study.sla === 'warn' ? 'warn' : 'info'}`} style={{ marginBottom: 18 }}>
          <Icon name="clock" size={18} />
          <div style={{ flex: 1 }}>
            <strong>10 business-day SLA · cl. 5.8.1</strong>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              Patient contact: {study.contact} ·
              {study.status === 'Final'
                ? ` Signed in ${study.signedDays}d ✓`
                : study.due === 0 ? ' Due today'
                : study.due > 0 ? ` ${study.due} days remaining`
                : ` ${Math.abs(study.due)} days over`}
            </div>
          </div>
        </div>

        {/* Lifecycle */}
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 10 }}>Report lifecycle</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 18 }}>
          {[
            { name: "Recording", done: true },
            { name: "Scoring", done: study.status !== 'Recording' },
            { name: "Preliminary", done: ['Preliminary','Awaiting sign-off','Final'].includes(study.status) },
            { name: "Sign-off", done: study.status === 'Final' || signed },
            { name: "Delivered", done: study.status === 'Final' || signed },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 12,
                  background: s.done ? 'var(--good)' : 'var(--surface-3)',
                  color: 'white',
                  display: 'grid', placeItems: 'center',
                }}>
                  {s.done ? <Icon name="check" size={12} /> : <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>{i+1}</span>}
                </div>
                <div style={{ fontSize: 10, color: s.done ? 'var(--ink-2)' : 'var(--ink-4)' }}>{s.name}</div>
              </div>
              {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: arr[i+1].done ? 'var(--good)' : 'var(--border)', margin: '0 4px', marginBottom: 14 }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Recording tech</div>
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name="P. Tan" size={20} idx={3} /> P. Tan</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Scoring tech</div>
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={study.scorer} size={20} idx={2} /> {study.scorer}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Reporting physician</div>
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={study.physician} size={20} idx={5} /> {study.physician}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Device</div>
            <div className="mono" style={{ fontSize: 12 }}>PSG-COMP-001</div>
          </div>
        </div>

        {/* Bio-signal verification */}
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Pre-study bio-signal verification · cl. 5.5.2</div>
        <div className="card card-pad" style={{ marginBottom: 18, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {["EEG impedance < 5 kΩ", "EOG L/R verified", "EMG chin verified", "ECG lead II", "Oximetry signal", "Airflow & effort", "Body position", "Audio/video sync"].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <Icon name="check" size={12} /> <span style={{ color: 'var(--ink-2)' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Sign-off section ─────────────────────────────────────────────── */}
        {(study.status === 'Awaiting sign-off' && !signed) && (
          <>
            {/* Signature box */}
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Sign final report</div>
            <div className="sig-box" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Reporting physician — {study.physician}</div>
              <div className="sig-line">{study.physician}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>e-signature · TOTP verified</span>
                <span>retained per cl. 5.8.11</span>
              </div>
            </div>

            {/* Prescription & DME toggle */}
            <button
              onClick={openPrescriptionPanel}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', marginBottom: 10, borderRadius: 8,
                border: '1px solid var(--border)', background: rxOpen ? 'var(--accent-soft)' : 'var(--surface-2)',
                color: rxOpen ? 'var(--accent-ink)' : 'var(--ink-2)', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, textAlign: 'left',
              }}>
              <Icon name="paper" size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Treatment prescription &amp; DME order</span>
              <Icon name={rxOpen ? 'chev_down' : 'chev_right'} size={13} style={{ flexShrink: 0, color: 'var(--ink-4)' }} />
            </button>

            {/* Expanded prescription panel */}
            {rxOpen && rx && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>

                {/* ── Clinical findings ── */}
                <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                  Clinical findings
                </div>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={row3}>
                    <div>
                      <label style={lbl}>AHI (events/h)</label>
                      <input className="input" style={inp} type="number" min={0} step={0.1} value={rx.ahi}
                        onChange={e => setRxField('ahi', e.target.value)} placeholder="e.g. 42.3" />
                    </div>
                    <div>
                      <label style={lbl}>O₂ nadir (%)</label>
                      <input className="input" style={inp} type="number" min={50} max={100} value={rx.o2Nadir}
                        onChange={e => setRxField('o2Nadir', e.target.value)} placeholder="e.g. 84" />
                    </div>
                    <div>
                      <label style={lbl}>ESS score</label>
                      <input className="input" style={inp} type="number" min={0} max={24} value={rx.ess}
                        onChange={e => setRxField('ess', e.target.value)} placeholder="0–24" />
                    </div>
                  </div>
                  {/* Diagnosis checkboxes */}
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 7 }}>Diagnosis (ICD-10)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    {DX_LIST.map(d => (
                      <label key={d.key} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 5,
                        cursor: 'pointer', fontSize: 11,
                        background: rx[d.key] ? 'var(--accent-soft)' : 'transparent',
                        color: rx[d.key] ? 'var(--accent-ink)' : 'var(--ink-2)',
                      }}>
                        <input type="checkbox" checked={!!rx[d.key]} onChange={e => setRxField(d.key, e.target.checked)} />
                        <span style={{ flex: 1, lineHeight: 1.3 }}>{d.label}</span>
                        {d.code !== '—' && <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'monospace', flexShrink: 0 }}>{d.code}</span>}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Equipment prescription ── */}
                <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                  Equipment prescription
                </div>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={row2}>
                    <div>
                      <label style={lbl}>Equipment type</label>
                      <select className="input" style={inp} value={rx.equipmentType} onChange={e => setRxField('equipmentType', e.target.value)}>
                        {['CPAP', 'BiPAP', 'ASV', 'Oxygen concentrator', 'Medication', 'No treatment'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    {rx.equipmentType === 'CPAP' && (
                      <div>
                        <label style={lbl}>Pressure mode</label>
                        <select className="input" style={inp} value={rx.pressureMode} onChange={e => setRxField('pressureMode', e.target.value)}>
                          {['APAP', 'Fixed CPAP', 'Auto CPAP'].map(v => <option key={v}>{v}</option>)}
                        </select>
                      </div>
                    )}
                    {rx.equipmentType === 'BiPAP' && (
                      <div>
                        <label style={lbl}>Pressure mode</label>
                        <select className="input" style={inp} value={rx.pressureMode} onChange={e => setRxField('pressureMode', e.target.value)}>
                          {['Auto BiPAP', 'Fixed BiPAP', 'BiPAP-ST'].map(v => <option key={v}>{v}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {rx.equipmentType === 'CPAP' && (
                    <div style={row2}>
                      <div>
                        <label style={lbl}>Min pressure (cmH₂O)</label>
                        <input className="input" style={inp} type="number" min={4} max={20} step={0.5}
                          value={rx.pMin} onChange={e => setRxField('pMin', e.target.value)} />
                      </div>
                      <div>
                        <label style={lbl}>Max pressure (cmH₂O)</label>
                        <input className="input" style={inp} type="number" min={4} max={20} step={0.5}
                          value={rx.pMax} onChange={e => setRxField('pMax', e.target.value)} />
                      </div>
                    </div>
                  )}
                  {rx.equipmentType === 'BiPAP' && (
                    <div style={row2}>
                      <div>
                        <label style={lbl}>IPAP (cmH₂O)</label>
                        <input className="input" style={inp} type="number" min={4} max={30} step={0.5}
                          value={rx.ipap} onChange={e => setRxField('ipap', e.target.value)} />
                      </div>
                      <div>
                        <label style={lbl}>EPAP (cmH₂O)</label>
                        <input className="input" style={inp} type="number" min={4} max={20} step={0.5}
                          value={rx.epap} onChange={e => setRxField('epap', e.target.value)} />
                      </div>
                    </div>
                  )}
                  {rx.equipmentType === 'ASV' && (
                    <div style={row2}>
                      <div>
                        <label style={lbl}>EPAP (cmH₂O)</label>
                        <input className="input" style={inp} type="number" min={4} max={20} step={0.5}
                          value={rx.epap} onChange={e => setRxField('epap', e.target.value)} />
                      </div>
                      <div>
                        <label style={lbl}>IPAP max (cmH₂O)</label>
                        <input className="input" style={inp} type="number" min={8} max={30} step={0.5}
                          value={rx.ipapMax} onChange={e => setRxField('ipapMax', e.target.value)} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Mask / interface</label>
                    <input className="input" style={{ ...inp, width: '100%' }} value={rx.mask}
                      onChange={e => setRxField('mask', e.target.value)}
                      placeholder="e.g. ResMed AirFit F20 Full Face" />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, cursor: 'pointer', color: 'var(--ink-2)', marginBottom: 10 }}>
                    <input type="checkbox" checked={rx.humidifier} onChange={e => setRxField('humidifier', e.target.checked)} />
                    Heated humidifier required
                  </label>
                  <div>
                    <label style={lbl}>Recommendation / comments</label>
                    <textarea className="input" style={{ ...inp, width: '100%', resize: 'vertical', minHeight: 52, fontFamily: 'inherit', lineHeight: 1.4 }}
                      value={rx.comments} onChange={e => setRxField('comments', e.target.value)}
                      placeholder="Additional clinical notes for the DME provider…" />
                  </div>
                </div>

                {/* ── DME provider ── */}
                <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                  DME provider
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={row2}>
                    <div>
                      <label style={lbl}>DME provider</label>
                      <select className="input" style={inp} value={rx.dmeProvider} onChange={e => setRxField('dmeProvider', e.target.value)}>
                        {DME_PROVIDERS.map(p => <option key={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Fax</label>
                      <input className="input" style={inp} value={rx.dmeProviderFax}
                        onChange={e => setRxField('dmeProviderFax', e.target.value)} placeholder="02 xxxx xxxx" />
                    </div>
                  </div>
                  <div style={row2}>
                    <div>
                      <label style={lbl}>Order type</label>
                      <select className="input" style={inp} value={rx.orderType} onChange={e => setRxField('orderType', e.target.value)}>
                        {['New', 'Renewal', 'Replacement'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Length of need</label>
                      <select className="input" style={inp} value={rx.lengthOfNeed} onChange={e => setRxField('lengthOfNeed', e.target.value)}>
                        {['Indefinite', '12 months', '24 months'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  {dmeNote && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, marginBottom: 8, fontSize: 12, color: '#15803d' }}>
                      <Icon name="check" size={13} style={{ flexShrink: 0 }} />
                      {dmeNote}
                    </div>
                  )}

                  <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={generateDmeOrder}>
                    <Icon name="download" size={13} />Preview &amp; print DME order
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => signFinal(false)}>
                <Icon name="check" size={14} />Sign as Final
              </button>
              {rxOpen && rx && (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => signFinal(true)}>
                  <Icon name="paper" size={14} />Sign &amp; create DME order
                </button>
              )}
              <button className="btn"><Icon name="edit" size={14} />Amend</button>
            </div>
          </>
        )}

        {/* Signed confirmation */}
        {signed && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, marginBottom: 14 }}>
              <Icon name="check" size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#15803d' }}>Report signed as Final</div>
                <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>e-signature applied · {new Date().toLocaleDateString('en-AU')} · cl. 5.8.11</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}><Icon name="download" size={14} />Download signed report</button>
              <button className="btn"><Icon name="link" size={14} />Send to referrer</button>
            </div>
          </>
        )}

        {study.status === 'Final' && !signed && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }}><Icon name="download" size={14} />Download signed report</button>
            <button className="btn"><Icon name="link" size={14} />Send to referrer</button>
          </div>
        )}

        {(study.status === 'Scoring' || study.status === 'Preliminary') && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }}><Icon name="paper" size={14} />Open scoring workspace</button>
          </div>
        )}
      </div>
    </>
  );
};

export default StudyDrawer;
