import React, { useState, useEffect, useRef } from 'react';
import Icon from './icons';
import WysiwygEditor from './wysiwyg-editor';

const FOLDERS  = [
  { id: 'manual',   name: 'Quality manual' },
  { id: 'policies', name: 'Policies' },
  { id: 'sops',     name: 'SOPs' },
  { id: 'forms',    name: 'Forms' },
  { id: 'records',  name: 'Records' },
];
const STATUSES = ['Draft', 'Under review', 'Issued', 'Live form'];
const OWNERS   = ['Dr. R. Okafor', 'Dr. L. Hartono', 'Dr. F. Liu', 'K. Patel', 'M. Chen', 'A. Singh'];

function guessFolder(id = '') {
  if (id.startsWith('POL')) return 'policies';
  if (id.startsWith('FRM')) return 'forms';
  if (id.startsWith('MAN')) return 'manual';
  return 'sops';
}

function generateId(folder, docs = []) {
  const prefix = { sops: 'SOP', policies: 'POL', forms: 'FRM', manual: 'MAN', records: 'REC' }[folder] || 'DOC';
  let max = 0;
  docs.forEach(d => {
    if (!d.id?.startsWith(prefix + '-')) return;
    const baseId = d.id.replace(/-r\d+$/i, '');
    const nums = baseId.match(/\d+/g);
    if (nums) nums.forEach(n => { const v = parseInt(n, 10); if (v > max) max = v; });
  });
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function initForm(prefill) {
  return {
    id:        prefill?.id        || '',
    title:     prefill?.title     || '',
    version:   prefill?.v         || '1.0',
    status:    prefill?.status    || 'Draft',
    folder:    prefill?.folder    || guessFolder(prefill?.id),
    owner:     prefill?.owner     || '',
    clauses:   prefill?.clauses?.join(', ') || '',
    reviewDue: prefill?.reviewDue || '',
  };
}

const fmtSize = (b) => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const DocUploadDrawer = ({ prefill, docs = [], onSave, onClose, saveError }) => {
  const isAttach = !!(prefill?.id);
  const [form, setForm]       = useState(() => initForm(prefill));
  const [file, setFile]       = useState(null);   // { name, size, type:'pdf'|'html', rawFile, fromEditor? }
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors]   = useState({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [idTouched, setIdTouched] = useState(false);
  const [surveyMode, setSurveyMode] = useState(false);
  const inputRef = useRef();

  // Pre-fill Doc ID for new documents on mount
  useEffect(() => {
    if (!isAttach && !form.id) {
      setForm(f => ({ ...f, id: generateId(f.folder, docs) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const processFile = (f, fromEditor = false) => {
    if (!f) return;
    const isPdf  = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    const isHtml = f.type === 'text/html' || /\.(html|htm)$/i.test(f.name);
    if (!isPdf && !isHtml) {
      setErrors(e => ({ ...e, file: 'Only PDF and HTML files are supported.' }));
      return;
    }
    setErrors(e => ({ ...e, file: undefined }));
    setFile({ name: f.name, size: f.size, type: isPdf ? 'pdf' : 'html', rawFile: f, fromEditor });
    if (!form.title && !fromEditor) {
      set('title', f.name.replace(/\.(pdf|html|htm)$/i, '').replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const validate = () => {
    const e = {};
    if (!isAttach && !file && !surveyMode) e.file = 'Please select a file to upload.';
    if (!form.id.trim())             e.id    = 'Required';
    if (!form.title.trim())          e.title = 'Required';
    if (!form.owner.trim())          e.owner = 'Required';
    return e;
  };

  const handleSave = (designAfter = false) => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const clauses = form.clauses.split(',').map(c => c.trim()).filter(Boolean);
    onSave({
      id:           form.id.trim(),
      title:        form.title.trim(),
      v:            form.version.trim() || '1.0',
      status:       form.status,
      folder:       form.folder,
      owner:        form.owner.trim(),
      clauses,
      reviewDue:    form.reviewDue || '—',
      updated:      'just now',
      fileType:     file?.type    ?? null,
      rawFile:      file?.rawFile ?? null,
      fileName:     file?.name    ?? null,
      openDesigner: designAfter,
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Documents &amp; SOPs · cl. 4.3</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {isAttach ? `Attach file to ${prefill.id}` : 'Upload document'}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">

        {/* Drop zone */}
        {!isAttach && (
          <div style={{ marginBottom: 18 }}>
            <div
              className={`drop-zone${dragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={file ? undefined : () => inputRef.current?.click()}
              style={file ? { cursor: 'default' } : undefined}
            >
              <input ref={inputRef} type="file" accept=".pdf,.html,.htm"
                style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />

              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center',
                    background: file.fromEditor ? 'var(--accent-soft)' : file.type === 'pdf' ? 'var(--bad-soft)' : 'var(--info-soft)',
                    color:      file.fromEditor ? 'var(--accent-ink)' : file.type === 'pdf' ? 'var(--bad)'      : 'var(--info)',
                  }}>
                    <Icon name={file.fromEditor ? 'edit' : file.type === 'pdf' ? 'paper' : 'file'} size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {file.type.toUpperCase()}
                      {file.fromEditor && <span style={{ marginLeft: 4, padding: '1px 6px', background: 'var(--accent-soft)', color: 'var(--accent-ink)', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>created in editor</span>}
                      {' · '}{fmtSize(file.size)}
                    </div>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: 12 }}
                    onClick={e => { e.stopPropagation(); setFile(null); }}>
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="drop-zone-icon"><Icon name="upload" size={20} /></div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 3 }}>Drop a file or click to browse</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>PDF or HTML supported</div>
                </>
              )}
            </div>
            {errors.file && <div className="form-error" style={{ marginTop: 8 }}>{errors.file}</div>}

            {/* Editor options — only shown when no file is selected */}
            {!file && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 8px' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setSurveyMode(false); setEditorOpen(true); }}
                  >
                    <Icon name="edit" size={13} />
                    Create with WYSIWYG editor
                  </button>
                  {form.folder === 'forms' && (
                    <button
                      className={`btn${surveyMode ? ' btn-primary' : ''}`}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setSurveyMode(v => !v)}
                    >
                      <Icon name="clipboard" size={13} />
                      {surveyMode ? '✓ Design with SurveyJS (selected)' : 'Design with SurveyJS'}
                    </button>
                  )}
                </div>
                {surveyMode && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, padding: '6px 10px', background: 'var(--accent-soft)', borderRadius: 6 }}>
                    The form creator will open after you click Create form. No file upload needed.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Attach-mode file picker (compact) */}
        {isAttach && (
          <div style={{ marginBottom: 18 }}>
            <div
              className={`drop-zone${dragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept=".pdf,.html,.htm"
                style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6, display: 'grid', placeItems: 'center',
                    background: file.type === 'pdf' ? 'var(--bad-soft)' : 'var(--info-soft)',
                    color:      file.type === 'pdf' ? 'var(--bad)'      : 'var(--info)',
                  }}>
                    <Icon name={file.type === 'pdf' ? 'paper' : 'file'} size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{file.type.toUpperCase()} · {fmtSize(file.size)}</div>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: 12 }}
                    onClick={e => { e.stopPropagation(); setFile(null); }}>
                    Change
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="drop-zone-icon" style={{ margin: 0, width: 32, height: 32 }}><Icon name="upload" size={16} /></div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>Drop file or click to browse</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>PDF or HTML</div>
                  </div>
                </div>
              )}
            </div>
            {errors.file && <div className="form-error" style={{ marginTop: 8 }}>{errors.file}</div>}
          </div>
        )}

        {/* Metadata */}
        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Doc ID {errors.id && <span className="form-err-inline">{errors.id}</span>}</label>
            <input className={`form-input${errors.id ? ' is-error' : ''}`}
              value={form.id}
              onChange={e => { set('id', e.target.value); setIdTouched(true); }}
              placeholder="SOP-PSG-032" readOnly={isAttach} />
          </div>
          <div className="form-field" style={{ width: 80 }}>
            <label className="form-label">Version</label>
            <input className="form-input" value={form.version}
              onChange={e => set('version', e.target.value)} placeholder="1.0" />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Title {errors.title && <span className="form-err-inline">{errors.title}</span>}</label>
          <input className={`form-input${errors.title ? ' is-error' : ''}`}
            value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Document title" />
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Folder</label>
            <select className="form-input" value={form.folder} onChange={e => {
              const newFolder = e.target.value;
              if (newFolder !== 'forms') setSurveyMode(false);
              setForm(f => ({
                ...f,
                folder: newFolder,
                ...(!isAttach && !idTouched ? { id: generateId(newFolder, docs) } : {}),
              }));
            }}>
              {FOLDERS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Owner {errors.owner && <span className="form-err-inline">{errors.owner}</span>}</label>
            <input list="doc-owners" className={`form-input${errors.owner ? ' is-error' : ''}`}
              value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Name" />
            <datalist id="doc-owners">
              {OWNERS.map(o => <option key={o} value={o} />)}
            </datalist>
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Review due</label>
            <input className="form-input" value={form.reviewDue}
              onChange={e => set('reviewDue', e.target.value)} placeholder="e.g. 12 Mar 2027" />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">
            Linked clauses <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(comma-separated)</span>
          </label>
          <input className="form-input" value={form.clauses}
            onChange={e => set('clauses', e.target.value)} placeholder="e.g. 5.3.4, 5.5.2" />
        </div>

        {saveError && (
          <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 6, background: 'var(--bad-soft)', color: 'var(--bad)', fontSize: 12, lineHeight: 1.5 }}>
            {saveError}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSave(surveyMode)}>
            <Icon name={surveyMode ? 'clipboard' : 'upload'} size={14} />
            {isAttach ? 'Attach file' : surveyMode ? 'Create form & open designer' : file?.fromEditor ? 'Create document' : 'Upload document'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>

      {/* WYSIWYG editor overlay */}
      {editorOpen && (
        <WysiwygEditor
          title={form.title}
          folder={form.folder}
          docId={form.id}
          onSave={(f) => { processFile(f, true); setEditorOpen(false); }}
          onCancel={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default DocUploadDrawer;
