import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Drawer } from '../components';
import DocViewer from '../doc-viewer';
import DocUploadDrawer from '../doc-upload-drawer';
import DocDetailDrawer from '../doc-detail-drawer';
import { useAuth } from '../AuthContext';
import { useNexusData } from '../NexusDataContext';
import { searchDocumentContent } from '../api';

// --- Workflow helpers -------------------------------------------------------
function mkWorkflow(steps) {
  return steps.map((s, i) => ({
    step: s.step, who: s.who, date: s.date || '—',
    done: !!s.done, active: !!s.active, rejected: !!s.rejected,
    comment: s.comment || '',
  }));
}

function defaultWorkflow(owner, activeStandard) {
  const approver = activeStandard === 'aasm' ? 'Site Director' : 'Dr. R. Okafor';
  const issuer   = activeStandard === 'aasm' ? 'Quality Manager' : 'K. Patel';
  return mkWorkflow([
    { step: 'Draft',           who: owner || 'Author', date: 'today', done: true,  active: false },
    { step: 'Peer review',     who: '—',                               done: false, active: true  },
    { step: 'Approval',        who: approver,                          done: false, active: false },
    { step: 'Issue',           who: issuer,                            done: false, active: false },
    { step: 'Periodic review', who: '+24 mo',                         done: false, active: false },
  ]);
}

