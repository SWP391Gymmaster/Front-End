# FE1 — Auth & Public API handoff

## Public routes

- `#/home` shows the public introduction, disciplines, and active packages.
- `#/classes` asks anonymous visitors to sign in; the public page does not call the protected class API.
- `#/register` creates only an account. It opens an email instruction modal after BE reports verification is required. It does not save a JWT or sign in first.
- `#/login` uses the existing JWT login flow.
- `/verify-email?token=...` is the email link destination. FE posts its token to BE and renders success or failure/expiry.

## Registration and email verification API

| Route | Contract | Frontend behavior |
|---|---|---|
| `POST /auth/register` | `{userName,fullName,email,password,phone}` → `{userId,email,verificationRequired,verificationEmailStatus,message}` | Show email instructions; no session is created |
| `POST /auth/verify-email` | `{token}` → `{message}` | Show successful verification, or BE error such as invalid/expired link |
| `POST /auth/resend-verification` | `{email}` → `{message}` | Request another verification link |
| `POST /auth/login` | Email/password → JWT response | Existing shared session logic; unverified users are rejected by BE |

BE sends a single-use token link over SMTP. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`, and `FRONTEND_BASE_URL` in the backend environment. For Gmail, use a Google App Password as `SMTP_PASSWORD`; do not commit it. Check `Back-End/src/main/resources/application.properties` for defaults and restart BE after changing configuration.

## Other API contracts and validation

Active packages use anonymous `GET /api/membership-packages/active`. Class sessions are fetched only inside authenticated role views (`/api/member/class-sessions/available` for members; protected `/api/classes` for staff). There is no anonymous class-list API in the current BE.

FE validates username 3–50 ASCII letters/digits/underscore/dot; full name 2–100 characters; email format; phone as 10 digits starting 0; password as 8–72 UTF-8 bytes with uppercase/lowercase/digit/special character and no whitespace; and exact confirm match. FE validation is not a security boundary; BE must validate all inputs independently.

The assignment's Thymeleaf controllers describe a Spring MVC design; this repository uses React + REST. Registration continues to be separate from package purchase and class enrollment.

## Verification limits

Browser contract scripts mock HTTP responses; they do not send real Gmail or create production accounts. Real delivery must be demonstrated with SMTP configured in the backend environment. The BE manages schema changes; do not re-import MySQL just for email verification.
