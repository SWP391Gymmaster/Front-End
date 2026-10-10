# Member portal integration

Integrated on top of main without replacing Manager, Receptionist, Coach or revenue/report pages.

- Member package selection (bank transfer, VNPay, MoMo, credit card; no cash option).
- Pending payment creation, payment/invoice details and explicitly labelled simulated online payment.
- Personal class enrollment/cancellation, weekly timetable, overlap checks and automatic refresh.
- Membership dates and seven-day expiry notices from server data.
- Cloudinary avatar upload; avatar URL remains browser-local until BE supports profiles.
- Vietnamese/English and light/dark controls within the Member portal.

Authentication stays in main's StoreProvider and gm-session storage. MemberProvider adapts that session to the member services; logout and unauthorized responses clear the shared session. Registration opens package selection. Staff menus and their API services remain unchanged.

Run MySQL/BE on port 8080, then npm install and npm run dev. VITE_API_URL defaults to /backend; BACKEND_URL controls Vite's backend proxy. Copy .env.example to .env.local for local Cloudinary settings; never commit real credentials. Cloudinary signing is available only during local Vite development, not a production authenticated upload endpoint.

Checks: npm run lint, npm run test:api, npm run test:payments, npm run test:avatar, npm run build. Tests use mocked HTTP and do not create real transactions.

Online payments are still simulated: no real gateway or bank callback is configured. A pending checkout alone does not activate membership. Existing cash records remain visible; reception retains cash collection.
