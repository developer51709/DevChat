import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ChannelWithCreator } from "@shared/schema";

interface EditChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: ChannelWithCreator | null;
  onEditChannel: (id: string, name: string, description?: string) => void;
  isPending: boolean;
}

export function EditChannelDialog({
  open,
  onOpenChange,
  channel,
  onEditChannel,
  isPending,
}: EditChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setDescription(channel.description || "");
    }
  }, [channel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && channel) {
      onEditChannel(channel.id, name.trim(), description.trim() || undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Channel</DialogTitle>
          <DialogDescription>
            Update the channel name and description
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-channel-name">Channel Name</Label>
              <Input
                id="edit-channel-name"
                placeholder="general"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                data-testid="input-edit-channel-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-channel-description">Description (optional)</Label>
              <Textarea
                id="edit-channel-description"
                placeholder="What's this channel about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                className="resize-none"
                rows={3}
                data-testid="input-edit-channel-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel-edit-channel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isPending}
              data-testid="button-submit-edit-channel"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
