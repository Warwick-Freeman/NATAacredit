// Courier integration layer
// To enable live label generation, add API credentials in Settings → Integrations
//
// Production endpoints:
//   Australia Post:  POST https://api.auspost.com.au/shipping/v1/shipments  (OAuth2)
//   DHL Express:     POST https://api.dhl.com/shipments                      (REST API key)
//   FedEx:           POST https://apis.fedex.com/ship/v1/shipments           (OAuth2 client credentials)
//   StarTrack:       POST https://api.auspost.com.au/shipping/v1/shipments   (same as AusPost)

export const COURIERS = [
  {
    id: 'auspost',   name: 'Australia Post', shortName: 'AUS POST',
    services: ['Express Post', 'Parcel Post', 'Priority'],
    trackingBase: 'https://auspost.com.au/mypost/track/#/details/',
    color: '#CC0000', textColor: '#fff',
  },
  {
    id: 'dhl',       name: 'DHL Express',    shortName: 'DHL',
    services: ['Express 1200', 'Express Worldwide', 'Same Day'],
    trackingBase: 'https://www.dhl.com/au-en/home/tracking.html?tracking-id=',
    color: '#FFCC00', textColor: '#D40511',
  },
  {
    id: 'fedex',     name: 'FedEx',          shortName: 'FedEx',
    services: ['Priority Overnight', 'International Priority', 'Express Saver'],
    trackingBase: 'https://www.fedex.com/en-au/tracking.html?trknbr=',
    color: '#4D148C', textColor: '#FF6600',
  },
  {
    id: 'startrack', name: 'StarTrack',      shortName: 'STARTRACK',
    services: ['Express', 'Premium', 'Road Express'],
    trackingBase: 'https://startrack.com.au/tracking?ref=',
    color: '#E8722B', textColor: '#fff',
  },
];

const PREFIX   = { auspost: 'AP', dhl: 'JD', fedex: 'FX', startrack: 'ST' };
const ETA_DAYS = { auspost: 2,   dhl: 1,    fedex: 1,     startrack: 2    };

// Simulates courier API — generates tracking numbers and estimated delivery.
// Replace body with real REST call once credentials are configured.
export async function createShipment({ courierId, service, sender, recipient, reference }) {
  await new Promise(r => setTimeout(r, 900));
  const p   = PREFIX[courierId] ?? 'XX';
  const ts  = Date.now();
  const n1  = String(ts).slice(-9);
  const n2  = String(ts + 1).slice(-9);
  const eta = new Date();
  eta.setDate(eta.getDate() + (ETA_DAYS[courierId] ?? 2));
  return {
    trackingNumber:       `${p}${n1}AU`,
    returnTrackingNumber: `${p}${n2}AU`,
    estimatedDelivery:    eta.toISOString().slice(0, 10),
    cost:                 null,
  };
}

