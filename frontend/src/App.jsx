import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { ThemeProvider } from "./lib/ThemeContext";
import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Header from "./components/layout/Header";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DatasetsPage from "./pages/DatasetsPage";
import UploadPage from "./pages/UploadPage";
import DatasetDetailPage from "./pages/DatasetDetailPage";
import QueryPage from "./pages/QueryPage";
import VisualizationPage from "./pages/VisualizationPage";
import DashboardPage from "./pages/DashboardPage";
import WidgetsPage from "./pages/WidgetsPage";
import CustomQueryPage from "./pages/CustomQueryPage";
import ApiIntegrationPage from "./pages/ApiIntegrationPage";
import UrlImportPage from "./pages/UrlImportPage";

/** Wrap a page in ProtectedRoute + the app shell (Header + scrollable main) */
function AppShell({ children }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col w-screen h-screen overflow-hidden bg-bg-base">
        <Header />
        <main className="flex-1 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Routes>
                {/* ── Public auth routes ── */}
                <Route path="/login"  element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* ── Protected app routes ── */}
                <Route path="/"           element={<AppShell><DatasetsPage /></AppShell>} />
                <Route path="/upload"     element={<AppShell><UploadPage /></AppShell>} />
                <Route path="/dataset/:id" element={<AppShell><DatasetDetailPage /></AppShell>} />
                <Route path="/query"      element={<AppShell><QueryPage /></AppShell>} />
                <Route path="/custom"     element={<AppShell><CustomQueryPage /></AppShell>} />
                <Route path="/visualize"  element={<AppShell><VisualizationPage /></AppShell>} />
                <Route path="/dashboards" element={<AppShell><DashboardPage /></AppShell>} />
                <Route path="/widgets"    element={<AppShell><WidgetsPage /></AppShell>} />
                <Route path="/api"        element={<AppShell><ApiIntegrationPage /></AppShell>} />
                <Route path="/import/url" element={<AppShell><UrlImportPage /></AppShell>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
