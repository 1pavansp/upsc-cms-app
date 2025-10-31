import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

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
  ...rest
}) => {
  const quillRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        editor.root.style.minHeight = `${minHeight}px`;
        if (maxHeight) {
          editor.root.style.maxHeight = `${maxHeight}px`;
          editor.root.style.overflowY = 'auto';
        }
      }
    }
  }, [minHeight, maxHeight]);

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
      matchVisual: false
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
