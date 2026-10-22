# Karwa Tours & Travels

A responsive single-page website concept for a local travel and vehicle-rental service in Diu. Visitors can browse the fleet and services, choose a vehicle, and prepare a booking enquiry.

## Features

- Fleet and service sections for car rentals, self-drive, outstation travel, weddings, and bike rentals.
- Booking form for contact details, vehicle, pickup, destination, dates, and a message.
- Basic phone and return-date validation in the browser.
- Fleet buttons preselect the chosen vehicle in the booking form.
- Submitting the form opens WhatsApp with a prefilled enquiry for the visitor to review and send.
- Responsive navigation and locally stored images, CSS, and JavaScript.

## Project type and booking flow

This is a static HTML, CSS, and JavaScript frontend. It does not include a server, booking API, database, or server-side booking storage. The form prepares a WhatsApp message; the visitor must send it in WhatsApp to contact the business. It is a frontend prototype, not an online reservation system.

## Run locally

Clone the repository and serve the files from its root with any static web server. For example, with Python installed:

```bash
git clone https://github.com/Vyom108/karwa.git
cd karwa
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). You can also open `index.html` directly, though a local server is recommended for browser behavior.

## Project structure

- `index.html` — page content and booking form
- `css/` — layout and custom styling
- `js/main.js` — form validation, fleet selection, and WhatsApp handoff
- `js/date-local.js`, `js/bikes.js` — date and bike-related behavior
- `assets/images/` — logo, fleet, and service imagery
