import React, { useState, useEffect } from 'react';
import Icon from './icons';
import { Pill, Avatar } from './components';
import { useAuth } from './AuthContext';
import { useNexusData } from './NexusDataContext';
import { ROLE_PERMISSIONS } from './AuthContext';

const STATUS_KIND = { Issued: 'good', Draft: 'outline', 'Under review': 'warn', 'Live form': 'info', Obsolete: 'bad' };

const STEP_PERM = [null, 'canPeerReviewDoc', 'canApproveDoc', 'canIssueDoc'];
const PERM_ROLE_ASA  = { canPeerReviewDoc: 'Senior Technologist or above', canApproveDoc: 'Reporting Physician or above', canIssueDoc: 'Quality Manager or above' };
const PERM_ROLE_AASM = { canPeerReviewDoc: 'Lead Technologist (RPSGT) or above', canApproveDoc: 'Site Director or above', canIssueDoc: 'Site Director or above' };
const ADVANCE_LABEL = ['Submit for peer review', 'Complete peer review', 'Approve document', 'Issue document'];
const STEP_STATUS   = ['Under review', 'Under review', 'Under review', 'Issued'];

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

const BASE = import.meta.env.VITE_API_URL ?? '';

const DocDetailDrawer = ({ doc, onUpdate, onClose, onView, onEdit, onEditHtml, onCancelDraft }) => {
  const { hasPerm, user, users } = useAuth();
  const { refreshData, activeStandard } = useNexusData();
  const PERM_ROLE = activeStandard === 'aasm' ? PERM_ROLE_AASM : PERM_ROLE_ASA;

  const wf = doc.workflow || [];
  const activeIdx = wf.findIndex(s => s.active && !s.done);

  // For Draft revisions, the logged-in user with canCreateDoc is treated as the current author.
  // This covers revisions created before the server stored the correct owner.
  const isDraftRevision = doc.status === 'Draft' && !!(doc.revisionOf);
  const effectiveOwner  = isDraftRevision && hasPerm('canCreateDoc') && user?.name
    ? user.name
    : doc.owner;

  // Filter users by the permission required for each workflow step
  const usersWithPerm = (perm) =>
    (users || []).filter(u => !!(ROLE_PERMISSIONS[u.role]?.[perm]));

  const [pendingAction, setPendingAction] = useState(null); // null | 'advance' | 'reject'
  const [pendingCancel, setPendingCancel] = useState(false);
  const [comment,       setComment]       = useState('');
  const [reviewer, setReviewer] = useState(wf[1]?.who && wf[1]?.who !== '—' ? wf[1]?.who : '');
  const [approver, setApprover] = useState(wf[2]?.who && wf[2]?.who !== '—' ? wf[2]?.who : '');
  const [issuer,   setIssuer]   = useState(wf[3]?.who && wf[3]?.who !== '—' ? wf[3]?.who : (doc.owner || ''));

  useEffect(() => {
    setPendingAction(null);
    setComment('');
  }, [doc.id]);

  const handleAdvance = () => {
    if (activeIdx < 0) return;
    const t = today();
    let wfNext;
    if (activeIdx === 0) {
      // Creator submits: stamp all routing at once, using effectiveOwner to correct any stale owner
      wfNext = wf.map((s, i) => {
        if (i === 0) return { ...s, done: true, active: false, date: t, comment, who: effectiveOwner || s.who };
        if (i === 1) return { ...s, active: true,  done: false, rejected: false, date: '—', who: reviewer || s.who };
        if (i === 2) return { ...s, active: false, done: false, rejected: false, date: '—', who: approver || s.who };
        if (i === 3) return { ...s, active: false, done: false, rejected: false, date: '—', who: issuer   || s.who };
        return s;
      });
    } else {
      wfNext = wf.map((s, i) => {
        if (i === activeIdx) return { ...s, done: true, active: false, date: t, comment, who: user?.name || s.who };
        if (i === activeIdx + 1) return { ...s, active: true };
        return s;
      });
    }
    const allCoreDone = wfNext.slice(0, 4).every(s => s.done);
    const newStatus   = allCoreDone ? 'Issued' : STEP_STATUS[activeIdx] || doc.status;
    const newReviewDue = allCoreDone ? addMonths(24) : doc.reviewDue;
    // Self-heal: if effectiveOwner differs from stored owner (stale revision data), correct it now
    const ownerUpdate = (activeIdx === 0 && effectiveOwner !== doc.owner) ? { owner: effectiveOwner } : {};
    onUpdate({ ...doc, ...ownerUpdate, workflow: wfNext, status: newStatus, reviewDue: newReviewDue, updated: 'today' });
    refreshData();
    // Create a task for the next step's assigned person
    const nextWho = activeIdx === 0 ? reviewer :
                    activeIdx === 1 ? wf[2]?.who :
                    activeIdx === 2 ? wf[3]?.who : null;
    if (nextWho && nextWho !== '—' && activeIdx < 3) {
      const stepNames = ['Peer review', 'Approval', 'Issue'];
      const tok = localStorage.getItem('nexus_token');
      fetch(`${BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
        body: JSON.stringify({
          title:      `${stepNames[activeIdx]}: ${doc.id} — ${doc.title}`,
          clause:     '4.3.1',
          due:        'in 5 days',
          priority:   'high',
          assignedTo: nextWho,
        }),
      }).catch(() => {});
    }
    setPendingAction(null);
    setComment('');
  };

  const handleReject = () => {
    if (activeIdx < 0) return;
    const t = today();
    // Step 2 rejection returns to step 1 (peer review); everything else returns to step 0 (draft)
    const returnToIdx = activeIdx === 2 ? 1 : 0;
    const wfNext = wf.map((s, i) => {
      if (i === activeIdx) return { ...s, done: false, active: false, rejected: true, date: t, comment, who: user?.name || s.who };
      if (i === returnToIdx) return { ...s, done: false, active: true, date: '—', rejected: false };
      if (i > returnToIdx && i < activeIdx) return { ...s, done: false, active: false, rejected: false };
      return s;
    });
    const newStatus = returnToIdx === 0 ? 'Draft' : 'Under review';
    onUpdate({ ...doc, workflow: wfNext, status: newStatus, updated: 'today' });
    refreshData();
    setPendingAction(null);
    setComment('');
  };

  const handleResetWorkflow = () => {
    const freshWf = [
      { step: 'Draft',           who: doc.owner || '—',   date: '—', done: false, active: true,  rejected: false, comment: '' },
      { step: 'Peer review',     who: wf[1]?.who || '—', date: '—', done: false, active: false, rejected: false, comment: '' },
      { step: 'Approval',        who: wf[2]?.who || '—', date: '—', done: false, active: false, rejected: false, comment: '' },
      { step: 'Issue',           who: wf[3]?.who || '—', date: '—', done: false, active: false, rejected: false, comment: '' },
      { step: 'Periodic review', who: '+24 mo',           date: '—', done: false, active: false, rejected: false, comment: '' },
    ];
    onUpdate({ ...doc, workflow: freshWf, status: 'Draft' });
  };

  // canAdvance: step 0 = effective owner (or any canCreateDoc user for revisions); steps 1–3 = assigned user with required role
  // For step 0 of a draft revision, use effectiveOwner (the stored wf[0].who may be stale pre-fix data)
  const rawAssignedWho = activeIdx >= 0 ? wf[activeIdx]?.who : null;
  const assignedWho = (activeIdx === 0 && isDraftRevision) ? effectiveOwner : rawAssignedWho;
  const isAssignedOrUnset = !assignedWho || assignedWho === '—' || user?.name === assignedWho;
  const canAdvance = activeIdx >= 0 && (() => {
    if (activeIdx === 0) return !effectiveOwner || user?.name === effectiveOwner;
    return isAssignedOrUnset && (STEP_PERM[activeIdx] ? hasPerm(STEP_PERM[activeIdx]) : true);
  })();

  const advanceLabel = ADVANCE_LABEL[activeIdx] || 'Advance';
  const rejectLabel  = activeIdx === 1 ? 'Return to draft' : activeIdx === 2 ? 'Return to peer review' : 'Return to draft';

  const cannotAdvanceReason = !canAdvance ? (
    activeIdx === 0 ? `Only the document owner (${effectiveOwner}) can submit this draft` :
    !isAssignedOrUnset ? `This step requires action from ${assignedWho}` :
    STEP_PERM[activeIdx] ? `Requires role: ${PERM_ROLE[STEP_PERM[activeIdx]]}` : undefined
  ) : undefined;

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
              <Avatar name={effectiveOwner} size={20} />
              <span style={{ fontSize: 13 }}>{effectiveOwner}</span>
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
              {wf.map((s, i) => {
                // For draft revisions, show the effective owner in the Draft step
                const displayStep = (i === 0 && isDraftRevision && effectiveOwner !== s.who)
                  ? { ...s, who: effectiveOwner }
                  : s;
                return (
                <React.Fragment key={i}>
                  <StepCircle index={i} step={displayStep} isLast={i === wf.length - 1} />
                  {i < wf.length - 1 && (
                    <div style={{
                      height: 2, width: 24, flexShrink: 0, marginTop: 14,
                      background: s.done && !s.rejected ? 'var(--good)' : 'var(--border)',
                    }} />
                  )}
                </React.Fragment>
                );
              })}
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

            {/* Recovery panel: Draft doc with no active workflow step (broken revision state) */}
            {doc.status === 'Draft' && activeIdx < 0 && (
              <div style={{ padding: 14, border: '1px solid var(--warn)', borderRadius: 8, marginBottom: 18, background: 'var(--warn-soft, #fef9ec)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warn)', marginBottom: 4 }}>Workflow reset required</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12, lineHeight: 1.5 }}>
                  This document is in Draft status but the workflow shows no active step. Click below to restore the correct draft workflow so it can proceed through approval.
                </div>
                <button className="btn" onClick={handleResetWorkflow}>
                  <Icon name="edit" size={13} /> Reset to draft workflow
                </button>
              </div>
            )}

            {/* Active step action panel */}
            {activeIdx >= 0 && !isIssued && (
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 10 }}>
                  Awaiting: <span style={{ color: 'var(--accent-ink)' }}>{wf[activeIdx].step}</span>
                </div>

                {/* Step 0: creator specifies routing for all future steps upfront */}
                {activeIdx === 0 && (
                  <>
                    <div className="form-field" style={{ marginBottom: 10 }}>
                      <label className="form-label">Peer reviewer</label>
                      <select className="form-input" value={reviewer} onChange={e => setReviewer(e.target.value)}>
                        <option value="">— select reviewer —</option>
                        {usersWithPerm('canPeerReviewDoc').map(u => <option key={u.id} value={u.name}>{u.name} · {u.role}</option>)}
                      </select>
                    </div>
                    <div className="form-field" style={{ marginBottom: 10 }}>
                      <label className="form-label">Approver</label>
                      <select className="form-input" value={approver} onChange={e => setApprover(e.target.value)}>
                        <option value="">— select approver —</option>
                        {usersWithPerm('canApproveDoc').map(u => <option key={u.id} value={u.name}>{u.name} · {u.role}</option>)}
                      </select>
                    </div>
                    <div className="form-field" style={{ marginBottom: 10 }}>
                      <label className="form-label">Issuer</label>
                      <select className="form-input" value={issuer} onChange={e => setIssuer(e.target.value)}>
                        <option value="">— select issuer —</option>
                        {usersWithPerm('canIssueDoc').map(u => <option key={u.id} value={u.name}>{u.name} · {u.role}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Show waiting message whenever current user is not the assigned person */}
                {!isAssignedOrUnset && (
                  <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--ink-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="clock" size={13} style={{ flexShrink: 0 }} />
                    <span>
                      {activeIdx === 0 ? 'Awaiting submission by' : 'Awaiting action from'}{' '}
                      <strong style={{ color: 'var(--ink-2)' }}>{assignedWho}</strong>
                    </span>
                  </div>
                )}

                {/* Comment field */}
                {pendingAction && isAssignedOrUnset && (
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

                {isAssignedOrUnset && (pendingAction ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {pendingAction === 'advance' ? (
                      <button className="btn btn-primary" style={{ flex: 1 }}
                        onClick={handleAdvance}
                        title={cannotAdvanceReason}
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
                      title={cannotAdvanceReason}
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
                ))}

                {cannotAdvanceReason && isAssignedOrUnset && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>
                    <Icon name="info" size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {cannotAdvanceReason}
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" style={{ flex: 1 }} onClick={onView}>
            <Icon name="eye" size={14} />{doc.fileType ? 'View document' : 'Attach file'}
          </button>
          {doc.status === 'Draft' && doc.fileType === 'html' && onEditHtml && (
            <button className="btn btn-primary" onClick={onEditHtml}>
              <Icon name="edit" size={14} />Edit draft
            </button>
          )}
          {hasPerm('canUploadDoc') && (
            <button className="btn" onClick={onEdit}>
              <Icon name="edit" size={14} />Edit details
            </button>
          )}
        </div>

        {/* Cancel draft / revision — visible to the effective owner of any Draft document */}
        {doc.status === 'Draft' && user?.name === effectiveOwner && onCancelDraft && (
          <div style={{ marginTop: 10 }}>
            {pendingCancel ? (
              <div style={{ padding: '10px 12px', background: 'var(--bad-soft)', borderRadius: 8, border: '1px solid var(--bad)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bad)', marginBottom: 8 }}>
                  {doc.revisionOf ? 'Cancel this revision?' : 'Delete this draft?'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
                  {doc.revisionOf
                    ? 'The revision draft will be removed and the previous issued version will be restored.'
                    : 'This draft will be permanently deleted and cannot be recovered.'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ flex: 1, color: 'var(--bad)', borderColor: 'var(--bad)' }}
                    onClick={() => { setPendingCancel(false); onCancelDraft(doc); }}>
                    <Icon name="x" size={14} />{doc.revisionOf ? 'Yes, cancel revision' : 'Yes, delete draft'}
                  </button>
                  <button className="btn" onClick={() => setPendingCancel(false)}>Keep</button>
                </div>
              </div>
            ) : (
              <button
                className="btn"
                style={{ width: '100%', color: 'var(--bad)', borderColor: 'var(--bad-soft)', justifyContent: 'center' }}
                onClick={() => setPendingCancel(true)}
              >
                <Icon name="x" size={14} />
                {doc.revisionOf ? 'Cancel revision — restore previous version' : 'Cancel draft'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocDetailDrawer;
