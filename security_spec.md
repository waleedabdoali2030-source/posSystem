# Security Specification & POS Firestore Rules Spec

This document describes the validation rules, data invariants, and potential vulnerability vectors ("Dirty Dozen" payloads) to ensure a secure, zero-trust Firestore setup for the POS application.

## 1. Data Invariants

- **Store Settings**: Single document representing location and VAT settings. The tax rate must always be constrained between `0` and `100` percent (defaulted to `15` for SA).
- **Categories**: Must contain a non-empty name and a valid styling color class or hex.
- **Products**: Price must be greater than or equal to `0`. A product must have a valid `categoryId`.
- **Payment Methods**: Custom cash or card pathways configured with standard names and icons.
- **Work Days**: Only one workday can be `'open'` at an active terminal. Transaction numbering begins sequential from `1` for each newly opened workday of the shift.
- **Transactions**: Every transaction is immutable upon creation. It must reference an active `dayId` and include appropriate calculation aggregates matching `netAmount` + `taxAmount` = `totalAmount`.

## 2. The "Dirty Dozen" Malicious Payloads (Vulnerability Vector Blockers)

Here is how the rules will protect against the 12 classic "Dirty Dozen" Firestore attacks:

1. **Transaction Price Poisoning**: Attacker logs a transaction with a massive negative sales amount to spoof negative totals (`totalAmount: -99999999`).
2. **Settings Override Attack**: Client resets store VAT Tax ID to empty, disabling tax calculations.
3. **Ghost Fields Injection**: Injecting a custom permission field `isAdmin: true` into a standard user setting or product catalog.
4. **Incorrect ID Spoofing**: Setting a document ID with recursive nested pathways or extremely long junk symbols to crash index lists.
5. **No-Active-Day Transaction Logging**: Creating transactions without referencing any valid `dayId` of an open shift.
6. **Double-Open Work Days**: Attempting to open multiple POS workdays simultaneously to duplicate transaction receipt sequences.
7. **Negative Inventory Pricing**: Adding a product with a negative price (`price: -5.00 SAR`).
8. **Invalid Color Injector**: Injecting script payloads inside a category color attribute (`color: "<script>alert('hack')</script>"`).
9. **Tax ID Mismatch**: In a tax transaction, setting the tax rate to `0` even if `isTaxInclusive` is false and total does not calculate.
10. **Immutable Value Mutation**: Attempting to edit or update an existing transaction to clear records of a sale.
11. **Excessive Field Payloads**: Crafting a massive nested document to saturate document store size.
12. **Mada Icon Spoof**: Deleting default payment pathways like Cash and Mada, locking out core system processing.

## 3. The Fortress Rules Definition

The rules will enforce validations on every entity write block to ensure data conforms strictly to the schema outline.
`allow read` is open to store users running terminals, with strict constraints. All writes validate input key sizes, data formats, and types.
