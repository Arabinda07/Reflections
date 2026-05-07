import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Quill from 'quill';
import './quill-snow.css';

const QUILL_TOOL_LABELS: Record<string, string> = {
  align: 'Text alignment',
  background: 'Highlight color',
  blockquote: 'Block quote',
  bold: 'Bold',
  clean: 'Clear formatting',
  code: 'Code',
  'code-block': 'Code block',
  color: 'Text color',
  header: 'Text style',
  italic: 'Italic',
  link: 'Insert link',
  'list:bullet': 'Bulleted list',
  'list:ordered': 'Numbered list',
  strike: 'Strikethrough',
  underline: 'Underline',
};

const getToolbarControlLabel = (control: Element) => {
  const controlClass = Array.from(control.classList)
    .find((className) => className.startsWith('ql-'))
    ?.replace('ql-', '');

  if (!controlClass) return null;

  const value = control.getAttribute('value');
  const valueKey = value ? `${controlClass}:${value}` : controlClass;

  return QUILL_TOOL_LABELS[valueKey] ?? QUILL_TOOL_LABELS[controlClass] ?? null;
};

const applyToolbarAccessibility = (toolbar: HTMLElement | null) => {
  if (!toolbar) return;

  toolbar.setAttribute('aria-label', 'Formatting toolbar');

  toolbar.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    const label = getToolbarControlLabel(button);
    if (label) {
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    }
    button.setAttribute('type', 'button');
  });

  toolbar.querySelectorAll<HTMLElement>('.ql-picker-label').forEach((pickerLabel) => {
    const label = getToolbarControlLabel(pickerLabel.parentElement ?? pickerLabel);
    if (label) {
      pickerLabel.setAttribute('aria-label', label);
      pickerLabel.setAttribute('title', label);
    }
    pickerLabel.setAttribute('role', 'button');
  });
};

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onFocusChange?: (isFocused: boolean) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  hideToolbar?: boolean;
}

export interface EditorRef {
  focus: () => void;
}

export const Editor = forwardRef<EditorRef, EditorProps>(({ value, onChange, onFocusChange, placeholder, ariaLabel = 'Reflection body', className = '', hideToolbar = false }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<InstanceType<typeof Quill> | null>(null);

  /** Stable refs for callbacks — prevents stale closures in the Quill event handlers. */
  const onChangeRef = useRef(onChange);
  const onFocusChangeRef = useRef(onFocusChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onFocusChangeRef.current = onFocusChange; }, [onFocusChange]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      quillInstance.current?.focus();
    }
  }));

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      if (typeof Quill === 'undefined') {
        console.error("Quill is not loaded. Please check your internet connection or CDN.");
        return;
      }
      // Initialize Quill
      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Start typing...',
        modules: {
          toolbar: hideToolbar ? false : [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'blockquote', 'code-block'],
            ['clean']
          ]
        }
      });
      applyToolbarAccessibility(editorRef.current.parentElement?.querySelector<HTMLElement>('.ql-toolbar') ?? null);

      const handleTextChange = () => {
        const html = quillInstance.current!.root.innerHTML;
        onChangeRef.current(html === '<p><br></p>' ? '' : html);
      };
      const handleSelectionChange = (range: unknown) => {
        onFocusChangeRef.current?.(Boolean(range));
      };

      quillInstance.current.on('text-change', handleTextChange);
      quillInstance.current.on('selection-change', handleSelectionChange);
      
      // Initial value
      if (value) {
         quillInstance.current.root.innerHTML = value;
      }

      return () => {
        quillInstance.current?.off('text-change', handleTextChange);
        quillInstance.current?.off('selection-change', handleSelectionChange);
      };
    }
  }, []);

  useEffect(() => {
    if (quillInstance.current) {
      const currentHtml = quillInstance.current.root.innerHTML;
      const normalizedValue = value || '<p><br></p>';
      if (currentHtml !== normalizedValue && currentHtml !== value) {
        quillInstance.current.root.innerHTML = value;
        // Move cursor to the end so user can start typing
        setTimeout(() => {
          if (quillInstance.current) {
            quillInstance.current.setSelection(quillInstance.current.getLength(), 0);
          }
        }, 0);
      }
    }
  }, [value]);

  useEffect(() => {
    if (quillInstance.current && placeholder) {
      quillInstance.current.root.dataset.placeholder = placeholder;
    }
  }, [placeholder]);

  useEffect(() => {
    const editorRoot = quillInstance.current?.root as HTMLElement | undefined;
    if (!editorRoot) return;

    editorRoot.setAttribute('role', 'textbox');
    editorRoot.setAttribute('aria-multiline', 'true');
    editorRoot.setAttribute('aria-label', ariaLabel);
  }, [ariaLabel]);

  return (
    <div className={`prose prose-zinc max-w-none ${className} note-editor`}>
      <div ref={editorRef} className="border-none" />
    </div>
  );
});
