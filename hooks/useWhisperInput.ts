import { useCallback, useEffect, useRef, useState } from 'react';

const UNSUPPORTED_MESSAGE =
  "Whisper isn't available in this browser yet. You can keep writing normally or try Chrome on Android.";

interface WhisperInputState {
  /** Whether speech recognition is currently active */
  isWhispering: boolean;
  /** Partial transcript being composed */
  interimTranscript: string;
  /** User-facing feedback message (e.g., unsupported browser) */
  feedback: string | null;
  /** Toggle speech recognition on/off */
  toggle: () => void;
}

/**
 * Self-contained hook for Web Speech API (whisper-to-text) integration.
 *
 * Manages the SpeechRecognition instance, interim transcript state,
 * and error feedback. Calls `onFinalTranscript` when a complete
 * utterance is recognized.
 */
export const useWhisperInput = (
  onFinalTranscript: (text: string) => void,
): WhisperInputState => {
  const [isWhispering, setIsWhispering] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isWhisperingRef = useRef(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);

  // Keep callback ref in sync
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Auto-clear feedback after 5 seconds
  useEffect(() => {
    if (!feedback) return;

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const toggle = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback(UNSUPPORTED_MESSAGE);
      return;
    }

    setFeedback(null);

    if (isWhisperingRef.current) {
      // Stop
      setIsWhispering(false);
      isWhisperingRef.current = false;
      recognitionRef.current?.stop();
      setInterimTranscript('');
    } else {
      // Start
      setIsWhispering(true);
      isWhisperingRef.current = true;

      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
          let finalText = '';
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalText += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          if (finalText) {
            onFinalTranscriptRef.current(finalText);
          }
          setInterimTranscript(currentInterim);
        };
      }

      recognitionRef.current.start();
    }
  }, []);

  return {
    isWhispering,
    interimTranscript,
    feedback,
    toggle,
  };
};
