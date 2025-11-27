import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import Quill from 'quill';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import 'quill/dist/quill.snow.css';
import './RichTextEditor.css';

const Delta = Quill.import('delta');

// Block embed for raw HTML (preserve tables and complex markup)
const BlockEmbed = Quill.import('blots/block/embed');
class RawHtmlBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.innerHTML = value;
    // allow Quill to render inner HTML
    node.setAttribute('data-raw-html', 'true');
    return node;
  }

  static value(node) {
    return node.innerHTML;
  }
}
RawHtmlBlot.blotName = 'raw';
RawHtmlBlot.tagName = 'div';
RawHtmlBlot.className = 'ql-raw-html';
Quill.register(RawHtmlBlot, true);

const EDITOR_FORMATS = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'code-block',
  'list',
  'bullet',
  'indent',
  'align',
  'color',
  'background',
  'script',
  'link',
  'image',
  'raw',
  'video',
  'clean'
];

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  uploadFolder = 'rich-text',
  label,
  className = '',
  minHeight = 220,
  maxHeight,
  disabled = false,
  preferRawPaste = true,
  ...rest
}) => {
  const quillRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [mountedEditor, setMountedEditor] = useState(null);

  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    if (!editor) return;
    setMountedEditor(editor);
    editor.root.style.minHeight = `${minHeight}px`;
    if (maxHeight) {
      editor.root.style.maxHeight = `${maxHeight}px`;
      editor.root.style.overflowY = 'auto';
    }

    return () => {
      setMountedEditor(null);
    };
  }, [minHeight, maxHeight]);

  // Preserve rich formatting when pasting from Word/Docs/PDF by pasting the source HTML directly.
  useEffect(() => {
    if (!mountedEditor) return undefined;

    const bulletRegex = /^[\u2022\u00B7\u2219\u25CF\u25CB\u25A0\-\*·•]\s+/;
    const orderedRegex = /^((\d+|[a-zA-Z]|[ivxlcdmIVXLCDM]+)[\.\)]|\(\d+\))\s+/;

    const processWordHtml = (rawHtml = '') => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');
        const frag = doc.createDocumentFragment();
        let currentList = null;
        let currentListType = null;

        const flushList = () => {
          if (currentList) {
            frag.appendChild(currentList);
            currentList = null;
            currentListType = null;
          }
        };

        const stripMarker = (nodeHtml, regex) => {
          const text = nodeHtml || '';
          const match = text.match(regex);
          if (!match) return nodeHtml;
          return text.replace(match[0], '');
        };

        const blocks = Array.from(doc.body.childNodes).filter(
          (n) =>
            (n.nodeType === 1 &&
              (n.tagName === 'P' || n.tagName === 'DIV' || n.tagName === 'TABLE' || n.tagName === 'UL' || n.tagName === 'OL')) ||
            (n.nodeType === 3 && n.textContent.trim())
        );

        blocks.forEach((node) => {
          if (node.tagName === 'TABLE' || node.tagName === 'UL' || node.tagName === 'OL') {
            flushList();
            frag.appendChild(node);
            return;
          }

          if (node.tagName === 'P' || node.tagName === 'DIV') {
            const text = node.textContent || '';
            const trimmed = text.trimStart();
            const isMsoList = node.className && /MsoListParagraph/i.test(node.className);
            const bulletMatch = trimmed.match(bulletRegex);
            const orderedMatch = trimmed.match(orderedRegex);

            if (isMsoList || bulletMatch || orderedMatch) {
              const listType = orderedMatch ? 'ol' : 'ul';
              if (!currentList || currentListType !== listType) {
                flushList();
                currentList = doc.createElement(listType);
                currentListType = listType;
              }
              const li = doc.createElement('li');
              li.innerHTML = stripMarker(node.innerHTML || '', orderedMatch ? orderedRegex : bulletRegex);
              currentList.appendChild(li);
              return;
            }
          }

          flushList();
          frag.appendChild(node);
        });

        flushList();
        const wrapper = doc.createElement('div');
        wrapper.appendChild(frag);
        return wrapper.innerHTML || rawHtml;
      } catch (err) {
        console.warn('processWordHtml failed; using raw HTML', err);
        return rawHtml;
      }
    };

    const handlePaste = async (event) => {
      console.debug('[RichTextEditor] handlePaste triggered');
      if (disabled) return;
      const html = event.clipboardData?.getData('text/html');
      const plain = event.clipboardData?.getData('text/plain');
      if (!html && !plain) return;

      const range = mountedEditor.getSelection(true) || { index: mountedEditor.getLength(), length: 0 };

      if (html) {
        event.preventDefault();
        const processedHtml = processWordHtml(html);
        // If the pasted HTML contains inline data-URI images, upload them
        // to Firebase Storage and replace the src with the hosted URL.
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(processedHtml, 'text/html');
          const imgs = Array.from(doc.querySelectorAll('img'));
          console.debug('[RichTextEditor] processedHtml length', processedHtml.length, 'imgs', imgs.length);
          if (imgs.length) {
            // Upload all data-uri images and replace src attributes
            await Promise.all(imgs.map(async (img) => {
              const src = img.getAttribute('src') || '';
              if (!src.startsWith('data:')) return;
              try {
                const blob = await (await fetch(src)).blob();
                const ext = (src.split(';')[0].split('/')[1]) || 'png';
                const storageRef = ref(storage, `${uploadFolder}/pasted-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`);
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                img.setAttribute('src', downloadURL);
              } catch (err) {
                console.warn('Failed to upload pasted image', err);
              }
            }));
          }
          const htmlWithUploadedImages = doc.body.innerHTML || processedHtml;

          const hasTable = /<table[\s>]/i.test(htmlWithUploadedImages);
          console.debug('[RichTextEditor] hasTable:', hasTable);

          if (hasTable) {
            // Insert as a raw HTML embed to preserve table structure
            try {
              mountedEditor.insertEmbed(range.index, 'raw', htmlWithUploadedImages, 'user');
              mountedEditor.setSelection(range.index + 1, 0);
              console.debug('[RichTextEditor] raw embed inserted');
              if (typeof onChange === 'function') {
                onChange(mountedEditor.root.innerHTML);
              }
              return;
            } catch (err) {
              // fallback to dangerouslyPasteHTML if embed fails
              console.warn('Raw embed failed, falling back to paste:', err);
            }
          }

          const shouldBypass = preferRawPaste;

          if (shouldBypass) {
            mountedEditor.clipboard.dangerouslyPasteHTML(range.index, htmlWithUploadedImages, 'user');
            mountedEditor.setSelection(range.index + (htmlWithUploadedImages?.length || 0), 0);
            if (typeof onChange === 'function') {
              onChange(mountedEditor.root.innerHTML);
            }
            return;
          }

          // Prefer Quill's converter for non-table HTML while keeping lists normalized
          const div = document.createElement('div');
          div.innerHTML = htmlWithUploadedImages;

          const listParagraphs = div.querySelectorAll('p.MsoListParagraph, p[class*="ListParagraph"]');
          listParagraphs.forEach((p) => {
            const asText = p.innerText || '';
            const trimmed = asText.trimStart();
            const bulletMatch = trimmed.match(bulletRegex);
            const orderedMatch = trimmed.match(orderedRegex);
            if (!bulletMatch && !orderedMatch) return;
            const wrapper = document.createElement(orderedMatch ? 'ol' : 'ul');
            const li = document.createElement('li');
            li.innerText = trimmed.replace(orderedMatch ? orderedMatch[0] : bulletMatch[0], '');
            wrapper.appendChild(li);
            p.replaceWith(wrapper);
          });

          const delta = mountedEditor.clipboard.convert(div.innerHTML);
          mountedEditor.updateContents(new Delta().retain(range.index).concat(delta), 'user');
          mountedEditor.setSelection(range.index + delta.length(), 0);
        } catch (err) {
          console.warn('Error processing pasted HTML:', err);
          // Fallback to original processedHtml if anything goes wrong
          mountedEditor.clipboard.dangerouslyPasteHTML(range.index, processedHtml, 'user');
          mountedEditor.setSelection(range.index + (processedHtml?.length || 0), 0);
          if (typeof onChange === 'function') {
            onChange(mountedEditor.root.innerHTML);
          }
        }

        
      } else if (plain) {
        event.preventDefault();
        mountedEditor.insertText(range.index, plain);
        mountedEditor.setSelection(range.index + plain.length, 0);
      }
    };

    const root = mountedEditor.root;
    root.addEventListener('paste', handlePaste);
    return () => {
      root.removeEventListener('paste', handlePaste);
    };
  }, [mountedEditor, disabled, preferRawPaste, onChange, uploadFolder]);

  useEffect(() => {
    if (!errorMessage) return undefined;
    const timeout = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [errorMessage]);

  const handleImageUpload = useCallback(() => {
    if (!quillRef.current || disabled) {
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;

      try {
        setIsUploading(true);
        setErrorMessage(null);

        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true) || { index: editor.getLength() };

        const storageRef = ref(storage, `${uploadFolder}/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        editor.insertEmbed(range.index, 'image', downloadURL, 'user');
        editor.setSelection(range.index + 1);
      } catch (error) {
        console.error('RichTextEditor image upload failed:', error);
        setErrorMessage('Image upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  }, [disabled, uploadFolder]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    },
    clipboard: {
      matchVisual: true,
      matchers: [
        [
          'p.MsoListParagraph',
          (node) => {
            const text = node.innerText || '';
            const trimmed = text.trimStart();
            const bulletMatch = trimmed.match(/^[\u2022\u00B7\u2219\u25CF\u25CB\u25A0\-\*]\s+/);
            const orderedMatch = trimmed.match(/^((\d+|[a-zA-Z]|[ivxlcdmIVXLCDM]+)[\.\)]|\(\d+\))\s+/);

            if (bulletMatch) {
              const content = trimmed.replace(bulletMatch[0], '');
              return new Delta().insert(content).insert('\n', { list: 'bullet' });
            }
            if (orderedMatch) {
              const content = trimmed.replace(orderedMatch[0], '');
              return new Delta().insert(content).insert('\n', { list: 'ordered' });
            }
            return new Delta().insert(text);
          }
        ]
      ]
    }
  }), [handleImageUpload]);

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      {label && (
        <label className="rich-text-editor-label">
          {label}
        </label>
      )}
      <div className={`rich-text-editor ${disabled ? 'is-disabled' : ''}`}>
        <ReactQuill
          ref={quillRef}
          value={value}
          onChange={onChange}
          modules={modules}
          formats={EDITOR_FORMATS}
          placeholder={placeholder}
          readOnly={disabled}
          {...rest}
        />
      </div>
      {(isUploading || errorMessage) && (
        <div className={`rich-text-editor-status ${isUploading ? 'is-uploading' : 'is-error'}`}>
          {isUploading ? 'Uploading image…' : errorMessage}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
