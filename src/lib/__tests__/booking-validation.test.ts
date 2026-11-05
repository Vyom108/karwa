import { describe, expect, it } from 'vitest'
import {
  BIKE_SERVICE, BIKE_VEHICLE, CAR_SERVICES, CAR_VEHICLES, getIndiaLocalDate,
  getVehiclesForService, SCOOTY_SERVICE, SCOOTY_VEHICLE, SERVICES,
  SERVICE_VEHICLES, validateBooking, validateDetails, validateJourney,
  type BookingValues,
} from '../booking-validation'

const validBooking = (overrides: Partial<BookingValues> = {}): BookingValues => ({
  service: 'Car for Rent', vehicle: 'Innova', pickup: 'Diu', destination: '',
  date: '2026-10-31', returnDate: '', name: 'V. Sejpal', phone: '+91 98765 43210',
  message: '', termsAgreement: false, ...overrides,
})

describe('handoff service and vehicle map', () => {
  it('contains the exact service and vehicle strings with no unlisted vehicle', () => {
    expect(SERVICES).toEqual([
      'Self Drive Cars', 'Car for Rent', 'Car Hire for Wedding', 'Outstation Trips',
      'Bikes on Rent — ₹700 / 12 hours', 'Scooty on Rent — ₹600 / 12 hours',
    ])
    expect(CAR_SERVICES).toEqual(['Self Drive Cars', 'Car for Rent', 'Car Hire for Wedding', 'Outstation Trips'])
    expect(CAR_VEHICLES).toEqual(['Innova','Swift Dzire','Ertiga','Innova Crysta','Etios','Force Urbania — 16 Seater','Kia Carens','Ford Endeavour','Mahindra Thar'])
    for (const service of CAR_SERVICES) expect(SERVICE_VEHICLES[service]).toEqual(CAR_VEHICLES)
    expect(SERVICE_VEHICLES[BIKE_SERVICE]).toEqual([BIKE_VEHICLE])
    expect(SERVICE_VEHICLES[SCOOTY_SERVICE]).toEqual([SCOOTY_VEHICLE])
    expect(getVehiclesForService(BIKE_SERVICE)).toEqual([BIKE_VEHICLE])
    expect(getVehiclesForService('Tempo Traveller')).toEqual([])
  })

  it('requires service, vehicle, pickup, and travel date; destination and return date are optional', () => {
    expect(validateJourney(validBooking({ service: '', vehicle: '', pickup: '', date: '' }), '2026-10-30')).toEqual({
      service: 'Choose a service.', vehicle: 'Choose a vehicle.', pickup: 'Enter a pickup location.', date: 'Choose a valid travel date.',
    })
    expect(validateJourney(validBooking({ destination: '', returnDate: '' }), '2026-10-30')).toEqual({})
    expect(validateJourney(validBooking({ service: 'Car for Rent', vehicle: BIKE_VEHICLE }), '2026-10-30').vehicle).toBe('Choose a vehicle available for the selected service.')
    expect(validateJourney(validBooking({ service: 'Bike', vehicle: BIKE_VEHICLE }), '2026-10-30').service).toBe('Choose a service.')
  })
})

describe('phone number rule', () => {
  it.each(['98765432', '+91 98765 43210', '1(234)567-8901', '123456789012345'])(
    'accepts valid phone value %s', (phone) => {
      expect(validateDetails(validBooking({ phone })).phone).toBeUndefined()
    },
  )
  it.each(['1234567', '1234567890123456', '++12345678', '12345abc678', '12345678-', '(123)45678'])(
    'rejects invalid phone value %s with the handoff message', (phone) => {
      expect(validateDetails(validBooking({ phone })).phone).toBe('Enter a valid phone number, including country code if needed.')
    },
  )
  it('uses the dedicated missing-phone message', () => {
    expect(validateDetails(validBooking({ phone: '  ' })).phone).toBe('Enter a phone number so Karwa can contact you.')
  })
})

describe('India-local dates', () => {
  it('changes the India-local date at 18:30 UTC midnight boundaries', () => {
    expect(getIndiaLocalDate(new Date('2026-10-30T18:29:59.999Z'))).toBe('2026-10-30')
    expect(getIndiaLocalDate(new Date('2026-10-30T18:30:00.000Z'))).toBe('2026-10-31')
    expect(getIndiaLocalDate(new Date('2026-10-31T00:00:00.000Z'))).toBe('2026-10-31')
  })
  it('accepts today and future travel dates and rejects past or invalid calendar values', () => {
    expect(validateJourney(validBooking({ date: '2026-10-30' }), '2026-10-30').date).toBeUndefined()
    expect(validateJourney(validBooking({ date: '2026-10-31' }), '2026-10-30').date).toBeUndefined()
    expect(validateJourney(validBooking({ date: '2026-10-29' }), '2026-10-30').date).toBe('Travel date must be today or later (India time).')
    expect(validateJourney(validBooking({ date: '2026-02-30' }), '2026-02-01').date).toBe('Choose a valid travel date.')
  })
  it('allows an equal return date, rejects an earlier one, and rejects invalid date values', () => {
    expect(validateJourney(validBooking({ date: '2026-10-30', returnDate: '2026-10-30' }), '2026-10-30').returnDate).toBeUndefined()
    expect(validateJourney(validBooking({ date: '2026-10-30', returnDate: '2026-10-29' }), '2026-10-30').returnDate).toBe('Return date cannot be before the travel date.')
    expect(validateJourney(validBooking({ returnDate: '2026-02-30' }), '2026-10-30').returnDate).toBe('Choose a valid return date.')
  })
})

describe('field length boundaries and messages', () => {
  it('accepts each exact maximum and rejects values one character over', () => {
    expect(validateBooking(validBooking({ pickup: 'p'.repeat(100), destination: 'd'.repeat(100), name: 'n'.repeat(70), message: 'm'.repeat(300) }), '2026-10-30')).toEqual({})
    expect(validateBooking(validBooking({ pickup: 'p'.repeat(101) }), '2026-10-30').pickup).toBe('Pickup location must be 100 characters or fewer.')
    expect(validateBooking(validBooking({ destination: 'd'.repeat(101) }), '2026-10-30').destination).toBe('Destination must be 100 characters or fewer.')
    expect(validateBooking(validBooking({ name: 'n'.repeat(71) }), '2026-10-30').name).toBe('Name must be 70 characters or fewer.')
    expect(validateBooking(validBooking({ message: 'm'.repeat(301) }), '2026-10-30').message).toBe('Message must be 300 characters or fewer.')
  })
  it('reports required name and pickup messages after trimming whitespace', () => {
    expect(validateDetails(validBooking({ name: ' ' })).name).toBe('Enter your name.')
    expect(validateJourney(validBooking({ pickup: ' ' }), '2026-10-30').pickup).toBe('Enter a pickup location.')
  })
})

describe('self-drive agreement', () => {
  it('requires acceptance only for Self Drive Cars', () => {
    expect(validateDetails(validBooking({ service: 'Self Drive Cars', termsAgreement: false })).termsAgreement).toBe('Please read and agree to the self-drive terms before continuing.')
    expect(validateDetails(validBooking({ service: 'Self Drive Cars', termsAgreement: true })).termsAgreement).toBeUndefined()
    expect(validateDetails(validBooking({ service: 'Car for Rent', termsAgreement: false })).termsAgreement).toBeUndefined()
  })
})
