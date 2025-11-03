import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Crown, Loader2, RefreshCw, Shield, RotateCcw, Users, Activity, Mail, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import ActivityLogs from "@/components/ActivityLogs";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  confirmed_at: string | null;
  banned_until: string | null;
  raw_user_meta_data: any;
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
      
      // Fetch users using the admin function
      const { data: authUsers, error: usersError } = await supabase.rpc('get_all_users_admin');
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw usersError;
      }

      // Fetch subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*');

      if (subsError) {
        console.error("Error fetching subscriptions:", subsError);
        throw subsError;
      }

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        throw rolesError;
      }

      // Fetch usage tracking
      const { data: usage, error: usageError } = await supabase
        .from('usage_tracking')
        .select('*');

      if (usageError) {
        console.error("Error fetching usage:", usageError);
        throw usageError;
      }

      // Combine all data
      const combinedUsers: UserData[] = authUsers.map((user: any) => {
        const userSub = subscriptions?.find(s => s.user_id === user.id);
        const userRole = roles?.find(r => r.user_id === user.id);
        const userUsage = usage?.find(u => u.user_id === user.id);

        return {
          id: user.id,
          email: user.email || 'N/A',
          created_at: user.created_at,
          plan: userSub?.plan || 'free',
          status: userSub?.status || 'active',
          role: userRole?.role || 'user',
          video_uploads: userUsage?.video_uploads_count || 0,
          ai_captions: userUsage?.ai_captions_count || 0,
          youtube_channels: userUsage?.youtube_channels_count || 0,
          ai_music: userUsage?.ai_music_count || 0,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at,
          confirmed_at: user.confirmed_at,
          banned_until: user.banned_until,
          raw_user_meta_data: user.raw_user_meta_data,
        };
      });

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error("Error in fetchUsers:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
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

  const toggleTesterRole = async (userId: string, currentRole: string | null) => {
    try {
      setUpdating(userId);

      if (currentRole === "tester") {
        // Remove tester role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "tester");

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tester role removed",
        });
      } else {
        // Add tester role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "tester" });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tester role granted",
        });
      }

      fetchUsers();
    } catch (error) {
      console.error("Error toggling tester role:", error);
      toast({
        title: "Error",
        description: "Failed to update tester role",
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

  const sendPasswordReset = async (email: string, userId: string) => {
    try {
      setUpdating(userId);

      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Password reset email sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const toggleAccountStatus = async (userId: string, action: 'disable' | 'enable') => {
    try {
      setUpdating(userId);

      const { error } = await supabase.functions.invoke('toggle-account-status', {
        body: { userId, action },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Account ${action}d successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      console.error(`Error ${action}ing account:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} account`,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const forcePasswordReset = async (userId: string, email: string) => {
    try {
      setUpdating(userId);

      const { error } = await supabase.functions.invoke('force-password-reset', {
        body: { userId, userEmail: email },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User will be required to reset password on next login",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error forcing password reset:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to force password reset",
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

        {/* Tabs for Users and Activity Logs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
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
                          <TableHead>Email Status</TableHead>
                          <TableHead>Last Sign In</TableHead>
                          <TableHead>Last Password Change</TableHead>
                          <TableHead>Account Status</TableHead>
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
                              {user.email_confirmed_at ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Unverified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.last_sign_in_at
                                ? new Date(user.last_sign_in_at).toLocaleDateString() +
                                  " " +
                                  new Date(user.last_sign_in_at).toLocaleTimeString()
                                : "Never"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.confirmed_at 
                                ? new Date(user.confirmed_at).toLocaleDateString()
                                : 'Never changed'}
                            </TableCell>
                            <TableCell>
                              {user.raw_user_meta_data?.account_disabled ? (
                                <Badge variant="destructive">Disabled</Badge>
                              ) : user.raw_user_meta_data?.force_password_change ? (
                                <Badge variant="outline" className="border-orange-500 text-orange-500">
                                  Reset Required
                                </Badge>
                              ) : user.banned_until ? (
                                <Badge variant="destructive">
                                  Banned
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                  Active
                                </Badge>
                              )}
                            </TableCell>
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
                              <div className="flex gap-2 flex-wrap">
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendPasswordReset(user.email, user.id)}
                                  disabled={updating === user.id}
                                  title="Send password reset email"
                                >
                                  {updating === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Mail className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={user.raw_user_meta_data?.account_disabled ? "default" : "destructive"}
                                  onClick={() => toggleAccountStatus(
                                    user.id, 
                                    user.raw_user_meta_data?.account_disabled ? 'enable' : 'disable'
                                  )}
                                  disabled={updating === user.id}
                                  title={user.raw_user_meta_data?.account_disabled ? 'Enable account' : 'Disable account'}
                                >
                                  {updating === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : user.raw_user_meta_data?.account_disabled ? (
                                    "Enable"
                                  ) : (
                                    "Disable"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-orange-500 text-orange-500 hover:bg-orange-50"
                                  onClick={() => forcePasswordReset(user.id, user.email)}
                                  disabled={updating === user.id}
                                  title="Force password reset on next login"
                                >
                                  {updating === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Force Reset"
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
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <ActivityLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
