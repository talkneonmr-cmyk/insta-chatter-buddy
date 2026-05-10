import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

const AppRoutes = lazy(() => import("./AppRoutes"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
    <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/index" element={<LandingPage />} />
        <Route path="*" element={<AppRoutes />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
