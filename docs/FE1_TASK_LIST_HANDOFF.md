# Task list 2 — integration, testing and submission

| Owner | Work | Acceptance / evidence | Status |
|---|---|---|---|
| FE1 | Account-only registration | POST only creates account; no session storage, no checkout/enroll request | Implemented; contract test |
| BE1 | RegisterDTO validation | Enforce phone, strong password, confirmation and username server-side | Pending |
| BE1 | Email OTP + Gmail | Hashed one-time codes, expiry, attempt limit, resend cooldown, login enforcement, Gmail SMTP endpoints | Implemented; SMTP credentials must be configured in the run environment |
| BE1 | Public classes | Existing authenticated class and schedule APIs | Connected; no anonymous endpoint |
| FE1 + BE1 | Connect OTP APIs | Register, verify OTP, resend OTP through `/auth/*` | Connected; real Gmail delivery requires local SMTP setup |
| FE1 | UI evidence | Desktop/mobile and verification states; label stubbed cases | See QA checklist |
| Each member | Update own two task lists | Actual owner, work, completion and evidence | Team action |
| FE1 | Consolidate and submit | Confirm required format/deadline, gather all members' rows, send to teacher | Draft prepared only; not submitted |

Submission deadline: [team to fill]. Recipient/platform: [team to fill]. No delivery or approval is implied by these files.
