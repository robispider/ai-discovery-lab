import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { Shell } from '../shell/Shell';
import { LessonView } from '../shell/LessonView';
import { Home } from '../pages/Home';
import { Glossary } from '../pages/Glossary';
import { ReferenceProjects } from '../pages/ReferenceProjects';
import { ComingSoon } from '../pages/ComingSoon';
import { Settings } from '../pages/Settings';
import { usePreferences } from './usePreferences';

/*
 * HashRouter keeps every view addressable (#/lesson/3) on any static host and when the
 * classroom build is opened straight from disk, where there is no server to rewrite paths.
 */
export function App() {
  usePreferences();
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="references" element={<ReferenceProjects />} />
        <Route path="lesson/:n" element={<LessonView />} />
        <Route path="map" element={<ComingSoon title="nav.map" />} />
        <Route path="glossary" element={<Glossary />} />
        <Route path="session" element={<ComingSoon title="nav.session" />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
