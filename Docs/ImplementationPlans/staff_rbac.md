# Implementation Plan: Staff Management & RBAC

This plan outlines the finalization of the Role-Based Access Control (RBAC) system and the implementation of a comprehensive Staff Management interface.

## User Review Required
> [!IMPORTANT]
> - Staff accounts are now secured with **bcrypt password hashing**.
> - All administrative routes now strictly enforce role permissions (Owner, Manager, Cashier).
> - Deleting a staff member is a "Soft Delete" (deactivation) to maintain historical audit integrity.

## Proposed Changes

### Backend (Security & CRUD)
#### [MODIFY] [staffController.ts](file:///e:/2026/Pos/backend/src/controllers/staffController.ts)
- Add `bcrypt` for password hashing on creation and updates.
- Implement `updateStaff` for changing roles, store assignments, and active status.
- Implement `deleteStaff` (soft delete) to deactivate accounts.

#### [MODIFY] [authController.ts](file:///e:/2026/Pos/backend/src/controllers/authController.ts)
- Replace mock login logic with actual `bcrypt.compare` verification.

#### [MODIFY] [index.ts](file:///e:/2026/Pos/backend/src/index.ts)
- Register new staff CRUD routes.
- Tighten RBAC on secondary routes (Inventory, Customers, Product Details) to ensure comprehensive perimeter security.

### Frontend (Management Dashboard)
#### [NEW] [StaffModal.tsx](file:///e:/2026/Pos/dashboard/src/components/StaffModal.tsx)
- Premium modal for creating and editing staff profiles.
- Supports role toggling and multi-store assignment.

#### [NEW] [staff/page.tsx](file:///e:/2026/Pos/dashboard/src/app/staff/page.tsx)
- Searchable directory of all staff members.
- Visual badges for roles and account status.
- Action triggers for editing and deactivation.

#### [MODIFY] [Sidebar.tsx](file:///e:/2026/Pos/dashboard/src/components/Sidebar.tsx)
- Integrate "Staff Management" into the primary navigation for authorized users.

## Verification Plan

### Automated Tests
- Verify that `pos_user` can no longer login with a blank password (once a password is set).
- Test role-based rejection (e.g., attempt to access `/staff` as a `cashier`).

### Manual Verification
- Create a new staff member via the dashboard.
- Update their role and verify sidebar links change accordingly upon re-login.
- Deactivate an account and verify login is denied.
