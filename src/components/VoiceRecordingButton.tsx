import { Mic, MicOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface VoiceRecordingButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecordingButton = ({ onTranscript, disabled }: VoiceRecordingButtonProps) => {
  const { t } = useTranslation();
  const {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    transcript,
    error,
  } = useVoiceRecording();

  // Send transcript to parent when recording stops and we have text
  useEffect(() => {
    if (!isRecording && transcript.trim() && transcript !== '') {
      onTranscript(transcript.trim());
      // Clear transcript after sending to prevent duplicate sends
      // This will be handled by the hook internally
    }
  }, [isRecording, transcript, onTranscript]);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return null; // Hide button if not supported
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "p-2 hover:bg-accent transition-colors",
        isRecording && "bg-red-100 hover:bg-red-200 text-red-600"
      )}
      title={isRecording ? t('voice.stopRecording') : t('voice.startRecording')}
    >
      {isRecording ? (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <MicOff className="w-4 h-4" />
        </div>
      ) : (
        <Mic className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  );
};