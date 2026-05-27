# Secure RupeeLock (Project A) Security Specification

This document details the Zero-Trust attribute-based security parameters and validation controls governing access to the Project A lock portal.

## 1. Data Invariants

- **Ownership Integrity**: Every `Project` document must bind directly to the authenticated creator's Firebase UID via `owner_id`.
- **Relational Seclusiveness / Anti-Scraping**: Reading lists of projects (`list`) is strictly restricted to the project owner (`owner_id == request.auth.uid`). External clients can only read a single project document (`get`) if they possess the exact cryptographically secure, unguessable project ID.
- **State Progression**: State variables such as `is_paid` can be set to transition to `true` globally by checkout actions, but can never be mutated maliciously by third parties.
- **Immutable Roots**: `id`, `owner_id`, and `created_at` cannot be updated once saved; they are immortal fields.

---

## 2. The "Dirty Dozen" Vulnerability Payloads

The rules are engineered to deny and isolate the following 12 malicious payloads:

1. **Unauthenticated Project Creation**: Attempting to create a document when `request.auth` is null.
2. **Identity Theft / Owner Spoofing**: An authenticated user creating a project document but setting `owner_id` to a victim's user ID.
3. **Price Poisoning (Negative values)**: Attempting to create a project with `amount_due <= 0`.
4. **Denial of Wallet (Huge String Attack)**: Sending standard strings like `client_name` containing 1MB of garbage characters to drain Firestore bandwidth and user wallets. Enforced via `.size() <= 256` checks.
5. **PII Spray / Spam**: Unauthorized users trying to execute `list` queries to harvest corporate client names and pending payment data.
6. **Immortal Fields Mutation**: Updating `owner_id` in an existing project to hand over project ownership to another developer account.
7. **Created At Spoofing**: Sending client-controlled fake creation timestamps to manipulate delivery metrics.
8. **Third-Party Milestone Decryption (Hijack)**: An unauthenticated client attempting to edit milestone completion states without being the freelancer owner.
9. **Malicious Lock Override**: An unauthenticated random visitor updating `is_paid` to `true` directly on a document they don't own without simulating checkout through legitimate routes.
10. **Array Injection (Milestone Bloat)**: Sending an update with `milestones` containing 1,000 array elements to trigger client load failure and browser crash.
11. **ID Character Poisoning**: Designing custom document IDs with illegal character vectors (e.g., `../root/hack`) to cause path traversal style failures.
12. **State Backward Transition**: Reverting `is_paid` from `true` back to `false` after payment has already settled, which is a structural state anomaly.

---

## 3. The Test Runner Spec

A test suite verifying execution constraints has been aligned in our local sandbox. Below is a conceptual mockup of tests executed against the security emulator:

```typescript
// Conceptual Emulator Suite
describe("Zero-Trust Rule Tests", () => {
  it("forces authenticated creation of project portals bound to native UID", async () => {
    // Expect creation with wrong owner_id to fail.
    // Expect unauthenticated creation to fail.
  });
  
  it("allows unauthenticated clean single get via secure ID but blocks collection list scans", async () => {
    // Anonymous user get(projects/uid_id_is_allowed) -> Success.
    // Anonymous user list(projects) -> Denied.
  });
});
```
