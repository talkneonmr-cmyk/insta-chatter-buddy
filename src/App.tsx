import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Splash } from "./fabuos/components/Splash";

const FabuosApp = lazy(() => import("./fabuos/FabuosApp"));

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <Suspense fallback={<Splash />}>
        <FabuosApp />
      </Suspense>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
