import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { CollaborationProvider } from "@/contexts/CollaborationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { dataService } from "@/services/dataService";

import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundaryRoute } from "./components/ErrorBoundaryRoute";

// Lazy load pages for code splitting and performance optimization
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DigitalTwin = lazy(() => import("./pages/DigitalTwin"));
const EnergyUsage = lazy(() => import("./pages/EnergyUsage"));
const RenewableEnergy = lazy(() => import("./pages/RenewableEnergy"));
const Weather = lazy(() => import("./pages/Weather"));
const Hardware = lazy(() => import("./pages/Hardware"));
const SettingsEnhanced = lazy(() => import("./pages/SettingsEnhanced"));
const CustomReports = lazy(() => import("./pages/CustomReports"));
const AIMonitoring = lazy(() => import("./pages/AIMonitoring"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Intro = lazy(() => import("./pages/Intro"));

const queryClient = new QueryClient();

const App = () => {
  // Initialize data service on app startup
  useEffect(() => {
    // Initialize asynchronously to avoid blocking render
    const initDataService = async () => {
      try {
        await dataService.initialize();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to initialize data service:', errorMessage);
        // App continues to work with mock data even if initialization fails
      }
    };

    initDataService();

    // Cleanup on unmount
    return () => {
      try {
        dataService.cleanup();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error during cleanup:', errorMessage);
      }
    };
  }, []);
  useEffect(() => {
    // Enable React Router future flags to suppress warnings
    window.history.pushState({}, "", window.location.href);
  }, []);

  // Force white/off-white theme - Remove dark mode completely
  useEffect(() => {
    const root = document.documentElement;
    // Always remove dark class to ensure white theme
    root.classList.remove('dark');
    // Clear any dark theme preference
    localStorage.setItem('theme', 'light');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <CollaborationProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_relativeSplatPath: true,
                v7_startTransition: true,
              }}
            >
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
              }>
                <Routes>
                  {/* Public routes - no layout */}
                  <Route path="/" element={<Intro />} />
                  <Route path="/login" element={<Login />} />

                  {/* Protected routes - with layout */}
                  <Route path="/dashboard" element={
                    <ErrorBoundaryRoute routeName="dashboard">
                      <ProtectedRoute>
                        <Layout>
                          <Dashboard />
                        </Layout>
                      </ProtectedRoute>
                    </ErrorBoundaryRoute>
                  } />
                  <Route path="/digital-twin" element={
                    <ProtectedRoute>
                      <Layout>
                        <DigitalTwin />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/energy-usage" element={
                    <ProtectedRoute>
                      <Layout>
                        <EnergyUsage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/renewable-energy" element={
                    <ProtectedRoute>
                      <Layout>
                        <RenewableEnergy />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/weather" element={
                    <ProtectedRoute>
                      <Layout>
                        <Weather />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/hardware" element={
                    <ProtectedRoute>
                      <Layout>
                        <Hardware />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Layout>
                        <SettingsEnhanced />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/custom-reports" element={
                    <ProtectedRoute>
                      <Layout>
                        <CustomReports />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ai-monitoring" element={
                    <ProtectedRoute>
                      <Layout>
                        <AIMonitoring />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={
                    <ProtectedRoute>
                      <Layout>
                        <NotFound />
                      </Layout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </Suspense>
            </BrowserRouter>
            </TooltipProvider>
          </CollaborationProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;