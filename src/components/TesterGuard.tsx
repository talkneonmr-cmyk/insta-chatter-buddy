import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Users } from "lucide-react";
import { useIsTester } from "@/hooks/useIsTester";

interface TesterGuardProps {
  children: ReactNode;
  featureName?: string;
}

export default function TesterGuard({ 
  children, 
  featureName = "this feature"
}: TesterGuardProps) {
  const { isTester, isLoading } = useIsTester();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Users className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (isTester) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Lock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <CardTitle>Tester Account - Limited Access</CardTitle>
              <CardDescription>
                {featureName} is not available for tester accounts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Available Features for Testers:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Music Generator</li>
              <li>✓ YouTube Manager</li>
              <li>✓ Image Enhancement</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            To access all features, contact the administrator to become a partner.
          </p>
          <Button 
            onClick={() => {
              localStorage.removeItem('tester_session_token');
              navigate("/auth");
            }} 
            className="w-full" 
            variant="outline"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
