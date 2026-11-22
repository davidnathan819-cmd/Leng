# GlamBook — Salon Appointment Management System

## Project overview
GlamBook is a responsive front-end salon appointment management prototype built with HTML, CSS, and vanilla JavaScript. It uses browser LocalStorage to retain appointment and service records after refreshing the page.

## Files
- `index.html` — page structure and sections
- `style.css` — responsive layout and visual design
- `script.js` — booking workflow, validation, records, admin functions, and LocalStorage

## How to run
1. Extract the ZIP file.
2. Keep `index.html`, `style.css`, and `script.js` in the same folder.
3. Open `index.html` in a modern browser (Chrome, Edge, Firefox, or Safari).
4. For a more consistent local test environment, open the folder using VS Code Live Server.

No database, backend, package installation, or build step is required. An internet connection is only needed to load the optional Google Fonts; the system itself works without them.

## Demo admin account
- Username: `admin`
- Password: `glam123`

Change these demo credentials in `script.js` before presenting if your instructor requires different credentials. This is a classroom prototype; the credentials are stored in client-side code and are not secure for a real business.

## Main features
- Customer appointment form with required-field and format validation
- Service selection and live price/duration summary
- Date validation and available time slots
- Prevents duplicate active bookings for the same date and time in the same browser
- Booking reference number and confirmation details
- My Bookings search, details, status filter, and cancellation
- Admin dashboard with appointment counts and status updates
- Admin service add, edit, and delete
- Confirmation prompts before cancellation and deletion
- LocalStorage persistence and responsive layouts

## Scope and limitations
- Data is saved only in the current browser profile on the current device. It does not synchronize between phones, tablets, or computers.
- Clearing browser site data can remove saved records.
- Admin sign-in is a demonstration-only front-end gate, not secure authentication.
- Payments, email, SMS, and push notifications are simulated/not integrated.
- Availability is checked against records stored in the same browser only.
- No real customer personal information should be entered into this classroom prototype.

## Suggested ZIP filename
`Section_Name_GlamBook.zip`
