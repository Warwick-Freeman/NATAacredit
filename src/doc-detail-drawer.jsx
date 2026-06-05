import React, { useState, useEffect } from 'react';
import Icon from './icons';
import { Pill, Avatar } from './components';
import { useAuth } from './AuthContext';
import { useNexusData } from './NexusDataContext';

const STATUS_KIND = { Issued: 'good', Draft: 'outline', 'Under review': 'warn', 'Live form': 'info', Obsolete: 'bad' };

const STEP_PERM = [null, 'canPeerReviewDoc', 'canApproveDoc', 'canIssueDoc'];
const PERM_ROLE_ASA  = { canPeerReviewDoc: 'Senior Technologist or above', canApproveDoc: 'Reporting Physician or above', canIssueDoc: 'Quality Manager or above' };
const PERM_ROLE_AASM = { canPeerReviewDoc: 'Lead Technologist (RPSGT) or above', canApproveDoc: 'Site Director or above', canIssueDoc: 'Site Director or above' };
const ADVANCE_LABEL = ['Submit for peer review', 'Approve peer review', 'Approve document', 'Issue document'];
const STEP_STATUS   = ['Under review', 'Under review', 'Issued', 'Issued'];

function addMonths(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function today() {
  return new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

const StepCircle = ({ index, step, isLast }) => {
  const isDone     = step.done && !step.rejected;
  const isActive   = step.active && !step.done;
  const isRejected = step.rejected;
  const bg = isDone ? 'var(--good)' : isActive ? 'var(--accent)' : isRejected ? 'var(--bad)' : 'var(--surface-3)';
  const fg = (isDone || isActive || isRejected) ? 'white' : 'var(--ink-4)';
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', margin: '0 auto',
        background: bg, color: fg,
        display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12,
        boxShadow: isActive ? '0 0 0 3px var(--accent-soft)' : 'none',
        position: 'relative',
      }}>
        {isDone ? <Icon name="check" size={13} /> : isRejected ? <Icon name="x" size={12} /> : index + 1}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 5, color: (isDone || isActive) ? 'var(--ink)' : 'var(--ink-3)' }}>
        {step.step}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{step.who}</div>
      <div style={{ fontSize: 10, color: isRejected ? 'var(--bad)' : 'var(--ink-4)' }}>
        {isRejected ? 'Changes requested' : step.date}
      </div>
    </div>
  );
};

