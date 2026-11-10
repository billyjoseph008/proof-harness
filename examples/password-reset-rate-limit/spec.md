# AUTH-012: Rate-limit password reset requests

Status: Approved · Owner: maintainer · Date: 2026-11-09

## Problem
Anyone can request unlimited password reset emails for any address. Attackers use it to flood inboxes and to probe which emails have accounts, and every request costs us an email send.

## Scope
- Limit reset requests per email address and per client IP.
- Return the same response whether or not the account exists.

## Out of scope
- CAPTCHA, account lockout, changes to the reset email itself.

## Acceptance criteria
| ID | Criterion (EARS) | Proof |
|---|---|---|
| AC-01 | When a client requests a reset for an email that has had 5 requests in the last 60 minutes, the API shall respond 429 with a `Retry-After` header and send no email. | `npm test -- reset-rate-limit.test.ts -t "sixth request"` |
| AC-02 | When a single IP sends more than 20 reset requests in 60 minutes, the API shall respond 429 to further requests from that IP. | `npm test -- reset-rate-limit.test.ts -t "per ip"` |
| AC-03 | The API shall return the same status and body for a reset request whether or not the email belongs to an account. | `npm test -- reset-rate-limit.test.ts -t "no enumeration"` |
| AC-04 | If the rate-limit store is unavailable, then the API shall allow the request and log a warning, so users are never locked out by an outage. | `npm test -- reset-rate-limit.test.ts -t "store down"` |
| AC-05 | While a limit is active, the reset page shall show "Too many requests, try again in N minutes". | Human check: request 6 resets in the browser |

## Risks
- Shared office IPs could hit the per-IP limit; 20/hour is above observed peaks.
- Clock skew between instances; the window uses the store's time, not the app's.

## Open questions
- [x] Should limits apply to logged-in admins triggering resets? → No, admin resets bypass the limit (decided 2026-11-09).
