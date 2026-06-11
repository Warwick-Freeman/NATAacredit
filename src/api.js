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

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { clearSessionAndReload(); return; }
  if (!res.ok) { const t = await res.text(); throw new Error(t || `API error ${res.status}`); }
  return res.json().catch(() => null);
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { clearSessionAndReload(); return; }
  if (!res.ok) { const t = await res.text(); throw new Error(t || `API error ${res.status}`); }
  return res.json().catch(() => null);
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  if (res.status === 401) { clearSessionAndReload(); return; }
  if (!res.ok) { const t = await res.text(); throw new Error(t || `API error ${res.status}`); }
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
  let linkedEvidence = [];
  try { linkedEvidence = JSON.parse(c.linkedEvidenceJson || '[]'); } catch { linkedEvidence = []; }
  return {
    id: c.clauseId,
    title: c.title,
    section: c.section,
    status: CLAUSE_STATUS_MAP[c.status] || c.status,
    evidence: c.evidence,
    linkedEvidence,
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
  const payload = { ...data };
  if (Array.isArray(payload.linkedEvidence)) {
    payload.linkedEvidence = JSON.stringify(payload.linkedEvidence);
  }
  const res = await fetch(`${BASE}/api/clauses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
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
    id:           d.docId,
    title:        d.title,
    version:      d.version,
    status:       d.status,
    folder:       d.folder,
    owner:        d.owner,
    updated:      d.updated,
    fileType:     d.fileType ?? null,
    hasFile:      d.hasFile ?? false,
    hasSurveyJson: d.hasSurveyJson ?? false,
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

export async function saveConfigKey(key, value) {
  const res = await fetch(`${BASE}/api/config/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error(`Failed to save config key: ${key}`);
  return res.json();
}

// ── Sites ─────────────────────────────────────────────────────────────────────

export async function fetchSites() { return get('/api/sites'); }

export async function createSite(data) { return post('/api/sites', data); }

export async function updateSite(siteCode, data) { return put(`/api/sites/${encodeURIComponent(siteCode)}`, data); }

export async function deleteSite(siteCode) { return del(`/api/sites/${encodeURIComponent(siteCode)}`); }

// ── Patients ──────────────────────────────────────────────────────────────────

function parseJson(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }

export function normalisePatient(p) {
  return {
    id:          p.patientId,
    name:        p.name,
    initials:    p.initials,
    dob:         p.dob,
    sex:         p.sex,
    mrn:         p.mrn,
    site:        p.site,
    referrer:    p.referrer,
    physician:   p.physician,
    status:      p.status,
    nextReview:  p.nextReview,
    contact:     parseJson(p.contactJson,    { phone: '', email: '', address: { line1: '', line2: '', suburb: '', state: 'VIC', postcode: '' }, emergencyContact: { name: '', relationship: '', phone: '' } }),
    diagnoses:   parseJson(p.diagnosesJson,  []),
    studies:     parseJson(p.studiesJson,    []),
    alerts:      parseJson(p.alertsJson,     []),
    treatment:   parseJson(p.treatmentJson,  null),
    compliance:  parseJson(p.complianceJson, null),
  };
}

export async function fetchPatients() {
  const list = await get('/api/patients');
  return (list ?? []).map(normalisePatient);
}

export async function createPatient(data) {
  const result = await post('/api/patients', {
    name:        data.name,
    initials:    data.initials,
    dob:         data.dob,
    sex:         data.sex,
    mrn:         data.mrn,
    site:        data.site,
    referrer:    data.referrer,
    physician:   data.physician,
    status:      data.status,
    nextReview:  data.nextReview ?? '',
    contactJson:    JSON.stringify(data.contact    ?? {}),
    diagnosesJson:  JSON.stringify(data.diagnoses  ?? []),
    studiesJson:    JSON.stringify(data.studies    ?? []),
    alertsJson:     JSON.stringify(data.alerts     ?? []),
    treatmentJson:  JSON.stringify(data.treatment  ?? null),
    complianceJson: JSON.stringify(data.compliance ?? null),
  });
  return normalisePatient(result);
}

export async function updatePatient(id, data) {
  const result = await put(`/api/patients/${encodeURIComponent(id)}`, {
    name:        data.name,
    initials:    data.initials,
    dob:         data.dob,
    sex:         data.sex,
    mrn:         data.mrn,
    site:        data.site,
    referrer:    data.referrer,
    physician:   data.physician,
    status:      data.status,
    nextReview:  data.nextReview ?? '',
    contactJson:    data.contact    !== undefined ? JSON.stringify(data.contact)    : undefined,
    diagnosesJson:  data.diagnoses  !== undefined ? JSON.stringify(data.diagnoses)  : undefined,
    studiesJson:    data.studies    !== undefined ? JSON.stringify(data.studies)    : undefined,
    alertsJson:     data.alerts     !== undefined ? JSON.stringify(data.alerts)     : undefined,
    treatmentJson:  data.treatment  !== undefined ? JSON.stringify(data.treatment)  : undefined,
    complianceJson: data.compliance !== undefined ? JSON.stringify(data.compliance) : undefined,
  });
  return normalisePatient(result);
}

export async function deletePatient(id) { return del(`/api/patients/${encodeURIComponent(id)}`); }

// ── Patient form links ────────────────────────────────────────────────────────

export async function createPatientFormLink(data) { return post('/api/patient-form-links', data); }

export async function fetchPatientFormLinks(patientId) {
  return get(`/api/patient-form-links?patientId=${encodeURIComponent(patientId)}`);
}

export async function sendFormLink(token) {
  return post(`/api/send-form-link/${token}`, {
    baseUrl: window.location.origin + window.location.pathname,
  });
}

// ── Patient portal ────────────────────────────────────────────────────────────

export async function sendPortalInvite(patientId, email) {
  return post('/api/portal/invite', {
    patientId,
    email,
    baseUrl: window.location.origin + window.location.pathname,
  });
}

export async function fetchPortalAccount(patientId) {
  return get(`/api/portal/account/${encodeURIComponent(patientId)}`);
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function fetchRoles() { return get('/api/roles'); }

export async function createRole(data) { return post('/api/roles', data); }

export async function updateRolePerms(roleName, data) { return put(`/api/roles/${encodeURIComponent(roleName)}`, data); }

export async function deleteRole(roleName) { return del(`/api/roles/${encodeURIComponent(roleName)}`); }

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
