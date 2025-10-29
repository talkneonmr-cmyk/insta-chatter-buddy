import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Crown, Loader2, RefreshCw, Shield, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  plan: string;
  status: string;
  role: string | null;
  video_uploads: number;
  ai_captions: number;
  youtube_channels: number;
  ai_music: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: adminCheckLoading } = useIsAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!adminCheckLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, adminCheckLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users with their profiles, subscriptions, and roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, created_at");

      if (profilesError) throw profilesError;

      // Get subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan, status");

      if (subsError) throw subsError;

      // Get roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get usage tracking
      const { data: usage, error: usageError } = await supabase
        .from("usage_tracking")
        .select("user_id, video_uploads_count, ai_captions_count, youtube_channels_count, ai_music_count");

      if (usageError) throw usageError;

      // Combine data
      const usersData: UserData[] = profiles?.map((profile) => {
        const subscription = subscriptions?.find((s) => s.user_id === profile.id);
        const userRole = roles?.find((r) => r.user_id === profile.id);
        const userUsage = usage?.find((u) => u.user_id === profile.id);

        return {
          id: profile.id,
          email: profile.email || "No email",
          created_at: profile.created_at,
          plan: subscription?.plan || "free",
          status: subscription?.status || "active",
          role: userRole?.role || null,
          video_uploads: userUsage?.video_uploads_count || 0,
          ai_captions: userUsage?.ai_captions_count || 0,
          youtube_channels: userUsage?.youtube_channels_count || 0,
          ai_music: userUsage?.ai_music_count || 0,
        };
      }) || [];

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId: string, newPlan: "free" | "pro") => {
    try {
      setUpdating(userId);

      const currentDate = new Date();
      const nextMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));

      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          plan: newPlan,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: nextMonthDate.toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User plan updated to ${newPlan}`,
      });

      fetchUsers();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        title: "Error",
        description: "Failed to update user plan",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const toggleAdminRole = async (userId: string, currentRole: string | null) => {
    try {
      setUpdating(userId);

      if (currentRole === "admin") {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;

        toast({
          title: "Success",
          description: "Admin role removed",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Admin role granted",
        });
      }

      fetchUsers();
    } catch (error) {
      console.error("Error toggling admin role:", error);
      toast({
        title: "Error",
        description: "Failed to update admin role",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const resetUsage = async (userId: string) => {
    try {
      setUpdating(userId);

      const { error } = await supabase
        .from("usage_tracking")
        .update({
          video_uploads_count: 0,
          ai_captions_count: 0,
          youtube_channels_count: 0,
          ai_music_count: 0,
          reset_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Usage limits reset successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error resetting usage:", error);
      toast({
        title: "Error",
        description: "Failed to reset usage limits",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (adminCheckLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage users and subscriptions</p>
            </div>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {users.filter((u) => u.plan === "pro").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage user subscriptions and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.plan}
                            onValueChange={(value) =>
                              updateUserPlan(user.id, value as "free" | "pro")
                            }
                            disabled={updating === user.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>Videos: {user.video_uploads}</div>
                            <div>Captions: {user.ai_captions}</div>
                            <div>Channels: {user.youtube_channels}</div>
                            <div>Music: {user.ai_music}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.role === "admin" ? (
                            <Badge variant="destructive" className="gap-1">
                              <Crown className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAdminRole(user.id, user.role)}
                              disabled={updating === user.id}
                            >
                              {updating === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : user.role === "admin" ? (
                                "Remove Admin"
                              ) : (
                                "Make Admin"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resetUsage(user.id)}
                              disabled={updating === user.id}
                              title="Reset usage limits"
                            >
                              {updating === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
