'use client';

import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, placeholder = '어떤 고민이 있으신가요?', disabled = false }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 p-3 rounded-2xl bg-white"
      style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none border-0 outline-none bg-transparent text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] leading-relaxed min-h-[1.5rem] max-h-40"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-0 cursor-pointer transition-colors ${
          value.trim() && !disabled
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)]'
        }`}>
        <Send size={16} />
      </button>
    </div>
  );
}

/* ── Message Bubble ── */

interface MessageBubbleProps {
  children: React.ReactNode;
  variant: 'user' | 'system';
}

export function MessageBubble({ children, variant }: MessageBubbleProps) {
  const isUser = variant === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-4 py-3 text-[14px] leading-relaxed ${
        isUser
          ? 'bg-[var(--color-primary)] text-white rounded-[20px] rounded-br-md'
          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-[20px] rounded-bl-md'
      }`}>
        {children}
      </div>
    </div>
  );
}
