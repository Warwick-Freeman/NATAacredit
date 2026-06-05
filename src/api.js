const BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders() {
  const token = localStorage.getItem('nexus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function clearSessionAndReload() {
  localStorage.removeItem('nexus_token');
  localStorage.removeItem('nexus_user');
  window.location.reload();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) { clearSessionAndReload(); return; }
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// Each API response uses camelCase from .NET's default JSON serializer.
// We normalise the shape to match what the components expect.

function normaliseStudy(s) {
  return {
    id: s.studyId,
    patient: s.patient,
    patientInitials: s.patientInitials,
    type: s.type,
    siteCode: s.siteCode,
    scorer: s.scorer,
    physician: s.physician,
    status: s.status,
    contact: s.contact,
    due: s.due,
    sla: s.sla,
    signedDays: s.signedDays,
  };
}

function normaliseEquipment(e) {
  return {
    id: e.assetId,
    name: e.name,
    type: e.type,
    site: e.site,
    serial: e.serial,
    artg: e.artg,
    lastVerify: e.lastVerify,
    nextVerify: e.nextVerify,
    verifyStatus: e.verifyStatus,
  };
}

function normaliseIndicator(k) {
  return {
    id: k.indicatorId,
    name: k.name,
    phase: k.phase,
    value: k.value,
    unit: k.unit,
    target: k.target,
    status: k.status,
    trend: JSON.parse(k.trend),
  };
}

const CLAUSE_STATUS_MAP = { nonconformant: 'nc', review: 'partial' };

function normaliseClause(c) {
  return {
    id: c.clauseId,
    title: c.title,
    section: c.section,
    status: CLAUSE_STATUS_MAP[c.status] || c.status,
    evidence: c.evidence,
    lastReviewed: c.lastReviewed,
    owner: c.owner,
    notes: '',
    category: c.category ?? null,
    standard: c.standard ?? 'asa',
  };
}

function normaliseSection(s) {
  const partial = Math.max(0, s.total - s.ok - s.nc - (s.na || 0));
  return {
    id: s.section,
    name: s.title,
    section: s.section,
    title: s.title,
    total: s.total,
    compliant: s.ok,
    ok: s.ok,
    partial,
    nc: s.nc,
    na: s.na,
    status: s.status,
  };
}

function normaliseTask(t) {
  return {
    id: t.taskId,
    title: t.title,
    clause: t.clause,
    due: t.due,
    priority: t.priority,
  };
}

function normaliseActivity(a) {
  return {
    id:     a.id,
    who:    a.who,
    what:   a.action,
    when:   a.time,
    kind:   a.kind,
    action: a.action,
    target: a.target,
    time:   a.time,
    ts:     a.ts,
    module: a.module || 'system',
    detail: a.detail || '',
    hash:   a.hash   || '',
  };
}

export async function patchClause(id, data) {
  const res = await fetch(`${BASE}/api/clauses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (res.status === 401) { clearSessionAndReload(); return; }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function patchStudyStatus(id, status, signedDays) {
  const res = await fetch(`${BASE}/api/studies/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status, signedDays: signedDays ?? null }),
  });
  if (res.status === 401) { clearSessionAndReload(); return; }
  if (res.status === 403) throw new Error('You do not have permission to perform this action.');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

export async function fetchRooms(siteId) {
  const qs = siteId && siteId !== 'all' ? `?siteId=${siteId}` : '';
  return get(`/api/rooms${qs}`);
}

export async function createRoom(data) {
  const res = await fetch(`${BASE}/api/rooms`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function updateRoom(id, data) {
  const res = await fetch(`${BASE}/api/rooms/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function deleteRoom(id) {
  const res = await fetch(`${BASE}/api/rooms/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(`API error ${res.status}`);
}

export async function fetchAppointments(siteId, from, to) {
  const params = new URLSearchParams();
  if (siteId && siteId !== 'all') params.set('siteId', siteId);
  if (from) params.set('from', from);
  if (to)   params.set('to',   to);
  return get(`/api/appointments?${params}`);
}

export async function createAppointment(data) {
  const res = await fetch(`${BASE}/api/appointments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function updateAppointment(id, data) {
  const res = await fetch(`${BASE}/api/appointments/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function deleteAppointment(id) {
  const res = await fetch(`${BASE}/api/appointments/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(`API error ${res.status}`);
}

export async function searchDocumentContent(q) {
  if (!q || q.length < 2) return [];
  return get(`/api/documents/search?q=${encodeURIComponent(q)}`);
}

export async function fetchDocuments() {
  const list = await get('/api/documents');
  return (list ?? []).map(d => ({
    id:       d.docId,
    title:    d.title,
    version:  d.version,
    status:   d.status,
    folder:   d.folder,
    owner:    d.owner,
    updated:  d.updated,
    fileType: d.fileType ?? null,
    hasFile:  d.hasFile ?? false,
  }));
}

export async function fetchConfig() {
  return get('/api/config');
}

export async function switchStandard(value) {
  const res = await fetch(`${BASE}/api/config/standard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ value }),
  });
  if (res.status === 401) { clearSessionAndReload(); return; }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchAll() {
  const [studies, equipment, indicators, clauses, compliance, tasks, activity] =
    await Promise.all([
      get('/api/studies'),
      get('/api/equipment'),
      get('/api/indicators'),
      get('/api/clauses'),
      get('/api/compliance'),
      get('/api/tasks'),
      get('/api/activity'),
    ]);

  return {
    service: {
      name: "Riverside Sleep & Respiratory Centre",
      abn: "67 412 998 003",
      sites: ["Riverside Main Lab", "Eastside Paediatric Lab", "Home Service – North"],
      nextAssessment: "12 Aug 2026",
      daysToAssessment: 92,
      accreditation: { status: "Accredited", since: "Mar 2022", certNo: "NATA-15847" },
    },
    studies: studies.map(normaliseStudy),
    equipment: equipment.map(normaliseEquipment),
    indicators: indicators.map(normaliseIndicator),
    clauses: clauses.map(normaliseClause),
    complianceBySection: compliance.map(normaliseSection),
    tasks: tasks.map(normaliseTask),
    activity: activity.map(normaliseActivity),
  };
}
