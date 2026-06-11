import React, { useState, useEffect, useRef } from 'react';
import Icon from './icons';
import { fetchDocuments, createPatientFormLink, sendFormLink } from './api';

const BASE = import.meta.env.VITE_API_URL ?? '';

const METHOD_OPTIONS = [
  { id: 'email', label: 'Email',    icon: 'mail'  },
  { id: 'sms',   label: 'SMS',      icon: 'phone' },
  { id: 'link',  label: 'Copy link', icon: 'link' },
];

function fillUrl(token) {
  return `${window.location.origin}${window.location.pathname}?fill=${token}`;
}

const PatientFormSendModal = ({ doc, patient, onClose, onSent }) => {
  const [formDocs, setFormDocs] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(doc?.id ?? '');
  const [selectedFormTitle, setSelectedFormTitle] = useState(doc?.title ?? '');
  const [recipientName,  setRecipientName]  = useState(patient?.name ?? '');
  const [recipientEmail, setRecipientEmail] = useState(patient?.contact?.email ?? '');
  const [recipientPhone, setRecipientPhone] = useState(patient?.contact?.phone ?? '');
  const [method, setMethod]   = useState('email');
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null); // { token, url }
  const [sendStatus, setSendStatus] = useState(null); // null | 'sending' | 'sent' | 'failed' | 'not_configured'
  const [sendError,  setSendError]  = useState('');
  const urlInputRef = useRef(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (doc) return;
    fetchDocuments()
      .then(list => setFormDocs((list ?? []).filter(d => d.folder === 'forms')))
      .catch(() => {});
  }, [doc]);

  const selectedForm = doc ?? formDocs.find(d => d.id === selectedFormId);

  function handleFormSelect(e) {
    const d = formDocs.find(x => x.id === e.target.value);
    setSelectedFormId(e.target.value);
    setSelectedFormTitle(d?.title ?? '');
  }

  async function handleSend() {
    if (!selectedFormId || !recipientName.trim()) return;
    setSending(true);
    try {
      const res = await createPatientFormLink({
        patientId:      patient?.id ?? '',
        patientName:    patient?.name ?? recipientName.trim(),
        recipientName:  recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim(),
        method,
        formId:    selectedFormId,
        formTitle: selectedFormTitle,
      });
      const url = fillUrl(res.token);
      setResult({ token: res.token, url });
      onSent?.(res);

      // Auto-send via Twilio/SendGrid for email and sms methods
      if (method === 'email' || method === 'sms') {
        setSendStatus('sending');
        try {
          await sendFormLink(res.token);
          setSendStatus('sent');
        } catch (err) {
          const msg = err?.message ?? '';
          setSendError(msg);
          setSendStatus(msg.toLowerCase().includes('not configured') ? 'not_configured' : 'failed');
        }
      }
    } catch { /* silent */ } finally { setSending(false); }
  }

  function copyText(text) {
    // Must run synchronously inside the click handler — async .then()/.catch() lose the user-gesture context
    const el = document.createElement('input');
    el.value = text;
    el.style.cssText = 'position:absolute;opacity:0;top:0;left:0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, 99999);
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(el);
    // Also fire modern API in parallel (wins if secure context; silent fail otherwise)
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function copyLink() {
    const input = urlInputRef.current;
    if (input) {
      input.focus();
      input.select();
      input.setSelectionRange(0, 99999);
      try { document.execCommand('copy'); } catch {}
      navigator.clipboard?.writeText(input.value).catch(() => {});
    } else {
      copyText(result.url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function emailLink() {
    const subj = encodeURIComponent(`Please complete: ${selectedFormTitle}`);
    const body = encodeURIComponent(
      `Hi ${recipientName},\n\nPlease complete the following form at your convenience:\n\n${result.url}\n\nThis is a one-time link. Once submitted, the link will expire.\n\nThank you.`
    );
    window.open(`mailto:${recipientEmail}?subject=${subj}&body=${body}`);
  }

  function smsText() {
    return `Hi ${recipientName}, please complete your form here: ${result.url}`;
  }

  // ── Sent confirmation ──────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="drawer-head">
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Send form</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{selectedFormTitle}</div>
          </div>
          <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', flex: 1, padding: '28px 24px' }}>

          {/* Send status banner */}
          {sendStatus === 'sending' && (
            <div style={{ width: '100%', background: 'var(--info-soft,#eff6ff)', border: '1px solid var(--info,#3b82f6)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--info,#2563eb)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="activity" size={14} />Sending {method === 'email' ? 'email' : 'SMS'} to {recipientName}…
            </div>
          )}
          {sendStatus === 'sent' && (
            <div style={{ width: '100%', background: 'var(--good-soft)', border: '1px solid var(--good)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--good)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={14} />{method === 'email' ? 'Email sent' : 'SMS sent'} to {recipientName}
            </div>
          )}
          {sendStatus === 'failed' && (
            <div style={{ width: '100%', background: 'var(--bad-soft)', border: '1px solid var(--bad)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--bad)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="alert" size={14} />Send failed — use the link below to deliver manually.</div>
              {sendError && <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', opacity: 0.85 }}>{sendError}</div>}
            </div>
          )}
          {sendStatus === 'not_configured' && (
            <div style={{ width: '100%', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="cog" size={14} />Twilio not configured — configure in Settings → Integrations, or use the link below.
            </div>
          )}

          {sendStatus !== 'sent' && (
            <>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--good-soft)', display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={22} style={{ color: 'var(--good)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Form link created</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>For {recipientName}</div>
              </div>

              {/* Link display */}
              <div style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>One-time fill link</div>
                <input
                  ref={urlInputRef}
                  readOnly
                  value={result.url}
                  onFocus={e => e.target.select()}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: 11, padding: '6px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink-1)', marginBottom: 10, boxSizing: 'border-box', cursor: 'text' }}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={copyLink}>
                    <Icon name={copied ? 'check' : 'copy'} size={12} />{copied ? 'Copied!' : 'Copy link'}
                  </button>
                  {method === 'email' && (
                    <button className="btn" style={{ fontSize: 11 }} onClick={emailLink}>
                      <Icon name="mail" size={12} />Open email draft
                    </button>
                  )}
                  {method === 'sms' && (
                    <button className="btn" style={{ fontSize: 11 }} onClick={() => {
                      copyText(smsText());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}>
                      <Icon name="copy" size={12} />{copied ? 'Copied!' : 'Copy SMS text'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {sendStatus === 'sent' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{method === 'email' ? 'Email sent' : 'SMS sent'}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>The recipient will receive a link to complete the form. Results will appear in the patient's Forms tab once submitted.</div>
            </div>
          )}

          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  // ── Compose ────────────────────────────────────────────────────────────────
  const canSend = selectedFormId && recipientName.trim() && (
    method === 'link' || (method === 'email' && recipientEmail.trim()) || (method === 'sms' && recipientPhone.trim())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="drawer-head">
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Patient forms</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Send form to patient</div>
        </div>
        <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">
        {/* Form selector */}
        {!doc && (
          <div className="form-field">
            <label className="form-label">Form</label>
            <select className="form-input" value={selectedFormId} onChange={handleFormSelect}>
              <option value="">— select a form —</option>
              {formDocs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
        )}
        {doc && (
          <div className="form-field">
            <label className="form-label">Form</label>
            <div style={{ fontSize: 13, fontWeight: 500, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
              {doc.title}
            </div>
          </div>
        )}

        {/* Recipient */}
        <div className="form-field">
          <label className="form-label">Recipient name</label>
          <input className="form-input" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Patient or carer name" />
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="recipient@example.com" />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Mobile</label>
            <input className="form-input" type="tel" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="04xx xxx xxx" />
          </div>
        </div>

        {/* Method */}
        <div className="form-field">
          <label className="form-label">Delivery method</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {METHOD_OPTIONS.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
                  border: `2px solid ${method === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: method === m.id ? 'var(--accent-soft)' : 'var(--surface)',
                  color: method === m.id ? 'var(--accent-ink)' : 'var(--ink-2)',
                }}
              >
                <Icon name={m.icon} size={18} />
                {m.label}
              </button>
            ))}
          </div>
          {method === 'email' && !recipientEmail && (
            <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>Add an email address to send via email.</div>
          )}
          {method === 'sms' && !recipientPhone && (
            <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>Add a mobile number to send via SMS.</div>
          )}
        </div>

        <div style={{ paddingTop: 8, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSend} disabled={!canSend || sending}>
            <Icon name={method === 'email' ? 'mail' : method === 'sms' ? 'phone' : 'paper'} size={14} />
            {sending
              ? (method === 'email' ? 'Sending email…' : method === 'sms' ? 'Sending SMS…' : 'Creating link…')
              : (method === 'email' ? 'Send email' : method === 'sms' ? 'Send SMS' : 'Generate link')}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6 }}>
          A one-time fill link will be generated. Copy it to send via your email client or messaging app.
        </div>
      </div>
    </div>
  );
};

export default PatientFormSendModal;
