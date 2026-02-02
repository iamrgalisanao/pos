# Functional Requirements

## BIR‑Compliant POS Settings Module

---

## 1. Purpose

This document defines the functional requirements for the **Settings Module** of a Point-of-Sale (POS) system designed for cafés and small fast‑food businesses, with explicit alignment to **Bureau of Internal Revenue (BIR – Philippines)** compliance requirements.

The Settings Module governs store identity, tax configuration, access control, auditability, device management, and promotional rules. These requirements ensure that all transactions are legally compliant, auditable, and tamper‑resistant.

---

## 2. Store Operational Settings

### 2.1 Store Profile Management

The system **shall** allow configuration and storage of the following store attributes:

* Registered Business Name (as per BIR Form 2303)
* Trade Name (if applicable)
* Registered Business Address
* Tax Identification Number (TIN)

The system **shall** ensure that the registered business name, address, and TIN appear on:

* All Official Receipts (OR)
* Daily Z‑Reports
* BIR export reports

### 2.2 Localization Settings

The system **shall** support store‑level localization settings including:

* Operating timezone (used for transaction timestamps and reporting)
* Currency code (default: PHP)

Once transactions exist for a store, the system **shall not allow modification** of the timezone or currency to preserve audit integrity.

---

## 3. Tax & BIR Compliance Settings

### 3.1 Tax Registration Type

The system **shall** support configuration of the store’s tax registration type:

* VAT‑registered (12% VAT)
* Non‑VAT (Percentage Tax, e.g., 3%)

The configured tax type **shall be consistently applied** across:

* POS transaction calculations
* Receipt printing
* Reports and exports

### 3.2 Tax Calculation Rules

The system **shall** support:

* VAT‑inclusive pricing
* VAT‑exclusive pricing

The system **shall calculate, store, and report** the following values:

* Gross Sales
* VATable Sales
* VAT Amount
* VAT‑Exempt Sales (if enabled)
* Zero‑Rated Sales (if applicable)

### 3.3 Official Receipt (OR) Requirements

The system **shall** generate Official Receipts that include:

* Official Receipt label
* Sequential OR number
* Date and time of transaction
* Store registered name, address, and TIN
* VAT registration status
* Itemized sales and tax breakdown

Receipt numbers **shall be sequential, non‑resettable, and non‑reusable**.

Voided receipts **shall not be deleted** and must remain traceable for audit purposes.

---

## 4. Access Control & Permissions

### 4.1 Role Definitions

The system **shall** support the following user roles:

* Owner
* Manager
* Cashier

### 4.2 Role‑Based Access Restrictions

The system **shall** restrict access based on role:

* Cashiers shall not access settings, reports, or tax configuration
* Managers may perform operational overrides
* Only Owners may modify tax, receipt, and compliance settings

### 4.3 Cashier Dashboard Access

The system **shall** support a configurable setting:

* `allow_cashier_dashboard_access`

By default:

* Cashiers shall not see the dashboard or administrative UI
* Cashiers shall remain limited to POS terminal operations

### 4.4 Manager Override Controls

The system **shall require manager or owner authorization** for sensitive actions, including:

* Refunds
* Voids
* Manual discounts above a defined threshold

All override actions **shall be logged** with:

* User ID
* Timestamp
* Action type
* Reason for override

---

## 5. Audit Trail & Data Integrity

### 5.1 Immutable Records

The system **shall not allow deletion** of:

* Sales transactions
* Receipts
* Z‑Reports

Corrections **shall only be performed** using void or adjustment transactions, preserving original records.

### 5.2 Settings Change Audit Log

The system **shall log all changes** to:

* Store profile
* Tax configuration
* Receipt settings
* Access permissions

Each log entry **shall include**:

* Previous value
* New value
* User who made the change
* Timestamp

---

## 6. Reporting & BIR Readiness

### 6.1 Daily Z‑Report

The system **shall generate a Daily Z‑Report** containing:

* Beginning OR number
* Ending OR number
* Gross sales
* VATable sales
* VAT amount
* VAT‑exempt sales
* Total voids and refunds

Z‑Reports **shall be immutable once generated**.

### 6.2 BIR Export Reports

The system **shall** support exporting sales and tax data in formats suitable for:

* BIR audits
* External accounting systems

Reports **shall be filterable** by store and date range.

---

## 7. Device & Terminal Management

### 7.1 Terminal Registration

Each POS terminal **shall** be uniquely registered to a store and device ID.

The system **shall track**:

* Terminal status (active, disabled, decommissioned)
* Last activity timestamp
* Application version

The system **shall support remote disabling** of terminals.

### 7.2 Offline Transactions

The system **shall support offline transaction processing**.

Offline transactions **shall**:

* Maintain correct OR sequencing
* Be stored securely on the device
* Automatically sync when connectivity is restored

Conflicts **shall not overwrite** existing records.

---

## 8. Promotions & Discounts (BIR‑Safe)

### 8.1 Supported Promotion Types

The system **shall support**:

* Percentage‑based discounts
* Fixed amount discounts
* Buy‑X‑Get‑Y promotions

### 8.2 Compliance Rules for Discounts

* Discounts shall be clearly displayed on receipts
* Discount amounts shall be reported separately from VATable sales
* Discounts shall not alter declared gross sales incorrectly

Manual discounts above a configurable limit **shall require manager approval**.

---

## 9. Settings Module UI (Future Dashboard)

The system **shall provide a `/settings` dashboard page** exposing:

* Store profile and tax settings
* Access control and permissions
* Device management
* Receipt and reporting configuration
* Promotions and loyalty rules

All UI‑level changes **shall respect database‑level enforcement and audit constraints**.

---

## 10. Compliance Statement

The system is designed to comply with **Philippine BIR POS requirements**, emphasizing:

* Immutability of financial records
* Sequential official receipt numbering
* Complete audit trails
* Accurate tax computation and reporting

Any future enhancements **shall not compromise** these compliance guarantees.
