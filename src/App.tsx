import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import LandingPage from "./pages/LandingPage";

const AppRoutes = lazy(() => import("./AppRoutes"));
const DrFabuosAI = lazy(() => import("./pages/DrFabuosAI"));
const DrFabuos = lazy(() => import("./pages/DrFabuos"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
    <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/index" element={<LandingPage />} />
          <Route path="/dr-fabuos-ai" element={<DrFabuosAI />} />
          <Route path="/dr-fabuos" element={<DrFabuos />} />
          <Route path="*" element={<AppRoutes />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
