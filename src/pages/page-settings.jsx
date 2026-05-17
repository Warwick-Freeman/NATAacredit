import React, { useState, useEffect } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs, Drawer } from '../components';
import { useAuth, ROLE_LEVEL, ROLE_PERMISSIONS } from '../AuthContext';
import UserFormDrawer from '../user-form-drawer';
import { useNexusData } from '../NexusDataContext';
import { fetchRooms, createRoom, updateRoom, deleteRoom } from '../api';

// ─── Toggle switch ─────────────────────────────────────────────────────────────

const Toggle = ({ on, onChange, disabled }) => (
  <div
    onClick={() => !disabled && onChange(!on)}
    style={{
      width: 36, height: 20, borderRadius: 10,
      background: on ? 'var(--accent)' : 'var(--surface-3)',
      position: 'relative', cursor: disabled ? 'default' : 'pointer',
      transition: 'background 0.2s', flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16,
      borderRadius: 8, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      transition: 'left 0.2s',
    }} />
  </div>
);

// ─── Seed data ─────────────────────────────────────────────────────────────────

const SEED_SITES = [
  { id: 1, code: 'RML', name: 'Riverside Main Lab',       type: 'Adult attended PSG · CPAP · MSLT/MWT',          beds: 6  },
  { id: 2, code: 'EPL', name: 'Eastside Paediatric Lab',  type: 'Paediatric attended PSG · NIV',                  beds: 3  },
  { id: 3, code: 'HSN', name: 'Home Service – North',     type: 'Type 2/3/4 HSAT · CPAP follow-up',              beds: '—'},
];

const SEED_INTEGRATIONS = [
  { id: 1,  name: 'Compumedics ProFusion',      cat: 'PSG software',         on: true,  apiKey: 'cpf_live_sk_4e...a91c', lastSync: '3 min ago',    webhook: 'https://api.nexus360.com/ingest/cpf' },
  { id: 2,  name: 'Philips Sleepware G3',       cat: 'PSG software',         on: true,  apiKey: 'slw_live_sk_7b...c44d', lastSync: '8 min ago',    webhook: 'https://api.nexus360.com/ingest/slw' },
  { id: 3,  name: 'Natus SleepWorks',           cat: 'PSG software',         on: false, apiKey: '',                      lastSync: '—',            webhook: '' },
  { id: 4,  name: 'ResMed AirView',             cat: 'CPAP cloud',           on: true,  apiKey: 'rsm_live_sk_9a...f02b', lastSync: '12 min ago',   webhook: '' },
  { id: 5,  name: 'Philips Care Orchestrator',  cat: 'CPAP cloud',           on: true,  apiKey: 'pco_live_sk_2c...b88e', lastSync: '12 min ago',   webhook: '' },
  { id: 6,  name: 'FHIR R4 endpoint',           cat: 'Interoperability',     on: true,  apiKey: 'fhir_live_sk_5d...311f', lastSync: '1 h ago',     webhook: 'https://api.nexus360.com/fhir/r4' },
  { id: 7,  name: 'HealthLink secure messaging',cat: 'Secure messaging',     on: true,  apiKey: 'hlk_live_sk_3e...aa7c', lastSync: '22 min ago',   webhook: '' },
  { id: 8,  name: 'Argus secure messaging',     cat: 'Secure messaging',     on: false, apiKey: '',                      lastSync: '—',            webhook: '' },
  { id: 9,  name: 'DocuSign',                   cat: 'e-Signature',          on: true,  apiKey: 'dcs_live_sk_8f...d61a', lastSync: '2 h ago',      webhook: 'https://api.nexus360.com/hook/dcs' },
  { id: 10, name: 'TGA adverse event export',   cat: 'Regulatory',           on: true,  apiKey: 'tga_live_sk_1a...c50b', lastSync: '1 d ago',      webhook: '' },
  { id: 11, name: 'Okta SSO (OIDC)',            cat: 'Identity',             on: true,  apiKey: 'okta_live_sk_6b...e99d', lastSync: 'live',        webhook: 'https://api.nexus360.com/sso/okta' },
  { id: 12, name: 'Sentry',                     cat: 'Observability',        on: true,  apiKey: 'sentry_live_sk_0c...12af', lastSync: 'live',      webhook: '' },
];

