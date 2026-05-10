# Voucher Concurrency and Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement safe voucher usage with concurrency protection and comprehensive integration tests for expiration, usage limits, and redemption limits.

**Architecture:** Use Pessimistic Locking (`SELECT ... FOR UPDATE`) in the database layer via EF Core to prevent race conditions. Follow TDD for all validation logic.

**Tech Stack:** .NET 8, EF Core (PostgreSQL), MediatR, xUnit, FluentAssertions.

---

### Task 1: Update Voucher Entity and Context
**Goal:** Add `MaxRedemptionsPerUser` and ensure the database schema is updated.

**Files:**
- Modify: `backend/PromotionService/PromotionService.Domain/Entities/Voucher.cs`
- Modify: `backend/PromotionService/PromotionService.Infrastructure/Persistence/AppDbContext.cs`

- [ ] **Step 1: Update Voucher entity**
Add `public int MaxRedemptionsPerUser { get; private set; }` and update the constructor/Update method.

- [ ] **Step 2: Add migration and update database**
Run: `dotnet ef migrations add AddMaxRedemptionsPerUser --project backend/PromotionService/PromotionService.Infrastructure/ --startup-project backend/PromotionService/PromotionService.Api/`
Run: `dotnet ef database update --project backend/PromotionService/PromotionService.Infrastructure/ --startup-project backend/PromotionService/PromotionService.Api/`

---

### Task 2: TDD Scenario 5 - Redemption Limit in RedeemVoucherCommand
**Goal:** Prevent users from redeeming more than allowed.

**Files:**
- Modify: `backend/PromotionService/PromotionService.Application/Vouchers/Commands/RedeemVoucherCommand.cs`
- Create: `backend/PromotionService/PromotionService.Tests/Vouchers/RedeemVoucherTests.cs`

- [ ] **Step 1: Write failing test for redemption limit**
```csharp
[Fact]
public async Task Handle_ShouldThrowException_WhenRedemptionLimitReached()
{
    // Arrange: Create voucher with MaxRedemptionsPerUser = 1 and already redeemed once.
}
```

- [ ] **Step 2: Implement check in RedeemVoucherCommand**
```csharp
var redemptionsCount = await _context.UserVouchers.CountAsync(uv => uv.UserId == request.UserId && uv.VoucherId == voucher.Id);
if (redemptionsCount >= voucher.MaxRedemptionsPerUser)
    throw new Exception("Redemption limit reached.");
```

- [ ] **Step 3: Verify test passes**
- [ ] **Step 4: Commit**

---

### Task 3: Create UseVoucherCommand with Pessimistic Locking
**Goal:** Implement the locked usage logic.

**Files:**
- Create: `backend/PromotionService/PromotionService.Application/Vouchers/Commands/UseVoucherCommand.cs`

- [ ] **Step 1: Implement UseVoucherCommand with transaction and lock**
```csharp
using (var transaction = await _context.Database.BeginTransactionAsync())
{
    var voucher = await _context.Vouchers
        .FromSqlRaw("SELECT * FROM \"Vouchers\" WHERE \"Id\" = {0} FOR UPDATE", request.VoucherId)
        .SingleOrDefaultAsync();
    // Validate and IncrementUsage
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
}
```

---

### Task 4: TDD Scenario 1 & 2 - Expiration and Total Usage
**Goal:** Verify basic usage limits.

**Files:**
- Create: `backend/PromotionService/PromotionService.Tests/Vouchers/UseVoucherTests.cs`

- [ ] **Step 1: Write failing test for expiration**
- [ ] **Step 2: Write failing test for total usage exhaustion**
- [ ] **Step 3: Verify they fail, then implement validation in UseVoucherCommand**
- [ ] **Step 4: Verify they pass and commit**

---

### Task 5: TDD Scenario 3 - High Concurrency
**Goal:** Verify the Pessimistic Lock works under pressure.

**Files:**
- Modify: `backend/PromotionService/PromotionService.Tests/Vouchers/UseVoucherTests.cs`

- [ ] **Step 1: Write concurrency test**
```csharp
[Fact]
public async Task Handle_ShouldHandleConcurrency_WhenManyUsersUseLastSlots()
{
    // Arrange: Voucher with 5 slots
    // Act: 20 parallel tasks calling UseVoucherCommand
    // Assert: 5 success, 15 failure, UsageCount == 5
}
```

- [ ] **Step 2: Run test and verify it passes with the lock implementation**
- [ ] **Step 3: Commit**