const DocDetailDrawer = ({ doc, onUpdate, onClose, onView, onEdit }) => {
  const { hasPerm, user, users } = useAuth();
  const { refreshData, activeStandard } = useNexusData();
  const PERM_ROLE = activeStandard === 'aasm' ? PERM_ROLE_AASM : PERM_ROLE_ASA;

  const wf = doc.workflow || [];
  const activeIdx = wf.findIndex(s => s.active && !s.done);

  const [pendingAction, setPendingAction] = useState(null); // null | 'advance' | 'reject'
  const [comment,       setComment]       = useState('');
  const [reviewer,      setReviewer]      = useState(
    wf[1]?.who !== '—' && wf[1]?.who !== 'M. Chen' ? wf[1]?.who : ''
  );

  useEffect(() => {
    setPendingAction(null);
    setComment('');
  }, [doc.id]);

  const handleAdvance = () => {
    if (activeIdx < 0) return;
    const t = today();
    const wfNext = wf.map((s, i) => {
      if (i === activeIdx) return { ...s, done: true, active: false, date: t, comment, who: user.name };
      if (i === activeIdx + 1) {
        const who = (activeIdx === 0 && reviewer) ? reviewer : s.who;
        return { ...s, active: true, who };
      }
      return s;
    });
    const allCoreDone = wfNext.slice(0, 4).every(s => s.done);
    const newStatus   = allCoreDone ? 'Issued' : STEP_STATUS[activeIdx] || doc.status;
    const newReviewDue = allCoreDone ? addMonths(24) : doc.reviewDue;
    onUpdate({ ...doc, workflow: wfNext, status: newStatus, reviewDue: newReviewDue, updated: 'today' });
    refreshData();
    setPendingAction(null);
    setComment('');
  };

  const handleReject = () => {
    if (activeIdx < 0) return;
    const t = today();
    const wfNext = wf.map((s, i) => {
      if (i === activeIdx) return { ...s, done: false, active: false, rejected: true, date: t, comment, who: user.name };
      if (i === 0) return { ...s, done: false, active: true, date: t };
      return { ...s, done: false, active: false, rejected: false };
    });
    onUpdate({ ...doc, workflow: wfNext, status: 'Draft', updated: 'today' });
    refreshData();
    setPendingAction(null);
    setComment('');
  };

  const canAdvance = activeIdx >= 0 && (STEP_PERM[activeIdx] ? hasPerm(STEP_PERM[activeIdx]) : true);
  const advanceLabel = ADVANCE_LABEL[activeIdx] || 'Advance';
  const rejectLabel  = activeIdx === 1 ? 'Return to draft' : activeIdx === 2 ? 'Return to peer review' : 'Return to draft';

  const isIssued = doc.status === 'Issued' || doc.status === 'Live form';
  const hasWf    = wf.length > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="drawer-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>
            Documents &amp; SOPs · {activeStandard === 'aasm' ? 'AASM S-4' : 'cl. 4.3'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{doc.id}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>v{doc.v}</span>
            <Pill kind={STATUS_KIND[doc.status] || 'outline'} dot>{doc.status}</Pill>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.title}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body" style={{ flex: 1, overflowY: 'auto' }}>

        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>Owner</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar name={doc.owner} size={20} />
              <span style={{ fontSize: 13 }}>{doc.owner}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>Review due</div>
            <div style={{ fontSize: 13, color: doc.reviewDue?.includes('Overdue') ? 'var(--bad)' : 'inherit' }}>{doc.reviewDue || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>Last updated</div>
            <div style={{ fontSize: 13 }}>{doc.updated}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>Linked clauses</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {doc.clauses?.map(c => (
                <span key={c} className="mono" style={{ fontSize: 10, padding: '1px 5px', background: 'var(--accent-soft)', borderRadius: 3, color: 'var(--accent-ink)' }}>{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow stepper */}
        {hasWf && (
          <>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Approval workflow</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 18 }}>
              {wf.map((s, i) => (
                <React.Fragment key={i}>
                  <StepCircle index={i} step={s} isLast={i === wf.length - 1} />
                  {i < wf.length - 1 && (
                    <div style={{
                      height: 2, width: 24, flexShrink: 0, marginTop: 14,
                      background: s.done && !s.rejected ? 'var(--good)' : 'var(--border)',
                    }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step comments history */}
            {wf.some(s => s.comment) && (
              <div style={{ marginBottom: 18 }}>
                {wf.filter(s => s.comment).map((s, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: s.rejected ? 'var(--bad-soft)' : 'var(--surface-2)', borderRadius: 6, marginBottom: 6, borderLeft: `3px solid ${s.rejected ? 'var(--bad)' : 'var(--good)'}` }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>
                      <strong>{s.who}</strong> · {s.step} · {s.date}
                      {s.rejected && <span style={{ color: 'var(--bad)', marginLeft: 6 }}>Changes requested</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{s.comment}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Active step action panel */}
            {activeIdx >= 0 && !isIssued && (
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 10 }}>
                  Awaiting: <span style={{ color: 'var(--accent-ink)' }}>{wf[activeIdx].step}</span>
                </div>

                {/* Reviewer selection for peer review step */}
                {activeIdx === 0 && (
                  <div className="form-field" style={{ marginBottom: 10 }}>
                    <label className="form-label">Assign peer reviewer</label>
                    <select className="form-input" value={reviewer} onChange={e => setReviewer(e.target.value)}>
                      <option value="">— select reviewer —</option>
                      {(users || []).map(u => <option key={u.id} value={u.name}>{u.name} · {u.role}</option>)}
                    </select>
                  </div>
                )}

                {/* Comment field */}
                {pendingAction && (
                  <div className="form-field" style={{ marginBottom: 10 }}>
                    <label className="form-label">
                      {pendingAction === 'reject' ? 'Reason for requesting changes' : 'Comment'}{' '}
                      <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>{pendingAction === 'reject' ? '(required)' : '(optional)'}</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      autoFocus
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder={pendingAction === 'reject'
                        ? 'Describe what needs to change before re-submission…'
                        : 'Add a note for the next reviewer…'}
                      style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }}
                    />
                  </div>
                )}

                {pendingAction ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {pendingAction === 'advance' ? (
                      <button className="btn btn-primary" style={{ flex: 1 }}
                        onClick={handleAdvance}
                        title={!canAdvance ? `Requires: ${PERM_ROLE[STEP_PERM[activeIdx]]}` : undefined}
                        disabled={!canAdvance}>
                        <Icon name="check" size={14} />{advanceLabel}
                      </button>
                    ) : (
                      <button className="btn" style={{ flex: 1, color: 'var(--bad)', borderColor: 'var(--bad-soft)' }}
                        onClick={handleReject}
                        disabled={!comment.trim()}>
                        <Icon name="x" size={14} />{rejectLabel}
                      </button>
                    )}
                    <button className="btn" onClick={() => { setPendingAction(null); setComment(''); }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, opacity: canAdvance ? 1 : 0.45 }}
                      disabled={!canAdvance}
                      title={!canAdvance ? `Requires: ${PERM_ROLE[STEP_PERM[activeIdx]]}` : undefined}
                      onClick={() => setPendingAction('advance')}>
                      <Icon name="check" size={14} />{advanceLabel}
                    </button>
                    {activeIdx > 0 && (
                      <button className="btn" style={{ color: 'var(--bad)', borderColor: 'var(--bad-soft)' }}
                        onClick={() => setPendingAction('reject')}>
                        <Icon name="x" size={14} />Request changes
                      </button>
                    )}
                  </div>
                )}

                {!canAdvance && STEP_PERM[activeIdx] && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>
                    <Icon name="info" size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Requires role: <strong>{PERM_ROLE[STEP_PERM[activeIdx]]}</strong>
                  </div>
                )}
              </div>
            )}

            {isIssued && wf.length > 0 && (
              <div style={{ padding: '10px 14px', background: 'var(--good-soft, var(--surface-2))', borderRadius: 8, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="check" size={16} style={{ color: 'var(--good)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--good)' }}>Issued and in effect</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Next periodic review: {doc.reviewDue}</div>
                </div>
                {hasPerm('canCreateDoc') && (
                  <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={onEdit}>
                    <Icon name="edit" size={12} />Start revision
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Activity */}
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Activity</div>
        <div className="timeline" style={{ marginBottom: 18 }}>
          <div className="timeline-item">
            <div><strong>{doc.owner}</strong> {doc.workflow ? 'created draft' : 'updated document'}</div>
            <div className="timeline-time">{doc.updated}</div>
          </div>
          {wf.filter(s => s.done && s.who !== 'Auto' && s.who !== '+24 mo').map((s, i) => (
            <div key={i} className="timeline-item">
              <div><strong>{s.who}</strong> completed <em>{s.step}</em>{s.comment ? ` — "${s.comment}"` : ''}</div>
              <div className="timeline-time">{s.date}</div>
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onView}>
            <Icon name="eye" size={14} />{doc.fileType ? 'View document' : 'Attach file'}
          </button>
          {hasPerm('canUploadDoc') && (
            <button className="btn" onClick={onEdit}>
              <Icon name="edit" size={14} />Edit details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocDetailDrawer;
