import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { ThemeProvider } from "./lib/ThemeContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import DatasetsPage from "./pages/DatasetsPage";
import UploadPage from "./pages/UploadPage";
import DatasetDetailPage from "./pages/DatasetDetailPage";
import QueryPage from "./pages/QueryPage";
import VisualizationPage from "./pages/VisualizationPage";
import DashboardPage from "./pages/DashboardPage";
import WidgetsPage from "./pages/WidgetsPage";
import CustomQueryPage from "./pages/CustomQueryPage";
import ApiIntegrationPage from "./pages/ApiIntegrationPage";

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <div className="flex w-screen h-screen overflow-hidden bg-bg-base">
              <Sidebar />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto animate-fade-in">
                  <Routes>
                    <Route path="/" element={<DatasetsPage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route
                      path="/dataset/:id"
                      element={<DatasetDetailPage />}
                    />
                    <Route path="/query" element={<QueryPage />} />
                    <Route path="/custom" element={<CustomQueryPage />} />
                    <Route path="/visualize" element={<VisualizationPage />} />
                    <Route path="/dashboards" element={<DashboardPage />} />
                    <Route path="/widgets" element={<WidgetsPage />} />
                    <Route path="/api" element={<ApiIntegrationPage />} />
                  </Routes>
                </main>
              </div>
            </div>
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
