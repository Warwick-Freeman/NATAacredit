import React, { useState, useEffect } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs, Drawer } from '../components';
import { useAuth, ROLE_LEVEL, ROLE_PERMISSIONS, ASA_ROLES, AASM_ROLES } from '../AuthContext';
import UserFormDrawer from '../user-form-drawer';
import { useNexusData } from '../NexusDataContext';
import { getStdCfg } from '../standardConfig';
import { fetchRooms, createRoom, updateRoom, deleteRoom, fetchConfig, saveConfigKey, fetchSites, createSite, updateSite, deleteSite, fetchRoles, createRole, updateRolePerms, deleteRole } from '../api';
import NexusGrid from '../nexus-grid';

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

const SEED_INTEGRATIONS = [
  { id: 1,  name: 'Compumedics ProFusion',      cat: 'PSG software',         on: true,  apiKey: 'cpf_live_sk_4e...a91c', lastSync: '3 min ago',    webhook: 'https://api.nexus360.com/ingest/cpf' },
  { id: 6,  name: 'FHIR R4 endpoint',           cat: 'Interoperability',     on: true,  apiKey: 'fhir_live_sk_5d...311f', lastSync: '1 h ago',     webhook: 'https://api.nexus360.com/fhir/r4' },
  { id: 7,  name: 'HealthLink secure messaging',cat: 'Secure messaging',     on: true,  apiKey: 'hlk_live_sk_3e...aa7c', lastSync: '22 min ago',   webhook: '' },
  { id: 8,  name: 'Argus secure messaging',     cat: 'Secure messaging',     on: false, apiKey: '',                      lastSync: '—',            webhook: '' },
  { id: 10, name: 'TGA adverse event export',   cat: 'Regulatory',           on: true,  apiKey: 'tga_live_sk_1a...c50b', lastSync: '1 d ago',      webhook: '' },
  { id: 12, name: 'Sentry',                     cat: 'Observability',        on: true,  apiKey: 'sentry_live_sk_0c...12af', lastSync: 'live',      webhook: '' },
];

const CPAP_DEVICE_PROVIDERS = {
  resmed:  { label: 'ResMed AirView',         connected: true,  lastSync: '2026-05-15 07:12', patients: 3 },
  philips: { label: 'Philips EncoreAnywhere', connected: true,  lastSync: '2026-05-14 06:44', patients: 1 },
  fp:      { label: 'F&P myAir',              connected: false, lastSync: null,               patients: 1 },
  lowenstein: { label: 'Löwenstein prismaLAB',connected: false, lastSync: null,               patients: 0 },
};

const PROVIDER_APIS = [
  {
    id: 'resmed', name: 'ResMed AirView API', logo: 'ResMed', endpoint: 'https://api.resmed.com/v1',
    auth: 'OAuth 2.0 (client_credentials)', scopes: 'therapy.read patient.read',
    dataFields: ['Daily usage (hours)', 'AHI (events/h)', 'Mask leak (L/min)', '90th percentile pressure', 'Apnea/hypopnea counts', 'CSR index (ASV)'],
    syncInterval: 'Every 6 hours (device uploads via cellular/Wi-Fi)',
    docs: 'developer.resmed.com',
  },
  {
    id: 'philips', name: 'Philips DreamStation API', logo: 'Philips', endpoint: 'https://api.connected-health.philips.com/v2',
    auth: 'OAuth 2.0 (authorization_code)', scopes: 'therapy.read',
    dataFields: ['Daily usage', 'AHI', 'Pressure', 'Leak', 'Compliance flag'],
    syncInterval: 'Every 12 hours',
    docs: 'developer.philips.com/healthcare',
  },
  {
    id: 'fp', name: 'Fisher & Paykel myAir API', logo: 'F&P', endpoint: 'Contact F&P Healthcare for API access',
    auth: 'Partner agreement required', scopes: 'therapy.read',
    dataFields: ['Daily usage', 'AHI', 'Leak', 'Pressure'],
    syncInterval: 'Daily batch',
    docs: 'Contact fphealthcare.com/professionals',
  },
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
  { who: 'Unknown',        event: 'Failed sign-in attempt', method: '—',              time: '2 days ago',   ip: '185.220.101.44',ok: false },
];

