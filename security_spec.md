# Security Specification - FinApp

## 1. Data Invariants
- A transaction must belong to a authenticated user (`userId`).
- A user can only read, create, update, or delete their own transactions.
- Transaction amount must be a positive number (or at least a number).
- Transaction type must be one of: 'receita', 'despesa', 'investimento'.
- Dates must be valid strings.

## 2. The Dirty Dozen Payloads (Rejection Targets)

1. **Identity Spoofing**: Create transaction with `userId` of another user.
2. **Type Poisoning**: `type: "hack"`.
3. **Value Poisoning**: `amount: "lots"` (string instead of number).
4. **Massive Payload**: `description` with 1MB of text.
5. **Unauthorized Read**: User A tries to list transactions where `userId == UserB`.
6. **Malicious Update**: User A tries to change the `userId` of their own transaction to User B.
7. **Bypassing Schema**: Create transaction without `amount`.
8. **Negative Integrity**: `amount` as a negative number (depending on business logic).
9. **ID Poisoning**: Document ID with huge junk string.
10. **Timestamp Fraud**: `createdAt` set to a future date by client.
11. **Orphaned Access**: Read transaction without being logged in.
12. **Ghost Fields**: Adding `isAdmin: true` to a transaction document.

## 3. Test Runner (Conceptual)
All the above payloads MUST return `PERMISSION_DENIED`.
