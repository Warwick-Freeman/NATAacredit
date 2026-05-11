import React, { useState, useEffect } from 'react';
import NEXUS_DATA from './data';
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

  const D = NEXUS_DATA;
  const badges = {
    tasks: D.tasks.filter(t => t.priority === 'critical').length || null,
    acc: D.complianceBySection.reduce((s,x) => s + x.nc, 0) || null,
    studies: D.studies.filter(s => s.status === 'Awaiting sign-off').length || null,
    equipment: D.equipment.filter(e => e.verifyStatus === 'bad').length || null,
    ncr: 7,
  };

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
      case "home": return <HomePage goTo={goTo} openClause={setOpenClauseId} />;
      case "tasks": return <TasksPage />;
      case "accreditation": return <AccreditationPage openClause={setOpenClauseId} />;
      case "indicators": return <IndicatorsPage />;
      case "studies": return <StudiesPage openStudy={setOpenStudyId} />;
      case "equipment": return <EquipmentPage />;
      case "documents": return <DocumentsPage />;
      case "audits": return <AuditsPage />;
      case "ncr": return <NCRPage />;
      case "staff": return <StaffPage />;
      case "settings": return <SettingsPage />;
      default: return <HomePage goTo={goTo} openClause={setOpenClauseId} />;
    }
  };

  return (
    <div className="shell" data-density={tweaks.density}>
      <Sidebar current={route} setCurrent={goTo} badges={badges} />
      <div className="main">
        <Topbar crumbs={crumbsFor[route] || ["Home"]} />
        {renderPage()}
      </div>

      <Drawer open={!!openClauseId} onClose={() => setOpenClauseId(null)}>
        <ClauseDrawer clauseId={openClauseId} onClose={() => setOpenClauseId(null)} />
      </Drawer>

      <Drawer open={!!openStudyId} onClose={() => setOpenStudyId(null)}>
        <StudyDrawer studyId={openStudyId} onClose={() => setOpenStudyId(null)} />
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
