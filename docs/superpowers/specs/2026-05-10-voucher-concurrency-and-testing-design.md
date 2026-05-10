# Design Spec: Voucher Concurrency and Robust Testing

**Date**: 2026-05-10
**Status**: Draft
**Topic**: Implementing Pessimistic Locking for Voucher Usage and Comprehensive Integration Testing.

## 1. Goal Description
The objective is to ensure the `PromotionService` accurately handles voucher usage under high concurrency and strictly enforces business rules regarding expiration and usage limits.

## 2. Background Context
The current system has basic validation logic but lacks a formal "Use Voucher" command and does not handle race conditions when multiple users attempt to use the last remaining slots of a voucher simultaneously.

## 3. Proposed Changes

### 3.1. Backend: Concurrency Handling
- **New Command**: `UseVoucherCommand(Guid VoucherId, Guid UserId, decimal OrderAmount)`
- **Logic**:
    1. Start a database transaction.
    2. Execute `SELECT * FROM Vouchers WHERE Id = @Id FOR UPDATE` (Pessimistic Lock).
    3. Validate conditions:
        - `IsActive == true`
        - `ValidFrom <= UtcNow <= ValidTo`
        - `UsageCount < TotalUsageLimit`
        - Per-user limit not reached.
    4. If valid, increment `UsageCount` and create/update `UserVoucher` record.
    5. Commit transaction.

### 3.2. Backend: Entity Enhancements
- Ensure `Voucher.IncrementUsage()` is called within the locked transaction.

### 3.3. Testing: Integration Tests
- **Scenario 1: Expiration Validation**
    - Create voucher with `ValidTo` in the past.
    - Call `ValidateVoucherQuery`.
    - Verify it returns `false` with the correct error message.
- **Scenario 2: Total Usage Exhaustion**
    - Create voucher with `TotalUsageLimit = 1`.
    - Use it once successfully.
    - Attempt to use it again.
    - Verify it fails with "No more uses left" message.
- **Scenario 4: Per-User Usage Limit**
    - Create voucher with `MaxUsagePerUser = 2`.
    - User A uses it twice successfully.
    - User A attempts to use it a third time.
    - Verify it fails with "You have reached your usage limit for this voucher" message.
    - Verify that User B can still use it if `TotalUsageLimit` is not reached.
- **Scenario 3: High Concurrency (Race Condition)**
    - Create voucher with `TotalUsageLimit = 10`.
    - Spawn 20 parallel tasks calling `UseVoucherCommand` for the same `VoucherId`.
    - Verify:
        - Exactly 10 tasks succeed.
        - Exactly 10 tasks fail.
        - `UsageCount` in the DB is exactly 10.

## 4. Architecture and Data Flow
1. Client calls `ValidateVoucher` (Query - Read-only check).
2. Client places order -> `OrderService` sends a message or calls `PromotionService`.
3. `PromotionService` executes `UseVoucherCommand` (Command - Locked update).

## 5. Verification Plan
- **Automated**: Run the new integration tests using `dotnet test`.
- **Manual**: Use Postman to trigger parallel requests if needed (though automated tests are preferred for concurrency).

## 6. Open Questions
- Should we provide a way to "unlock" or "rollback" usage if an order is cancelled? (Currently out of scope, but good for future).