// --- Seed data ---------------------------------------------------------------
const SEED_DOCS = [
  {
    id: 'SOP-PSG-031', title: 'Pre-study bio-signal verification',
    v: '3.2', status: 'Issued', folder: 'sops', reviewDue: '12 Mar 2027',
    owner: 'M. Chen', clauses: ['5.3.4','5.5.2'], updated: '21 Apr 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'M. Chen',       date: '01 Mar 2026', done: true },
      { step: 'Peer review',     who: 'K. Patel',      date: '08 Mar 2026', done: true,  comment: 'Reviewed — no issues.' },
      { step: 'Approval',        who: 'Dr. R. Okafor', date: '12 Mar 2026', done: true,  comment: 'Approved for issue.' },
      { step: 'Issue',           who: 'K. Patel',      date: '21 Apr 2026', done: true  },
      { step: 'Periodic review', who: '+24 mo',        date: '12 Mar 2027'              },
    ]),
  },
  {
    id: 'SOP-PSG-014', title: 'Adult attended PSG protocol',
    v: '3.2', status: 'Issued', folder: 'sops', reviewDue: '08 Jul 2026',
    owner: 'Dr. R. Okafor', clauses: ['5.5.3'], updated: '14 Apr 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'Dr. R. Okafor', date: '01 Mar 2026', done: true },
      { step: 'Peer review',     who: 'M. Chen',       date: '10 Mar 2026', done: true, comment: 'Reviewed.' },
      { step: 'Approval',        who: 'Dr. R. Okafor', date: '15 Mar 2026', done: true },
      { step: 'Issue',           who: 'K. Patel',      date: '14 Apr 2026', done: true },
      { step: 'Periodic review', who: '+24 mo',        date: '08 Jul 2027'             },
    ]),
  },
  {
    id: 'SOP-PED-007', title: 'Paediatric attended PSG protocol',
    v: '2.1', status: 'Issued', folder: 'sops', reviewDue: '22 Sep 2026',
    owner: 'Dr. L. Hartono', clauses: ['5.5.3.2','5.8.5'], updated: '18 Mar 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'Dr. L. Hartono', date: '01 Feb 2026', done: true },
      { step: 'Peer review',     who: 'M. Chen',        date: '10 Feb 2026', done: true },
      { step: 'Approval',        who: 'Dr. R. Okafor',  date: '18 Feb 2026', done: true },
      { step: 'Issue',           who: 'K. Patel',       date: '18 Mar 2026', done: true },
      { step: 'Periodic review', who: '+24 mo',         date: '22 Sep 2027'             },
    ]),
  },
  {
    id: 'SOP-EQP-004', title: 'Equipment acceptance testing',
    v: '1.4', status: 'Issued', folder: 'sops', reviewDue: '01 Jun 2026',
    owner: 'M. Chen', clauses: ['5.3.2'], updated: '30 Mar 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'M. Chen',       date: '01 Feb 2026', done: true },
      { step: 'Peer review',     who: 'K. Patel',      date: '10 Feb 2026', done: true },
      { step: 'Approval',        who: 'Dr. R. Okafor', date: '20 Feb 2026', done: true },
      { step: 'Issue',           who: 'K. Patel',      date: '30 Mar 2026', done: true },
      { step: 'Periodic review', who: '+24 mo',        date: '01 Jun 2028'             },
    ]),
  },
  {
    // Returned to author — rejection example
    id: 'SOP-EQP-012', title: 'Decontamination of removed equipment',
    v: '2.0', status: 'Draft', folder: 'sops', reviewDue: 'Overdue 8d',
    owner: 'M. Chen', clauses: ['5.3.5'], updated: '09 May 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'M. Chen',       date: '09 May 2026', active: true },
      { step: 'Peer review',     who: 'K. Patel',      date: '05 May 2026', rejected: true, comment: 'Section 4.2 incomplete — mobile equipment decon procedure missing. Please revise before resubmission.' },
      { step: 'Approval',        who: 'Dr. R. Okafor'                                                                                                                                                         },
      { step: 'Issue',           who: 'K. Patel'                                                                                                                                                              },
      { step: 'Periodic review', who: '+24 mo'                                                                                                                                                                },
    ]),
  },
  {
    // Awaiting peer review — just submitted
    id: 'SOP-EMG-001', title: 'Emergency & escalation protocol',
    v: '4.0', status: 'Under review', folder: 'sops', reviewDue: '—',
    owner: 'K. Patel', clauses: ['5.5.1'], updated: '10 May 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'K. Patel',      date: '10 May 2026', done: true, comment: 'Revised per new BLS requirements and expanded escalation criteria.' },
      { step: 'Peer review',     who: 'M. Chen',       active: true                                                                                                   },
      { step: 'Approval',        who: 'Dr. R. Okafor'                                                                                                                 },
      { step: 'Issue',           who: 'K. Patel'                                                                                                                      },
      { step: 'Periodic review', who: '+24 mo'                                                                                                                        },
    ]),
  },
  {
    id: 'SOP-CPAP-002', title: 'Split-night titration protocol',
    v: '1.2', status: 'Issued', folder: 'sops', reviewDue: '15 Jan 2027',
    owner: 'Dr. R. Okafor', clauses: ['5.5.3.4'], updated: '20 Feb 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'Dr. R. Okafor', date: '01 Jan 2026', done: true },
      { step: 'Peer review',     who: 'M. Chen',       date: '10 Jan 2026', done: true },
      { step: 'Approval',        who: 'Dr. R. Okafor', date: '18 Jan 2026', done: true },
      { step: 'Issue',           who: 'K. Patel',      date: '20 Feb 2026', done: true },
      { step: 'Periodic review', who: '+24 mo',        date: '15 Jan 2028'             },
    ]),
  },
  {
    id: 'POL-QMS-001', title: 'Quality policy',
    v: '2.3', status: 'Issued', folder: 'policies', reviewDue: '31 Dec 2026',
    owner: 'Dr. R. Okafor', clauses: ['4.2.1'], updated: '15 Jan 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'Dr. R. Okafor', date: '10 Jan 2026', done: true },
      { step: 'Peer review',     who: 'K. Patel',      date: '12 Jan 2026', done: true },
      { step: 'Approval',        who: 'Dr. R. Okafor', date: '14 Jan 2026', done: true },
      { step: 'Issue',           who: 'K. Patel',      date: '15 Jan 2026', done: true },
      { step: 'Periodic review', who: '+24 mo',        date: '31 Dec 2027'             },
    ]),
  },
  {
    id: 'POL-CONF-002', title: 'Confidentiality & data handling',
    v: '1.5', status: 'Issued', folder: 'policies', reviewDue: '20 Nov 2026',
    owner: 'K. Patel', clauses: ['4.1.6','4.13'], updated: '20 Nov 2025',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'K. Patel',      date: '01 Nov 2025', done: true },
      { step: 'Peer review',     who: 'Dr. R. Okafor', date: '10 Nov 2025', done: true },
      { step: 'Approval',        who: 'Dr. R. Okafor', date: '15 Nov 2025', done: true },
      { step: 'Issue',           who: 'K. Patel',      date: '20 Nov 2025', done: true },
      { step: 'Periodic review', who: '+24 mo',        date: '20 Nov 2027'             },
    ]),
  },
  {
    // Awaiting approval — peer review complete
    id: 'POL-VAL-003', title: 'Validation & verification policy',
    v: '1.0', status: 'Under review', folder: 'policies', reviewDue: 'Overdue 14d',
    owner: 'M. Chen', clauses: ['5.3'], updated: '20 Apr 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'M. Chen',       date: '01 Mar 2026', done: true, comment: 'Initial version per new equipment fleet scope.' },
      { step: 'Peer review',     who: 'K. Patel',      date: '20 Apr 2026', done: true, comment: 'Reviewed — scope updated, OK to proceed to approval.' },
      { step: 'Approval',        who: 'Dr. R. Okafor', active: true                                                                                   },
      { step: 'Issue',           who: 'K. Patel'                                                                                                      },
      { step: 'Periodic review', who: '+24 mo'                                                                                                        },
    ]),
  },
  {
    id: 'FRM-CoI-2026', title: 'Conflict of interest declaration 2026',
    v: '—', status: 'Live form', folder: 'forms', reviewDue: 'Annual',
    owner: 'K. Patel', clauses: ['4.1.5'], updated: '01 Jan 2026',
  },
  {
    id: 'MAN-QMS-001', title: 'Quality manual',
    v: '5.1', status: 'Issued', folder: 'manual', reviewDue: '12 Aug 2026',
    owner: 'Dr. R. Okafor', clauses: ['4.2'], updated: '10 Feb 2026',
    workflow: mkWorkflow([
      { step: 'Draft',           who: 'Dr. R. Okafor', date: '01 Jan 2026', done: true },
      { step: 'Peer review',     who: 'K. Patel',      date: '20 Jan 2026', done: true },
      { step: 'Approval',        who: 'Dr. R. Okafor', date: '05 Feb 2026', done: true },
      { step: 'Issue',           who: 'K. Patel',      date: '10 Feb 2026', done: true },
      { step: 'Periodic review', who: '+24 mo',        date: '12 Aug 2028'             },
    ]),
  },
].map(d => ({ fileType: null, fileUrl: null, fileName: null, htmlContent: null, ...d }));

