import { BrowserRouter, Routes, Route } from 'react-router';
import AppShell from './components/layout/AppShell';
import LessonListPage from './pages/LessonListPage';
import LessonPage from './pages/LessonPage';
import RecentsPage from './pages/RecentsPage';
import SeriesPage from './pages/SeriesPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<LessonListPage />} />
          <Route path="lesson/:id" element={<LessonPage />} />
          <Route path="recents" element={<RecentsPage />} />
          <Route path="series/:title" element={<SeriesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
