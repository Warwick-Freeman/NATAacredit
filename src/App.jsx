import React, { useState, useEffect } from 'react';
import { useNexusData } from './NexusDataContext';
import { useAuth } from './AuthContext';
import { useTaskContext } from './TaskContext';
import { Sidebar, Topbar, Drawer } from './components';
import LoginPage from './pages/page-login';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio } from './tweaks-panel';
import HomePage from './pages/page-home';
import AccreditationPage from './pages/page-accreditation';
import IndicatorsPage from './pages/page-indicators';
import StudiesPage from './pages/page-studies';
import EquipmentPage from './pages/page-equipment';
import DocumentsPage from './pages/page-documents';
import AuditsPage from './pages/page-audits';
import NCRPage from './pages/page-ncr';
import StaffPage from './pages/page-staff';
import SettingsPage from './pages/page-settings';
import AuditTrailPage from './pages/page-audit-trail';
import TasksPage from './pages/page-tasks';
import PatientsPage from './pages/page-patients';
import SchedulerPage from './pages/page-scheduler';
import WorkbooksPage from './pages/page-workbooks';
import ISRPage from './pages/page-isr';
import TaskFormDrawer from './task-form-drawer';
import ClauseDrawer from './clause-drawer';
import StudyDrawer from './study-drawer';
import GlobalSearch from './global-search';
import FormFillPage from './pages/page-form-fill';