const SEED_RETENTION = [
  { id: 1, type: 'Final report (PDF/A)',              period: 'Health-record period (7 yr adult, 25 yr paeds)', storage: 'S3 ap-southeast-2', lock: true  },
  { id: 2, type: 'Raw PSG signal data',               period: 'Until reporting complete (min 12 mo)',           storage: 'S3 ap-southeast-2', lock: true  },
  { id: 3, type: 'Video/audio recording',             period: 'Until final report (longer if diagnostic)',      storage: 'S3 ap-southeast-2', lock: true  },
  { id: 4, type: 'Equipment records',                 period: 'Life of equipment + 7 years',                   storage: 'Postgres + S3',     lock: false },
  { id: 5, type: 'Audit trail entries',               period: 'Indefinite · append-only hash chain',           storage: 'Postgres',           lock: true  },
  { id: 6, type: 'Training records',                  period: 'Duration of employment + 7 years',              storage: 'Postgres',           lock: false },
  { id: 7, type: 'Quality records (NCs, audits)',     period: '10 years',                                      storage: 'Postgres + S3',     lock: true  },
  { id: 8, type: 'Patient feedback',                  period: '5 years',                                       storage: 'Postgres',           lock: false },
];

const SECURITY_EVENTS = [
  { who: 'K. Patel',       event: 'Sign in',               method: 'Okta SSO + TOTP', time: 'now',          ip: '203.0.113.45',  ok: true  },
  { who: 'Dr. R. Okafor', event: 'Sign in',               method: 'Okta SSO + TOTP', time: '1 h ago',      ip: '203.0.113.45',  ok: true  },
  { who: 'M. Chen',        event: 'Sign in',               method: 'Okta SSO + TOTP', time: '5 h ago',      ip: '203.0.113.62',  ok: true  },
  { who: 'A. Singh',       event: 'Sign in',               method: 'Okta SSO + TOTP', time: 'yesterday',    ip: '203.0.113.58',  ok: true  },
  { who: 'J. Roy',         event: 'Sign in',               method: 'Local + TOTP',    time: '16 Mar 2026',  ip: '198.51.100.22', ok: true  },
  { who: 'Unknown',        event: 'Failed sign-in attempt','method': '—',             time: '2 days ago',   ip: '185.220.101.44',ok: false },
];

const PERM_LABELS = {
  canCreateDoc:     'Create documents',
  canUploadDoc:     'Upload files',
  canPeerReviewDoc: 'Peer review',
  canApproveDoc:    'Approve documents',
  canIssueDoc:      'Issue documents',
  canManageUsers:   'Manage users',
  canInviteUsers:   'Invite users',
};