const PERM_LABELS = {
  canCreateDoc:     'Create docs',
  canUploadDoc:     'Upload files',
  canPeerReviewDoc: 'Peer review',
  canApproveDoc:    'Approve docs',
  canIssueDoc:      'Issue docs',
  canSignStudy:     'Sign study',
  canManageUsers:   'Manage users',
  canInviteUsers:   'Invite users',
};
const PERM_KEYS = Object.keys(PERM_LABELS);

// ─── Component ─────────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { user, users, hasPerm, addUser, updateUser, allSites, setAllSites, roleMap, setRoleMap, getRoleLevel } = useAuth();
  const { assessmentDate, setAssessmentDate, activeStandard, changeStandard } = useNexusData();
  const stdCfg = getStdCfg(activeStandard);
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
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [editSiteCode, setEditSiteCode] = useState(null);
  const [siteDraft, setSiteDraft] = useState({ code: '', name: '', type: '', beds: '' });
  const [newSite, setNewSite] = useState({ code: '', name: '', type: '', beds: '' });
  const [siteSaving, setSiteSaving] = useState(false);

  // Roles
  const [localRoles, setLocalRoles] = useState([]);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [newRoleDraft, setNewRoleDraft] = useState({ name: '', level: 1 });

  useEffect(() => {
    if (!roleMap) return;
    setLocalRoles(Object.entries(roleMap).map(([roleName, perms]) => ({
      roleName, level: perms.level ?? 0,
      ...Object.fromEntries(PERM_KEYS.map(k => [k, !!perms[k]])),
    })));
  }, [roleMap]);

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

  // Device integrations
  const [expandedProvider, setExpandedProvider] = useState(null);

  // Nexus 360 server integration
  const [n360Url,      setN360Url]      = useState('');
  const [n360Username, setN360Username] = useState('');
  const [n360Password, setN360Password] = useState('');
  const [n360Saving,   setN360Saving]   = useState(false);
  const [n360Testing,  setN360Testing]  = useState(false);
  const [n360TestResult, setN360TestResult] = useState(null); // null | 'ok' | 'fail'
  const [showN360Pass, setShowN360Pass] = useState(false);

  // Twilio (SMS + Email)
  const [twilioConfig, setTwilioConfig] = useState({ accountSid: '', authToken: '', from: '', emailFrom: '', emailFromName: '' });
  const [twilioSaving, setTwilioSaving] = useState(false);
  const [twilioSaved,  setTwilioSaved]  = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);

  async function saveTwilioConfig() {
    setTwilioSaving(true);
    try {
      await Promise.all([
        saveConfigKey('twilio_account_sid',      twilioConfig.accountSid),
        saveConfigKey('twilio_auth_token',        twilioConfig.authToken),
        saveConfigKey('twilio_from',              twilioConfig.from),
        saveConfigKey('twilio_email_from',        twilioConfig.emailFrom),
        saveConfigKey('twilio_email_from_name',   twilioConfig.emailFromName),
      ]);
      setTwilioSaved(true);
      setTimeout(() => setTwilioSaved(false), 2500);
    } catch {} finally { setTwilioSaving(false); }
  }

  useEffect(() => {
    fetchConfig().then(cfg => {
      if (cfg['nexus360_url'])      setN360Url(cfg['nexus360_url']);
      if (cfg['nexus360_username']) setN360Username(cfg['nexus360_username']);
      if (cfg['nexus360_password']) setN360Password(cfg['nexus360_password']);
      // Twilio (SMS + Email)
      setTwilioConfig(c => ({
        ...c,
        accountSid:    cfg['twilio_account_sid']    ?? '',
        authToken:     cfg['twilio_auth_token']     ?? '',
        from:          cfg['twilio_from']           ?? '',
        emailFrom:     cfg['twilio_email_from']     ?? '',
        emailFromName: cfg['twilio_email_from_name']?? '',
      }));
    }).catch(() => {});
  }, []);

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

  // Standard switcher
  const [confirmStandard, setConfirmStandard] = useState(null);
  const [switchingStandard, setSwitchingStandard] = useState(false);

  const canInvite = hasPerm('canInviteUsers');
  const canManage = hasPerm('canManageUsers');
  const myLevel   = getRoleLevel(user?.role);

  // ── User helpers ─────────────────────────────────────────────────────────────

  const openInvite = () => canInvite && setUserTarget({});
  const openEdit   = (u) => {
    if (canManage && getRoleLevel(u.role) < myLevel) setUserTarget(u);
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

  async function addSite() {
    if (!newSite.name || !newSite.code) return;
    setSiteSaving(true);
    try {
      await createSite({ siteCode: newSite.code, name: newSite.name, type: newSite.type, beds: newSite.beds });
      setAllSites(prev => [...prev, { code: newSite.code, name: newSite.name, type: newSite.type, beds: newSite.beds, abbr: newSite.name }]);
      setNewSite({ code: '', name: '', type: '', beds: '' });
      setAddSiteOpen(false);
    } catch { /* silent */ } finally { setSiteSaving(false); }
  }
  function beginEditSite(s) { setSiteDraft({ code: s.code, name: s.name, type: s.type ?? '', beds: s.beds ?? '' }); setEditSiteCode(s.code); }
  async function saveSite() {
    setSiteSaving(true);
    try {
      await updateSite(editSiteCode, { siteCode: siteDraft.code, name: siteDraft.name, type: siteDraft.type, beds: siteDraft.beds });
      setAllSites(prev => prev.map(s => s.code === editSiteCode ? { ...s, ...siteDraft, abbr: siteDraft.name } : s));
      setEditSiteCode(null);
      showSaved();
    } catch { /* silent */ } finally { setSiteSaving(false); }
  }
  async function removeSite(code) {
    try {
      await deleteSite(code);
      setAllSites(prev => prev.filter(s => s.code !== code));
    } catch { /* silent */ }
  }

  // ── Role helpers ──────────────────────────────────────────────────────────────

  async function togglePerm(roleName, permKey, value) {
    const role = localRoles.find(r => r.roleName === roleName);
    if (!role) return;
    const updated = { ...role, [permKey]: value };
    setLocalRoles(prev => prev.map(r => r.roleName === roleName ? updated : r));
    const permissionsJson = JSON.stringify(Object.fromEntries(PERM_KEYS.map(k => [k, !!updated[k]])));
    try {
      await updateRolePerms(roleName, { roleName, level: updated.level, permissionsJson });
      setRoleMap(prev => prev ? { ...prev, [roleName]: { ...prev[roleName], [permKey]: value } } : prev);
    } catch { /* silent */ }
  }

  async function saveRoleLevel(roleName, level) {
    const role = localRoles.find(r => r.roleName === roleName);
    if (!role) return;
    const permissionsJson = JSON.stringify(Object.fromEntries(PERM_KEYS.map(k => [k, !!role[k]])));
    try {
      await updateRolePerms(roleName, { roleName, level, permissionsJson });
      setRoleMap(prev => prev ? { ...prev, [roleName]: { ...prev[roleName], level } } : prev);
    } catch { /* silent */ }
  }

  async function handleAddRole() {
    if (!newRoleDraft.name.trim()) return;
    const permissionsJson = JSON.stringify(Object.fromEntries(PERM_KEYS.map(k => [k, false])));
    try {
      await createRole({ roleName: newRoleDraft.name.trim(), level: newRoleDraft.level, permissionsJson });
      const newRoleObj = { roleName: newRoleDraft.name.trim(), level: newRoleDraft.level, ...Object.fromEntries(PERM_KEYS.map(k => [k, false])) };
      setLocalRoles(prev => [...prev, newRoleObj]);
      setRoleMap(prev => prev ? { ...prev, [newRoleDraft.name.trim()]: { level: newRoleDraft.level, ...Object.fromEntries(PERM_KEYS.map(k => [k, false])) } } : prev);
      setNewRoleDraft({ name: '', level: 1 });
      setAddRoleOpen(false);
      showSaved();
    } catch { /* silent */ }
  }

  async function handleDeleteRole(roleName) {
    try {
      await deleteRole(roleName);
      setLocalRoles(prev => prev.filter(r => r.roleName !== roleName));
      setRoleMap(prev => { if (!prev) return prev; const next = { ...prev }; delete next[roleName]; return next; });
    } catch (e) { alert(e.message); }
  }

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

  // ── Nexus 360 server helpers ──────────────────────────────────────────────────

  async function saveN360Settings() {
    setN360Saving(true);
    setN360TestResult(null);
    try {
      await Promise.all([
        saveConfigKey('nexus360_url',      n360Url.trim()),
        saveConfigKey('nexus360_username', n360Username.trim()),
        saveConfigKey('nexus360_password', n360Password),
      ]);
      showSaved();
    } catch { /* silent — toast not shown on error */ }
    finally { setN360Saving(false); }
  }

  async function testN360Connection() {
    if (!n360Url.trim() || !n360Username.trim() || !n360Password) return;
    setN360Testing(true);
    setN360TestResult(null);
    try {
      const token = localStorage.getItem('nexus_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/config/test-nexus360`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ url: n360Url.trim(), username: n360Username.trim(), password: n360Password }),
      });
      const data = res.ok ? await res.json() : null;
      setN360TestResult(data?.ok ? 'ok' : 'fail');
    } catch {
      setN360TestResult('fail');
    } finally {
      setN360Testing(false);
    }
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

  async function handleSwitchStandard(value) {
    setSwitchingStandard(true);
    setConfirmStandard(null);
    try {
      await changeStandard(value);
      showSaved();
    } finally {
      setSwitchingStandard(false);
    }
  }

  const pendingIntName = integrations.find(i => i.id === pendingOff)?.name;

  // ── Column definitions ────────────────────────────────────────────────────────

  const userColDefs = [
    {
      headerName: 'User',
      field: 'name',
      flex: 2,
      cellRenderer: p => {
        const u = p.data;
        const i = users.indexOf(u);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={u.name} idx={i} size={22} />
            <span>{u.name}</span>
            {u.id === user?.id && <Pill kind="accent">You</Pill>}
          </div>
        );
      },
    },
    { headerName: 'Role', field: 'role', flex: 1, valueFormatter: p => p.value },
    {
      headerName: 'MFA',
      field: 'mfa',
      width: 110,
      cellRenderer: p => p.value
        ? <Pill kind="good"><Icon name="check" size={10} /> TOTP</Pill>
        : <Pill kind="bad">Off</Pill>,
    },
    { headerName: 'Auth', field: 'auth', width: 80 },
    {
      headerName: 'Sites',
      field: 'sites',
      flex: 2,
      cellRenderer: p => {
        const s = p.value;
        if (!s || s.length === 0) return <Pill kind="outline">All sites</Pill>;
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {s.map(name => {
              const site = allSites.find(x => x.name === name);
              return <Pill key={name} kind="accent">{site?.code ?? name}</Pill>;
            })}
          </div>
        );
      },
    },
    { headerName: 'Last sign-in', field: 'lastSeen', flex: 1 },
  ];

  const retentionColDefs = [
    { headerName: 'Record type', field: 'type', flex: 2, cellStyle: { fontWeight: 500 } },
    {
      headerName: 'Retention period',
      field: 'period',
      flex: 3,
      cellRenderer: p => {
        const r = p.data;
        if (editRetId === r.id) {
          return (
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
              <button className="btn" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => setEditRetId(null)}>&#x2715;</button>
            </div>
          );
        }
        return <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{r.period}</span>;
      },
    },
    { headerName: 'Storage', field: 'storage', flex: 1 },
    {
      headerName: 'Object-lock',
      field: 'lock',
      width: 130,
      cellRenderer: p => p.value
        ? <Pill kind="good"><Icon name="check" size={10} /> Locked</Pill>
        : <span className="muted">—</span>,
    },
    {
      headerName: '',
      field: 'id',
      width: 60,
      sortable: false,
      cellRenderer: p => {
        const r = p.data;
        if (!r.lock && editRetId !== r.id) {
          return <button className="btn-icon" title="Edit" onClick={e => { e.stopPropagation(); beginEditRet(r); }}><Icon name="edit" size={13} /></button>;
        }
        if (r.lock) {
          return <Icon name="shield" size={13} style={{ color: 'var(--ink-3)', opacity: 0.4 }} />;
        }
        return null;
      },
    },
  ];

  const securityEventColDefs = [
    {
      headerName: 'User',
      field: 'who',
      flex: 1,
      cellRenderer: p => {
        const e = p.data;
        const i = SECURITY_EVENTS.indexOf(e);
        if (e.who !== 'Unknown' && e.who !== 'System') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={e.who} size={20} idx={i} />
              {e.who}
            </div>
          );
        }
        return <span className="muted">{e.who}</span>;
      },
    },
    {
      headerName: 'Event',
      field: 'event',
      flex: 1,
      cellRenderer: p => <Pill kind={p.data.ok ? 'good' : 'bad'}>{p.value}</Pill>,
    },
    { headerName: 'Method', field: 'method', flex: 1 },
    {
      headerName: 'IP address',
      field: 'ip',
      flex: 1,
      cellRenderer: p => <code style={{ fontSize: 12 }}>{p.value}</code>,
    },
    { headerName: 'Time', field: 'time', flex: 1 },
  ];

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
        { id: 'devices',      label: 'Device integrations', count: PROVIDER_APIS.filter(p => CPAP_DEVICE_PROVIDERS[p.id]?.connected).length },
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
                [stdCfg.certLabel, 'nata', false],
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

              {allSites.map(s => (
                <div key={s.code} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {editSiteCode === s.code ? (
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
                        <button className="btn" onClick={() => setEditSiteCode(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={saveSite} disabled={siteSaving}>Save</button>
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
                      <button className="btn-icon" title="Remove" style={{ color: 'var(--bad)', opacity: 0.6 }} onClick={() => removeSite(s.code)}><Icon name="x" size={13} /></button>
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
            {allSites.map(s => (
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
                  New room · {allSites.find(s => s.code === roomSite)?.name ?? roomSite}
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

        {/* Accreditation Standard */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Accreditation standard</div>
              <div className="card-sub">Switches the clause set, compliance sections, and evidence framework</div>
            </div>
          </div>
          <div className="card-pad">
            {confirmStandard && (
              <div className="banner" style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon name="alert" size={18} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>
                    Switch to {confirmStandard === 'aasm' ? 'AASM (US)' : 'ASA (Australian)'} standard?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>
                    The accreditation workspace will reload with the {confirmStandard === 'aasm' ? '91 AASM standards' : 'ASA clause set'}.
                    Your existing evidence and status records for each standard are preserved separately.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn" onClick={() => setConfirmStandard(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => handleSwitchStandard(confirmStandard)} disabled={switchingStandard}>
                    {switchingStandard ? 'Switching…' : 'Switch'}
                  </button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { id: 'asa',  label: 'ASA Standard',       sub: 'Australian · NATA accreditation', flag: '🇦🇺' },
                { id: 'aasm', label: 'AASM Standards',      sub: 'United States · 91 standards',     flag: '🇺🇸' },
              ].map(s => {
                const active = activeStandard === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => !active && !switchingStandard && setConfirmStandard(s.id)}
                    style={{
                      border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '14px 18px', minWidth: 200, flex: 1,
                      background: active ? 'var(--accent-soft)' : 'var(--surface)',
                      cursor: active || switchingStandard ? 'default' : 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>{s.flag}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent-ink)' : 'var(--ink-1)' }}>{s.label}</div>
                      {active && <Pill kind="accent" style={{ marginLeft: 'auto' }}>Active</Pill>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* NATA Assessment Schedule */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <div>
              <div className="card-title">{stdCfg.bodyName} assessment schedule</div>
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
            <NexusGrid
              rowData={users}
              columnDefs={userColDefs}
              onRowClicked={p => {
                const u = p.data;
                if (canManage && myLevel > getRoleLevel(u.role)) openEdit(u);
              }}
            />
          </div>

          {/* Permission matrix — editable */}
          {showPermMatrix && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">Roles &amp; permissions</div>
                <div className="topbar-spacer" />
                <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAddRoleOpen(v => !v)}>
                  <Icon name="plus" size={11} />New role
                </button>
                <button className="btn-icon" onClick={() => setShowPermMatrix(false)}><Icon name="x" size={14} /></button>
              </div>

              {addRoleOpen && (
                <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Role name</label>
                    <input className="input" style={{ width: 220 }} placeholder="e.g. Head of Department" value={newRoleDraft.name} onChange={e => setNewRoleDraft(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Level (0–5)</label>
                    <input type="number" className="input" style={{ width: 70 }} min={0} max={5} value={newRoleDraft.level} onChange={e => setNewRoleDraft(p => ({ ...p, level: +e.target.value }))} />
                  </div>
                  <button className="btn" onClick={() => setAddRoleOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleAddRole} disabled={!newRoleDraft.name.trim()}>Add role</button>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 18px', fontWeight: 600, minWidth: 180, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>Role</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: 70 }}>Level</th>
                      {PERM_KEYS.map(k => (
                        <th key={k} style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 500, color: 'var(--ink-2)', fontSize: 11, minWidth: 80 }}>{PERM_LABELS[k]}</th>
                      ))}
                      <th style={{ width: 36 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {(localRoles.length > 0 ? localRoles : (activeStandard === 'aasm' ? AASM_ROLES : ASA_ROLES).map(rn => ({
                      roleName: rn, level: ROLE_LEVEL[rn] ?? 0,
                      ...Object.fromEntries(PERM_KEYS.map(k => [k, !!(ROLE_PERMISSIONS[rn]?.[k])])),
                    }))).map((role, i) => (
                      <tr key={role.roleName} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                        <td style={{ padding: '7px 18px', fontWeight: 500, position: 'sticky', left: 0, background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)', zIndex: 1 }}>{role.roleName}</td>
                        <td style={{ textAlign: 'center', padding: '7px 10px' }}>
                          <input
                            type="number" min={0} max={5}
                            defaultValue={role.level}
                            style={{ width: 44, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 4px', fontSize: 12, background: 'var(--surface)' }}
                            onBlur={e => saveRoleLevel(role.roleName, +e.target.value)}
                          />
                        </td>
                        {PERM_KEYS.map(k => (
                          <td key={k} style={{ textAlign: 'center', padding: '7px 10px' }}>
                            <input type="checkbox" checked={!!role[k]} onChange={e => togglePerm(role.roleName, k, e.target.checked)} />
                          </td>
                        ))}
                        <td style={{ textAlign: 'center', padding: '7px 6px' }}>
                          <button className="btn-icon" title="Delete role" style={{ color: 'var(--bad)', opacity: 0.6 }}
                            onClick={() => handleDeleteRole(role.roleName)}>
                            <Icon name="x" size={12} />
                          </button>
                        </td>
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
          {/* ── Nexus 360 server ──────────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: n360Url ? 'var(--good-soft)' : 'var(--surface-2)',
                color: n360Url ? 'var(--good)' : 'var(--ink-3)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name={n360Url ? 'check' : 'link'} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Nexus 360 server</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 8, marginTop: 2 }}>
                  <span>PSG data platform</span>
                  {n360Url && <span>· {n360Url}</span>}
                </div>
              </div>
              {n360TestResult === 'ok'   && <Pill kind="good">Connected</Pill>}
              {n360TestResult === 'fail' && <Pill kind="bad">Failed</Pill>}
              <button
                className="btn"
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setExpandedInt(expandedInt === 'n360' ? null : 'n360')}
              >
                <Icon name="cog" size={11} />Configure
              </button>
            </div>
            {expandedInt === 'n360' && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Server URL</label>
                  <input
                    className="form-input"
                    value={n360Url}
                    onChange={e => { setN360Url(e.target.value); setN360TestResult(null); }}
                    placeholder="https://yourserver.nexus360.cloud"
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Device key / username</label>
                    <input
                      className="form-input"
                      value={n360Username}
                      onChange={e => { setN360Username(e.target.value); setN360TestResult(null); }}
                      placeholder="devicekey"
                    />
                  </div>
                  <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Password</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="form-input"
                        type={showN360Pass ? 'text' : 'password'}
                        value={n360Password}
                        onChange={e => { setN360Password(e.target.value); setN360TestResult(null); }}
                        placeholder="••••••••"
                        style={{ flex: 1 }}
                      />
                      <button className="btn" style={{ flexShrink: 0 }} onClick={() => setShowN360Pass(v => !v)}>
                        <Icon name="eye" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={saveN360Settings} disabled={n360Saving}>
                    <Icon name="check" size={13} />{n360Saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    className="btn"
                    onClick={testN360Connection}
                    disabled={n360Testing || !n360Url.trim() || !n360Username.trim() || !n360Password}
                  >
                    <Icon name="pulse" size={13} />{n360Testing ? 'Testing…' : 'Test connection'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Twilio (SMS + Email) ──────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: twilioConfig.accountSid ? 'var(--good-soft)' : 'var(--surface-2)', color: twilioConfig.accountSid ? 'var(--good)' : 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
                <Icon name={twilioConfig.accountSid ? 'check' : 'phone'} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Twilio</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                  SMS &amp; Email delivery · {twilioConfig.accountSid ? 'Configured' : 'Not configured'}
                </div>
              </div>
              {twilioSaved && <span style={{ fontSize: 11, color: 'var(--good)', fontWeight: 600 }}>Saved</span>}
              <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setExpandedInt(expandedInt === 'twilio' ? null : 'twilio')}>
                <Icon name="cog" size={11} />Configure
              </button>
            </div>
            {expandedInt === 'twilio' && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Account credentials</div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Account SID</label>
                  <input className="form-input" style={{ fontFamily: 'monospace' }} value={twilioConfig.accountSid} onChange={e => setTwilioConfig(c => ({ ...c, accountSid: e.target.value }))} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Auth token</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="form-input" style={{ flex: 1, fontFamily: 'monospace' }} type={showTwilioToken ? 'text' : 'password'} value={twilioConfig.authToken} onChange={e => setTwilioConfig(c => ({ ...c, authToken: e.target.value }))} placeholder="••••••••••••••••••••••••••••••••" />
                    <button className="btn" style={{ flexShrink: 0 }} onClick={() => setShowTwilioToken(v => !v)}><Icon name="eye" size={13} /></button>
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginTop: 4 }}>SMS</div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">From number</label>
                  <input className="form-input" value={twilioConfig.from} onChange={e => setTwilioConfig(c => ({ ...c, from: e.target.value }))} placeholder="+61400000000" />
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginTop: 4 }}>Email</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-field" style={{ flex: 2, marginBottom: 0 }}>
                    <label className="form-label">From address</label>
                    <input className="form-input" type="email" value={twilioConfig.emailFrom} onChange={e => setTwilioConfig(c => ({ ...c, emailFrom: e.target.value }))} placeholder="noreply@yourdomain.com" />
                  </div>
                  <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">From name</label>
                    <input className="form-input" value={twilioConfig.emailFromName} onChange={e => setTwilioConfig(c => ({ ...c, emailFromName: e.target.value }))} placeholder="Nexus 360" />
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  Twilio credentials for SMS and email at <strong>console.twilio.com</strong>. The from-address must be verified in your Twilio account.
                </div>
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={saveTwilioConfig} disabled={twilioSaving}>
                  <Icon name="check" size={13} />{twilioSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

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

      {/* ── DEVICE INTEGRATIONS ───────────────────────────────────────────────── */}
      {tab === 'devices' && (
        <>
          <div className="banner info" style={{ marginBottom: 18 }}>
            <Icon name="wifi" size={18} />
            <div style={{ flex: 1 }}>
              <strong>CPAP device cloud integrations.</strong>
              <div style={{ fontSize: 12, marginTop: 2 }}>
                Compliance data is automatically synced via manufacturer APIs when patients consent via the device's companion app (myAir, DreamMapper, etc.).
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            {PROVIDER_APIS.map(prov => {
              const status = CPAP_DEVICE_PROVIDERS[prov.id];
              const isOpen = expandedProvider === prov.id;
              return (
                <div key={prov.id} className="card" style={{ border: status?.connected ? '1px solid var(--good)' : undefined }}>
                  <div className="card-head" style={{ cursor: 'pointer' }} onClick={() => setExpandedProvider(isOpen ? null : prov.id)}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: status?.connected ? 'var(--good-soft)' : 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="wifi" size={16} style={{ color: status?.connected ? 'var(--good)' : 'var(--ink-3)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{prov.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        {status?.connected ? `${status.patients} patient${status.patients !== 1 ? 's' : ''} · Last sync ${status.lastSync}` : 'Not connected'}
                      </div>
                    </div>
                    <Pill kind={status?.connected ? 'good' : 'outline'}>{status?.connected ? 'Connected' : 'Setup required'}</Pill>
                    <Icon name={isOpen ? 'chev_down' : 'chev_right'} size={14} style={{ color: 'var(--ink-4)', marginLeft: 6 }} />
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 12px', fontSize: 12 }}>
                        <span style={{ color: 'var(--ink-3)' }}>API endpoint</span>
                        <span className="mono" style={{ fontSize: 11 }}>{prov.endpoint}</span>
                        <span style={{ color: 'var(--ink-3)' }}>Authentication</span>
                        <span>{prov.auth}</span>
                        <span style={{ color: 'var(--ink-3)' }}>Sync interval</span>
                        <span>{prov.syncInterval}</span>
                        <span style={{ color: 'var(--ink-3)' }}>Documentation</span>
                        <span style={{ color: 'var(--accent-ink)' }}>{prov.docs}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Data fields available</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {prov.dataFields.map(f => (
                            <span key={f} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--ink-2)' }}>{f}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {status?.connected
                          ? <><button className="btn">Force sync</button><button className="btn btn-ghost" style={{ color: 'var(--bad)' }}>Disconnect</button></>
                          : <button className="btn btn-primary"><Icon name="link" size={13} />Connect {prov.logo}</button>
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card card-pad">
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>How CPAP API integration works</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { n: '1', title: 'Patient consent', body: "Patient consents to data sharing via the manufacturer's companion app (ResMed myAir, Philips DreamMapper, etc.)." },
                { n: '2', title: 'Device upload', body: 'CPAP device automatically uploads nightly data via cellular or Wi-Fi to the manufacturer\'s cloud.' },
                { n: '3', title: 'API sync', body: 'Nexus 360 backend polls the AirView / EncoreAnywhere API (OAuth 2.0) on a scheduled interval and stores compliance metrics.' },
                { n: '4', title: 'Clinician view', body: 'Compliance data appears in the Patients module automatically. Alerts trigger when a patient falls below the 70% threshold.' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>{s.n}</div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55 }}>{s.body}</div>
                </div>
              ))}
            </div>
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
          <NexusGrid
            rowData={retention}
            columnDefs={retentionColDefs}
          />
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
            <NexusGrid
              rowData={SECURITY_EVENTS}
              columnDefs={securityEventColDefs}
            />
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
