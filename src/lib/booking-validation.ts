export const CAR_SERVICES = [
  'Self Drive Cars',
  'Car for Rent',
  'Car Hire for Wedding',
  'Outstation Trips',
] as const

export const CAR_VEHICLES = [
  'Innova',
  'Swift Dzire',
  'Ertiga',
  'Innova Crysta',
  'Etios',
  'Force Urbania — 16 Seater',
  'Kia Carens',
  'Ford Endeavour',
  'Mahindra Thar',
] as const

export const BIKE_SERVICE = 'Bikes on Rent — ₹700 / 12 hours' as const
export const SCOOTY_SERVICE = 'Scooty on Rent — ₹600 / 12 hours' as const
export const BIKE_VEHICLE = 'Bike — ₹700 / 12 hours' as const
export const SCOOTY_VEHICLE = 'Scooty — ₹600 / 12 hours' as const

export type Service = (typeof CAR_SERVICES)[number] | typeof BIKE_SERVICE | typeof SCOOTY_SERVICE
export type Vehicle = (typeof CAR_VEHICLES)[number] | typeof BIKE_VEHICLE | typeof SCOOTY_VEHICLE

export const SERVICES: readonly Service[] = [...CAR_SERVICES, BIKE_SERVICE, SCOOTY_SERVICE]

export const SERVICE_VEHICLES: Readonly<Record<Service, readonly Vehicle[]>> = Object.freeze({
  ...Object.fromEntries(CAR_SERVICES.map((service) => [service, CAR_VEHICLES])) as Record<(typeof CAR_SERVICES)[number], typeof CAR_VEHICLES>,
  [BIKE_SERVICE]: [BIKE_VEHICLE],
  [SCOOTY_SERVICE]: [SCOOTY_VEHICLE],
})

export const ALL_VEHICLES: readonly Vehicle[] = [...CAR_VEHICLES, BIKE_VEHICLE, SCOOTY_VEHICLE]

export interface BookingValues {
  service: string
  vehicle: string
  pickup: string
  destination: string
  date: string
  returnDate: string
  name: string
  phone: string
  message: string
  termsAgreement: boolean
}

export type BookingField = keyof BookingValues
export type BookingErrors = Partial<Record<BookingField, string>>

export const SELF_DRIVE_TERMS = {
  brand: 'KARWA TOURS AND TRAVELS',
  title: 'SELF-DRIVE CAR RENTAL',
  route: 'Route: Diu → Somnath → Sasan Gir → Dwarka',
  heading: 'Terms & Conditions',
  items: [
    'A valid driving licence and valid ID proof are mandatory.',
    'A security deposit must be paid at the time of booking.',
    'Only the authorised driver may drive the vehicle.',
    'Fuel, toll tax, parking charges, and traffic fines are the customer’s responsibility.',
    'The customer is responsible for the vehicle’s safety and condition throughout the rental period.',
    'The customer must pay any applicable charges in case of an accident, damage, or vehicle loss.',
    'Using the vehicle for illegal activities is strictly prohibited.',
    'Smoking and alcohol consumption inside the vehicle are strictly prohibited.',
    'The vehicle must be returned in the same condition on the agreed date and time.',
    'Permission from Karwa Tours and Travels is required before extending the rental period.',
    'Karwa Tours and Travels must be informed immediately in case of an accident or breakdown.',
    'Booking cancellations and refunds are subject to the applicable booking policy.',
  ],
  thankYou: 'Thank You for Choosing KARWA TOURS AND TRAVELS',
  agreement: 'I have read and agree to the Self-Drive Terms & Conditions.',
} as const

const PHONE_PATTERN = /^\+?[0-9][0-9\s()-]{6,18}[0-9]$/

export function getIndiaLocalDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${part.year}-${part.month}-${part.day}`
}

export function isDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function getVehiclesForService(service: string): readonly Vehicle[] {
  return Object.hasOwn(SERVICE_VEHICLES, service)
    ? SERVICE_VEHICLES[service as Service]
    : []
}

export function validateJourney(data: BookingValues, today = getIndiaLocalDate()): BookingErrors {
  const errors: BookingErrors = {}
  if (!Object.hasOwn(SERVICE_VEHICLES, data.service)) errors.service = 'Choose a service.'
  if (!data.vehicle) errors.vehicle = 'Choose a vehicle.'
  else if (getVehiclesForService(data.service).length && !getVehiclesForService(data.service).includes(data.vehicle as Vehicle)) {
    errors.vehicle = 'Choose a vehicle available for the selected service.'
  }

  const pickup = data.pickup.trim()
  const destination = data.destination.trim()
  if (!pickup) errors.pickup = 'Enter a pickup location.'
  else if (pickup.length > 100) errors.pickup = 'Pickup location must be 100 characters or fewer.'
  if (destination.length > 100) errors.destination = 'Destination must be 100 characters or fewer.'

  if (!isDateValue(data.date)) errors.date = 'Choose a valid travel date.'
  else if (data.date < today) errors.date = 'Travel date must be today or later (India time).'
  if (data.returnDate) {
    if (!isDateValue(data.returnDate)) errors.returnDate = 'Choose a valid return date.'
    else if (isDateValue(data.date) && data.returnDate < data.date) errors.returnDate = 'Return date cannot be before the travel date.'
  }
  return errors
}

export function validateDetails(data: BookingValues): BookingErrors {
  const errors: BookingErrors = {}
  const name = data.name.trim()
  const phone = data.phone.trim()
  const message = data.message.trim()
  if (!name) errors.name = 'Enter your name.'
  else if (name.length > 70) errors.name = 'Name must be 70 characters or fewer.'

  const digits = phone.replace(/\D/g, '')
  if (!phone) errors.phone = 'Enter a phone number so Karwa can contact you.'
  else if (!PHONE_PATTERN.test(phone) || digits.length < 8 || digits.length > 15) {
    errors.phone = 'Enter a valid phone number, including country code if needed.'
  }
  if (message.length > 300) errors.message = 'Message must be 300 characters or fewer.'
  if (data.service === 'Self Drive Cars' && !data.termsAgreement) {
    errors.termsAgreement = 'Please read and agree to the self-drive terms before continuing.'
  }
  return errors
}

export function validateBooking(data: BookingValues, today = getIndiaLocalDate()): BookingErrors {
  return { ...validateJourney(data, today), ...validateDetails(data) }
}
