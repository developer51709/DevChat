import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";

interface MessageInputProps {
  channelName: string;
  onSendMessage: (content: string, attachments?: string[]) => void;
  disabled?: boolean;
}

export function MessageInput({
  channelName,
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mock file upload: in a real app, upload to a server/S3
      alert(`File "${file.name}" selected. File sharing feature stubbed.`);
    }
  };

  return (
    <div className="p-4 border-t border-border bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 items-end bg-card rounded-xl border border-card-border p-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleFileClick}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}`}
            className="resize-none border-0 bg-transparent text-base focus-visible:ring-0 p-0 min-h-[2.5rem] max-h-32"
            disabled={disabled}
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className="flex-shrink-0"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
