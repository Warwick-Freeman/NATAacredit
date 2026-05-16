import React, { useState } from 'react';
import Icon from './icons';

const TODAY = new Date().toISOString().slice(0, 10);
const CATEGORIES = ['Electrodes', 'Gels & Pastes', 'Sensors', 'Airways', 'Effort belts', 'Filters', 'Other'];
const SITES = ['Riverside Main Lab', 'Eastside Paediatric Lab', 'Home Service – North'];

// ── Add / edit consumable ────────────────────────────────────────────────────
export const ConsumableFormDrawer = ({ consumable, onSave, onClose }) => {
  const isEdit = !!consumable?.sku;
  const [form, setForm] = useState({
    sku:         consumable?.sku         ?? '',
    description: consumable?.description ?? '',
    category:    consumable?.category    ?? 'Electrodes',
    site:        consumable?.site        ?? SITES[0],
    unit:        consumable?.unit        ?? 'pack',
    reorder:     consumable?.reorder     ?? 4,
    supplier:    consumable?.supplier    ?? '',
    catalogNo:   consumable?.catalogNo   ?? '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.sku.trim())         { setError('SKU is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    setError('');
    onSave({ ...form, reorder: parseInt(form.reorder) || 0 });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Consumables · cl. 5.3.5</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {isEdit ? `Edit ${consumable.sku}` : 'Add consumable'}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>
      <div className="drawer-body">
        <div className="form-field">
          <label className="form-label">SKU</label>
          <input className="form-input" value={form.sku} onChange={e => set('sku', e.target.value)}
            placeholder="CON-EEG-001"
            readOnly={isEdit}
            style={isEdit ? { background: 'var(--surface-2)', color: 'var(--ink-3)' } : undefined} />
        </div>
        <div className="form-field">
          <label className="form-label">Description</label>
          <input className="form-input" value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Full description including pack size" />
        </div>
        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Unit</label>
            <input className="form-input" value={form.unit} onChange={e => set('unit', e.target.value)}
              placeholder="pack, jar, box, each…" />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Site</label>
          <select className="form-input" value={form.site} onChange={e => set('site', e.target.value)}>
            {SITES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Supplier</label>
            <input className="form-input" value={form.supplier} onChange={e => set('supplier', e.target.value)} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Catalog No.</label>
            <input className="form-input" value={form.catalogNo} onChange={e => set('catalogNo', e.target.value)} />
          </div>
        </div>
        <div className="form-field" style={{ maxWidth: 160 }}>
          <label className="form-label">Reorder level</label>
          <input className="form-input" type="number" min={0} value={form.reorder}
            onChange={e => set('reorder', e.target.value)} />
        </div>
        {error && <div style={{ color: 'var(--bad)', fontSize: 12, marginTop: 4 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <Icon name={isEdit ? 'check' : 'plus'} size={14} />
            {isEdit ? 'Save changes' : 'Add consumable'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Receive stock ────────────────────────────────────────────────────────────
export const StockReceiveDrawer = ({ consumable, onReceive, onClose }) => {
  const [form, setForm] = useState({
    qty:        '',
    lotNo:      '',
    expiry:     '',
    invoiceRef: '',
    receivedBy: '',
    date:       TODAY,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.qty || parseInt(form.qty) <= 0) { setError('Quantity must be greater than 0'); return; }
    if (!form.lotNo.trim())                   { setError('Lot / batch number is required'); return; }
    if (!form.expiry)                         { setError('Expiry date is required'); return; }
    if (!form.receivedBy.trim())              { setError('Received by is required'); return; }
    setError('');
    onReceive({
      qty:        parseInt(form.qty),
      lotNo:      form.lotNo.trim(),
      expiry:     form.expiry,
      invoiceRef: form.invoiceRef.trim(),
      receivedBy: form.receivedBy.trim(),
      date:       form.date,
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{consumable.sku} · Receive stock</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Receive stock</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{consumable.description}</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>
      <div className="drawer-body">
        <div className="form-row">
          <div className="form-field" style={{ maxWidth: 130 }}>
            <label className="form-label">Qty ({consumable.unit}s)</label>
            <input className="form-input" type="number" min={1} value={form.qty}
              onChange={e => set('qty', e.target.value)} placeholder="0" autoFocus />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Lot / batch number</label>
            <input className="form-input" value={form.lotNo} onChange={e => set('lotNo', e.target.value)}
              placeholder="e.g. EEG-2026-L06" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Expiry date</label>
            <input className="form-input" type="date" value={form.expiry}
              onChange={e => set('expiry', e.target.value)} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Date received</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Invoice / PO reference</label>
            <input className="form-input" value={form.invoiceRef}
              onChange={e => set('invoiceRef', e.target.value)} placeholder="INV-2026-xxxx" />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Received by</label>
            <input className="form-input" value={form.receivedBy}
              onChange={e => set('receivedBy', e.target.value)} placeholder="Name" />
          </div>
        </div>
        {error && <div style={{ color: 'var(--bad)', fontSize: 12, marginTop: 4 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <Icon name="check" size={14} />Receive stock
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Record use ───────────────────────────────────────────────────────────────
export const StockUseDrawer = ({ consumable, onUse, onClose }) => {
  const activeLots = [...(consumable.lots ?? [])]
    .filter(l => l.qty > 0)
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  const [form, setForm] = useState({
    qty:      '',
    lotNo:    activeLots[0]?.lotNo ?? '',
    studyRef: '',
    by:       '',
    date:     TODAY,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [error, setError] = useState('');

  const selectedLot = activeLots.find(l => l.lotNo === form.lotNo);
  const maxQty = selectedLot?.qty ?? 0;

  const handleSave = () => {
    if (!form.qty || parseInt(form.qty) <= 0) { setError('Quantity must be greater than 0'); return; }
    if (parseInt(form.qty) > maxQty)          { setError(`Only ${maxQty} ${consumable.unit}${maxQty !== 1 ? 's' : ''} available in selected lot`); return; }
    if (!form.lotNo)                          { setError('Please select a lot'); return; }
    if (!form.by.trim())                      { setError('Used by is required'); return; }
    setError('');
    onUse({
      qty:      parseInt(form.qty),
      lotNo:    form.lotNo,
      studyRef: form.studyRef.trim(),
      by:       form.by.trim(),
      date:     form.date,
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{consumable.sku} · Record usage</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Record usage</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{consumable.description}</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>
      <div className="drawer-body">
        {activeLots.length === 0 ? (
          <div style={{ padding: '16px 0', color: 'var(--bad)', fontSize: 13 }}>
            No stock available. Receive stock before recording usage.
          </div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">
                  Lot{' '}
                  <span style={{ fontWeight: 400, color: 'var(--ink-4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>FEFO order</span>
                </label>
                <select className="form-input" value={form.lotNo} onChange={e => set('lotNo', e.target.value)}>
                  {activeLots.map(l => (
                    <option key={l.lotNo} value={l.lotNo}>
                      {l.lotNo} · exp {l.expiry} · {l.qty} {consumable.unit}{l.qty !== 1 ? 's' : ''} avail.
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field" style={{ maxWidth: 130 }}>
                <label className="form-label">Qty used</label>
                <input className="form-input" type="number" min={1} max={maxQty}
                  value={form.qty} onChange={e => set('qty', e.target.value)}
                  placeholder={`max ${maxQty}`} autoFocus />
              </div>
            </div>
            <div className="form-field" style={{ maxWidth: 200 }}>
              <label className="form-label">Date used</label>
              <input className="form-input" type="date" value={form.date}
                onChange={e => set('date', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">
                  Study / patient ref{' '}
                  <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>(optional)</span>
                </label>
                <input className="form-input" value={form.studyRef}
                  onChange={e => set('studyRef', e.target.value)} placeholder="PSG-2026-xxxx" />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Used by</label>
                <input className="form-input" value={form.by}
                  onChange={e => set('by', e.target.value)} placeholder="Name" />
              </div>
            </div>
          </>
        )}
        {error && <div style={{ color: 'var(--bad)', fontSize: 12, marginTop: 4 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}
            disabled={activeLots.length === 0}>
            <Icon name="check" size={14} />Record usage
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Place order ──────────────────────────────────────────────────────────────
export const PlaceOrderDrawer = ({ consumable, onOrder, onClose }) => {
  const [form, setForm] = useState({
    qty:       '',
    supplier:  consumable.supplier  ?? '',
    catalogNo: consumable.catalogNo ?? '',
    by:        '',
    date:      TODAY,
    notes:     '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.qty || parseInt(form.qty) <= 0) { setError('Quantity must be greater than 0'); return; }
    if (!form.by.trim())                      { setError('Ordered by is required'); return; }
    setError('');
    onOrder({
      qty:       parseInt(form.qty),
      supplier:  form.supplier.trim(),
      catalogNo: form.catalogNo.trim(),
      by:        form.by.trim(),
      date:      form.date,
      notes:     form.notes.trim(),
      status:    'Pending',
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{consumable.sku} · Place order</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Place order</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{consumable.description}</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>
      <div className="drawer-body">
        {consumable.pendingOrder && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--warn)', borderRadius: 6, padding: '8px 12px', fontSize: 12, marginBottom: 12, color: 'var(--ink-2)' }}>
            A pending order already exists ({consumable.pendingOrder.qty} {consumable.unit}s, placed {consumable.pendingOrder.date}). Placing a new order will replace it.
          </div>
        )}
        <div className="form-row">
          <div className="form-field" style={{ maxWidth: 130 }}>
            <label className="form-label">Qty ({consumable.unit}s)</label>
            <input className="form-input" type="number" min={1} value={form.qty}
              onChange={e => set('qty', e.target.value)} placeholder="0" autoFocus />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Order date</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Supplier</label>
            <input className="form-input" value={form.supplier}
              onChange={e => set('supplier', e.target.value)} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Catalog No.</label>
            <input className="form-input" value={form.catalogNo}
              onChange={e => set('catalogNo', e.target.value)} />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Ordered by</label>
          <input className="form-input" value={form.by}
            onChange={e => set('by', e.target.value)} placeholder="Name" />
        </div>
        <div className="form-field">
          <label className="form-label">
            Notes{' '}
            <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>(optional)</span>
          </label>
          <textarea className="form-input" rows={2} value={form.notes}
            onChange={e => set('notes', e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }} />
        </div>
        {error && <div style={{ color: 'var(--bad)', fontSize: 12, marginTop: 4 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <Icon name="check" size={14} />Place order
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
