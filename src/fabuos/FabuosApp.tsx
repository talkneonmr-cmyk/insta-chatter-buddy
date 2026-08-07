import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { FabuosShell } from "./components/FabuosShell";
import SignIn from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Compass from "./pages/Compass";
import Create from "./pages/Create";
import Grow from "./pages/Grow";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";

export default function FabuosApp() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<FabuosShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/compass" element={<Compass />} />
          <Route path="/create" element={<Create />} />
          <Route path="/grow" element={<Grow />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}
