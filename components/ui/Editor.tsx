import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';


interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onFocusChange?: (isFocused: boolean) => void;
  placeholder?: string;
  className?: string;
  hideToolbar?: boolean;
}

export interface EditorRef {
  focus: () => void;
}

// Quill is now imported locally

export const Editor = forwardRef<EditorRef, EditorProps>(({ value, onChange, onFocusChange, placeholder, className = '', hideToolbar = false }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (quillInstance.current) {
        quillInstance.current.focus();
      }
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

      // Handle changes
      const handleTextChange = () => {
        const html = quillInstance.current.root.innerHTML;
        onChange(html === '<p><br></p>' ? '' : html);
      };
      const handleSelectionChange = (range: unknown) => {
        onFocusChange?.(Boolean(range));
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

  return (
    <div className={`prose prose-zinc max-w-none ${className} duolingo-editor`}>
      <div ref={editorRef} className="border-none" />
    </div>
  );
});
