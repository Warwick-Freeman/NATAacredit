import React, { useState, useEffect } from 'react';
import { useNexusData } from './NexusDataContext';
import { Sidebar, Topbar, Drawer } from './components';
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
import { TasksPage } from './pages/page-stubs';
import ClauseDrawer from './clause-drawer';
import StudyDrawer from './study-drawer';

const App = () => {
  const [route, setRoute] = useState("home");
  const [openClauseId, setOpenClauseId] = useState(null);
  const [openStudyId, setOpenStudyId] = useState(null);
  const [tweaks, setTweak] = useTweaks({
    "palette": "default",
    "density": "comfortable"
  });

  useEffect(() => {
    document.documentElement.dataset.palette = tweaks.palette === 'default' ? '' : tweaks.palette;
  }, [tweaks.palette]);

  const goTo = (r) => { setRoute(r); window.scrollTo({ top: 0 }); };

  const { data, loading, error } = useNexusData();
  const badges = data ? {
    tasks: data.tasks.filter(t => t.priority === 'critical').length || null,
    acc: data.complianceBySection.reduce((s,x) => s + x.nc, 0) || null,
    studies: data.studies.filter(s => s.status === 'Awaiting sign-off').length || null,
    equipment: data.equipment.filter(e => e.verifyStatus === 'bad').length || null,
    ncr: 7,
  } : {};

  const crumbsFor = {
    home: ["Home"],
    tasks: ["Workspace", "My tasks"],
    accreditation: ["Compliance", "Accreditation"],
    documents: ["Compliance", "Documents & SOPs"],
    audits: ["Compliance", "Audits & reviews"],
    ncr: ["Compliance", "NC & CAPA"],
    studies: ["Operations", "Studies & reports"],
    indicators: ["Operations", "Quality indicators"],
    equipment: ["Operations", "Equipment register"],
    staff: ["Operations", "Staff & training"],
    settings: ["Admin", "Settings"],
  };

  const renderPage = () => {
    switch (route) {
      case "home": return <HomePage data={data} goTo={goTo} openClause={setOpenClauseId} />;
      case "tasks": return <TasksPage data={data} />;
      case "accreditation": return <AccreditationPage data={data} openClause={setOpenClauseId} />;
      case "indicators": return <IndicatorsPage data={data} />;
      case "studies": return <StudiesPage data={data} openStudy={setOpenStudyId} />;
      case "equipment": return <EquipmentPage data={data} />;
      case "documents": return <DocumentsPage />;
      case "audits": return <AuditsPage />;
      case "ncr": return <NCRPage />;
      case "staff": return <StaffPage />;
      case "settings": return <SettingsPage />;
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
    <div className="shell" data-density={tweaks.density}>
      <Sidebar current={route} setCurrent={goTo} badges={badges} />
      <div className="main">
        <Topbar crumbs={crumbsFor[route] || ["Home"]} />
        {renderPage()}
      </div>

      <Drawer open={!!openClauseId} onClose={() => setOpenClauseId(null)}>
        <ClauseDrawer data={data} clauseId={openClauseId} onClose={() => setOpenClauseId(null)} />
      </Drawer>

      <Drawer open={!!openStudyId} onClose={() => setOpenStudyId(null)}>
        <StudyDrawer data={data} studyId={openStudyId} onClose={() => setOpenStudyId(null)} />
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
  );
};

export default App;
