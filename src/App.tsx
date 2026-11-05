import { type FormEvent, useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, Menu, X, MapPin, Phone, Mail, ChevronDown, MessageCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WHATSAPP_NUMBER } from '@/lib/api'
import { getIndiaLocalDate, getVehiclesForService, SELF_DRIVE_TERMS, SERVICES, validateBooking, validateJourney, type BookingErrors, type BookingField, type BookingValues, type Service, type Vehicle } from '@/lib/booking-validation'

type PolicyKey = 'terms' | 'privacy' | 'cancellation' | 'refund'
const policies: Record<PolicyKey, { title: string; description: string; blocks: { heading?: string; text?: string; list?: string[] }[] }> = {
  terms: { title: 'Booking Terms | Karwa Tours & Travels', description: 'How booking requests and reservation confirmations work with Karwa Tours & Travels.', blocks: [
    { heading: 'Owner review required before publication.' },
    { text: 'The points below describe the current website workflow. The business should complete and approve service-specific conditions before treating this page as a complete set of contractual terms.' },
    { list: ['Confirm what constitutes final acceptance of a reservation.', 'Confirm any deposits, payment methods, changes, cancellation terms, and service-specific rules.', 'Confirm the correct business name and governing contact details.'] },
    { heading: 'Booking request and confirmation', text: 'Submitting the website form sends a request for a service, vehicle, and travel dates. It does not by itself confirm a reservation or final price. Karwa will check availability and confirm the final price with the customer through WhatsApp or another confirmation process agreed with the customer.' },
    { heading: 'Details provided', text: 'Please provide accurate contact and trip details so Karwa can respond. The website prepares a WhatsApp message from the details you enter; you review and send it yourself.' },
    { heading: 'Service-specific conditions', text: 'Additional self-drive terms are shown in the booking form when that service is selected and must be accepted before sending the request. Any additional conditions for other services should be confirmed directly with Karwa before the reservation is finalized.' },
    { heading: 'Changes and cancellations', text: 'See the Cancellation Policy and Refund Policy. Those pages require owner decisions before they can be considered complete.' },
    { heading: 'Contact', text: 'The website currently lists +91 81400 57861, +91 97230 87861, and mansurimakhdum098@gmail.com. Confirm final pricing and service conditions with Karwa before travel.' },
  ] },
  privacy: { title: 'Privacy Policy | Karwa Tours & Travels', description: 'How booking enquiries are prepared and sent to Karwa Tours & Travels.', blocks: [
    { heading: 'Owner review required before publication.' },
    { text: 'This draft describes the data flows visible in the website. Complete the owner checklist below and confirm the final text before publishing it as an approved policy.' },
    { list: ['Confirm the responsible legal/business name and postal address.', 'Set and disclose data retention, deletion, and customer request procedures.', 'Confirm applicable privacy-law notices and the contact responsible for privacy requests.'] },
    { text: 'The booking form temporarily uses the details you enter to prepare a WhatsApp message. The website does not create a customer account or store a booking request in a website database.' },
    { list: ['Booking message: name, phone number, selected service and vehicle, pickup location, optional destination, travel and return dates, and optional message.'] },
    { heading: 'How the information is used', text: 'The information is included in a WhatsApp message only after you choose to continue. You can review the message and choose whether to send it. A booking request is not a confirmed reservation.' },
    { heading: 'WhatsApp', text: 'When you send the prepared message, WhatsApp processes it under its own terms and privacy practices. The message is sent to Karwa’s published WhatsApp contact.' },
    { heading: 'Retention and customer requests', text: 'The website does not retain the booking form details after you leave the page. Once sent, the message is available to you and Karwa in WhatsApp. Contact Karwa directly for questions about a sent enquiry.' },
    { heading: 'Contact', text: 'For questions about a booking, the site currently lists +91 81400 57861, +91 97230 87861, and mansurimakhdum098@gmail.com. [OWNER TO CONFIRM] Identify the correct privacy contact and the legal/business name responsible for the information.' },
  ] },
  cancellation: { title: 'Cancellation Policy | Karwa Tours & Travels', description: 'Cancellation information for Karwa Tours & Travels booking requests.', blocks: [
    { heading: 'Owner decisions required before publication.' },
    { text: 'No cancellation window, fee, or rescheduling promise was available in the repository, so this page does not invent one.' },
    { list: ['Define how customers cancel or change a request after confirmation.', 'Set any cutoff times, fees, and service-specific exceptions.', 'Explain how customers receive acknowledgement of a cancellation.'] },
    { heading: 'Booking requests', text: 'The website prepares a WhatsApp message with your requested ride details. You must send that message in WhatsApp for Karwa to receive it. This is a request, not a confirmed reservation.' },
    { heading: 'After Karwa confirms a reservation', text: '[OWNER TO COMPLETE] Add the verified process and conditions for cancelling or changing a confirmed reservation. Include any deadlines and applicable charges only after the business has approved them.' },
    { heading: 'Contact', text: 'The website currently lists +91 81400 57861, +91 97230 87861, and mansurimakhdum098@gmail.com. Contact Karwa with the booking reference when one is available. [OWNER TO CONFIRM] Choose the official cancellation contact and response process.' },
  ] },
  refund: { title: 'Refund Policy | Karwa Tours & Travels', description: 'Refund information for Karwa Tours & Travels reservations.', blocks: [
    { heading: 'Owner decisions required before publication.' },
    { text: 'The website does not collect online payments, and no refund rules were provided. Complete and approve the details below before presenting this as a final policy.' },
    { list: ['Confirm whether deposits or advance payments are collected and by which methods.', 'Define the refund conditions, amount, timing, and process.', 'Explain how cancellations by Karwa or the customer are handled.'] },
    { heading: 'Website requests', text: 'The website submits a travel request for availability and pricing follow-up. It does not take payment in the booking form. A request is not a confirmed reservation.' },
    { heading: 'Refund terms for confirmed bookings', text: '[OWNER TO COMPLETE] Publish the approved refund conditions for each relevant service, including any advance payments, deductions, timing, and customer contact process. Do not rely on this page until those details have been verified.' },
    { heading: 'Contact', text: 'The website currently lists +91 81400 57861, +91 97230 87861, and mansurimakhdum098@gmail.com. [OWNER TO CONFIRM] Identify the official refund enquiry contact.' },
  ] },
}
const fleet = [
  ['Innova', 'car', 'fleet-innova.webp'], ['Swift Dzire', 'car', 'fleet-swift-dzire.webp'], ['Ertiga', 'car', 'fleet-ertiga.webp'], ['Innova Crysta', 'car', 'fleet-innova-crysta.webp'], ['Etios', 'car', 'fleet-etios.webp'], ['Force Urbania', 'car', 'fleet-force-urbania.webp'], ['Kia Carens', 'car', 'fleet-kia-carens.webp'], ['Ford Endeavour', 'car', 'fleet-ford-endeavour.webp'], ['Mahindra Thar', 'car', 'fleet-mahindra-thar.webp'], ['Bikes on Rent', 'bike', 'fleet-bike.webp'], ['Scooty on Rent', 'scooty', 'fleet-scooty.webp'],
]
const services = [
  ['01 / SELF DRIVE', 'Take the wheel.', 'Self-drive cars for your own pace around Diu.', 'service-self-drive-premium.webp'],
  ['02 / CAR RENTAL', 'Ride together.', 'Choose a car for local plans or an outstation journey.', 'service-rental-premium.webp'],
  ['03 / CELEBRATIONS', 'Make it a day.', 'Car hire for weddings and the moments around them.', 'service-wedding-premium.webp'],
  ['04 / OUTSTATION', 'Keep going.', 'Ask about a ride for the road beyond Diu.', 'service-outstation-premium.webp'],
]
const destinations = [
  { place: 'Diu', description: 'Local plans along the island’s coast and familiar roads.', kind: 'Around Diu', image: 'place-diu.webp', alt: 'Stone gateway framing the sea along Diu’s coast' },
  { place: 'Nagoa Beach', description: 'A popular crescent-shaped beach on Diu, listed by the district tourism site.', kind: 'Around Diu', image: 'place-nagoa-beach.webp', alt: 'Sunset over the sea at Nagoa Beach, Diu' },
  { place: 'Diu Fort', description: 'The historic fort set along the island’s seafront.', kind: 'Around Diu', image: 'place-diu-fort.webp', alt: 'Historic Diu Fort overlooking the Arabian Sea' },
  { place: 'Gangeshwar Temple', description: 'A seaside temple in Fudam, a short distance from Diu town.', kind: 'Around Diu', image: 'place-gangeshwar-temple.webp', alt: 'Gangeshwar Temple grounds and sign beside Diu’s coast' },
  { place: 'INS Khukri Memorial', description: 'A memorial on the hillock by Chakratirth Beach.', kind: 'Around Diu', image: 'place-ins-khukri-memorial.webp', alt: 'The INS Khukri memorial pavilion in Diu' },
  { place: 'Ghoghla Beach', description: 'A broad beach at the entrance to Diu, on the district tourism list.', kind: 'Around Diu', image: 'place-ghoghla-beach.webp', alt: 'Open sandy shoreline near Ghoghla Beach, Diu' },
  { place: 'St. Paul’s Church', description: 'A landmark church in Diu, recognized for its historic architecture.', kind: 'Around Diu', image: 'place-st-pauls-church.webp', alt: 'Exterior of St. Paul’s Church in Diu' },
  { place: 'Somnath', description: 'A destination included in Karwa’s current self-drive route terms.', kind: 'Road beyond Diu', image: 'place-somnath.webp', alt: 'Somnath Temple in Gujarat' },
  { place: 'Sasan Gir', description: 'A destination included in Karwa’s current self-drive route terms.', kind: 'Road beyond Diu', image: 'place-sasan-gir.webp', alt: 'Asiatic lion in Gir National Park' },
  { place: 'Dwarka', description: 'A destination included in Karwa’s current self-drive route terms.', kind: 'Road beyond Diu', image: 'place-dwarka.webp', alt: 'Dwarkadhish Temple tower in Dwarka, Gujarat' },
  { place: 'Jamnagar', description: 'Ask Karwa about a ride to Jamnagar from Diu.', kind: 'Road beyond Diu', image: 'place-jamnagar.webp', alt: 'Lakhota Palace and Museum beside the lake in Jamnagar' },
  { place: 'Statue of Unity', description: 'Ask Karwa about a trip from Diu to the Statue of Unity.', kind: 'Road beyond Diu', image: 'place-statue-of-unity.webp', alt: 'The Statue of Unity beside the Narmada River' },
  { place: 'Pavagadh', description: 'Ask Karwa about a trip to Pavagadh.', kind: 'Road beyond Diu', image: 'place-pavagadh.webp', alt: 'Kalika Mata Temple on Pavagadh Hill' },
  { place: 'Ahmedabad ↔ Rajkot (pickup & drop)', description: 'Pickup and drop enquiries between Ahmedabad and Rajkot.', kind: 'Pickup & drop', image: 'route-ahmedabad-rajkot.webp', alt: 'Sabarmati Riverfront in Ahmedabad, for Ahmedabad–Rajkot pickup and drop enquiries', actionLabel: 'Ask about this route' },
  { place: 'Mumbai → Surat (drop)', description: 'Drop enquiry from Mumbai to Surat.', kind: 'Drop route', image: 'route-mumbai-surat.webp', alt: 'Cable bridge over the Tapi River in Surat, for Mumbai-to-Surat drop enquiries', actionLabel: 'Ask about this route' },
]
const destinationImageCredits = [
  { place: 'Diu', file: 'Diu,Gujarat,India (25).jpg', author: 'Srinath G M', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', source: 'https://commons.wikimedia.org/wiki/File:Diu,Gujarat,India_(25).jpg' },
  { place: 'Nagoa Beach', file: 'Nagoa beach 1 DIU.jpg', author: 'Sudhakar Kumawat', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Nagoa_beach_1_DIU.jpg' },
  { place: 'Diu Fort', file: 'Diu fort Diu india.jpg', author: 'Sumit Sharma', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', source: 'https://commons.wikimedia.org/wiki/File:Diu_fort_Diu_india.jpg' },
  { place: 'Gangeshwar Temple', file: 'Gangeshwar Temple,Diu.jpg', author: 'Prateekmalviya20', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', source: 'https://commons.wikimedia.org/wiki/File:Gangeshwar_Temple,Diu.jpg' },
  { place: 'INS Khukri Memorial', file: 'Model of INS Khukri at memorial of the ship, 2012.jpg', author: 'Archan dave', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', source: 'https://commons.wikimedia.org/wiki/File:Model_of_INS_Khukri_at_memorial_of_the_ship,_2012.jpg' },
  { place: 'Ghoghla Beach', file: 'Clean coast between Ghoghla and Khodighar Beach, Diu-20- 29.06.2021.jpg', author: 'SMarndi', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Clean_coast_between_Ghoghla_and_Khodighar_Beach,_Diu-20-_29.06.2021.jpg' },
  { place: 'St. Paul’s Church', file: 'StPaulsChurchDiu.jpg', author: 'Rajen.banerjee', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:StPaulsChurchDiu.jpg' },
  { place: 'Somnath', file: 'Somanath Temple.jpg', author: 'B. SurajPatro1997', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Somanath_Temple.jpg' },
  { place: 'Sasan Gir', file: 'Portrait of an Asiatic lion at Gir National Park 01.jpg', author: 'Rohit Sharma', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Portrait_of_an_Asiatic_lion_at_Gir_National_Park_01.jpg' },
  { place: 'Dwarka', file: 'Dwarkadheesh temple.jpg', author: 'Scalebelow', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', source: 'https://commons.wikimedia.org/wiki/File:Dwarkadheesh_temple.jpg' },
  { place: 'Jamnagar', file: 'Lakhota palace and museum sunrise nature.jpg', author: 'Anil Kausalyayan', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Lakhota_palace_and_museum_sunrise_nature.jpg' },
  { place: 'Statue of Unity', file: 'Statue of Unity - View from the other bank of Narmada.jpg', author: 'Pradeep717', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Statue_of_Unity_-_View_from_the_other_bank_of_Narmada.jpg' },
  { place: 'Pavagadh', file: 'Pavagadh, Kalika Mata Temple (9840241633).jpg', author: 'Arian Zwegers', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', source: 'https://commons.wikimedia.org/wiki/File:Pavagadh,_Kalika_Mata_Temple_(9840241633).jpg' },
  { place: 'Ahmedabad ↔ Rajkot (pickup & drop)', file: 'Sabarmati River Front - Ahmedabad, India.jpg', author: 'Emmanuel DYAN', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', source: 'https://commons.wikimedia.org/wiki/File:Sabarmati_River_Front_-_Ahmedabad,_India.jpg' },
  { place: 'Mumbai → Surat (drop)', file: 'Cable Bridge Surat, India.jpg', author: 'Pravega', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: 'https://commons.wikimedia.org/wiki/File:Cable_Bridge_Surat,_India.jpg' },
]
const faqs = [
  ['Is a booking request a confirmed reservation?', 'No. Karwa checks availability and confirms the final price with you on WhatsApp. Your reservation is confirmed only after Karwa gets back to you.'],
  ['What rides can I request?', 'You can request self-drive cars, car rentals, wedding car hire, outstation trips, bikes, and scooties. Availability is confirmed after you send a request.'],
  ['What are the bike and scooty rates?', 'Bike rentals are listed at ₹700 for 12 hours. Scooty rentals are listed at ₹600 for 12 hours.'],
  ['How do I request a ride?', 'Share your trip details in the booking form. It opens WhatsApp with your message ready for Karwa.'],
  ['Where can I read the booking and service terms?', 'Read the Booking Terms. Self-drive terms appear in the booking form when you select that service and must be accepted before you send the request.'],
]
const routeLinks = [['Privacy', '/privacy.html'], ['Cancellation', '/cancellation.html'], ['Refunds', '/refund.html'], ['Booking terms', '/terms.html']]

interface PageMeta { title: string; description: string; ogDescription?: string; twitterDescription?: string; robots: 'index,follow' | 'noindex,follow'; canonical: string }
const HOME_META: PageMeta = {
  title: 'Karwa Tours & Travels | Diu, your way',
  description: 'Explore Diu and plan your next journey with Karwa Tours & Travels. Browse car and two-wheeler rentals, wedding car hire and outstation trips.',
  robots: 'index,follow',
  ogDescription: 'Explore Diu and plan the road ahead with Karwa Tours & Travels.',
  twitterDescription: 'Explore Diu and plan the road ahead with Karwa Tours & Travels.',
  canonical: 'https://karwatours.com/',
}
function setMeta(selector: string, key: string, value: string, property = false) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(property ? 'property' : 'name', key)
    document.head.append(element)
  }
  element.content = value
}
function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    document.title = meta.title
    setMeta('meta[name="description"]', 'description', meta.description)
    setMeta('meta[name="robots"]', 'robots', meta.robots)
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = meta.canonical
    setMeta('meta[property="og:type"]', 'og:type', 'website', true)
    setMeta('meta[property="og:site_name"]', 'og:site_name', 'Karwa Tours & Travels', true)
    setMeta('meta[property="og:title"]', 'og:title', meta.title, true)
    setMeta('meta[property="og:description"]', 'og:description', meta.ogDescription ?? meta.description, true)
    setMeta('meta[property="og:url"]', 'og:url', meta.canonical, true)
    setMeta('meta[property="og:image"]', 'og:image', 'https://karwatours.com/assets/images/karwa-social-preview.jpg', true)
    setMeta('meta[property="og:image:width"]', 'og:image:width', '1200', true)
    setMeta('meta[property="og:image:height"]', 'og:image:height', '630', true)
    setMeta('meta[property="og:image:alt"]', 'og:image:alt', 'A coastal road scene created for Karwa Tours & Travels', true)
    setMeta('meta[name="twitter:card"]', 'twitter:card', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'twitter:title', meta.title)
    setMeta('meta[name="twitter:description"]', 'twitter:description', meta.twitterDescription ?? meta.description)
    setMeta('meta[name="twitter:image"]', 'twitter:image', 'https://karwatours.com/assets/images/karwa-social-preview.jpg')
  }, [meta.title, meta.description, meta.ogDescription, meta.twitterDescription, meta.robots, meta.canonical])
}
function Footer({ policy = false }: { policy?: boolean }) {
  return <footer className="bg-[#193247] px-6 py-12 text-white md:px-[max(1.5rem,calc((100vw-1200px)/2))]"><div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-8 md:flex-row md:items-end"><div><a href="/" className="flex items-center gap-3 font-black tracking-[.16em]"><img className="brand-logo rounded-lg bg-white p-1" src="/assets/images/karwa-logo-180.webp" alt="Karwa Tours & Travels logo"/><span>KARWA <small className="mt-1 block text-[.58rem] font-semibold tracking-[.24em] text-[#E79776]">TOURS &amp; TRAVELS</small></span></a><p className="mt-4 text-sm text-white/75">From Diu to the road ahead.<br/>Start with a ride that fits your plans.</p></div><a href={policy ? '/' : '#top'} className="text-sm hover:text-[#E79776]">{policy ? 'Home' : 'Back to top ↑'}</a></div><nav className="flex flex-wrap gap-x-6 gap-y-3 py-6 text-xs text-white/75" aria-label="Footer">{(policy ? routeLinks : [['Services','#services'],['Fleet','#fleet'],['Diu','#destination'],['Our story','#about'],['FAQs','#faq'],['Contact','#contact'],...routeLinks]).map(([label, href]) => <a key={label} href={href} className="transition-colors hover:text-white">{label}</a>)}</nav><p className="text-xs text-white/55">© 2026 Karwa Tours &amp; Travels{policy ? '' : '. All Rights Reserved.'}</p></footer>
}
function Header({ onBook }: { onBook: () => void }) {
  const [open, setOpen] = useState(false)
  return <header className="sticky top-0 z-50 border-b border-[#193247]/10 bg-white/95 px-5 text-[#193247] shadow-[0_4px_22px_rgba(25,50,71,.045)] backdrop-blur md:px-10"><div className="mx-auto flex max-w-[1280px] items-center justify-between py-3"><a href="#top" aria-label="Karwa Tours & Travels home" className="flex items-center gap-3"><img className="brand-logo rounded-lg" src="/assets/images/karwa-logo-180.webp" alt="Karwa Tours & Travels logo"/><span className="font-black tracking-[.16em]">KARWA <small className="mt-1 block text-[.55rem] font-semibold tracking-[.24em] text-[#67757B]">TOURS &amp; TRAVELS</small></span></a><button className="rounded-full p-2 text-[#193247] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D746F] md:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button><nav id="primary-navigation" className={`${open ? 'flex' : 'hidden'} absolute left-0 top-full w-full flex-col gap-5 border-b border-[#193247]/10 bg-white px-6 py-6 shadow-lg md:static md:flex md:w-auto md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>{[['About','#about'],['Services','#services'],['Our Fleet','#fleet'],['Destinations','#destinations'],['Contact','#contact']].map(([x,y])=><a onClick={()=>setOpen(false)} className="text-sm font-semibold text-[#193247]/80 transition-colors hover:text-[#4D746F]" key={x} href={y}>{x}</a>)}<Button size="sm" className="h-10 rounded-full px-5" onClick={()=>{setOpen(false);onBook()}}>Book a ride <ArrowUpRight size={15}/></Button></nav></div></header>
}
const initialBooking: BookingValues = {
  service: 'Car for Rent', vehicle: 'Innova', pickup: '', destination: '', date: '', returnDate: '',
  name: '', phone: '', message: '', termsAgreement: false,
}
const serviceForVehicle = (vehicle: string): Service => vehicle === 'Bike — ₹700 / 12 hours'
  ? 'Bikes on Rent — ₹700 / 12 hours'
  : vehicle === 'Scooty — ₹600 / 12 hours' ? 'Scooty on Rent — ₹600 / 12 hours' : 'Car for Rent'
const vehicleForFleetCard = (name: string, category: string): Vehicle => category === 'bike'
  ? 'Bike — ₹700 / 12 hours'
  : category === 'scooty' ? 'Scooty — ₹600 / 12 hours'
    : name === 'Force Urbania' ? 'Force Urbania — 16 Seater' : name as Vehicle

function FieldError({ children }: { children?: string }) {
  return children ? <p className="mt-1 text-sm text-red-700" role="alert">{children}</p> : null
}

function Home() {
  usePageMeta(HOME_META)
  const [values, setValues] = useState<BookingValues>(initialBooking)
  const [step, setStep] = useState<1 | 2>(1)
  const [errors, setErrors] = useState<BookingErrors>({})
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const today = getIndiaLocalDate()

  useEffect(() => {
    const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]')]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      document.documentElement.classList.remove('motion-ready')
      elements.forEach((element) => element.classList.add('is-revealed'))
      return
    }
    document.documentElement.classList.add('motion-ready')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    elements.forEach((element) => observer.observe(element))
    return () => {
      observer.disconnect()
      document.documentElement.classList.remove('motion-ready')
    }
  }, [])

  useEffect(() => {
    if (!bookingOpen) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBookingOpen(false)
    }
    document.addEventListener('keydown', dismissOnEscape)
    window.setTimeout(() => document.querySelector<HTMLElement>('#bookingForm select')?.focus(), 0)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', dismissOnEscape)
      previouslyFocused?.focus()
    }
  }, [bookingOpen])

  const update = (field: BookingField, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSummary('')
    setStatus('')
  }
  const updateService = (service: string) => {
    update('service', service)
    update('vehicle', '')
  }
  const chooseVehicle = (name: string, category: string) => {
    const vehicle = vehicleForFleetCard(name, category)
    const currentServiceAccepts = getVehiclesForService(values.service).includes(vehicle)
    const nextService = currentServiceAccepts ? values.service as Service : serviceForVehicle(vehicle)
    setValues((current) => ({ ...current, service: nextService, vehicle }))
    setErrors({})
    setSummary('')
    setStatus('')
    setStep(1)
    setBookingOpen(true)
  }
  const chooseDestination = (destination: string) => {
    setValues((current) => ({ ...current, destination }))
    setStep(1)
    setErrors({})
    setSummary('')
    setStatus('')
    setBookingOpen(true)
  }
  const handleNext = () => {
    const nextErrors = validateJourney(values, today)
    setErrors(nextErrors)
    const hasErrors = Object.keys(nextErrors).length > 0
    setSummary(hasErrors ? 'Please review the highlighted fields.' : '')
    if (!hasErrors) {
      setStep(2)
      setTimeout(() => document.querySelector<HTMLElement>('[data-step-two-title]')?.focus(), 0)
    }
  }
  const handleBack = () => { setStep(1); setErrors({}); setSummary('') }
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateBooking(values, today)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setSummary('Please review the highlighted fields.')
      return
    }
    setSummary('')
    setStatus('')
    const digits = WHATSAPP_NUMBER.replace(/\D/g, '')
    if (!/^\d{8,15}$/.test(digits)) {
      setStatus('WhatsApp booking is temporarily unavailable. Please call Karwa directly.')
      return
    }
    const message = `Hello Karwa Tours & Travels, I would like to request a ride.\n\nName: ${values.name.trim()}\nPhone: ${values.phone.trim()}\nService: ${values.service}\nPreferred vehicle: ${values.vehicle}\nPickup: ${values.pickup.trim()}\nDestination: ${values.destination.trim() || 'Not specified'}\nTravel date: ${values.date}\nReturn date: ${values.returnDate || 'Not specified'}\nAdditional details: ${values.message.trim() || 'None'}${values.service === 'Self Drive Cars' ? `\nSelf-drive terms: Accepted` : ''}\n\nI understand this is a booking request, not a confirmed reservation. Please confirm availability and final price. Thank you.`
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setStatus('Your message is ready in WhatsApp. Send it there so Karwa can check availability and confirm the final price. This request is not a confirmed reservation.')
  }
  const fieldClass = 'mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

  return <><Header onBook={()=>setBookingOpen(true)}/><main>
    <section id="top" className="hero-shell bg-white px-6 pb-10 pt-14 text-[#193247] md:pb-14 md:pt-20">
      <div className="mx-auto max-w-[1040px] text-center">
        <p className="eyebrow">DIU, GUJARAT · KARWA TOURS &amp; TRAVELS</p>
        <h1 className="hero-title display mx-auto mt-5 max-w-4xl text-6xl md:text-8xl">Your road,<br/><em>your way.</em></h1>
        <p className="hero-subtitle mx-auto mt-5 max-w-2xl text-base leading-7 text-[#67757B] md:text-lg md:leading-8">Make more of your time in Diu. Find a ride for a local day out, a longer journey, or the plans in between.</p>
        <div className="hero-actions mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={()=>{setBookingOpen(true);setStep(1)}} className="h-12 rounded-full px-6">Book your ride <ArrowUpRight size={17}/></Button>
          <Button asChild variant="outline" className="h-12 rounded-full border-[#193247]/25 bg-white px-6 text-[#193247] hover:bg-[#F0ECE4]"><a href="#fleet">Explore the fleet <ArrowRight size={17}/></a></Button>
        </div>
        <div className="hero-highlights mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-xs font-semibold tracking-wide text-[#67757B]">
          <span className="flex items-center gap-2"><Check className="text-[#4D746F]" size={16}/> Local rides in Diu</span>
          <span className="flex items-center gap-2"><Check className="text-[#4D746F]" size={16}/> Cars, bikes and scooties</span>
          <span className="flex items-center gap-2"><MessageCircle className="text-[#4D746F]" size={16}/> Confirm details on WhatsApp</span>
        </div>
      </div>
      <div className="hero-photo relative mx-auto mt-10 min-h-[280px] max-w-[1200px] overflow-hidden rounded-[1.5rem] bg-[#F0ECE4] md:mt-12 md:min-h-[450px]">
        <img className="absolute inset-0 h-full w-full object-cover" src="/assets/images/karwa-coastal-hero.webp" alt="Illustrative coastal road inspired by Diu" fetchPriority="high"/>
        <div className="absolute inset-0 bg-gradient-to-t from-[#193247]/35 via-transparent to-transparent"/>
        <span className="image-caption">Diu · illustrative scene</span>
        <div className="absolute bottom-5 right-5 max-w-[240px] rounded-xl bg-white/95 p-4 text-[#193247] shadow-lg backdrop-blur">
          <span className="eyebrow">START HERE</span><p className="mt-1 font-bold">A ride for the day you have in mind.</p>
        </div>
      </div>
    </section>
    <div className="ticker" aria-label="Karwa travel options"><div className="ticker-track" aria-hidden="true">{[0,1].map((group)=><div key={group} className="ticker-group">{['Car for Rent','Self Drive Cars','Outstation Trips','Wedding Car Hire','Bikes on Rent','Scooty on Rent'].map((item)=><span key={item}>{item}<b>✳</b></span>)}</div>)}</div></div>
    <section id="about" data-reveal className="section-pad grid items-center gap-10 md:grid-cols-[.9fr_1.1fr]">
      <div><p className="eyebrow">A WARM WELCOME TO DIU</p><h2 className="display mt-3 text-5xl md:text-6xl">Start with a plan.<br/><em>Leave room to roam.</em></h2><p className="mt-5 max-w-xl leading-7 text-muted-foreground">Karwa Tours &amp; Travels helps you find a ride for your time in Diu and the road beyond. Tell us where you want to go; Karwa will check availability and confirm the final price with you on WhatsApp.</p><button type="button" onClick={()=>setBookingOpen(true)} className="mt-6 inline-flex items-center gap-2 font-bold text-[#193247] hover:text-[#4D746F]">Talk through your plans <ArrowRight size={17}/></button></div>
      <figure className="relative min-h-[310px] overflow-hidden rounded-2xl bg-[#F0ECE4]"><img className="absolute inset-0 h-full w-full object-cover" src="/assets/images/karwa-diu-story.webp" alt="Travelers beside their car overlooking Diu Fort and the Arabian Sea" loading="lazy"/><figcaption className="image-caption">A ride, then room to explore</figcaption></figure>
    </section>
    <section id="services" data-reveal className="section-pad bg-[#F0ECE4]">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">WAYS TO TRAVEL WITH KARWA</p><h2 className="display mt-3 text-5xl md:text-6xl">Pick your kind<br/><em>of journey.</em></h2></div><p className="max-w-md leading-7 text-muted-foreground">Choose a service to explore. Share your trip details and Karwa will confirm the options available for your dates.</p></div>
      <div className="grid gap-5 sm:grid-cols-2">{services.map(([tag,title,desc,image])=><Card key={title} className="service-card group overflow-hidden border-0 shadow-sm"><div className="service-photo relative"><img className="h-56 w-full object-cover" src={'/assets/images/'+image} alt={title+' in Diu'} loading="lazy"/><span className="image-caption">{tag}</span></div><CardContent className="p-6"><h3 className="display text-3xl">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{desc}</p><button type="button" onClick={()=>{setBookingOpen(true);setStep(1)}} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#193247] hover:text-[#4D746F]">Ask about this service <ArrowRight size={16}/></button></CardContent></Card>)}</div>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">Availability and final price are confirmed by Karwa. Sending a request does not confirm a reservation.</p>
    </section>
    <section id="fleet" data-reveal className="section-pad">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">THE KARWA FLEET</p><h2 className="display mt-3 text-5xl md:text-6xl">Meet your<br/><em>ride options.</em></h2></div><p className="max-w-md leading-7 text-muted-foreground">Browse all listed vehicles. Vehicle images are illustrative concepts. Choose one to include it in your WhatsApp request.</p></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{fleet.map(([name,category,image])=><Card key={name} className="fleet-card overflow-hidden border border-[#193247]/10 shadow-sm"><div className="fleet-photo relative"><img src={'/assets/images/'+image} alt={'Illustrative vehicle concept: '+name} loading="lazy"/><span className="image-caption">Illustrative concept</span></div><CardContent className="flex min-h-[112px] items-center justify-between gap-3 p-5"><div><h3 className="display text-2xl">{name}</h3>{name==='Force Urbania'&&<p className="mt-1 text-sm text-muted-foreground">16 Seater</p>}{category==='bike'&&<p className="mt-1 text-sm font-semibold text-[#4D746F]">₹700 / 12 hours</p>}{category==='scooty'&&<p className="mt-1 text-sm font-semibold text-[#4D746F]">₹600 / 12 hours</p>}</div><Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={()=>chooseVehicle(name,category)}>Choose <ArrowUpRight size={14}/></Button></CardContent></Card>)}</div>
      <p className="mt-5 text-xs text-muted-foreground">Rates shown are those listed for bike and scooty rentals. Ask Karwa to confirm all other prices and availability.</p>
    </section>
    <section id="destination" data-reveal className="grid bg-[#193247] text-white md:grid-cols-2">
      <div className="relative min-h-[360px]"><img className="absolute inset-0 h-full w-full object-cover" src="/assets/images/karwa-coastal-hero.webp" alt="Illustrative coastal road at sunset" loading="lazy"/><span className="image-caption">Diu · illustrative scene</span></div>
      <div className="flex flex-col justify-center px-7 py-14 md:px-16"><p className="eyebrow text-[#91B8AA]">MAKE A DAY OF DIU</p><h2 className="display mt-3 text-5xl md:text-6xl">The coast is<br/><em>Diu’s own.</em></h2><p className="mt-5 max-w-lg leading-7 text-white/75">From time by the water to the island’s familiar roads, shape a day that feels like yours. Start with the ride you need; confirm your plans directly with Karwa.</p><button type="button" onClick={()=>setBookingOpen(true)} className="mt-6 inline-flex items-center gap-2 self-start font-bold text-white hover:text-[#91B8AA]">Plan with Karwa <ArrowRight size={17}/></button></div>
    </section>
    <section data-reveal className="section-pad">
      <div className="mb-10 max-w-2xl"><p className="eyebrow">FROM HELLO TO ON YOUR WAY</p><h2 className="display mt-3 text-5xl md:text-6xl">A clear start.<br/><em>A human reply.</em></h2><p className="mt-4 leading-7 text-muted-foreground">No online payment or account needed. Send your details through WhatsApp and let Karwa confirm what is available.</p></div>
      <ol className="grid gap-7 sm:grid-cols-3">{[['01','Choose a ride','Browse services and the full list of vehicles.'],['02','Share your trip','Add your contact, pickup and date details to the form.'],['03','Confirm on WhatsApp','Review your message and send it to Karwa. Availability and final price are confirmed in the reply.']].map(([num,title,body])=><li key={num} className="border-t-2 border-[#4D746F] pt-5"><span className="eyebrow">{num}</span><h3 className="display mt-3 text-2xl">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></li>)}</ol>
    </section>
    <section id="faq" data-reveal className="section-pad bg-[#F0ECE4]"><div className="grid gap-10 md:grid-cols-[.7fr_1.3fr]"><div><p className="eyebrow">GOOD TO KNOW</p><h2 className="display mt-3 text-5xl">A few things,<br/><em>answered.</em></h2><p className="mt-4 text-muted-foreground">Need another detail? Reach Karwa directly and ask.</p><a className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#193247]" href="#contact">Contact Karwa <ArrowRight size={16}/></a></div><div className="divide-y divide-[#DED8CD]">{faqs.map(([q,a])=><details key={q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<ChevronDown className="shrink-0 transition group-open:rotate-180" size={18}/></summary><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{a}</p></details>)}</div></div></section>
    <section id="destinations" data-reveal className="section-pad destinations-section scroll-mt-24 bg-[#F0ECE4]"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">PLACES TO GO</p><h2 className="display mt-3 text-5xl md:text-6xl">Where to <em>next?</em></h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">From Diu’s coastline and landmarks to longer journeys and city connections, choose a place or route to ask about.</p></div><div className="destination-rail grid snap-x grid-flow-col auto-cols-[minmax(250px,82%)] gap-4 overflow-x-auto pb-4 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-5" aria-label="Suggested places and routes">{destinations.map(({place,description,kind,image,alt,actionLabel},index)=><article key={place} className="destination-card group relative flex min-h-[350px] snap-start flex-col overflow-hidden rounded-2xl border border-[#193247]/10 bg-white shadow-sm sm:min-w-0"><div className="destination-photo relative h-40 shrink-0 overflow-hidden"><img className="h-full w-full object-cover" src={'/assets/images/'+image} alt={alt} loading="lazy"/><span className="destination-kind absolute bottom-3 left-3">{kind}</span><span className="destination-number absolute right-3 top-3">{String(index+1).padStart(2,'0')}</span></div><div className="flex flex-1 flex-col p-5"><h3 className="display text-2xl leading-tight">{place}</h3><p className="mt-3 min-h-[4rem] text-sm leading-6 text-muted-foreground">{description}</p><button type="button" onClick={()=>chooseDestination(place)} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[#193247] transition-colors hover:text-[#B95536]">{actionLabel || 'Ask about this place'} <ArrowUpRight size={15}/></button></div></article>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Local places are visitor suggestions, not a promise that a ride is available. Somnath, Sasan Gir and Dwarka are listed in the current self-drive route terms. Other long-distance places and city routes are requests only. Confirm route, availability and fare with Karwa.</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2"><a className="inline-flex text-xs font-semibold text-[#4D746F] underline decoration-[#4D746F]/40 underline-offset-4 hover:text-[#193247]" href="https://diu.gov.in/tourist-places/" target="_blank" rel="noreferrer">See the Diu District visitor places list <ArrowUpRight size={13}/></a><a className="inline-flex text-xs font-semibold text-[#4D746F] underline decoration-[#4D746F]/40 underline-offset-4 hover:text-[#193247]" href="/photo-credits.html">Photo credits <ArrowUpRight size={13}/></a></div></section>
    <section id="contact" data-reveal className="section-pad grid gap-10 bg-white md:grid-cols-2"><div><p className="eyebrow">YOUR NEXT JOURNEY STARTS HERE</p><h2 className="display mt-3 text-5xl md:text-6xl">Let’s <em>plan your ride.</em></h2><p className="mt-4 text-muted-foreground">Share the plan with Karwa and get a personal reply.</p><button type="button" onClick={()=>setBookingOpen(true)} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#D86C45] px-6 font-bold text-[#101820] hover:bg-[#E79776]">Book on WhatsApp <MessageCircle size={17}/></button></div><div className="flex flex-col justify-center gap-4"><span className="eyebrow">REACH KARWA</span><a className="flex items-center gap-3 hover:text-[#4D746F]" href="tel:+918140057861"><Phone size={17}/>+91 81400 57861</a><a className="flex items-center gap-3 hover:text-[#4D746F]" href="tel:+919723087861"><Phone size={17}/>+91 97230 87861</a><a className="flex items-center gap-3 hover:text-[#4D746F]" href="mailto:mansurimakhdum098@gmail.com"><Mail size={17}/>mansurimakhdum098@gmail.com</a><p className="flex items-center gap-3"><MapPin size={17}/>Diu District - 362520</p></div></section>
  </main>
  {bookingOpen&&<div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#193247]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setBookingOpen(false)}}><section role="dialog" aria-modal="true" aria-labelledby="bookingDialogTitle" className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 text-[#193247] shadow-2xl sm:rounded-3xl sm:p-8"><div className="mb-6 flex items-start justify-between gap-5"><div><p className="eyebrow">A FEW DETAILS, THEN WE’LL TAKE IT FROM HERE</p><h2 id="bookingDialogTitle" className="display mt-2 text-3xl sm:text-4xl">Plan your ride.</h2><p className="mt-2 text-sm text-muted-foreground">Your request opens in WhatsApp. Karwa will confirm availability and final price.</p></div><button type="button" aria-label="Close booking form" className="rounded-full p-2 hover:bg-[#F0ECE4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D746F]" onClick={()=>setBookingOpen(false)}><X size={21}/></button></div>
    <form id="bookingForm" noValidate onSubmit={handleSubmit} className="space-y-5">
      {step===1?<section aria-labelledby="stepOneTitle"><h3 id="stepOneTitle" className="sr-only">Your journey details</h3><div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Service <span className="text-red-700">Required</span><select className={fieldClass} value={values.service} onChange={(event)=>updateService(event.target.value)} aria-invalid={Boolean(errors.service)}>{SERVICES.map((service)=><option key={service} value={service}>{service}</option>)}</select><FieldError>{errors.service}</FieldError></label>
        <label className="block text-sm font-semibold">Preferred vehicle <span className="text-red-700">Required</span><select className={fieldClass} value={values.vehicle} onChange={(event)=>update('vehicle',event.target.value)} aria-invalid={Boolean(errors.vehicle)}><option value="">Choose a vehicle</option>{getVehiclesForService(values.service).map((vehicle)=><option key={vehicle} value={vehicle}>{vehicle}</option>)}</select><FieldError>{errors.vehicle}</FieldError></label>
        <label className="block text-sm font-semibold">Pickup location <span className="text-red-700">Required</span><input className={fieldClass} value={values.pickup} maxLength={100} autoComplete="street-address" onChange={(event)=>update('pickup',event.target.value)} aria-invalid={Boolean(errors.pickup)}/><FieldError>{errors.pickup}</FieldError></label>
        <label className="block text-sm font-semibold">Destination <span className="text-muted-foreground">Optional</span><input className={fieldClass} value={values.destination} maxLength={100} onChange={(event)=>update('destination',event.target.value)} aria-invalid={Boolean(errors.destination)}/><FieldError>{errors.destination}</FieldError></label>
        <label className="block text-sm font-semibold">Travel date <span className="text-red-700">Required</span><input className={fieldClass} type="date" value={values.date} min={today} onChange={(event)=>update('date',event.target.value)} aria-invalid={Boolean(errors.date)}/><FieldError>{errors.date}</FieldError></label>
        <label className="block text-sm font-semibold">Return date <span className="text-muted-foreground">Optional</span><input className={fieldClass} type="date" value={values.returnDate} min={values.date||today} onChange={(event)=>update('returnDate',event.target.value)} aria-invalid={Boolean(errors.returnDate)}/><FieldError>{errors.returnDate}</FieldError></label>
      </div><Button type="button" className="mt-5 w-full rounded-full" onClick={handleNext}>Continue to your details <ArrowRight size={16}/></Button></section>:<section aria-labelledby="stepTwoTitle"><h3 id="stepTwoTitle" data-step-two-title tabIndex={-1} className="display mb-4 text-2xl">Who’s travelling?</h3><div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Your name <span className="text-red-700">Required</span><input className={fieldClass} value={values.name} maxLength={70} autoComplete="name" onChange={(event)=>update('name',event.target.value)} aria-invalid={Boolean(errors.name)}/><FieldError>{errors.name}</FieldError></label>
        <label className="block text-sm font-semibold">Phone number <span className="text-red-700">Required</span><input className={fieldClass} type="tel" value={values.phone} maxLength={20} inputMode="tel" autoComplete="tel" onChange={(event)=>update('phone',event.target.value)} aria-invalid={Boolean(errors.phone)}/><FieldError>{errors.phone}</FieldError></label>
        <label className="block text-sm font-semibold sm:col-span-2">Anything else we should know? <span className="text-muted-foreground">Optional</span><textarea className={fieldClass} value={values.message} maxLength={300} rows={3} onChange={(event)=>update('message',event.target.value)} aria-invalid={Boolean(errors.message)}/><FieldError>{errors.message}</FieldError></label>
        {values.service==='Self Drive Cars'&&<section className="rounded-xl border border-[#DED8CD] bg-[#F0ECE4] p-4 sm:col-span-2" aria-labelledby="selfDriveTitle"><p className="text-xs font-bold tracking-wide">{SELF_DRIVE_TERMS.brand}</p><h4 id="selfDriveTitle" className="mt-2 font-bold">{SELF_DRIVE_TERMS.title}</h4><p className="mt-1 text-sm">{SELF_DRIVE_TERMS.route}</p><h5 className="mt-4 font-semibold">{SELF_DRIVE_TERMS.heading}</h5><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6">{SELF_DRIVE_TERMS.items.map(term=><li key={term}>{term}</li>)}</ol><p className="mt-3 text-sm font-semibold">{SELF_DRIVE_TERMS.thankYou}</p><label className="mt-4 flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={values.termsAgreement} onChange={(event)=>update('termsAgreement',event.target.checked)}/><span>{SELF_DRIVE_TERMS.agreement} <span className="text-red-700">Required</span></span></label><FieldError>{errors.termsAgreement}</FieldError></section>}
      </div><div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button type="button" variant="outline" className="rounded-full" onClick={handleBack}>← Back</Button><Button type="submit" className="rounded-full">Continue to WhatsApp <MessageCircle size={16}/></Button></div></section>}
      <p className="text-sm font-semibold text-red-700" aria-live="assertive">{summary}</p><p className="text-sm text-[#193247]" role="status" aria-live="polite">{status}</p>
      <p className="border-t border-[#DED8CD] pt-4 text-xs leading-5 text-muted-foreground">A booking request is not a confirmed reservation. Availability and final price are confirmed by Karwa. Review our <a className="underline" href="/terms.html">Booking Terms</a>, <a className="underline" href="/privacy.html">Privacy Policy</a>, <a className="underline" href="/cancellation.html">Cancellation Policy</a> and <a className="underline" href="/refund.html">Refund Policy</a>.</p>
    </form></section></div>}
  <Footer/></>

}
function PolicyPage({ kind }: { kind: PolicyKey }) {
  const page = policies[kind]
  usePageMeta({ title: page.title, description: page.description, robots: 'noindex,follow', canonical: `https://karwatours.com/${kind==='terms'?'terms':kind}.html` })
  return <><header className="border-b border-border bg-background px-6 py-5"><div className="mx-auto flex max-w-4xl items-center justify-between"><a href="/" className="font-black tracking-[.15em]">KARWA <span className="block text-[.55rem] tracking-[.2em] text-primary">TOURS &amp; TRAVELS</span></a><a href="/" className="text-sm text-primary">Home</a></div></header><main className="min-h-[70vh] px-6 py-16"><article className="mx-auto max-w-3xl"><p className="eyebrow">KARWA TOURS &amp; TRAVELS</p><h1 className="display mt-3 text-5xl">{page.title.split(' |')[0]}</h1><div className="mt-10 space-y-8">{page.blocks.map((block,i)=><section key={i}>{block.heading&&<h2 className={`mb-3 text-lg font-bold ${block.heading.toLowerCase().includes('owner')?'text-[#9c582f]':''}`}>{block.heading}</h2>}{block.text&&<p className="leading-8 text-[#384953]">{block.text}</p>}{block.list&&<ul className="list-disc space-y-2 pl-6 leading-7 text-[#384953]">{block.list.map(item=><li key={item}>{item}</li>)}</ul>}</section>)}</div></article></main><Footer policy/></>
}
function PhotoCredits() {
  usePageMeta({ title: 'Destination Photo Credits | Karwa Tours & Travels', description: 'Photographer and license credits for the destination photographs on Karwa Tours & Travels.', robots: 'noindex,follow', canonical: 'https://karwatours.com/photo-credits.html' })
  return <><header className="border-b border-border bg-background px-6 py-5"><div className="mx-auto flex max-w-4xl items-center justify-between"><a href="/" className="font-black tracking-[.15em]">KARWA <span className="block text-[.55rem] tracking-[.2em] text-primary">TOURS &amp; TRAVELS</span></a><a href="/" className="text-sm text-primary">Home</a></div></header><main className="min-h-[70vh] px-6 py-16"><article className="mx-auto max-w-5xl"><p className="eyebrow">IMAGE ATTRIBUTION</p><h1 className="display mt-3 text-5xl">Destination photo credits</h1><p className="mt-5 max-w-3xl leading-7 text-muted-foreground">These destination and route photographs are from Wikimedia Commons. Each image is resized and converted to WebP for this site, then cropped to fit its card. The individual image files remain available under the license shown beside each source.</p><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{destinations.map(({place,image,alt},index)=>{const credit=destinationImageCredits[index];return <article key={place} className="overflow-hidden rounded-2xl border border-border bg-white"><img className="h-40 w-full object-cover" src={'/assets/images/'+image} alt={alt} loading="lazy"/><div className="space-y-2 p-4"><h2 className="display text-xl">{place}</h2><p className="text-xs leading-5 text-muted-foreground">{credit.file}<br/>Photo: {credit.author}</p><p className="text-xs">Licensed under <a className="font-semibold text-[#4D746F] underline" href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a></p><a className="inline-flex items-center gap-1 text-xs font-semibold text-[#193247] underline" href={credit.source} target="_blank" rel="noreferrer">View original on Wikimedia Commons <ArrowUpRight size={12}/></a></div></article>})}</div></article></main><Footer policy/></>
}
function SimpleShell({ type }: { type: 'reset'|'admin-login'|'admin' }) {
  const title = type==='reset'?'Reset password | Karwa Tours & Travels':type==='admin-login'?'Karwa Tours & Travels | Admin sign in':'Karwa Tours & Travels | Admin'
  const description = type==='reset'?'Reset your password on Karwa Tours & Travels.':type==='admin-login'?'Sign in to the Karwa Tours & Travels admin area.':'Karwa Tours & Travels administration page.'
  const route = type==='reset'?'reset-password.html':type==='admin-login'?'admin-login.html':'admin.html'
  usePageMeta({ title, description, robots: 'noindex,follow', canonical: `https://karwatours.com/${route}` })
  return <main className="grid min-h-screen place-items-center bg-[#193247] px-6"><Card className="w-full max-w-lg"><CardContent className="p-10"><a href="/" className="font-black tracking-[.15em] text-primary">KARWA TOURS &amp; TRAVELS</a><h1 className="display mt-8 text-4xl">{type==='reset'?'Reset password':type==='admin-login'?'Admin sign in':'Admin'}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{type==='reset'?'Password reset page shell. Account recovery will be added in a later step.':type==='admin-login'?'Staff sign-in shell. Authentication will be added in a later step.':'Admin dashboard shell. Admin features will be added in a later step.'}</p></CardContent></Card></main>
}
export default function App() {
  const path = window.location.pathname
  if (path === '/terms.html') return <PolicyPage kind="terms"/>
  if (path === '/privacy.html') return <PolicyPage kind="privacy"/>
  if (path === '/cancellation.html') return <PolicyPage kind="cancellation"/>
  if (path === '/refund.html') return <PolicyPage kind="refund"/>
  if (path === '/photo-credits.html') return <PhotoCredits/>
  if (path === '/reset-password.html') return <SimpleShell type="reset"/>
  if (path === '/admin-login.html') return <SimpleShell type="admin-login"/>
  if (path === '/admin.html') return <SimpleShell type="admin"/>
  return <Home/>
}
