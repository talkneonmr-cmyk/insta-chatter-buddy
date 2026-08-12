import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Play, Eye, Search, Youtube } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: string;
}

const YouTubeBulkOperations = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [noAccount, setNoAccount] = useState(false);

  // Operation states
  const [operationType, setOperationType] = useState<string>("findReplace");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [appendText, setAppendText] = useState("");
  const [prependText, setPrependText] = useState("");
  const [targetField, setTargetField] = useState<string>("title");
  const [privacyStatus, setPrivacyStatus] = useState<string>("public");
  const [tagsToAdd, setTagsToAdd] = useState("");
  const [tagsToRemove, setTagsToRemove] = useState("");

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setNoAccount(false);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-list-videos', {
        body: { maxResults: 50 }
      });

      if (error) {
        if (error.message?.includes('YouTube account not found')) {
          setNoAccount(true);
          return;
        }
        throw error;
      }
      setVideos(data.videos || []);
    } catch (error: any) {
      if (error.message?.includes('YouTube account not found')) {
        setNoAccount(true);
      } else {
        toast.error("Failed to fetch videos: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleVideo = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const toggleAll = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOperationPayload = () => {
    switch (operationType) {
      case 'findReplace':
        return { type: 'findReplace', find: findText, replace: replaceText, target: targetField };
      case 'appendText':
        return { type: 'appendText', text: appendText, target: targetField };
      case 'prependText':
        return { type: 'prependText', text: prependText, target: targetField };
      case 'changePrivacy':
        return { type: 'changePrivacy', privacyStatus };
      case 'addTags':
        return { type: 'addTags', tags: tagsToAdd.split(',').map(t => t.trim()) };
      case 'removeTags':
        return { type: 'removeTags', tags: tagsToRemove.split(',').map(t => t.trim()) };
      default:
        return {};
    }
  };

  const previewChanges = () => {
    if (selectedVideos.size === 0) {
      toast.error("Please select at least one video");
      return;
    }
    setShowPreview(true);
  };

  const applyBulkOperation = async () => {
    if (selectedVideos.size === 0) {
      toast.error("Please select at least one video");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const operation = getOperationPayload();
      const videoIds = Array.from(selectedVideos);

      const { data, error } = await supabase.functions.invoke('youtube-bulk-update', {
        body: { videoIds, operation }
      });

      if (error) throw error;

      setProgress(100);
      
      // Increment YouTube operations usage
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'youtube_operations' }
      });
      
      toast.success(`Bulk operation completed! ${data.successCount} successful, ${data.failureCount} failed`);
      
      // Refresh videos
      await fetchVideos();
      setSelectedVideos(new Set());
      setShowPreview(false);
    } catch (error: any) {
      toast.error("Bulk operation failed: " + error.message);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const getPreviewText = (video: Video) => {
    const operation = getOperationPayload();
    let preview = "";

    switch (operation.type) {
      case 'findReplace':
        const target = operation.target === 'title' ? video.title : video.description;
        preview = target.split(operation.find).join(operation.replace);
        break;
      case 'appendText':
        preview = operation.target === 'title' 
          ? `${video.title}${operation.text}`
          : `${video.description}\n\n${operation.text}`;
        break;
      case 'prependText':
        preview = operation.target === 'title'
          ? `${operation.text}${video.title}`
          : `${operation.text}\n\n${video.description}`;
        break;
      case 'changePrivacy':
        preview = `Privacy will be changed to: ${operation.privacyStatus}`;
        break;
      case 'addTags':
        preview = `Tags to add: ${operation.tags.join(', ')}`;
        break;
      case 'removeTags':
        preview = `Tags to remove: ${operation.tags.join(', ')}`;
        break;
    }

    return preview;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (noAccount) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-red-500/10 rounded-full">
            <Youtube className="h-12 w-12 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">YouTube Account Not Connected</h3>
            <p className="text-muted-foreground mb-4">
              Please connect your YouTube account using the section above to access Bulk Operations.
            </p>
            <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Go to Account Connection
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Video Operations</h2>
          <p className="text-muted-foreground">Edit multiple videos at once</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedVideos.size} of {videos.length} videos selected
        </div>
      </div>

      {/* Search and Select All */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={toggleAll} variant="outline">
          {selectedVideos.size === filteredVideos.length ? "Deselect All" : "Select All"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Video List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Select Videos</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleVideo(video.id)}
              >
                <Checkbox
                  checked={selectedVideos.has(video.id)}
                  onCheckedChange={() => toggleVideo(video.id)}
                />
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-24 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                  <p className="text-xs text-muted-foreground">{video.viewCount} views</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Operations Panel */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Bulk Actions</h3>
          <Tabs value={operationType} onValueChange={setOperationType}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="findReplace">Find & Replace</TabsTrigger>
              <TabsTrigger value="appendText">Append</TabsTrigger>
              <TabsTrigger value="prependText">Prepend</TabsTrigger>
            </TabsList>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="changePrivacy">Privacy</TabsTrigger>
              <TabsTrigger value="addTags">Add Tags</TabsTrigger>
              <TabsTrigger value="removeTags">Remove Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="findReplace" className="space-y-4">
              <div>
                <Label>Target Field</Label>
                <Select value={targetField} onValueChange={setTargetField}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title Only</SelectItem>
                    <SelectItem value="description">Description Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Find Text</Label>
                <Input value={findText} onChange={(e) => setFindText(e.target.value)} />
              </div>
              <div>
                <Label>Replace With</Label>
                <Input value={replaceText} onChange={(e) => setReplaceText(e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="appendText" className="space-y-4">
              <div>
                <Label>Target Field</Label>
                <Select value={targetField} onValueChange={setTargetField}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Text to Append</Label>
                <Textarea value={appendText} onChange={(e) => setAppendText(e.target.value)} rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="prependText" className="space-y-4">
              <div>
                <Label>Target Field</Label>
                <Select value={targetField} onValueChange={setTargetField}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Text to Prepend</Label>
                <Textarea value={prependText} onChange={(e) => setPrependText(e.target.value)} rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="changePrivacy" className="space-y-4">
              <div>
                <Label>Privacy Status</Label>
                <Select value={privacyStatus} onValueChange={setPrivacyStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="addTags" className="space-y-4">
              <div>
                <Label>Tags to Add (comma-separated)</Label>
                <Textarea 
                  value={tagsToAdd} 
                  onChange={(e) => setTagsToAdd(e.target.value)} 
                  placeholder="tag1, tag2, tag3"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="removeTags" className="space-y-4">
              <div>
                <Label>Tags to Remove (comma-separated)</Label>
                <Textarea 
                  value={tagsToRemove} 
                  onChange={(e) => setTagsToRemove(e.target.value)} 
                  placeholder="tag1, tag2, tag3"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button onClick={previewChanges} variant="outline" className="flex-1" disabled={processing}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={applyBulkOperation} className="flex-1" disabled={processing}>
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Apply to {selectedVideos.size} Videos
            </Button>
          </div>

          {processing && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground mt-2">Processing...</p>
            </div>
          )}
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <Card className="p-4 mt-6">
          <h3 className="font-semibold mb-4">Preview Changes (First 5 Videos)</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {Array.from(selectedVideos).slice(0, 5).map((videoId) => {
              const video = videos.find(v => v.id === videoId);
              if (!video) return null;

              return (
                <div key={videoId} className="border rounded-lg p-4">
                  <p className="font-medium mb-2">{video.title}</p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm font-medium mb-1">After changes:</p>
                    <p className="text-sm">{getPreviewText(video)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={() => setShowPreview(false)} variant="outline" className="mt-4 w-full">
            Close Preview
          </Button>
        </Card>
      )}
    </div>
  );
};

export default YouTubeBulkOperations;