const BASE_API = import.meta.env.VITE_API_URL ?? '';

function normaliseDocument(d) {
  let workflow = [];
  try { workflow = d.workflow ? JSON.parse(d.workflow) : []; } catch {}
  return {
    id:        d.docId,
    title:     d.title,
    v:         d.version,
    status:    d.status,
    folder:    d.folder,
    owner:     d.owner,
    clauses:   d.clauses ? d.clauses.split(',').map(c => c.trim()).filter(Boolean) : [],
    reviewDue: d.reviewDue,
    updated:   d.updated,
    fileType:  d.fileType  ?? null,
    fileName:  d.fileName  ?? null,
    fileUrl:   d.hasFile   ? `${BASE_API}/api/documents/${encodeURIComponent(d.docId)}/file` : null,
    htmlContent: null,
    workflow,
  };
}

const FOLDER_META = [
  { id: 'all',      name: 'All documents', icon: 'file'      },
  { id: 'manual',   name: 'Quality manual',icon: 'book'      },
  { id: 'policies', name: 'Policies',      icon: 'shield'    },
  { id: 'sops',     name: 'SOPs',          icon: 'file'      },
  { id: 'forms',    name: 'Forms',         icon: 'clipboard' },
  { id: 'records',  name: 'Records',       icon: 'paper'     },
  { id: 'obsolete', name: 'Archived',      icon: 'x'         },
];

// AASM-specific ID prefixes (network/clinic/lab/hsat/dme sections)
const AASM_PREFIXES = ['POL-NET', 'POL-CLI', 'POL-LAB', 'POL-HST', 'POL-DME', 'PRO-LAB', 'PRO-HST', 'FRM-AASM'];

// Prefixes that apply to both ASA and AASM modes (cross-cutting QMS/HR/data documents)
const CROSS_CUTTING_PREFIXES = ['SOP-QMS', 'SOP-HR', 'SOP-DATA', 'FRM-027', 'FRM-028'];

// Returns 'aasm', 'asa', or 'both'
function docStandard(id = '') {
  if (CROSS_CUTTING_PREFIXES.some(p => id.startsWith(p))) return 'both';
  return AASM_PREFIXES.some(p => id.startsWith(p)) ? 'aasm' : 'asa';
}

const STATUS_KIND = { Issued: 'good', Draft: 'outline', 'Under review': 'warn', 'Live form': 'info', Obsolete: 'bad' };

