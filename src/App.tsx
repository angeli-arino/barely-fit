import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { Toast } from './components/layout/Toast';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage';
import { ExerciseCatalogPage } from './pages/ExerciseCatalogPage';
import { HistoryPage } from './pages/HistoryPage';
import { WorkoutSchedulePage } from './pages/WorkoutSchedulePage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { SignInPage } from './pages/SignInPage';
import { TemplateEditorPage } from './pages/TemplateEditorPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TodayPage } from './pages/TodayPage';
import { WorkoutDetailPage } from './pages/WorkoutDetailPage';
import { useAppState } from './state/AppState';

function ProtectedApp() {
  const { authenticated } = useAppState();
  return authenticated ? <AppShell /> : <Navigate to="/sign-in" replace />;
}

export function App() {
  const { loading, authenticated } = useAppState();
  if (loading) return <LoadingScreen />;

  return (
    <>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route element={<ProtectedApp />}>
          <Route path="/today" element={<TodayPage />} />
          <Route path="/workout/active" element={<ActiveWorkoutPage />} />
          <Route path="/plan" element={<WorkoutSchedulePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/:templateId" element={<TemplateEditorPage />} />
          <Route path="/exercises" element={<ExerciseCatalogPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:workoutId" element={<WorkoutDetailPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/" element={<Navigate to={authenticated ? '/today' : '/sign-in'} replace />} />
        <Route path="*" element={<Navigate to={authenticated ? '/today' : '/sign-in'} replace />} />
      </Routes>
      <Toast />
    </>
  );
}
