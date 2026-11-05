import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BIKE_SERVICE,
  BIKE_VEHICLE,
  SCOOTY_SERVICE,
  SCOOTY_VEHICLE,
  getIndiaLocalDate,
  validateBooking
} from '../js/booking-validation.js';

const today = '2026-10-15';
const validRequest = {
  name: '  Asha Patel  ',
  phone: '+91 98765 43210',
  service: 'Car for Rent',
  vehicle: 'Innova',
  pickup: ' Diu ',
  destination: 'Somnath',
  date: today,
  returnDate: '',
  message: ''
};

test('accepts a same-day, one-way request using the supported India date', () => {
  assert.deepEqual(validateBooking(validRequest, today), {});
});

test('uses Asia/Kolkata to determine the business-local calendar date', () => {
  assert.equal(getIndiaLocalDate(new Date('2026-10-15T18:30:00.000Z')), '2026-10-16');
});

test('rejects travel dates before the India-local current date', () => {
  const errors = validateBooking({ ...validRequest, date: '2026-10-14' }, today);
  assert.match(errors.date, /today or later/i);
});

test('rejects impossible calendar dates', () => {
  const errors = validateBooking({ ...validRequest, date: '2026-02-30' }, today);
  assert.match(errors.date, /valid travel date/i);
});

test('allows a return on the travel date and rejects an earlier return', () => {
  assert.equal(validateBooking({ ...validRequest, returnDate: today }, today).returnDate, undefined);
  const errors = validateBooking({ ...validRequest, date: '2026-10-16', returnDate: today }, today);
  assert.match(errors.returnDate, /cannot be before/i);
});

test('rejects car and two-wheeler service/vehicle mismatches', () => {
  assert.match(validateBooking({ ...validRequest, service: BIKE_SERVICE, vehicle: 'Innova' }, today).vehicle, /available for the selected service/i);
  assert.match(validateBooking({ ...validRequest, service: 'Car for Rent', vehicle: SCOOTY_VEHICLE }, today).vehicle, /available for the selected service/i);
});

test('accepts the listed bike and scooty service/vehicle pairs', () => {
  assert.deepEqual(validateBooking({ ...validRequest, service: BIKE_SERVICE, vehicle: BIKE_VEHICLE }, today), {});
  assert.deepEqual(validateBooking({ ...validRequest, service: SCOOTY_SERVICE, vehicle: SCOOTY_VEHICLE }, today), {});
});

test('rejects blank required details and an unsupported service', () => {
  const errors = validateBooking({ ...validRequest, name: ' ', phone: '', service: '', vehicle: '', pickup: '' }, today);
  for (const field of ['name', 'phone', 'service', 'vehicle', 'pickup']) assert.ok(errors[field]);
});

test('rejects malformed phone numbers and trim-length violations', () => {
  assert.ok(validateBooking({ ...validRequest, phone: '1234----' }, today).phone);
  assert.ok(validateBooking({ ...validRequest, phone: `+${'1'.repeat(16)}` }, today).phone);
  assert.equal(validateBooking(validRequest, today).phone, undefined);
});

test('enforces customer input limits', () => {
  const errors = validateBooking({
    ...validRequest,
    name: 'a'.repeat(71),
    pickup: 'p'.repeat(101),
    destination: 'd'.repeat(101),
    message: 'm'.repeat(301)
  }, today);
  for (const field of ['name', 'pickup', 'destination', 'message']) assert.ok(errors[field]);
});