const STEP_PERM = [null, 'canPeerReviewDoc', 'canApproveDoc', 'canIssueDoc'];

// --- Component ---------------------------------------------------------------
const DocumentsPage = () => {
  const { hasPerm } = useAuth();
  const { activeStandard } = useNexusData();
  const [contentResults, setContentResults] = React.useState(null); // null=idle, []=no results, [...]
  const [contentSearching, setContentSearching] = React.useState(false);
  const [docs, setDocs]           = useState(SEED_DOCS);
  const [folder, setFolder]       = useState('all');
  const [search, setSearch]       = useState('');
  const [detailDocId, setDetailDocId] = useState(null);
  const [viewingDoc,  setViewingDoc]  = useState(null);
  const [uploadPrefill, setUploadPrefill] = useState(null);
  const [uploadOpen,    setUploadOpen]    = useState(false);

  // Load from server; fall back to SEED_DOCS if API is unavailable
  const loadDocs = useCallback(() => {
    const tok = localStorage.getItem('nexus_token');
    if (!tok) return Promise.resolve();
    return fetch(`${BASE_API}/api/documents`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(list => { if (list?.length) setDocs(list.map(normaliseDocument)); })
      .catch(() => {});
  }, []);
  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleFormSaved = useCallback(() => {
    loadDocs().then(() => setFolder('records'));
  }, [loadDocs]);

  // Debounced content search — fires 500ms after the user stops typing (3+ chars)
  React.useEffect(() => {
    if (search.length < 3) { setContentResults(null); return; }
    setContentSearching(true);
    const timer = setTimeout(() => {
      searchDocumentContent(search)
        .then(results => setContentResults(results ?? []))
        .catch(() => setContentResults([]))
        .finally(() => setContentSearching(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const detailDoc = docs.find(d => d.id === detailDocId) || null;

  // Only show documents belonging to the active standard; records and cross-cutting QMS docs show in both
  const standardDocs = useMemo(
    () => docs.filter(d => {
      if (d.folder === 'records') return true;
      const std = docStandard(d.id);
      return std === 'both' || std === (activeStandard ?? 'asa');
    }),
    [docs, activeStandard]
  );

  const folderCounts = useMemo(() => {
    const map = {};
    FOLDER_META.forEach(f => { map[f.id] = 0; });
    standardDocs.forEach(d => { map[d.folder] = (map[d.folder] || 0) + 1; });
    map.all = standardDocs.length;
    return map;
  }, [standardDocs]);

  const visibleDocs = useMemo(() => {
    const q = search.toLowerCase();
    return standardDocs.filter(d => {
      const matchFolder = folder === 'all' || d.folder === folder;
      const matchSearch = !q || d.id.toLowerCase().includes(q) || d.title.toLowerCase().includes(q) || (d.owner || '').toLowerCase().includes(q);
      return matchFolder && matchSearch;
    });
  }, [standardDocs, folder, search]);

  const overdueCount   = standardDocs.filter(d => d.reviewDue?.includes('Overdue')).length;
  const draftCount     = standardDocs.filter(d => d.status === 'Draft' || d.status === 'Under review').length;
  const awaitingCount  = standardDocs.filter(d => {
    const wf = d.workflow || [];
    return wf.some(s => s.active && !s.done);
  }).length;

  const handleUpdateDoc = (updated) => {
    setDocs(prev => prev.map(d => d.id === updated.id ? updated : d));
    // Persist workflow and status changes to the server
    const tok = localStorage.getItem('nexus_token');
    const ah  = tok ? { Authorization: `Bearer ${tok}` } : {};
    fetch(`${BASE_API}/api/documents/${encodeURIComponent(updated.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...ah },
      body: JSON.stringify({
        title:     updated.title,
        version:   updated.v,
        status:    updated.status,
        folder:    updated.folder,
        owner:     updated.owner,
        clauses:   (updated.clauses || []).join(','),
        reviewDue: updated.reviewDue || '—',
        updated:   updated.updated || '',
        workflow:  JSON.stringify(updated.workflow || []),
      }),
    }).catch(() => {});
  };

  const openUpload = (prefill) => { setUploadPrefill(prefill ?? null); setUploadOpen(true); };
  const closeUpload = () => setUploadOpen(false);

  const handleSaveDoc = async (saved) => {
    const isAttach = !!(uploadPrefill?.id);

    if (isAttach) {
      // Attach or replace file on an existing document
      if (saved.rawFile) {
        const fd = new FormData();
        fd.append('file', saved.rawFile);
        const tok2 = localStorage.getItem('nexus_token');
        const res = await fetch(
          `${BASE_API}/api/documents/${encodeURIComponent(uploadPrefill.id)}/file`,
          { method: 'POST', body: fd, headers: tok2 ? { Authorization: `Bearer ${tok2}` } : {} }
        );
        if (res.ok) {
          const updated = normaliseDocument(await res.json());
          setDocs(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
          setViewingDoc(updated);
        }
      }
    } else {
      // Create a new document
      const fd = new FormData();
      fd.append('docId',     saved.id);
      fd.append('title',     saved.title);
      fd.append('version',   saved.v || '1.0');
      fd.append('status',    saved.status || 'Draft');
      fd.append('folder',    saved.folder || 'sops');
      fd.append('owner',     saved.owner || '');
      fd.append('clauses',   (saved.clauses || []).join(','));
      fd.append('reviewDue', saved.reviewDue || '—');
      fd.append('workflow',  JSON.stringify(defaultWorkflow(saved.owner, activeStandard)));
      if (saved.rawFile) fd.append('file', saved.rawFile);

      const tok3 = localStorage.getItem('nexus_token');
      const res = await fetch(`${BASE_API}/api/documents`, { method: 'POST', body: fd, headers: tok3 ? { Authorization: `Bearer ${tok3}` } : {} });
      if (res.ok) {
        const created = normaliseDocument(await res.json());
        setDocs(prev => [created, ...prev]);
        setDetailDocId(created.id);
      }
    }

    closeUpload();
  };

  // Determine active step for a doc (for showing in the table)
  const getActiveStep = (doc) => {
    if (!doc.workflow) return null;
    const idx = doc.workflow.findIndex(s => s.active && !s.done);
    return idx >= 0 ? doc.workflow[idx] : null;
  };

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow={activeStandard === 'aasm' ? 'Compliance · AASM S-4' : 'Compliance · cl. 4.2, 4.3'}
        title="Documents & SOPs"
        subtitle={activeStandard === 'aasm'
          ? 'AASM accreditation policies, protocols and forms · controlled, versioned, audited'
          : 'Quality manual → policies → SOPs → forms → records · controlled, versioned, audited'
        }
        actions={
          hasPerm('canUploadDoc') ? (
            <>
              <button className="btn" onClick={() => openUpload()}>
                <Icon name="upload" size={14} />Upload
              </button>
              <button className="btn btn-primary" onClick={() => openUpload()}>
                <Icon name="plus" size={14} />New document
              </button>
            </>
          ) : null
        }
      />

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="file" size={13} />Controlled documents</div>
          <div className="stat-value">{standardDocs.length}</div>
          <div className="stat-meta">{activeStandard === 'aasm' ? 'AASM standard' : 'ASA standard'}</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="clock" size={13} />Awaiting action</div>
          <div className="stat-value" style={{ color: awaitingCount ? 'var(--warn)' : 'var(--good)' }}>{awaitingCount}</div>
          <div className="stat-meta">in approval workflow</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Overdue review</div>
          <div className="stat-value" style={{ color: overdueCount ? 'var(--bad)' : 'var(--good)' }}>{overdueCount}</div>
          <div className="stat-meta">{overdueCount ? 'requires attention' : 'all reviews current'}</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="edit" size={13} />In progress</div>
          <div className="stat-value">{draftCount}</div>
          <div className="stat-meta">draft or under review</div>
        </div>
      </div>

      {/* Folder tree + doc table */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18 }}>

        {/* Folder tree */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 10 }}>
              {activeStandard === 'aasm' ? 'AASM document library' : 'QMS hierarchy'}
            </div>
            {FOLDER_META.map(f => (
              <div key={f.id}
                onClick={() => setFolder(f.id)}
                className={`nav-item ${folder === f.id ? 'active' : ''}`}
                style={{ fontSize: 13, marginBottom: 2 }}>
                <span className="icon"><Icon name={f.icon} size={14} /></span>
                <span style={{ flex: 1 }}>{f.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{folderCounts[f.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document table */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              {FOLDER_META.find(f => f.id === folder)?.name ?? 'Documents'}
              {search && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 8 }}>
                — {visibleDocs.length} result{visibleDocs.length !== 1 ? 's' : ''}
              </span>}
            </div>
            <div className="topbar-spacer" />
            <div className="search" style={{ width: 220 }}
              onClick={e => e.currentTarget.querySelector('input')?.focus()}>
              <Icon name="search" size={12} />
              <input
                style={{ border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontSize: 12, color: 'var(--ink)', width: '100%' }}
                placeholder="Search title or content…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {contentSearching && <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>searching…</span>}
              {search && (
                <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0 }}
                  onClick={e => { e.stopPropagation(); setSearch(''); setContentResults(null); }}>
                  <Icon name="x" size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Content search results */}
          {contentResults !== null && (
            <div style={{ borderBottom: '2px solid var(--accent)', background: 'var(--accent-soft)', padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-ink)', marginBottom: contentResults.length ? 10 : 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="search" size={12} />
                {contentResults.length === 0
                  ? `No documents contain "${search}" in their content`
                  : `${contentResults.length} document${contentResults.length > 1 ? 's' : ''} contain "${search}" in content`
                }
              </div>
              {contentResults.map(r => (
                <div key={r.docId}
                  onClick={() => { setDetailDocId(r.docId); }}
                  style={{ padding: '8px 10px', marginBottom: 6, background: 'var(--surface)', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-ink)' }}>{r.docId}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{r.title}</span>
                    <Pill kind={STATUS_KIND[r.status] || 'outline'}>{r.status}</Pill>
                    <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 'auto', textTransform: 'capitalize' }}>{r.folder}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                    {/* Highlight matching term in snippet */}
                    {r.snippet?.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i')).map((part, i) =>
                      part.toLowerCase() === search.toLowerCase()
                        ? <mark key={i} style={{ background: '#fef08a', color: '#1f2933', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
                        : part
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {visibleDocs.length === 0 ? (
            <div className="empty">No documents match your filter.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Doc ID</th><th>Title</th><th>Ver.</th><th>Status</th>
                  <th>Workflow step</th><th>Review due</th>
                </tr>
              </thead>
              <tbody>
                {visibleDocs.map(d => {
                  const activeStep = getActiveStep(d);
                  return (
                    <tr key={d.id} className="row-clickable" onClick={() => setDetailDocId(d.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {d.fileType && (
                            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3,
                              background: d.fileType === 'pdf' ? 'var(--bad-soft)' : 'var(--info-soft)',
                              color:      d.fileType === 'pdf' ? 'var(--bad)'      : 'var(--info)',
                              fontWeight: 600, fontFamily: 'monospace' }}>
                              {d.fileType.toUpperCase()}
                            </span>
                          )}
                          <span className="mono" style={{ fontWeight: 500 }}>{d.id}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{d.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{d.owner} · Updated {d.updated}</div>
                      </td>
                      <td className="mono">v{d.v}</td>
                      <td><Pill kind={STATUS_KIND[d.status] || 'outline'} dot>{d.status}</Pill></td>
                      <td>
                        {activeStep ? (
                          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                            {activeStep.step}
                            {activeStep.who && activeStep.who !== '—' && (
                              <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>· {activeStep.who}</span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>
                            {d.status === 'Issued' ? '✓ Issued' : d.status === 'Live form' ? 'Live' : '—'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: d.reviewDue?.includes('Overdue') ? 'var(--bad)' : 'var(--ink-3)' }}>
                          {d.reviewDue}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Document detail + workflow drawer */}
      <Drawer open={!!detailDocId} onClose={() => setDetailDocId(null)}>
        {detailDoc && (
          <DocDetailDrawer
            key={detailDoc.id}
            doc={detailDoc}
            onUpdate={handleUpdateDoc}
            onClose={() => setDetailDocId(null)}
            onView={() => setViewingDoc(detailDoc)}
            onEdit={() => { setDetailDocId(null); openUpload(detailDoc); }}
          />
        )}
      </Drawer>

      {/* Document content viewer */}
      {viewingDoc && (
        <DocViewer
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onAttach={(doc) => { setViewingDoc(null); openUpload(doc); }}
          onFormSaved={handleFormSaved}
        />
      )}

      {/* Upload / attach drawer */}
      <Drawer open={uploadOpen} onClose={closeUpload}>
        <DocUploadDrawer
          prefill={uploadPrefill}
          onSave={handleSaveDoc}
          onClose={closeUpload}
        />
      </Drawer>
    </div>
  );
};

export default DocumentsPage;
