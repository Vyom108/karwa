import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import {
  BIKE_SERVICE, BIKE_VEHICLE, SCOOTY_SERVICE, SCOOTY_VEHICLE,
  validateBooking
} from '../js/booking-validation.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const valid = {
  name: 'Asha Patel', phone: '+91 98765 43210', pickup: 'Diu', destination: '',
  message: '', date: '2026-10-20', returnDate: ''
};

test('bike and scooty values match the forward database constraint', async () => {
  const sql = await read('supabase/migrations/20261018181355_align_bike_booking_labels.sql');
  assert.ok(sql.includes(`service = '${BIKE_SERVICE}' and vehicle = '${BIKE_VEHICLE}'`));
  assert.ok(sql.includes(`service = '${SCOOTY_SERVICE}' and vehicle = '${SCOOTY_VEHICLE}'`));
  assert.ok(sql.includes('validate constraint bookings_service_vehicle_compatibility_700_check'));
  assert.ok(sql.includes('drop constraint bookings_service_vehicle_compatibility_check'));
  assert.ok(!sql.includes('₹900'));
  assert.doesNotMatch(sql, /\bupdate\s+public\.bookings/i);
});

test('bike at ₹700 and scooty at ₹600 remain valid; stale bike price is rejected', () => {
  assert.deepEqual(validateBooking({ ...valid, service: BIKE_SERVICE, vehicle: BIKE_VEHICLE }, '2026-10-20'), {});
  assert.deepEqual(validateBooking({ ...valid, service: SCOOTY_SERVICE, vehicle: SCOOTY_VEHICLE }, '2026-10-20'), {});
  assert.ok(validateBooking({ ...valid, service: BIKE_SERVICE, vehicle: 'Bike — ₹900 / 12 hours' }, '2026-10-20').vehicle);
});


test('mobile navigation exposes expanded state, a labelled control, and Escape dismissal', async () => {
  const html = await read('index.html');
  const script = await read('js/main.js');
  assert.match(html, /aria-controls="site-navigation"/);
  assert.match(html, /<nav id="site-navigation">/);
  assert.match(script, /aria-label', isOpen \? 'Close menu' : 'Open menu'/);
  assert.match(script, /event\.key === 'Escape'/);
});

test('homepage and public contact actions use verified phone, email, and booking destinations', async () => {
  const html = await read('index.html');
  assert.match(html, /href="tel:\+918140057861"/);
  assert.match(html, /href="tel:\+919723087861"/);
  assert.match(html, /href="mailto:mansurimakhdum098@gmail\.com"/);
  assert.match(html, /href="#booking">Request a Booking/);
});

test('public SEO files exclude private pages and point to canonical host', async () => {
  const robots = await read('robots.txt');
  const sitemap = await read('sitemap.xml');
  assert.match(robots, /Disallow: \/admin\.html/);
  assert.match(robots, /Disallow: \/admin-login\.html/);
  assert.match(robots, /Disallow: \/reset-password\.html/);
  assert.match(sitemap, /https:\/\/karwatours\.com\//);
  assert.doesNotMatch(sitemap, /admin|reset-password|privacy|terms|refund|cancellation/);
  const localConfig = await read('supabase/config.toml');
  assert.ok(localConfig.includes('site_url = "http://127.0.0.1:3000"'));
  assert.ok(localConfig.includes('additional_redirect_urls = ["http://127.0.0.1:3000", "http://localhost:3000"]'));
  assert.ok(!localConfig.includes('additional_redirect_urls = ["https://'));
});

test('security header configuration allows the app origins and hashes the JSON-LD block', async () => {
  const html = await read('index.html');
  const jsonld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(jsonld);
  const hash = createHash('sha256').update(jsonld).digest('base64');
  const config = JSON.parse(await read('vercel.json'));
  const csp = config.headers[0].headers.find(({ key }) => key === 'Content-Security-Policy').value;
  assert.ok(csp.includes(`'sha256-${hash}'`));
  for (const directive of ['https://esm.sh', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://images.unsplash.com', 'https://budzaprtpjupczcmmdax.supabase.co']) {
    assert.ok(csp.includes(directive), `CSP includes ${directive}`);
  }
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes("object-src 'none'"));
});

test('homepage local image references exist and optimized hero is substantially smaller', async () => {
  const html = await read('index.html');
  const refs = [...html.matchAll(/(?:src|srcset)="([^"]+)"/g)]
    .flatMap(([, value]) => value.split(',').map((entry) => entry.trim().split(/\s+/)[0]))
    .filter((value) => value.startsWith('assets/'));
  for (const ref of refs) await access(resolve(new URL('.', root).pathname, ref));
  const [source, optimized] = await Promise.all([
    readFile(new URL('assets/images/hero-indian-road.png', root)),
    readFile(new URL('assets/images/hero-indian-road-1376.webp', root))
  ]);
  assert.ok(optimized.byteLength < source.byteLength / 10);
});
