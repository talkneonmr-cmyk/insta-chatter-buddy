import { ReactNode } from "react";

interface TesterGuardProps {
  children: ReactNode;
  featureName?: string;
}

export default function TesterGuard({ children }: TesterGuardProps) {
  // Tester system removed: always allow access
  return <>{children}</>;
}
