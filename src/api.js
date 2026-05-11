const BASE = 'http://localhost:5000';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
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

function normaliseClause(c) {
  return {
    id: c.clauseId,
    title: c.title,
    section: c.section,
    status: c.status,
    evidence: c.evidence,
    lastReviewed: c.lastReviewed,
    owner: c.owner,
  };
}

function normaliseSection(s) {
  return {
    section: s.section,
    title: s.title,
    total: s.total,
    ok: s.ok,
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
    who: a.who,
    action: a.action,
    target: a.target,
    time: a.time,
    kind: a.kind,
  };
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
    studies: studies.map(normaliseStudy),
    equipment: equipment.map(normaliseEquipment),
    indicators: indicators.map(normaliseIndicator),
    clauses: clauses.map(normaliseClause),
    complianceBySection: compliance.map(normaliseSection),
    tasks: tasks.map(normaliseTask),
    activity: activity.map(normaliseActivity),
  };
}
