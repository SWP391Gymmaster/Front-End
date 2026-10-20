# FE1 — Auth & Public API handoff

## Public routes

- `#/home` shows the public introduction, disciplines, and active packages.
- `#/classes` asks anonymous visitors to sign in; the public page does not call the protected class API.
- `#/register` creates only an account. After the backend sends an OTP, the frontend opens a dialog and waits for verification. It does not save a JWT or sign in first.
- `#/login` uses the existing JWT login flow.
- `#/verify` links back to registration; OTP is entered in the dialog shown after registration.

## Registration and OTP API

| Route | Contract | Frontend behavior |
|---|---|---|
| `POST /auth/register` | `{userName,fullName,email,password,phone}` → `{status:"sent",email}` | Open OTP dialog; no session is created |
| `POST /auth/verify-email` | `{email,otp}` → `{status:"verified"\|"expired"\|"invalid"\|"locked",email}` | Only `verified` completes signup |
| `POST /auth/resend-otp` | `{email}` → `{status:"sent",email}` | Resend from dialog; backend rate limits to one per minute |
| `POST /auth/login` | Email/password → JWT response | Existing shared session logic; unverified users receive 403 |

BE sends the code using Gmail SMTP. It stores a BCrypt hash in `email_verification_otps`, expires the code after 10 minutes, locks after five invalid attempts, and removes the OTP after success. New users have `email_verified=false`; existing accounts default to verified. Set `GMAIL_USERNAME` and `GMAIL_APP_PASSWORD` in the backend process environment. See [Gmail OTP setup](../../Back-End/docs/GMAIL_OTP_SETUP.md). Do not commit the Gmail App Password.

## Other API contracts and validation

Active packages use anonymous `GET /api/membership-packages`. Class sessions are still fetched only inside authenticated role views (`/api/member/class-sessions/available` for members; protected `/api/classes` for staff).

FE validates username 3–50 ASCII letters/digits/underscore/dot; full name 2–100 characters; email format; phone as 10 digits starting 0; password as 8–72 UTF-8 bytes with uppercase/lowercase/digit/special character and no whitespace; and exact confirm match. BE currently validates required username/fullName, email format and password minimum length; phone and confirm password still need equivalent Bean Validation on BE. FE validation is not a security boundary.

The assignment's Thymeleaf controllers describe a Spring MVC design; this repository uses React + REST. Registration continues to be separate from package purchase and class enrollment.

## Verification limits

Browser contract scripts mock HTTP responses, including OTP; they do not send real Gmail or create production accounts. Real delivery must be demonstrated with Gmail SMTP configured in the backend environment. The backend's `ddl-auto=update` adds the verification column/table; do not re-import MySQL.
