import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingFile {
  file: File;
  previewUrl?: string;
}

interface MessageInputProps {
  channelName: string;
  onSendMessage: (content: string, attachments?: string[]) => void;
  disabled?: boolean;
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

export function MessageInput({
  channelName,
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("auth_token") || "";
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.url;
  };

  const handleSend = async () => {
    if ((!message.trim() && pendingFiles.length === 0) || disabled) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const pf of pendingFiles) {
        const url = await uploadFile(pf.file);
        uploadedUrls.push(url);
      }

      onSendMessage(message.trim() || (uploadedUrls.length > 0 ? "" : ""), uploadedUrls.length > 0 ? uploadedUrls : undefined);
      setMessage("");
      setPendingFiles([]);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPending: PendingFile[] = files.map((file) => ({
      file,
      previewUrl: isImage(file) ? URL.createObjectURL(file) : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      const updated = [...prev];
      if (updated[index].previewUrl) URL.revokeObjectURL(updated[index].previewUrl!);
      updated.splice(index, 1);
      return updated;
    });
  };

  const isSendDisabled = (!message.trim() && pendingFiles.length === 0) || disabled || uploading;

  return (
    <div className="p-4 border-t border-border bg-background">
      <div className="max-w-4xl mx-auto">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {pendingFiles.map((pf, i) => (
              <div
                key={i}
                className="relative group flex items-center gap-2 bg-muted rounded-md border border-border p-2"
              >
                {pf.previewUrl ? (
                  <img
                    src={pf.previewUrl}
                    alt={pf.file.name}
                    className="h-14 w-14 object-cover rounded"
                  />
                ) : (
                  <div className="h-14 w-14 flex items-center justify-center bg-background rounded">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="max-w-[120px]">
                  <p className="text-xs text-foreground truncate">{pf.file.name}</p>
                  <p className="text-xs text-muted-foreground">{(pf.file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end bg-card rounded-xl border border-card-border p-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx,.zip,.mp4,.mp3"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex-shrink-0"
            data-testid="button-attach-file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${channelName ? `#${channelName}` : "..."}`}
            className="resize-none border-0 bg-transparent text-base focus-visible:ring-0 p-0 min-h-[2.5rem] max-h-32"
            disabled={disabled || uploading}
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={isSendDisabled}
            size="icon"
            className="flex-shrink-0"
            data-testid="button-send-message"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
