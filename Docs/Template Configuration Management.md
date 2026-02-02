# Template Configuration Management

**How Templates Are Viewed, Edited, Versioned, and Applied**
**Context:** Multi-Tenant POS for Café & Fast-Food Chains (Starbucks / McDonald’s class)

This document defines the **dedicated module, pages, permissions, and lifecycle** for managing tenant onboarding templates safely and at scale.

---

## 1. Purpose of Template Configuration Management

Tenant templates are **first-class platform assets**, not hidden seed data.

They exist to:

* Standardize onboarding
* Encode best practices per vertical
* Prevent misconfiguration
* Enable rapid scaling across hundreds or thousands of stores

**Key Principle:**
Templates define defaults. Tenants receive a *copied configuration*, not a live link.

---

## 2. Template Management Module

### Module Name (Recommended)

* `Templates & Defaults`
* `Tenant Blueprints`
* `Business Templates`

### Module Scope

* Platform-level only
* Not accessible from normal tenant admin

### Access Control

| Role                 | Access                         |
| -------------------- | ------------------------------ |
| Platform Super Admin | Full (Create / Edit / Publish) |
| Corporate Admin      | Limited (if enabled)           |
| Tenant Admin         | View-only or None              |
| Store Manager        | ❌                              |

---

## 3. Template List Page

### Purpose

Provide a high-level view of all available onboarding templates.

### Columns

* Template Name
* Vertical (Café / Fast-Food / Hybrid)
* Status (Draft / Published / Deprecated)
* Version
* Last Updated
* Used By (number of tenants)

### Actions

* View
* Edit (Draft only)
* Duplicate
* Deprecate

---

## 4. Template Detail Page (Read Mode)

The **single source of truth** for a template’s configuration.

### Sections

1. **Overview**

   * Template intent
   * Supported vertical
   * Recommended use cases

2. **Enabled Capabilities**

   * Modifiers
   * Variants
   * Combos
   * Time-based menus
   * Inventory behavior

3. **Default Product Rules**

   * Product types
   * Variant dimensions
   * Modifier rules

4. **Menu & Availability Rules**

   * Menu structure
   * Time cutoffs
   * Availability defaults

5. **Pricing & Tax Defaults**

   * Pricing behavior
   * Tax categories
   * Channel pricing

6. **Permissions Model**

   * Role matrix
   * Override rules

7. **Operational Defaults**

   * Kitchen routing
   * Prep logic

### Per-Setting Metadata

Each rule shows:

* Default value
* Scope (Global / Tenant / Location)
* Overridable (Yes / No)

---

## 5. Template Edit Mode (Safe-by-Design)

### Core Rule

Editing a template must **never break existing tenants**.

### Edit Lifecycle

* Editing always creates a **new draft version**
* Published versions are immutable
* Draft → Published requires explicit action

### Edit UX Principles

* Sectioned layout (mirrors Product Config)
* Toggle-based feature enablement
* Rule editors instead of raw fields
* Inline validation & warnings

### Examples of Warnings

* "This will affect all *future* tenants using this template"
* "This capability cannot be enabled after onboarding"

---

## 6. What Can and Cannot Be Edited

### Editable

* Enabled capabilities
* Default variant dimensions
* Modifier rules
* Menu structures
* Permission matrices

### Not Editable

* Audit model
* Core financial compliance rules
* System invariants

---

## 7. Versioning & Change Management

Every template must support:

* Semantic versioning (v1.0, v1.1)
* Human-readable change log
* Status lifecycle:

  * Draft
  * Published
  * Deprecated

### Golden Rules

* Never silently change a published template
* Never auto-migrate existing tenants

---

## 8. Applying Templates During Tenant Onboarding

### Onboarding Flow

1. Select Template
2. Preview Configuration (read-only)
3. Confirm Template Version
4. Apply Allowed Overrides
5. Create Tenant

### Technical Behavior

* Configuration is **copied**, not referenced
* Template version is stored on tenant record

---

## 9. Template vs Tenant Configuration Boundary

| Area               | Template | Tenant      |
| ------------------ | -------- | ----------- |
| Product Structure  | ✅        | ❌           |
| Default Menus      | ✅        | ⚠️ Limited  |
| Pricing Rules      | ✅        | ⚠️ Override |
| Tax Categories     | ✅        | ❌           |
| Availability Rules | ✅        | ⚠️ Local    |
| Permissions        | ✅        | ❌           |

---

## 10. Why a Dedicated Template Module Is Critical

Without this module:

* Defaults become tribal knowledge
* Onboarding is inconsistent
* Chain behavior drifts

With it:

* Governance is centralized
* Scaling is predictable
* Support and ops costs drop

---

## Strategic Takeaway

Templates are **products**, not settings.

They require:

* Ownership
* UI
* Versioning
* Guardrails

This module is essential for any POS targeting **enterprise café or fast-food chains**.
