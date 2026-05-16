import React, { useState, useEffect } from 'react';
import Icon from './icons';
import { Pill } from './components';
import { useTaskContext } from './TaskContext';

const PHASES       = ['raised', 'rca', 'capa', 'effectiveness', 'closed'];
const PHASE_LABELS = ['Raised', 'Root cause', 'CAPA', 'Effectiveness', 'Closed'];
const SEV_KIND     = { Critical: 'bad', High: 'warn', Medium: 'info', Low: 'outline' };
const STATUS_LABEL = { raised: 'Open · Raised', rca: 'Open · RCA', capa: 'Open · CAPA', effectiveness: 'Effectiveness review', closed: 'Closed' };
const STATUS_KIND  = { raised: 'warn', rca: 'warn', capa: 'warn', effectiveness: 'accent', closed: 'good' };

const today = () => new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

const NCDetailDrawer = ({ nc, onUpdate, onClose }) => {
  const { openCreateTask } = useTaskContext();
  const phaseIdx = PHASES.indexOf(nc.phase);

  // Local editing state — re-synced when the NC or its phase changes
  const [whys,       setWhys]       = useState(nc.whys || []);
  const [rootCause,  setRootCause]  = useState(nc.rootCause || '');
  const [effNote,    setEffNote]    = useState(nc.effectivenessNote || '');
  const [showAdd,    setShowAdd]    = useState(false);
  const [newAction,  setNewAction]  = useState({ type: 'corrective', description: '', owner: '', dueDate: '' });

  useEffect(() => {
    setWhys(nc.whys || []);
    setRootCause(nc.rootCause || '');
    setEffNote(nc.effectivenessNote || '');
  }, [nc.id, nc.phase]);

  // Can user advance to next phase?
  const canAdvance = () => {
    if (nc.phase === 'raised') return true;
    if (nc.phase === 'rca')   return whys.every(w => w.answer.trim()) && rootCause.trim();
    if (nc.phase === 'capa')  return nc.capaActions.length > 0;
    if (nc.phase === 'effectiveness') return effNote.trim();
    return false;
  };

  const advancePhase = () => {
    const next = PHASES[phaseIdx + 1];
    if (!next) return;
    const base = { ...nc, whys, rootCause, effectivenessNote: effNote, phase: next };
    if (next === 'closed') base.closedDate = today();
    onUpdate(base);
  };

  const ADVANCE_LABEL = {
    raised: 'Begin root cause analysis',
    rca:    'Complete RCA · define CAPA actions',
    capa:   'Submit for effectiveness review',
    effectiveness: 'Verify effective · close NC',
  };

  // CAPA helpers — immediately persist via onUpdate
  const addCapaAction = () => {
    if (!newAction.description.trim()) return;
    const action = { id: Date.now(), ...newAction, done: false };
    onUpdate({ ...nc, capaActions: [...nc.capaActions, action] });
    setNewAction({ type: 'corrective', description: '', owner: '', dueDate: '' });
    setShowAdd(false);
  };

  const toggleDone = (id) => {
    onUpdate({ ...nc, capaActions: nc.capaActions.map(a => a.id === id ? { ...a, done: !a.done } : a) });
  };

  const removeAction = (id) => {
    onUpdate({ ...nc, capaActions: nc.capaActions.filter(a => a.id !== id) });
  };

  const setWhy = (i, answer) => setWhys(prev => prev.map((w, idx) => idx === i ? { ...w, answer } : w));

  const allCapaDone = nc.capaActions.length > 0 && nc.capaActions.every(a => a.done);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="drawer-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>NC &amp; CAPA · cl. 4.9, 4.10, 4.11</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{nc.id}</span>
            <Pill kind={SEV_KIND[nc.severity] || 'outline'}>{nc.severity}</Pill>
            <Pill kind={STATUS_KIND[nc.phase] || 'warn'} dot>{STATUS_LABEL[nc.phase]}</Pill>
            {nc.clinicalSig?.startsWith('Yes') && <Pill kind="bad">Clinical</Pill>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nc.title}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
          {nc.phase !== 'closed' && (
            <button className="btn" style={{ fontSize: 11, padding: '3px 8px', whiteSpace: 'nowrap' }}
              onClick={() => openCreateTask({
                title: `Follow up: ${nc.title}`,
                clause: nc.clause,
                source: nc.id,
                sourceType: 'nc',
                priority: nc.severity === 'Critical' ? 'critical' : nc.severity === 'High' ? 'high' : 'medium',
                assignedTo: nc.owner,
              })}>
              <Icon name="plus" size={11} />Create task
            </button>
          )}
        </div>
      </div>

      {/* Phase stepper */}
      <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {PHASES.map((p, i) => {
            const done   = i < phaseIdx;
            const active = i === phaseIdx;
            const future = i > phaseIdx;
            const isLast = i === PHASES.length - 1;
            return (
              <React.Fragment key={p}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', margin: '0 auto',
                    background: done ? 'var(--good)' : active ? 'var(--accent)' : 'var(--surface-3)',
                    color: (done || active) ? 'white' : 'var(--ink-4)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 10, fontWeight: 700,
                    boxShadow: active ? '0 0 0 3px var(--accent-soft)' : 'none',
                  }}>
                    {done ? <Icon name="check" size={11} /> : i + 1}
                  </div>
                  <div style={{
                    fontSize: 10, marginTop: 4, fontWeight: active ? 600 : 400,
                    color: future ? 'var(--ink-4)' : active ? 'var(--accent)' : 'var(--ink-2)',
                  }}>
                    {PHASE_LABELS[i]}
                  </div>
                </div>
                {!isLast && (
                  <div style={{ width: 18, height: 1, flexShrink: 0, background: done ? 'var(--good)' : 'var(--border)', marginBottom: 16 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="drawer-body" style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── NC DETAILS (always visible) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 20, fontSize: 12 }}>
          {[
            ['Source',    nc.source],
            ['Clause',    nc.clause],
            ['Owner',     nc.owner],
            ['Raised',    nc.raised],
            ['Due',       nc.due],
            ['Clin. sig.', nc.clinicalSig],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{k}</span>
              <span style={{ fontWeight: 500, color: k === 'Clin. sig.' && v?.startsWith('Yes') ? 'var(--bad)' : 'var(--ink)' }}>{v}</span>
            </div>
          ))}
        </div>

        {nc.description && (
          <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, marginBottom: 20, color: 'var(--ink-2)' }}>
            {nc.description}
          </div>
        )}

        {/* ── ROOT CAUSE ANALYSIS (rca phase and beyond) ── */}
        {phaseIdx >= 1 && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="search" size={13} />5-Whys root cause analysis
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {whys.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-soft)',
                    color: 'var(--accent-ink)', display: 'grid', placeItems: 'center',
                    fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>{w.question}</div>
                    {nc.phase === 'rca' ? (
                      <textarea
                        className="form-input"
                        rows={2}
                        value={w.answer}
                        onChange={e => setWhy(i, e.target.value)}
                        placeholder="Enter answer…"
                        style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }}
                      />
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 500, padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 6 }}>
                        {w.answer || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Root cause summary */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Root cause</div>
              {nc.phase === 'rca' ? (
                <textarea
                  className="form-input"
                  rows={2}
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  placeholder="Summarise the systemic root cause…"
                  style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: 'var(--good-soft)', borderRadius: 8, fontSize: 12, color: 'var(--good)', fontWeight: 500 }}>
                  {rootCause || <span style={{ opacity: 0.6 }}>Not recorded</span>}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── CAPA ACTIONS (capa phase and beyond) ── */}
        {phaseIdx >= 2 && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={13} />CAPA actions
              {allCapaDone && nc.capaActions.length > 0 && <Pill kind="good">All complete</Pill>}
            </div>

            {nc.capaActions.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 10 }}>
                No actions added yet. Add at least one corrective action.
              </div>
            )}

            {nc.capaActions.map(a => (
              <div key={a.id} style={{
                padding: '10px 12px',
                background: a.done ? 'var(--good-soft)' : 'var(--surface-2)',
                borderRadius: 8,
                marginBottom: 8,
                border: `1px solid ${a.done ? 'var(--good)' : 'var(--border)'}`,
                opacity: a.done ? 0.8 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <button
                    style={{
                      width: 18, height: 18, borderRadius: 4, border: `2px solid ${a.done ? 'var(--good)' : 'var(--border-strong)'}`,
                      background: a.done ? 'var(--good)' : 'transparent',
                      cursor: nc.phase !== 'closed' ? 'pointer' : 'default',
                      display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}
                    onClick={() => nc.phase !== 'closed' && toggleDone(a.id)}
                    title={a.done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {a.done && <Icon name="check" size={10} style={{ color: 'white' }} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Pill kind={a.type === 'corrective' ? 'warn' : 'info'}>
                        {a.type === 'corrective' ? 'Corrective' : 'Preventive'}
                      </Pill>
                      {a.done && <span style={{ fontSize: 10, color: 'var(--good)', fontWeight: 600 }}>Done</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{a.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      {a.owner && <span>{a.owner}</span>}
                      {a.owner && a.dueDate && <span> · </span>}
                      {a.dueDate && <span>Due {a.dueDate}</span>}
                    </div>
                  </div>
                  {nc.phase !== 'closed' && (
                    <button className="icon-btn" style={{ flexShrink: 0 }}
                      onClick={() => removeAction(a.id)} title="Remove action">
                      <Icon name="x" size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add action form */}
            {nc.phase !== 'closed' && (
              showAdd ? (
                <div style={{ padding: 12, border: '1px dashed var(--border-strong)', borderRadius: 8 }}>
                  <div className="form-row" style={{ marginBottom: 8 }}>
                    <div className="form-field" style={{ flex: 1 }}>
                      <label className="form-label">Type</label>
                      <select className="form-input" value={newAction.type}
                        onChange={e => setNewAction(a => ({ ...a, type: e.target.value }))}>
                        <option value="corrective">Corrective</option>
                        <option value="preventive">Preventive</option>
                      </select>
                    </div>
                    <div className="form-field" style={{ flex: 1 }}>
                      <label className="form-label">Owner</label>
                      <input className="form-input" value={newAction.owner}
                        onChange={e => setNewAction(a => ({ ...a, owner: e.target.value }))}
                        placeholder="Name" />
                    </div>
                  </div>
                  <div className="form-field" style={{ marginBottom: 8 }}>
                    <label className="form-label">Description</label>
                    <input className="form-input" value={newAction.description}
                      onChange={e => setNewAction(a => ({ ...a, description: e.target.value }))}
                      placeholder="What needs to be done?" />
                  </div>
                  <div className="form-field" style={{ marginBottom: 10 }}>
                    <label className="form-label">Due date</label>
                    <input className="form-input" type="date" value={newAction.dueDate}
                      onChange={e => setNewAction(a => ({ ...a, dueDate: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={addCapaAction}>
                      Add action
                    </button>
                    <button className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}
                  onClick={() => setShowAdd(true)}>
                  <Icon name="plus" size={13} />Add CAPA action
                </button>
              )
            )}
          </section>
        )}

        {/* ── EFFECTIVENESS NOTE (effectiveness phase and beyond) ── */}
        {phaseIdx >= 3 && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="pulse" size={13} />Effectiveness review
            </div>
            {nc.phase === 'effectiveness' ? (
              <textarea
                className="form-input"
                rows={3}
                value={effNote}
                onChange={e => setEffNote(e.target.value)}
                placeholder="Describe how you verified the CAPA actions were effective. Include evidence, re-audit results, or follow-up observations…"
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: 'var(--good-soft)', borderRadius: 8, fontSize: 12, color: 'var(--good)' }}>
                {effNote || '—'}
              </div>
            )}
            {nc.closedDate && (
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>
                NC closed: <strong>{nc.closedDate}</strong>
              </div>
            )}
          </section>
        )}

      </div>

      {/* Footer — advance button */}
      {nc.phase !== 'closed' && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {!canAdvance() && nc.phase === 'rca' && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
              Answer all 5 whys and provide a root cause summary to proceed.
            </div>
          )}
          {!canAdvance() && nc.phase === 'capa' && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
              Add at least one CAPA action to proceed.
            </div>
          )}
          {!canAdvance() && nc.phase === 'effectiveness' && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
              Provide an effectiveness note to close the NC.
            </div>
          )}
          <button
            className={`btn btn-primary${canAdvance() ? '' : ' disabled'}`}
            style={{ width: '100%', justifyContent: 'center', opacity: canAdvance() ? 1 : 0.5 }}
            disabled={!canAdvance()}
            onClick={advancePhase}
          >
            <Icon name="chev_right" size={14} />
            {ADVANCE_LABEL[nc.phase]}
          </button>
        </div>
      )}
      {nc.phase === 'closed' && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ padding: '10px 14px', background: 'var(--good-soft)', borderRadius: 8, fontSize: 13, color: 'var(--good)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={16} />
            NC closed · verified effective
          </div>
        </div>
      )}
    </div>
  );
};

export default NCDetailDrawer;
