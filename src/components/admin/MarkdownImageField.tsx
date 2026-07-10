'use client';

import { useRef, useState } from 'react';

// A lightweight WordPress-classic-editor-style toolbar for the Markdown
// article body: Bold / Italic / headings / quote / lists / link buttons
// that wrap or prefix the current selection, plus an "Attach photo" button
// that uploads a file to Vercel Blob (via /api/admin/blog/upload-image)
// and inserts the resulting URL as markdown — so admins never have to type
// Markdown syntax or paste an image URL by hand.
export function MarkdownImageField({
  name,
  defaultValue,
  required
}: {
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function focusAndSelect(start: number, end: number) {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(start, end);
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = el.value.slice(start, end) || placeholder;
    const inserted = `${before}${selected}${after}`;
    el.value = el.value.slice(0, start) + inserted + el.value.slice(end);
    focusAndSelect(start + before.length, start + before.length + selected.length);
  }

  function currentLineRange(): { lineStart: number; lineEnd: number; value: string } {
    const el = textareaRef.current!;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = value.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = value.length;
    return { lineStart, lineEnd, value };
  }

  function prefixLines(makePrefix: (lineIndex: number) => string) {
    const el = textareaRef.current;
    if (!el) return;
    const { lineStart, lineEnd, value } = currentLineRange();
    const block = value.slice(lineStart, lineEnd);
    const prefixed = block
      .split('\n')
      .map((line, i) => (line ? `${makePrefix(i)}${line}` : line))
      .join('\n');
    el.value = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    focusAndSelect(lineStart, lineStart + prefixed.length);
  }

  function insertLink() {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = el.value.slice(start, end) || 'link text';
    const url = window.prompt('Link URL', 'https://');
    if (!url) return;
    const inserted = `[${selected}](${url})`;
    el.value = el.value.slice(0, start) + inserted + el.value.slice(end);
    focusAndSelect(start + inserted.length, start + inserted.length);
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const needsLeadingBreak = before.length > 0 && !before.endsWith('\n\n');
    const insertText = `${needsLeadingBreak ? '\n\n' : ''}${text}\n\n`;
    el.value = `${before}${insertText}${after}`;
    const cursorPos = before.length + insertText.length;
    focusAndSelect(cursorPos, cursorPos);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/blog/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      const altText = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      insertAtCursor(`![${altText}](${data.url})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const toolbarButtonClass =
    'h-7 min-w-[28px] px-2 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 flex items-center justify-center';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">Content (Markdown)</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-1.5 p-1.5 bg-gray-50 border border-gray-200 rounded-lg">
        <button type="button" title="Bold" className={`${toolbarButtonClass} font-bold`} onClick={() => wrapSelection('**', '**', 'bold text')}>
          B
        </button>
        <button type="button" title="Italic" className={`${toolbarButtonClass} italic`} onClick={() => wrapSelection('*', '*', 'italic text')}>
          I
        </button>
        <span className="w-px h-5 bg-gray-200 mx-0.5" />
        <button type="button" title="Heading 2" className={toolbarButtonClass} onClick={() => prefixLines(() => '## ')}>
          H2
        </button>
        <button type="button" title="Heading 3" className={toolbarButtonClass} onClick={() => prefixLines(() => '### ')}>
          H3
        </button>
        <span className="w-px h-5 bg-gray-200 mx-0.5" />
        <button type="button" title="Quote" className={toolbarButtonClass} onClick={() => prefixLines(() => '> ')}>
          &ldquo;
        </button>
        <button type="button" title="Bullet list" className={toolbarButtonClass} onClick={() => prefixLines(() => '- ')}>
          •&nbsp;List
        </button>
        <button
          type="button"
          title="Numbered list"
          className={toolbarButtonClass}
          onClick={() => prefixLines((i) => `${i + 1}. `)}
        >
          1.&nbsp;List
        </button>
        <span className="w-px h-5 bg-gray-200 mx-0.5" />
        <button type="button" title="Link" className={toolbarButtonClass} onClick={insertLink}>
          Link
        </button>
        <div className="ml-auto">
          <label
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 h-7 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {uploading ? 'Uploading…' : '+ Attach photo'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={22}
        className="input font-mono text-[13px] leading-relaxed"
        placeholder={`## Getting there\n\nStart your day at...\n\nUse the toolbar above to format text or attach a photo.\n\n:::tip\nBook skip-the-line tickets a few days ahead in peak season.\n:::`}
      />

      {error ? <p className="text-[11px] text-red-600 mt-1">{error}</p> : null}
      <p className="text-[11px] text-gray-400 mt-1">
        Select text and use the toolbar for bold, italic, headings, quotes, lists, and links — or attach a photo directly.
        Callout boxes: wrap a paragraph in :::tip / :::info / :::warning and ::: on its own line after it.
      </p>
    </div>
  );
}
