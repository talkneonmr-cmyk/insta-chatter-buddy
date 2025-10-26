-- Fix MISSING_RLS: Add DELETE policies for audit logs to allow users to delete their own data
CREATE POLICY "Users can delete their own comment logs"
ON comments_log FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DMs"
ON dms_sent FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video upload history"
ON video_uploads_history FOR DELETE
USING (auth.uid() = user_id);

-- Fix PUBLIC_DATA_EXPOSURE: Add explicit write protection for caption_templates
CREATE POLICY "Caption templates are read-only - no inserts"
ON caption_templates FOR INSERT
WITH CHECK (false);

CREATE POLICY "Caption templates are read-only - no updates"
ON caption_templates FOR UPDATE
USING (false);

CREATE POLICY "Caption templates are read-only - no deletes"
ON caption_templates FOR DELETE
USING (false);