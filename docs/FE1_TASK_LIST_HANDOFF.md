# Task list 2 — integration, testing and submission

| Owner | Work | Acceptance / evidence | Status |
|---|---|---|---|
| FE1 | Account-only registration | POST creates account only; no session, checkout, or enrollment | Implemented; contract test |
| BE1 | Register validation | Validate phone, strong password, confirmation, and username server-side | Pending confirmation from BE1 |
| BE1 | Email verification link | Single-use token, expiry, login enforcement, SMTP delivery | Implemented in current BE; SMTP must be configured in runtime environment |
| FE1 | Public pages | Home with disciplines/packages; anonymous class list requires login because BE has no public endpoint | Implemented |
| FE1 + BE1 | Connect email verification APIs | Register, verify token, resend link through `/auth/*` | Connected; real Gmail delivery requires SMTP setup |
| FE1 | UI evidence | Desktop/mobile and link verification states; clearly label mocked cases | See QA checklist |
| Each member | Update own two task lists | Actual owner, work, completion and evidence | Team action |
| FE1 | Consolidate and submit | Confirm required format/deadline, gather all members' rows, send to teacher | Draft prepared only; not submitted |

Submission deadline: [team to fill]. Recipient/platform: [team to fill]. No delivery or approval is implied by these files.
