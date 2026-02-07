import { BrowserRouter, Routes, Route } from 'react-router';
import AppShell from './components/layout/AppShell';
import LessonListPage from './pages/LessonListPage';
import LessonPage from './pages/LessonPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<LessonListPage />} />
          <Route path="lesson/:id" element={<LessonPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