const App = () => {
  const { user, signOut } = useAuth();
  const { tasks, modalOpen, modalPrefill, closeTaskModal, addTask } = useTaskContext();
  const [route, setRoute] = useState("home");
  const [openClauseId, setOpenClauseId] = useState(null);
  const [openStudyId, setOpenStudyId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tweaks, setTweak] = useTweaks({
    "palette": "default",
    "density": "comfortable"
  });

  useEffect(() => {
    document.documentElement.dataset.palette = tweaks.palette === 'default' ? '' : tweaks.palette;
  }, [tweaks.palette]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const { data, loading, error, refreshData, activeStandard } = useNexusData();

  const goTo = (r) => { setRoute(r); setSidebarOpen(false); window.scrollTo({ top: 0 }); };

  const fillToken = new URLSearchParams(window.location.search).get('fill');
  if (fillToken) return <FormFillPage token={fillToken} />;

  if (!user) return <LoginPage />;

  const criticalTaskCount = tasks.filter(t => t.status !== 'done' && t.priority === 'critical').length;

  const notifications = (() => {
    const items = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const critTasks = tasks.filter(t => t.priority === 'critical' && t.status !== 'done');
    if (critTasks.length > 0)
      items.push({ kind: 'bad', icon: 'alert', title: `${critTasks.length} critical task${critTasks.length > 1 ? 's' : ''} open`, sub: critTasks.slice(0, 2).map(t => t.title).join(' · '), page: 'tasks' });

    const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today);
    if (overdue.length > 0)
      items.push({ kind: 'bad', icon: 'clock', title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`, sub: overdue.slice(0, 2).map(t => t.title).join(' · '), page: 'tasks' });

    if (data) {
      const badStudies = data.studies.filter(s => s.sla === 'bad' && s.status !== 'Final');
      if (badStudies.length > 0)
        items.push({ kind: 'bad', icon: 'paper', title: `${badStudies.length} stud${badStudies.length > 1 ? 'ies' : 'y'} past 10-day SLA`, sub: badStudies.map(s => s.id).join(', '), page: 'studies' });

      const awaitingStudies = data.studies.filter(s => s.status === 'Awaiting sign-off');
      if (awaitingStudies.length > 0)
        items.push({ kind: 'warn', icon: 'paper', title: `${awaitingStudies.length} stud${awaitingStudies.length > 1 ? 'ies' : 'y'} awaiting sign-off`, sub: awaitingStudies.map(s => s.id).join(', '), page: 'studies' });

      const badEquip = data.equipment.filter(e => e.verifyStatus === 'bad');
      if (badEquip.length > 0)
        items.push({ kind: 'bad', icon: 'cube', title: `${badEquip.length} equipment item${badEquip.length > 1 ? 's' : ''} verification overdue`, sub: badEquip.slice(0, 2).map(e => e.id).join(', '), page: 'equipment' });

      const ncSections = data.complianceBySection.filter(s => s.nc > 0);
      if (ncSections.length > 0) {
        const totalNc = ncSections.reduce((s, x) => s + x.nc, 0);
        items.push({ kind: 'warn', icon: 'shield', title: `${totalNc} non-conformant clause${totalNc > 1 ? 's' : ''}`, sub: ncSections.map(s => `§${s.id}`).join('  ·  '), page: 'accreditation' });
      }

      const days = data.service?.daysToAssessment;
      if (days != null && days >= 0 && days < 90)
        items.push({ kind: days < 30 ? 'bad' : 'warn', icon: 'shield', title: `${activeStandard === 'aasm' ? 'AASM' : 'NATA'} assessment in ${days} day${days !== 1 ? 's' : ''}`, sub: `Scheduled: ${data.service.nextAssessment}`, page: 'accreditation' });
    }

    return items;
  })();

  const badges = data ? {
    tasks: criticalTaskCount || null,
    acc: data.complianceBySection.reduce((s,x) => s + x.nc, 0) || null,
    studies: data.studies.filter(s => s.status === 'Awaiting sign-off').length || null,
    equipment: data.equipment.filter(e => e.verifyStatus === 'bad').length || null,
    ncr: 7,
  } : { tasks: criticalTaskCount || null };

  const crumbsFor = {
    home: ["Home"],
    tasks: ["Workspace", "My tasks"],
    accreditation: ["Compliance", "Accreditation"],
    documents: ["Compliance", "Documents & SOPs"],
    audits: ["Compliance", "Audits & reviews"],
    ncr: ["Compliance", "NC & CAPA"],
    scheduler: ["Operations", "Scheduler"],
    patients: ["Operations", "Patients"],
    studies: ["Operations", "Studies & reports"],
    indicators: ["Operations", "Quality indicators"],
    equipment: ["Operations", "Equipment register"],
    staff: ["Operations", "Staff & training"],
    workbooks: ["Operations", "Workbooks"],
    isr:       ["Compliance", "Inter-Scorer Reliability"],
    settings: ["Admin", "Settings"],
    trail: ["Admin", "Audit trail"],
  };

  const renderPage = () => {
    switch (route) {
      case "home": return <HomePage data={data} goTo={goTo} openClause={setOpenClauseId} />;
      case "tasks": return <TasksPage />;
      case "accreditation": return <AccreditationPage data={data} openClause={setOpenClauseId} goTo={goTo} />;
      case "indicators": return <IndicatorsPage data={data} />;
      case "scheduler": return <SchedulerPage />;
      case "patients": return <PatientsPage openStudy={setOpenStudyId} />;
      case "studies": return <StudiesPage data={data} openStudy={setOpenStudyId} />;
      case "equipment": return <EquipmentPage />;
      case "documents": return <DocumentsPage />;
      case "audits": return <AuditsPage />;
      case "ncr": return <NCRPage />;
      case "staff": return <StaffPage />;
      case "workbooks": return <WorkbooksPage />;
      case "isr":       return <ISRPage />;
      case "settings": return <SettingsPage />;
      case "trail": return <AuditTrailPage />;
      default: return <HomePage data={data} goTo={goTo} openClause={setOpenClauseId} />;
    }
  };

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', fontSize: 14, color: 'var(--ink-3)' }}>
      Loading…
    </div>
  );

  if (error) return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', fontSize: 14, color: 'var(--bad)' }}>
      Could not reach API — is the backend running? ({error})
    </div>
  );

  return (
    <>
      <div className="shell" data-density={tweaks.density}>
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
        <Sidebar current={route} setCurrent={goTo} badges={badges} user={user} onSignOut={signOut} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main">
          <Topbar crumbs={crumbsFor[route] || ["Home"]} onSearch={() => setSearchOpen(true)} notifications={notifications} goTo={goTo} onMenuToggle={() => setSidebarOpen(o => !o)} />
          {renderPage()}
        </div>

        <Drawer open={!!openClauseId} onClose={() => setOpenClauseId(null)}>
          <ClauseDrawer data={data} clauseId={openClauseId} onClose={() => setOpenClauseId(null)} />
        </Drawer>

        <Drawer open={!!openStudyId} onClose={() => setOpenStudyId(null)}>
          <StudyDrawer data={data} studyId={openStudyId} onClose={() => setOpenStudyId(null)} onStudyUpdated={refreshData} />
        </Drawer>

        <TweaksPanel title="Tweaks">
          <TweakSection title="Palette" subtitle="Color treatments for the same product">
            <TweakRadio
              label="Color system"
              value={tweaks.palette}
              options={['default', 'navy', 'neutral', 'teal']}
              onChange={(v) => setTweak('palette', v)}
            />
          </TweakSection>
        </TweaksPanel>
      </div>

      {searchOpen && data && (
        <GlobalSearch data={data} goTo={(r) => { goTo(r); setSearchOpen(false); }} onClose={() => setSearchOpen(false)} />
      )}

      {/* Global task creation modal — z-index 60, above drawers */}
      {modalOpen && (
        <div className="task-modal-overlay" onClick={closeTaskModal}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <TaskFormDrawer
              key={JSON.stringify(modalPrefill)}
              prefill={modalPrefill}
              isEdit={false}
              onSave={(task) => { addTask(task); closeTaskModal(); }}
              onClose={closeTaskModal}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default App;