// Generates a print-ready shipping label HTML page.
// Opens in a new window and auto-prints.
export function generateLabelHtml({ courierId, service, sender, recipient, tracking, returnBy, reference, deviceId, isReturn }) {
  const courier = COURIERS.find(c => c.id === courierId) ?? COURIERS[0];
  const from    = isReturn ? recipient : sender;
  const to      = isReturn ? sender    : recipient;
  const trackNo = isReturn ? tracking.returnTrackingNumber : tracking.trackingNumber;

  // Pseudo-barcode from tracking number characters
  const bars = trackNo.split('').flatMap((ch) => {
    const w = (ch.charCodeAt(0) % 3) + 1;
    const g = ch.charCodeAt(0) % 2 + 1;
    return [
      `<span style="display:inline-block;width:${w * 3}px;height:52px;background:#000;vertical-align:bottom;"></span>`,
      `<span style="display:inline-block;width:${g + 1}px;height:52px;background:#fff;vertical-align:bottom;"></span>`,
    ];
  }).join('');

  const fmtDate = iso => iso
    ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Shipping Label — ${trackNo}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; background: #f5f5f5; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 16px; }
  .label { width: 100mm; background: #fff; border: 2px solid #000; }
  .hdr   { background: ${courier.color}; color: ${courier.textColor}; padding: 9px 12px; display: flex; align-items: center; justify-content: space-between; }
  .hdr-name  { font-size: 20px; font-weight: 900; letter-spacing: 0.06em; }
  .hdr-svc   { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 3px; background: rgba(0,0,0,0.18); color: ${courier.textColor}; }
  .ret-banner { background: #fff9e6; border-bottom: 2px solid #f59e0b; padding: 5px 12px; font-size: 10px; font-weight: 700; color: #92400e; text-align: center; letter-spacing: 0.04em; }
  .sect  { padding: 9px 12px; border-bottom: 1px solid #000; }
  .lbl   { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #777; margin-bottom: 3px; }
  .name  { font-size: 13px; font-weight: 700; line-height: 1.3; }
  .addr  { font-size: 11px; line-height: 1.6; color: #222; }
  .pcode { font-size: 24px; font-weight: 900; letter-spacing: 0.04em; margin-top: 5px; }
  .barcode-sect { padding: 10px 12px; border-bottom: 1px solid #000; text-align: center; }
  .bars  { display: flex; align-items: flex-end; justify-content: center; height: 60px; margin-bottom: 5px; overflow: hidden; }
  .trkno { font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; }
  .foot  { padding: 8px 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .meta  { font-size: 10px; line-height: 1.8; }
  .meta strong { color: #111; }
  .warn  { font-size: 10px; font-weight: 700; color: #b91c1c; text-align: right; }
  .warn-sub { font-size: 9px; color: #666; text-align: right; margin-top: 2px; }
  @media print {
    body   { background: #fff; padding: 0; }
    .label { border: 2px solid #000; width: 100%; max-width: 100%; }
  }
</style></head><body>
<div class="label">
  <div class="hdr">
    <div class="hdr-name">${courier.shortName}</div>
    <div class="hdr-svc">${service.toUpperCase()}</div>
  </div>
  ${isReturn ? '<div class="ret-banner">↩ RETURN LABEL — Patient returns device to lab</div>' : ''}
  <div class="sect">
    <div class="lbl">From</div>
    <div class="name">${from.name ?? ''}</div>
    <div class="addr">${[from.line1, from.line2].filter(Boolean).join(', ')}</div>
    <div class="addr">${(from.suburb ?? '').toUpperCase()} ${from.state ?? ''} ${from.postcode ?? ''}</div>
    ${from.phone ? `<div class="addr" style="color:#555">Ph: ${from.phone}</div>` : ''}
  </div>
  <div class="sect">
    <div class="lbl">Deliver to</div>
    <div class="name">${to.name ?? ''}</div>
    <div class="addr">${[to.line1, to.line2].filter(Boolean).join(', ')}</div>
    <div class="addr">${(to.suburb ?? '').toUpperCase()} ${to.state ?? ''} ${to.postcode ?? ''}</div>
    ${to.phone ? `<div class="addr" style="color:#555">Ph: ${to.phone}</div>` : ''}
    ${to.postcode ? `<div class="pcode">${to.postcode}</div>` : ''}
  </div>
  <div class="barcode-sect">
    <div class="bars">${bars}</div>
    <div class="trkno">${trackNo}</div>
  </div>
  <div class="foot">
    <div class="meta">
      <div><span style="color:#666">REF: </span><strong>${reference || '—'}</strong></div>
      <div><span style="color:#666">DEVICE: </span><strong>${deviceId}</strong></div>
      ${returnBy && !isReturn ? `<div><span style="color:#666">RETURN BY: </span><strong>${fmtDate(returnBy)}</strong></div>` : ''}
      ${isReturn ? '<div style="color:#b45309;font-weight:700">MEDICAL DEVICE RETURN</div>' : ''}
    </div>
    <div>
      <div class="warn">⚠ MEDICAL DEVICE</div>
      <div class="warn-sub">Handle with care</div>
      <div class="warn-sub">Do not bend or crush</div>
    </div>
  </div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body></html>`;
}
