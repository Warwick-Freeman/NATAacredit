import React from 'react';
import Icon from './icons';
import { Pill, Avatar } from './components';

const StudyDrawer = ({ data, studyId, onClose }) => {
  if (!studyId || !data) return null;
  const study = data.studies.find(s => s.id === studyId);
  if (!study) return null;

  return (
    <div>
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
            { name: "Sign-off", done: study.status === 'Final' },
            { name: "Delivered", done: study.status === 'Final' },
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

        {/* Sign-off */}
        {study.status === 'Awaiting sign-off' && (
          <>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Sign final report</div>
            <div className="sig-box" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Reporting physician — {study.physician}</div>
              <div className="sig-line">{study.physician}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>e-signature · TOTP verified</span>
                <span>retained per cl. 5.8.11</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}><Icon name="check" size={14} />Sign as Final</button>
              <button className="btn"><Icon name="edit" size={14} />Amend preliminary</button>
            </div>
          </>
        )}

        {study.status === 'Final' && (
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
    </div>
  );
};

export default StudyDrawer;
