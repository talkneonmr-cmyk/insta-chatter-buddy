import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { FabuosShell } from "./components/FabuosShell";
import SignIn from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Life from "./pages/Life";
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
          <Route path="/create" element={<Create />} />
          <Route path="/life" element={<Life />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />
        </Route>
      </Routes>
    </>
  );
}
