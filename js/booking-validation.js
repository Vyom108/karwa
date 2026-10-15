export const CAR_SERVICES = [
  'Self Drive Cars',
  'Car for Rent',
  'Car Hire for Wedding',
  'Outstation Trips'
];

export const CAR_VEHICLES = [
  'Innova',
  'Swift Dzire',
  'Ertiga',
  'Innova Crysta',
  'Etios',
  'Tempo Traveller',
  'Force Urbania — 16 Seater',
  'Kia Carens',
  'Ford Endeavour',
  'Mahindra Thar'
];

export const BIKE_SERVICE = 'Bikes on Rent — ₹900 / 12 hours';
export const SCOOTY_SERVICE = 'Scooty on Rent — ₹600 / 12 hours';
export const BIKE_VEHICLE = 'Bike — ₹900 / 12 hours';
export const SCOOTY_VEHICLE = 'Scooty — ₹600 / 12 hours';

export const SERVICE_VEHICLES = Object.freeze({
  ...Object.fromEntries(CAR_SERVICES.map((service) => [service, CAR_VEHICLES])),
  [BIKE_SERVICE]: [BIKE_VEHICLE],
  [SCOOTY_SERVICE]: [SCOOTY_VEHICLE]
});

export const ALL_VEHICLES = [...CAR_VEHICLES, BIKE_VEHICLE, SCOOTY_VEHICLE];

export function getIndiaLocalDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const part = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${part.year}-${part.month}-${part.day}`;
}

function isDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateBooking(data, today = getIndiaLocalDate()) {
  const errors = {};
  const name = (data.name || '').trim();
  const phone = (data.phone || '').trim();
  const pickup = (data.pickup || '').trim();
  const destination = (data.destination || '').trim();
  const message = (data.message || '').trim();

  if (!name) errors.name = 'Enter your name.';
  else if (name.length > 70) errors.name = 'Name must be 70 characters or fewer.';

  const digits = phone.replace(/\D/g, '');
  if (!phone) errors.phone = 'Enter a phone number so Karwa can contact you.';
  else if (!/^\+?[0-9][0-9\s()-]{6,18}[0-9]$/.test(phone) || digits.length < 8 || digits.length > 15) {
    errors.phone = 'Enter a valid phone number, including country code if needed.';
  }

  if (!Object.hasOwn(SERVICE_VEHICLES, data.service)) errors.service = 'Choose a service.';
  if (!data.vehicle) errors.vehicle = 'Choose a vehicle.';
  else if (SERVICE_VEHICLES[data.service] && !SERVICE_VEHICLES[data.service].includes(data.vehicle)) {
    errors.vehicle = 'Choose a vehicle available for the selected service.';
  }

  if (!pickup) errors.pickup = 'Enter a pickup location.';
  else if (pickup.length > 100) errors.pickup = 'Pickup location must be 100 characters or fewer.';
  if (destination.length > 100) errors.destination = 'Destination must be 100 characters or fewer.';
  if (message.length > 300) errors.message = 'Message must be 300 characters or fewer.';

  if (!isDateValue(data.date)) errors.date = 'Choose a valid travel date.';
  else if (data.date < today) errors.date = 'Travel date must be today or later (India time).';
  if (data.returnDate) {
    if (!isDateValue(data.returnDate)) errors.returnDate = 'Choose a valid return date.';
    else if (isDateValue(data.date) && data.returnDate < data.date) {
      errors.returnDate = 'Return date cannot be before the travel date.';
    }
  }

  return errors;
}
