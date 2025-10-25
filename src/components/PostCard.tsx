import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ExternalLink, Edit, Trash2, Settings } from "lucide-react";

interface PostCardProps {
  post: any;
  onToggleActive: (is_active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PostCard({ post, onToggleActive, onEdit, onDelete }: PostCardProps) {
  const ruleCount = post.automation_rules?.[0]?.count || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{post.post_title || "Untitled Post"}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-xs"
              >
                View on Instagram
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={post.is_active}
              onCheckedChange={onToggleActive}
              aria-label="Toggle post monitoring"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {post.thumbnail_url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={post.thumbnail_url}
              alt={post.post_title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant={post.is_active ? "default" : "secondary"}>
              {post.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {ruleCount} {ruleCount === 1 ? "Rule" : "Rules"}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this post? This will also delete all associated automation rules ({ruleCount}). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
