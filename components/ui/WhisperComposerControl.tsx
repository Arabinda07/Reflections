import React, { useCallback, useEffect, useRef } from 'react';
import { Microphone } from '@phosphor-icons/react/Microphone';
import { MicrophoneSlash } from '@phosphor-icons/react/MicrophoneSlash';
import { useWhisperInput } from '../../hooks/useWhisperInput';

interface WhisperComposerControlProps {
  onFinalTranscript: (text: string) => void;
  className?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
  idleButtonClassName?: string;
  label?: string;
  showLabel?: boolean;
  previewClassName?: string;
  stopOnFinalTranscript?: boolean;
}

export const appendTranscriptToHtml = (previous: string, transcript: string) => {
  const text = transcript
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  if (!text) return previous;

  const clean = previous === '<p><br></p>' ? '' : previous.trim();
  if (!clean) return `<p>${text}</p>`;

  if (clean.endsWith('</p>')) {
    return `${clean.slice(0, -4).trimEnd()} ${text}</p>`;
  }

  return `${clean} ${text}`;
};

export const WhisperComposerControl: React.FC<WhisperComposerControlProps> = ({
  onFinalTranscript,
  className = '',
  buttonClassName = '',
  activeButtonClassName = 'bg-green/10 border-green/20 text-green',
  idleButtonClassName = 'control-surface text-gray-text',
  label = 'Voice capture',
  showLabel = true,
  previewClassName = '',
  stopOnFinalTranscript = false,
}) => {
  const stopRef = useRef<() => void>(() => undefined);
  const whisper = useWhisperInput(useCallback((text: string) => {
    if (stopOnFinalTranscript) {
      stopRef.current();
    }
    onFinalTranscript(text);
  }, [onFinalTranscript, stopOnFinalTranscript]));
  const isActive = whisper.isWhispering;

  useEffect(() => {
    stopRef.current = whisper.stop;
  }, [whisper.stop]);

  return (
    <div className={`whisper-composer-control ${className}`.trim()}>
      <button
        type="button"
        onClick={whisper.toggle}
        aria-label={isActive ? 'Stop voice capture' : 'Start voice capture'}
        aria-pressed={isActive}
        className={`${buttonClassName} ${isActive ? activeButtonClassName : idleButtonClassName}`.trim()}
      >
        {isActive ? <Microphone size={20} weight="fill" /> : <MicrophoneSlash size={20} weight="regular" />}
        {showLabel ? <span>{label}</span> : null}
      </button>

      {whisper.feedback ? (
        <p className="mt-2 text-ui-xs font-bold leading-relaxed text-clay" aria-live="polite">
          {whisper.feedback}
        </p>
      ) : null}

      {isActive && whisper.interimTranscript ? (
        <div
          className={`mt-3 rounded-[1.25rem] border border-green/10 bg-green/5 px-4 py-3 font-serif text-[16px] italic leading-relaxed text-green ${previewClassName}`.trim()}
          aria-live="polite"
        >
          {whisper.interimTranscript}...
        </div>
      ) : null}
    </div>
  );
};
