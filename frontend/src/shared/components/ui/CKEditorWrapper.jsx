import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../services/axios.instance.js';
import './ckeditor-wrapper.css';

class CloudinaryUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    console.log('CloudinaryUploadAdapter: upload() triggered');
    return this.loader.file
      .then(file => {
        console.log('CloudinaryUploadAdapter: file resolved from loader', file);
        return new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('type', 'blog');

          console.log('CloudinaryUploadAdapter: sending image upload request to /upload/image');
          axiosInstance.post('/upload/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          .then(res => {
            console.log('CloudinaryUploadAdapter: upload response received', res);
            if (res.data?.success && res.data?.data?.url) {
              console.log('CloudinaryUploadAdapter: upload successful, URL:', res.data.data.url);
              resolve({
                default: res.data.data.url
              });
            } else {
              console.error('CloudinaryUploadAdapter: upload failed - unexpected response format', res.data);
              reject(new Error('Tải ảnh lên thất bại'));
            }
          })
          .catch(err => {
            console.error('CloudinaryUploadAdapter: upload request failed with error', err);
            reject(err.message || 'Tải ảnh lên thất bại');
          });
        });
      });
  }

  abort() {
    console.log('CloudinaryUploadAdapter: upload aborted');
  }
}

function CloudinaryUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new CloudinaryUploadAdapter(loader);
  };
}

export default function CKEditorWrapper({ value, onChange, placeholder = 'Nhập nội dung chi tiết bài viết...' }) {
  const containerRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const isInitializingRef = useRef(false);
  const [scriptLoaded, setScriptLoaded] = useState(!!window.ClassicEditor);

  // Keep fresh references of callbacks and configurations to prevent stale closures
  const onChangeRef = useRef(onChange);
  const placeholderRef = useRef(placeholder);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    placeholderRef.current = placeholder;
  }, [placeholder]);

  // 1. Dynamic Script Loading
  useEffect(() => {
    if (window.ClassicEditor) {
      return;
    }

    const scriptId = 'ckeditor-cdn-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.ckeditor.com/ckeditor5/41.1.0/classic/ckeditor.js';
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      // Script exists but maybe not loaded yet
      const handleLoad = () => setScriptLoaded(true);
      script.addEventListener('load', handleLoad);
      return () => script.removeEventListener('load', handleLoad);
    }
  }, []);

  // 2. Editor Initialization (runs only once when script is loaded)
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;
    if (editorInstanceRef.current) return;

    let isCancelled = false;
    let editorInstance = null;

    window.ClassicEditor.create(containerRef.current, {
      placeholder: placeholderRef.current,
      extraPlugins: [CloudinaryUploadAdapterPlugin],
      toolbar: [
        'heading', '|',
        'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
        'uploadImage', 'insertTable', 'mediaEmbed', '|',
        'undo', 'redo'
      ]
    })
      .then((editor) => {
        if (isCancelled) {
          editor.destroy()
            .catch(err => console.error('Error destroying orphaned CKEditor:', err));
          return;
        }

        editorInstance = editor;
        editorInstanceRef.current = editor;
        
        // Initial value loading
        if (value) {
          editor.setData(value);
        }

        // Change listener
        editor.model.document.on('change:data', () => {
          const data = editor.getData();
          if (onChangeRef.current) {
            onChangeRef.current(data);
          }
        });
      })
      .catch((error) => {
        console.error('Error initializing CKEditor:', error);
      });

    // Cleanup on unmount
    return () => {
      isCancelled = true;
      if (editorInstance) {
        editorInstance.destroy()
          .catch(err => console.error('Error destroying CKEditor instance:', err));
        editorInstanceRef.current = null;
      } else if (editorInstanceRef.current) {
        const editorToDestroy = editorInstanceRef.current;
        editorInstanceRef.current = null;
        editorToDestroy.destroy()
          .catch(err => console.error('Error destroying CKEditor from ref:', err));
      }
    };
  }, [scriptLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Sync external changes to editor
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (editor && value !== undefined && value !== editor.getData()) {
      editor.setData(value);
    }
  }, [value]);

  return (
    <div className="ckeditor-wrapper">
      <textarea ref={containerRef} style={{ display: 'none' }} />
      {!scriptLoaded && <div className="editor-loading">Đang tải bộ soạn thảo CKEditor...</div>}
    </div>
  );
}
