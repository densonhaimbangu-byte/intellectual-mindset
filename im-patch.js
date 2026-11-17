// Intellectual Mindset update: session-only login on website, receipt stays open, "Sign in" label.
const fs = require('fs');
const edits = [];
const edit = (file, a, b) => edits.push([file, a, b]);

// 1) Footer label
edit('src/components/site/Footer.tsx', '            Owner login\n', '            Sign in\n');

// 2) Receipt: no more automatic jump to WhatsApp; add a WhatsApp button inside the receipt
edit('src/routes/product.$productId.tsx',
  '      window.open(whatsappOrderUrl(ownerPhone, payload), "_blank", "noopener,noreferrer");\n',
  '      setWaUrl(whatsappOrderUrl(ownerPhone, payload));\n');
edit('src/routes/product.$productId.tsx',
  '  const [slip, setSlip] = useState<OrderRecord | null>(null);\n',
  '  const [slip, setSlip] = useState<OrderRecord | null>(null);\n  const [waUrl, setWaUrl] = useState<string | null>(null);\n');
edit('src/routes/product.$productId.tsx',
  '<OrderSlipDialog order={slip} onClose={() => setSlip(null)} />',
  '<OrderSlipDialog order={slip} whatsappUrl={waUrl} onClose={() => setSlip(null)} />');
edit('src/components/site/OrderSlip.tsx',
  'export function OrderSlip({ order }: { order: OrderRecord }) {',
  'export function OrderSlip({ order, whatsappUrl }: { order: OrderRecord; whatsappUrl?: string | null }) {');
edit('src/components/site/OrderSlip.tsx',
  '{saving ? "Saving…" : "Save slip image"}</Button>\n',
  '{saving ? "Saving…" : "Save slip image"}</Button>\n    {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex h-10 w-full items-center justify-center rounded-md border border-border text-sm font-semibold">Send this order on WhatsApp</a> : null}\n');
edit('src/components/site/OrderSlip.tsx',
  'export function OrderSlipDialog({ order, onClose }: { order: OrderRecord | null; onClose: () => void }) {',
  'export function OrderSlipDialog({ order, onClose, whatsappUrl }: { order: OrderRecord | null; onClose: () => void; whatsappUrl?: string | null }) {');
edit('src/components/site/OrderSlip.tsx',
  '{order ? <OrderSlip order={order} /> : null}',
  '{order ? <OrderSlip order={order} whatsappUrl={whatsappUrl} /> : null}');

// 3) Login: remembered only inside the installed app; on the website it ends when the tab/browser closes
edit('src/integrations/supabase/client.ts',
  'function createSupabaseClient() {\n',
  `function isInstalledApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) return true;
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    if ((navigator as Navigator & { standalone?: boolean }).standalone) return true;
    if (/IMApp|; wv\\)/i.test(navigator.userAgent)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function authStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    if (isInstalledApp()) return window.localStorage;
    // Website: forget any old saved login, keep new logins only for this visit.
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) window.localStorage.removeItem(key);
    }
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function createSupabaseClient() {
`);
edit('src/integrations/supabase/client.ts',
  '    auth: {\n      persistSession: true,',
  '    auth: {\n      storage: authStorage(),\n      persistSession: true,');

// verify every anchor before touching anything
const cache = {};
for (const [f, a] of edits) {
  cache[f] ??= fs.readFileSync(f, 'utf8');
  if (!cache[f].includes(a)) { console.log('CANNOT APPLY (nothing changed). Missing in ' + f + ': ' + a.slice(0, 60)); process.exit(1); }
}
for (const [f, a, b] of edits) cache[f] = cache[f].replace(a, () => b);
for (const f of Object.keys(cache)) fs.writeFileSync(f, cache[f]);
console.log('UPDATE APPLIED OK (' + Object.keys(cache).length + ' files)');
