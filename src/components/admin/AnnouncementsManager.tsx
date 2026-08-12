import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Megaphone, RefreshCw, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export default function AnnouncementsManager() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success" | "error">("info");
  const [expiresIn, setExpiresIn] = useState<string>("never");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Admin needs to see all announcements, even inactive ones
      // We'll fetch directly since admin check is done at component level
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements((data || []) as Announcement[]);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let expiresAt: string | null = null;
      if (expiresIn !== "never") {
        const now = new Date();
        switch (expiresIn) {
          case "1h":
            expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            break;
          case "1d":
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            break;
          case "7d":
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case "30d":
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
      }

      const { error } = await supabase
        .from("announcements")
        .insert({
          title: title.trim(),
          message: message.trim(),
          type,
          created_by: user.id,
          expires_at: expiresAt,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created successfully",
      });

      // Reset form
      setTitle("");
      setMessage("");
      setType("info");
      setExpiresIn("never");
      setShowForm(false);
      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Announcement ${!currentStatus ? "activated" : "deactivated"}`,
      });

      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error toggling announcement:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update announcement",
        variant: "destructive",
      });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement deleted",
      });

      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete announcement",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (announcementType: string) => {
    switch (announcementType) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </h3>
          <p className="text-sm text-muted-foreground">
            Create announcements visible to all users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Announcement</CardTitle>
            <CardDescription>
              This announcement will be visible to all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Announcement message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <span className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        Info
                      </span>
                    </SelectItem>
                    <SelectItem value="success">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Success
                      </span>
                    </SelectItem>
                    <SelectItem value="warning">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Warning
                      </span>
                    </SelectItem>
                    <SelectItem value="error">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Error
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expires</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={createAnnouncement} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No announcements yet</p>
            <p className="text-sm">Create your first announcement above</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>{getTypeIcon(announcement.type)}</TableCell>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    {announcement.title}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {announcement.message}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(announcement.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {announcement.expires_at 
                      ? formatDate(announcement.expires_at)
                      : "Never"
                    }
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={announcement.is_active}
                      onCheckedChange={() => toggleActive(announcement.id, announcement.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteAnnouncement(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