// ─── Component ─────────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { user, users, hasPerm, addUser, updateUser } = useAuth();
  const { assessmentDate, setAssessmentDate } = useNexusData();
  const [tab, setTab] = useState('service');

  // Users
  const [userTarget, setUserTarget] = useState(null);
  const [showPermMatrix, setShowPermMatrix] = useState(false);

  // Assessment date
  const [assessmentDraft, setAssessmentDraft] = useState(assessmentDate);

  // Service profile
  const [service, setService] = useState({
    name: 'Riverside Sleep & Respiratory Centre',
    abn:  '67 412 998 003',
    hpio: '8003 6280 5947 1234',
    nata: '15847 (read-only)',
    since: 'March 2022 (read-only)',
    host: 'Independent · arms-length from Riverside Hospital',
  });
  const [editService, setEditService] = useState(false);
  const [svcDraft, setSvcDraft] = useState(service);

  // Sites
  const [sites, setSites] = useState(SEED_SITES);
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [editSiteId, setEditSiteId] = useState(null);
  const [siteDraft, setSiteDraft] = useState({ code: '', name: '', type: '', beds: '' });
  const [newSite, setNewSite] = useState({ code: '', name: '', type: '', beds: '' });

  // Rooms
  const [rooms, setRooms] = useState([]);
  const [roomSite, setRoomSite] = useState('RML');
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'psg' });
  const [roomEditId, setRoomEditId] = useState(null);
  const [roomEditName, setRoomEditName] = useState('');
  const [roomEditType, setRoomEditType] = useState('psg');
  const [roomSaving, setRoomSaving] = useState(false);

  useEffect(() => {
    fetchRooms(null).then(r => setRooms(r ?? [])).catch(() => {});
  }, []);

  // Integrations
  const [integrations, setIntegrations] = useState(SEED_INTEGRATIONS);
  const [expandedInt, setExpandedInt] = useState(null);
  const [pendingOff, setPendingOff] = useState(null);
  const [showKey, setShowKey] = useState({});

  // Retention
  const [retention, setRetention] = useState(SEED_RETENTION);
  const [editRetId, setEditRetId] = useState(null);
  const [retDraft, setRetDraft] = useState('');

  // Security
  const [security, setSecurity] = useState({
    mfaRequired:      true,
    sessionTimeout:   8,
    minPasswordLen:   12,
    complexityRequired: true,
    ipAllowlistEnabled: false,
    ipAllowlist: ['10.0.0.0/24', '203.0.113.0/24'],
  });
  const [addIpOpen, setAddIpOpen] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const canInvite = hasPerm('canInviteUsers');
  const canManage = hasPerm('canManageUsers');
  const myLevel   = ROLE_LEVEL[user?.role] ?? 0;

  // ── User helpers ─────────────────────────────────────────────────────────────

  const openInvite = () => canInvite && setUserTarget({});
  const openEdit   = (u) => {
    if (canManage && (ROLE_LEVEL[u.role] ?? 0) < myLevel) setUserTarget(u);
  };
  const handleSaveUser = (saved) => {
    if (saved.id) updateUser(saved.id, saved); else addUser(saved);
    setUserTarget(null);
  };

  // ── Service helpers ──────────────────────────────────────────────────────────

  function saveService() {
    setService(svcDraft);
    setEditService(false);
    showSaved();
  }

  // ── Site helpers ─────────────────────────────────────────────────────────────

  function addSite() {
    if (!newSite.name || !newSite.code) return;
    setSites(prev => [...prev, { ...newSite, id: Date.now() }]);
    setNewSite({ code: '', name: '', type: '', beds: '' });
    setAddSiteOpen(false);
  }
  function beginEditSite(s) { setSiteDraft({ ...s }); setEditSiteId(s.id); }
  function saveSite() {
    setSites(prev => prev.map(s => s.id === editSiteId ? { ...siteDraft } : s));
    setEditSiteId(null);
    showSaved();
  }
  function removeSite(id) { setSites(prev => prev.filter(s => s.id !== id)); }

  // ── Room helpers ─────────────────────────────────────────────────────────────

  async function handleAddRoom() {
    if (!newRoom.name.trim()) return;
    setRoomSaving(true);
    try {
      const created = await createRoom({ siteId: roomSite, name: newRoom.name.trim(), type: newRoom.type });
      setRooms(prev => [...prev, created]);
      setNewRoom({ name: '', type: 'psg' });
      setAddRoomOpen(false);
    } finally { setRoomSaving(false); }
  }

  async function handleUpdateRoom(id) {
    setRoomSaving(true);
    try {
      const updated = await updateRoom(id, { siteId: roomSite, name: roomEditName.trim(), type: roomEditType });
      setRooms(prev => prev.map(r => r.id === id ? updated : r));
      setRoomEditId(null);
      showSaved();
    } finally { setRoomSaving(false); }
  }

  async function handleDeleteRoom(id) {
    await deleteRoom(id);
    setRooms(prev => prev.filter(r => r.id !== id));
  }

  // ── Integration helpers ───────────────────────────────────────────────────────

  function toggleIntegration(id) {
    const item = integrations.find(i => i.id === id);
    if (item.on) { setPendingOff(id); return; }
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, on: true } : i));
  }
  function confirmDisconnect() {
    setIntegrations(prev => prev.map(i => i.id === pendingOff ? { ...i, on: false, lastSync: '—' } : i));
    setPendingOff(null);
    if (expandedInt === pendingOff) setExpandedInt(null);
  }

  // ── Retention helpers ─────────────────────────────────────────────────────────

  function beginEditRet(r) { setRetDraft(r.period); setEditRetId(r.id); }
  function saveRet(id) {
    setRetention(prev => prev.map(r => r.id === id ? { ...r, period: retDraft } : r));
    setEditRetId(null);
    showSaved();
  }

  // ── Security helpers ──────────────────────────────────────────────────────────

  function addIp() {
    if (!newIp.trim()) return;
    setSecurity(prev => ({ ...prev, ipAllowlist: [...prev.ipAllowlist, newIp.trim()] }));
    setNewIp('');
    setAddIpOpen(false);
  }
  function removeIp(ip) {
    setSecurity(prev => ({ ...prev, ipAllowlist: prev.ipAllowlist.filter(x => x !== ip) }));
  }

  function showSaved() {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  }

  const pendingIntName = integrations.find(i => i.id === pendingOff)?.name;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        subtitle="Tenant configuration · integrations · retention · SSO / MFA"
      />

      {savedToast && (
        <div className="banner info" style={{ marginBottom: 18 }}>
          <Icon name="check" size={16} />
          <span style={{ fontWeight: 500 }}>Changes saved.</span>
          <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={() => setSavedToast(false)}><Icon name="x" size={14} /></button>
        </div>
      )}

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'service',      label: 'Service profile'  },
        { id: 'users',        label: 'Users & roles',   count: users.length },
        { id: 'integrations', label: 'Integrations',    count: integrations.filter(i => i.on).length },
        { id: 'retention',    label: 'Retention'        },
        { id: 'security',     label: 'Security'         },
      ]} />

      {/* ── SERVICE PROFILE ───────────────────────────────────────────────────── */}
      {tab === 'service' && (
        <>
        <div className="grid-2">
          {/* Legal entity */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Legal entity</div>
              <div className="topbar-spacer" />
              {!editService
                ? <button className="btn" onClick={() => { setSvcDraft(service); setEditService(true); }}><Icon name="edit" size={13} />Edit</button>
                : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={() => setEditService(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={saveService}><Icon name="check" size={13} />Save</button>
                  </div>
                )
              }
            </div>
            <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ['Service name', 'name',  true],
                ['ABN',          'abn',   true],
                ['HPI-O',        'hpio',  true],
                ['Host institution', 'host', true],
                ['NATA cert no.', 'nata', false],
                ['Accredited since', 'since', false],
              ].map(([label, key, editable]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 148, fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>{label}</div>
                  {editService && editable ? (
                    <input
                      className="input"
                      style={{ flex: 1, fontSize: 13 }}
                      value={svcDraft[key]}
                      onChange={e => setSvcDraft(p => ({ ...p, [key]: e.target.value }))}
                    />
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
                      {(editService ? svcDraft[key] : service[key]).replace(' (read-only)', '')}
                      {!editable && <Pill kind="outline" style={{ marginLeft: 8, fontSize: 10 }}>read-only</Pill>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sites */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Sites</div>
              <div className="topbar-spacer" />
              <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAddSiteOpen(v => !v)}>
                <Icon name="plus" size={11} />Add site
              </button>
            </div>
            <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {addSiteOpen && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--accent)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Code</label>
                      <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="ABC" maxLength={6} value={newSite.code} onChange={e => setNewSite(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Site name</label>
                      <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. Westside Lab" value={newSite.name} onChange={e => setNewSite(p => ({ ...p, name: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Services / type</label>
                    <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. Adult PSG · CPAP" value={newSite.type} onChange={e => setNewSite(p => ({ ...p, type: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Beds</label>
                      <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="4" value={newSite.beds} onChange={e => setNewSite(p => ({ ...p, beds: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" onClick={() => setAddSiteOpen(false)}>Cancel</button>
                      <button className="btn btn-primary" onClick={addSite}>Add</button>
                    </div>
                  </div>
                </div>
              )}

              {sites.map(s => (
                <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {editSiteId === s.id ? (
                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Code</label>
                          <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={siteDraft.code} onChange={e => setSiteDraft(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Name</label>
                          <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={siteDraft.name} onChange={e => setSiteDraft(p => ({ ...p, name: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Services</label>
                        <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={siteDraft.type} onChange={e => setSiteDraft(p => ({ ...p, type: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={() => setEditSiteId(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={saveSite}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                          <Pill kind="outline">{s.code}</Pill>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.type} · {s.beds} beds</div>
                      </div>
                      <button className="btn-icon" title="Edit" onClick={() => beginEditSite(s)}><Icon name="edit" size={13} /></button>
                      <button className="btn-icon" title="Remove" style={{ color: 'var(--bad)', opacity: 0.6 }} onClick={() => removeSite(s.id)}><Icon name="x" size={13} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rooms */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Rooms</div>
              <div className="card-sub">Physical rooms available for booking at each site</div>
            </div>
            <div className="topbar-spacer" />
            <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => { setAddRoomOpen(v => !v); setRoomEditId(null); }}>
              <Icon name="plus" size={11} />Add room
            </button>
          </div>

          {/* Site selector */}
          <div style={{ padding: '10px 18px 0', display: 'flex', gap: 6 }}>
            {SEED_SITES.filter(s => s.code !== 'HSN').concat([{ id: 3, code: 'HSN', name: 'Home Service – North' }]).map(s => (
              <button
                key={s.code}
                onClick={() => { setRoomSite(s.code); setAddRoomOpen(false); setRoomEditId(null); }}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${roomSite === s.code ? 'var(--accent)' : 'var(--border)'}`,
                  background: roomSite === s.code ? 'var(--accent-soft)' : 'var(--surface)',
                  color: roomSite === s.code ? 'var(--accent-ink)' : 'var(--ink-2)',
                }}
              >
                {s.code}
                {rooms.filter(r => r.siteId === s.code).length > 0 && (
                  <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>
                    {rooms.filter(r => r.siteId === s.code).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Add room form */}
            {addRoomOpen && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12, border: '1px solid var(--accent)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-ink)', marginBottom: 10 }}>
                  New room · {SEED_SITES.find(s => s.code === roomSite)?.name ?? roomSite}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Room name</label>
                    <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. PSG Lab 1" value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddRoom()} autoFocus />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Type</label>
                    <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newRoom.type} onChange={e => setNewRoom(p => ({ ...p, type: e.target.value }))}>
                      <option value="psg">PSG</option>
                      <option value="titration">Titration</option>
                      <option value="consult">Consult</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => setAddRoomOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleAddRoom} disabled={roomSaving || !newRoom.name.trim()}>Add</button>
                </div>
              </div>
            )}

            {/* Room list */}
            {rooms.filter(r => r.siteId === roomSite).length === 0 && !addRoomOpen && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '6px 0' }}>
                No rooms configured for this site. Click "Add room" to get started.
              </div>
            )}
            {rooms.filter(r => r.siteId === roomSite).map(r => (
              <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {roomEditId === r.id ? (
                  <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 130px', gap: 8 }}>
                    <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={roomEditName} onChange={e => setRoomEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdateRoom(r.id)} autoFocus />
                    <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={roomEditType} onChange={e => setRoomEditType(e.target.value)}>
                      <option value="psg">PSG</option>
                      <option value="titration">Titration</option>
                      <option value="consult">Consult</option>
                      <option value="general">General</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
                      <button className="btn" onClick={() => setRoomEditId(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => handleUpdateRoom(r.id)} disabled={roomSaving}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{r.type}</div>
                    </div>
                    <button className="btn-icon" title="Edit" onClick={() => { setRoomEditId(r.id); setRoomEditName(r.name); setRoomEditType(r.type); setAddRoomOpen(false); }}>
                      <Icon name="edit" size={13} />
                    </button>
                    <button className="btn-icon" title="Remove" style={{ color: 'var(--bad)', opacity: 0.6 }} onClick={() => handleDeleteRoom(r.id)}>
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* NATA Assessment Schedule */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <div>
              <div className="card-title">NATA assessment schedule</div>
              <div className="card-sub">Sets the countdown on the home page and accreditation workspace</div>
            </div>
          </div>
          <div className="card-pad">
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 148, fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>Next assessment date</div>
              <input
                type="date"
                className="input"
                style={{ fontSize: 13, width: 180 }}
                value={assessmentDraft}
                onChange={e => setAssessmentDraft(e.target.value)}
              />
              {assessmentDraft && (() => {
                const [y, m, d] = assessmentDraft.split('-').map(Number);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const days = Math.round((new Date(y, m - 1, d) - today) / 86400000);
                return (
                  <span style={{ fontSize: 12, color: days < 0 ? 'var(--bad)' : days < 30 ? 'var(--warn)' : 'var(--ink-3)' }}>
                    {days >= 0 ? `${days} days from today` : `${Math.abs(days)} days overdue`}
                  </span>
                );
              })()}
            </div>
            <div style={{ paddingTop: 12 }}>
              <button
                className="btn btn-primary"
                disabled={!assessmentDraft || assessmentDraft === assessmentDate}
                onClick={() => { setAssessmentDate(assessmentDraft); showSaved(); }}
              >
                <Icon name="check" size={13} />Save date
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* ── USERS & ROLES ─────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <div className="card-title">User access · role-based permissions</div>
              <div className="topbar-spacer" />
              <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setShowPermMatrix(v => !v)}>
                <Icon name="shield" size={11} />Permission matrix
              </button>
              {canInvite && (
                <button className="btn btn-primary" onClick={openInvite}>
                  <Icon name="user_plus" size={14} />Invite user
                </button>
              )}
            </div>
            <table className="tbl">
              <thead>
                <tr><th>User</th><th>Role</th><th>MFA</th><th>Auth</th><th>Last sign-in</th></tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const theirLevel = ROLE_LEVEL[u.role] ?? 0;
                  const clickable  = canManage && myLevel > theirLevel;
                  return (
                    <tr key={u.id}
                      className={clickable ? 'row-clickable' : ''}
                      onClick={() => clickable && openEdit(u)}
                      title={clickable ? 'Click to edit' : undefined}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={u.name} idx={i} size={22} />
                          <span>{u.name}</span>
                          {u.id === user?.id && <Pill kind="accent">You</Pill>}
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{u.role}</td>
                      <td>{u.mfa ? <Pill kind="good"><Icon name="check" size={10} /> TOTP</Pill> : <Pill kind="bad">Off</Pill>}</td>
                      <td className="muted">{u.auth}</td>
                      <td className="muted">{u.lastSeen}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Permission matrix */}
          {showPermMatrix && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">Permission matrix</div>
                <button className="btn-icon" onClick={() => setShowPermMatrix(false)}><Icon name="x" size={14} /></button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th>Role</th>
                      {Object.values(PERM_LABELS).map(l => (
                        <th key={l} style={{ fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap' }}>{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                      <tr key={role}>
                        <td style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{role}</td>
                        {Object.keys(PERM_LABELS).map(key => (
                          <td key={key} style={{ textAlign: 'center' }}>
                            {perms[key]
                              ? <span style={{ color: 'var(--good)' }}><Icon name="check" size={14} /></span>
                              : <span style={{ color: 'var(--surface-3)' }}>—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── INTEGRATIONS ──────────────────────────────────────────────────────── */}
      {tab === 'integrations' && (
        <>
          {pendingOff && (
            <div className="banner" style={{ background: 'var(--bad-soft)', border: '1px solid var(--bad)', borderRadius: 8, marginBottom: 18 }}>
              <Icon name="alert" size={18} style={{ color: 'var(--bad)' }} />
              <div style={{ flex: 1 }}>
                <strong>Disconnect {pendingIntName}?</strong>
                <div style={{ fontSize: 12, marginTop: 2 }}>Data sync will stop immediately. You can reconnect at any time.</div>
              </div>
              <button className="btn" onClick={() => setPendingOff(null)}>Cancel</button>
              <button className="btn" style={{ background: 'var(--bad)', color: 'white', border: 'none' }} onClick={confirmDisconnect}>Disconnect</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {integrations.map(item => {
              const isExpanded = expandedInt === item.id;
              return (
                <div key={item.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: item.on ? 'var(--good-soft)' : 'var(--surface-2)',
                      color: item.on ? 'var(--good)' : 'var(--ink-3)',
                      display: 'grid', placeItems: 'center',
                    }}>
                      <Icon name={item.on ? 'check' : 'link'} size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 8, marginTop: 2 }}>
                        <span>{item.cat}</span>
                        {item.on && <span>· Last sync: {item.lastSync}</span>}
                      </div>
                    </div>
                    {item.on && (
                      <button
                        className="btn"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => setExpandedInt(isExpanded ? null : item.id)}
                      >
                        <Icon name="cog" size={11} />Configure
                      </button>
                    )}
                    <Toggle on={item.on} onChange={() => toggleIntegration(item.id)} />
                  </div>

                  {isExpanded && item.on && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {item.apiKey && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>API key</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <code style={{ fontSize: 12, background: 'var(--surface)', padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', flex: 1 }}>
                              {showKey[item.id] ? item.apiKey : item.apiKey.replace(/(?<=.{8}).+(?=.{4})/, '••••••••••••')}
                            </code>
                            <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setShowKey(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                              <Icon name="eye" size={11} />{showKey[item.id] ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>
                      )}
                      {item.webhook && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Webhook endpoint</div>
                          <code style={{ fontSize: 12, background: 'var(--surface)', padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', display: 'block' }}>{item.webhook}</code>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => { showSaved(); }}>
                          <Icon name="pulse" size={11} />Test connection
                        </button>
                        <div style={{ flex: 1 }} />
                        <button className="btn" style={{ fontSize: 11, padding: '3px 8px', color: 'var(--bad)' }} onClick={() => { setPendingOff(item.id); setExpandedInt(null); }}>
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── RETENTION ─────────────────────────────────────────────────────────── */}
      {tab === 'retention' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Retention policies · cl. 4.13</div>
              <div className="card-sub">Click any policy period to edit · object-locked records cannot be shortened</div>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Record type</th><th>Retention period</th><th>Storage</th><th>Object-lock</th><th></th></tr>
            </thead>
            <tbody>
              {retention.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.type}</td>
                  <td>
                    {editRetId === r.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="input"
                          style={{ flex: 1, fontSize: 12 }}
                          value={retDraft}
                          onChange={e => setRetDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveRet(r.id); if (e.key === 'Escape') setEditRetId(null); }}
                          autoFocus
                        />
                        <button className="btn btn-primary" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => saveRet(r.id)}>Save</button>
                        <button className="btn" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => setEditRetId(null)}>✕</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{r.period}</span>
                    )}
                  </td>
                  <td className="muted">{r.storage}</td>
                  <td>
                    {r.lock
                      ? <Pill kind="good"><Icon name="check" size={10} /> Locked</Pill>
                      : <span className="muted">—</span>}
                  </td>
                  <td>
                    {!r.lock && editRetId !== r.id && (
                      <button className="btn-icon" title="Edit" onClick={() => beginEditRet(r)}><Icon name="edit" size={13} /></button>
                    )}
                    {r.lock && <Icon name="shield" size={13} style={{ color: 'var(--ink-3)', opacity: 0.4 }} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SECURITY ──────────────────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            {/* Authentication policy */}
            <div className="card">
              <div className="card-head"><div className="card-title">Authentication policy</div></div>
              <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    label: 'Require MFA for all users',
                    desc: 'Users without TOTP or hardware key cannot sign in.',
                    key: 'mfaRequired',
                  },
                  {
                    label: 'Require password complexity',
                    desc: 'Uppercase, lowercase, number, and symbol required.',
                    key: 'complexityRequired',
                  },
                  {
                    label: 'Enable IP allowlist',
                    desc: 'Block sign-ins from IPs not on the allowlist below.',
                    key: 'ipAllowlistEnabled',
                  },
                ].map(({ label, desc, key }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{desc}</div>
                    </div>
                    <Toggle on={security[key]} onChange={v => { setSecurity(p => ({ ...p, [key]: v })); showSaved(); }} />
                  </div>
                ))}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>Minimum password length</div>
                    <span style={{ fontSize: 13, fontWeight: 600, width: 28, textAlign: 'right' }}>{security.minPasswordLen}</span>
                  </div>
                  <input
                    type="range" min={8} max={32} step={1}
                    value={security.minPasswordLen}
                    onChange={e => setSecurity(p => ({ ...p, minPasswordLen: +e.target.value }))}
                    onMouseUp={showSaved}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-3)' }}><span>8</span><span>32</span></div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Session timeout</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[1, 4, 8, 24, 0].map(h => (
                      <button
                        key={h}
                        className={`chip-btn ${security.sessionTimeout === h ? 'active' : ''}`}
                        onClick={() => { setSecurity(p => ({ ...p, sessionTimeout: h })); showSaved(); }}
                      >
                        {h === 0 ? 'Never' : `${h}h`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* IP allowlist */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">IP allowlist</div>
                  <div className="card-sub">CIDR notation · applies when allowlist is enabled</div>
                </div>
                <div className="topbar-spacer" />
                <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAddIpOpen(v => !v)}>
                  <Icon name="plus" size={11} />Add
                </button>
              </div>
              <div className="card-pad">
                {addIpOpen && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input className="input" style={{ flex: 1 }} placeholder="e.g. 192.168.1.0/24" value={newIp} onChange={e => setNewIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIp()} />
                    <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={addIp}>Add</button>
                    <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAddIpOpen(false)}>Cancel</button>
                  </div>
                )}
                {security.ipAllowlist.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>No IPs configured — allowlist will block all traffic when enabled.</div>
                )}
                {security.ipAllowlist.map(ip => (
                  <div key={ip} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <code style={{ fontSize: 12, flex: 1 }}>{ip}</code>
                    <button className="btn-icon" style={{ opacity: 0.5 }} onClick={() => removeIp(ip)}><Icon name="x" size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="grid-2">
            {[
              { t: 'Data residency',            d: 'AWS Sydney (ap-southeast-2) · encrypted at rest (KMS) · TLS 1.3 in transit', k: 'good' },
              { t: 'Tamper-evident audit trail', d: 'Append-only with SHA-256 hash chain · 1.2M entries logged',                  k: 'good' },
              { t: 'Backups',                    d: 'Hourly snapshots · cross-region replication · 30-day point-in-time',         k: 'good' },
              { t: 'Disaster recovery',          d: 'RPO 1h · RTO 4h · last DR drill 14 Mar 2026',                               k: 'good' },
              { t: 'Privacy compliance',         d: 'Australian Privacy Act 1988 · APP-compliant · NDB scheme',                   k: 'good' },
              { t: 'Penetration test',           d: 'Annual · last conducted Feb 2026 by independent firm',                      k: 'good' },
            ].map((c, i) => (
              <div key={i} className="card card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Pill kind={c.k}><Icon name="check" size={10} /></Pill>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.t}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{c.d}</div>
              </div>
            ))}
          </div>

          {/* Recent sign-in events */}
          <div className="card">
            <div className="card-head"><div className="card-title">Recent sign-in events</div></div>
            <table className="tbl">
              <thead><tr><th>User</th><th>Event</th><th>Method</th><th>IP address</th><th>Time</th></tr></thead>
              <tbody>
                {SECURITY_EVENTS.map((e, i) => (
                  <tr key={i}>
                    <td>
                      {e.who !== 'Unknown' && e.who !== 'System'
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={e.who} size={20} idx={i} />{e.who}</div>
                        : <span className="muted">{e.who}</span>}
                    </td>
                    <td>
                      <Pill kind={e.ok ? 'good' : 'bad'}>{e.event}</Pill>
                    </td>
                    <td className="muted">{e.method}</td>
                    <td><code style={{ fontSize: 12 }}>{e.ip}</code></td>
                    <td className="muted">{e.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User invite / edit drawer */}
      <Drawer open={userTarget !== null} onClose={() => setUserTarget(null)}>
        <UserFormDrawer
          userData={userTarget?.id ? userTarget : null}
          currentUserRole={user?.role}
          onSave={handleSaveUser}
          onClose={() => setUserTarget(null)}
        />
      </Drawer>
    </div>
  );
};

export default SettingsPage;
