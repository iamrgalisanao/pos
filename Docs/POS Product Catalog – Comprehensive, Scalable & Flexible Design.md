# POS Product Catalog – Comprehensive, Scalable & Flexible Design

**Target:** Multi-tenant POS for Café & Fast-Food Chains (Starbucks / McDonald's class)

This document consolidates items **1–6** into a single, best-practice reference covering **UX, data model, scalability, governance, and architecture**.

---

## 1. Redesign the “Add Product” Flow (Step-by-Step UX)

### Goal

Enable fast setup for small cafés while supporting enterprise-grade configuration for large chains.

### UX Principle: Progressive Disclosure

Start simple, reveal complexity only when needed.

### Recommended Flow (Wizard or Tabs)

1. **Core Product**

   * Product Name (customer-facing)
   * Internal Name (optional)
   * SKU / PLU / Barcode
   * Product Type:

     * Beverage
     * Food
     * Combo / Meal Set
     * Modifier-only
     * Hidden / Ingredient
   * Category (menu-facing)
   * Description (receipt vs menu)

2. **Pricing & Tax**

   * Base Price
   * Cost (COGS – restricted)
   * Tax Category (not raw %)
   * Dine-in vs Takeaway tax behavior
   * Channel-based pricing (POS / Kiosk / Delivery)

3. **Variants & Modifiers**

   * Variants (Size, Temperature, Meal Size)
   * Modifier Groups (Required / Optional)
   * Min / Max selections
   * Price deltas
   * Default selections
   * Nested modifiers

4. **Availability & Menus**

   * Time-based availability (Breakfast / Lunch)
   * Day-of-week schedule
   * Temporary disable (86 item)
   * Menu assignment

5. **Locations & Channels**

   * Location scope (All / Selected)
   * Channel visibility
   * Inherit vs Override behavior

6. **Permissions & Lifecycle**

   * Who can edit price / tax / availability
   * Manager PIN required
   * Status: Active / Inactive / Archived

---

## 2. Full Product Data Model (PRD-Ready)

### Core Entities

**Product**

* id
* name
* internal_name
* type
* status
* reporting_category

**Variant**

* id
* dimension (size, temp)
* price_delta
* tax_override

**Modifier Group**

* required
* min / max
* nested_allowed

**Pricing Rule**

* channel
* location
* time_window

**Availability Rule**

* schedule
* menu
* location

**Permission Rule**

* role
* action
* approval_required

---

## 3. Café vs Fast-Food Feature Toggle Strategy

### Café (Starbucks / JCO)

* Deep modifier trees
* Flexible customization
* Recipe-based prep logic

### Fast-Food (McDonald's)

* Strict modifier limits
* Predefined combos
* Time-based menus

### Feature Toggles

* Enable Modifiers
* Enable Variants
* Enable Combos
* Enable Time-Based Menus

Toggles can be:

* Tenant-level
* Vertical-based

---

## 4. Rules Engine vs Static Configuration

### Static Configuration (Simple Cafés)

* Fixed prices
* Flat menus
* Minimal overrides

### Rules Engine (Chains – Recommended)

* Time-based pricing
* Channel-specific behavior
* Conditional availability

**Best Practice:**
Use declarative rules stored as configuration, not hardcoded logic.

---

## 5. Permissions & Governance Matrix

| Action         | Staff | Manager | Franchise | Corporate |
| -------------- | ----- | ------- | --------- | --------- |
| Sell Item      | ✅     | ✅       | ✅         | ✅         |
| Price Override | ❌     | ✅       | ❌         | ❌         |
| Edit Product   | ❌     | ❌       | ✅         | ✅         |
| Disable Item   | ❌     | ✅       | ✅         | ✅         |
| Change Tax     | ❌     | ❌       | ❌         | ✅         |

All overrides must be:

* Audited
* Timestamped
* Linked to user

---

## 6. Catalog Scalability & Bulk Operations

### Catalog List Enhancements

* Product Type Icon
* Variant Count
* Modifier Indicator
* Availability Status
* Locations Count

### Bulk Actions

* Bulk price update
* Bulk availability change
* Bulk tax reassignment
* Bulk archive

### Guardrails

* Warn if product is live
* Require confirmation for breaking changes
* Preserve historical data

---

## Strategic Summary

You are building a **Product Configuration System**, not a simple catalog.

This structure supports:

* Multi-tenancy
* Chain governance
* High-volume operations
* Audit & compliance

**This foundation scales from a single café to a global fast-food brand.**

---

## 7. Tenant Onboarding Templates (Chain-Ready)

Tenant onboarding templates provide **preconfigured defaults** so a new tenant can go live quickly while still supporting enterprise governance. Below are **two production-grade templates** aligned to real-world operations.

---

### Template A: Starbucks-like (Café / Beverage-Centric Chain)

**Positioning**
High customization, moderate speed, strong loyalty, recipe-driven drinks.

#### Enabled Capabilities

* Variants: ✅ (Size, Temperature)
* Modifiers: ✅ Deep & Nested
* Combos: ❌
* Time-based menus: ⚠️ Optional (seasonal)
* Inventory: ⚠️ Ingredient-level (optional)

#### Default Product Configuration

* Product Type Default: Beverage
* Variant Dimensions:

  * Size: Tall / Grande / Venti
  * Temperature: Hot / Iced
* Modifier Groups:

  * Milk Type (Required, 1 selection)
  * Syrups (Optional, max 3)
  * Add-ons (Optional)

#### Pricing & Tax Defaults

* Base price at variant level
* Modifier price deltas enabled
* Tax category: Beverage
* Channel pricing: POS = Online

#### Menu & Availability

* Always-on menu
* Seasonal menu toggle enabled
* No hard time cutoffs

#### Permissions Model

* Staff: Sell, basic modifier selection
* Manager: Price override (PIN)
* Tenant Admin: Menu & modifier edits
* Corporate: Pricing templates

#### Operational Defaults

* Prep instructions printed to barista station
* No course firing
* Loyalty eligible by product group

#### Success Metric

* Average ticket value
* Modifier attachment rate
* Order accuracy

---

### Template B: McDonald’s-like (Fast-Food / QSR Chain)

**Positioning**
Extreme speed, limited customization, high volume, strict governance.

#### Enabled Capabilities

* Variants: ⚠️ Limited (Meal size only)
* Modifiers: ⚠️ Restricted
* Combos: ✅ Core capability
* Time-based menus: ✅ Mandatory
* Inventory: ⚠️ Availability-based

#### Default Product Configuration

* Product Type Default: Food / Combo
* Variant Dimensions:

  * Meal Size: Regular / Upsize
* Modifier Groups:

  * Exclusions only (e.g. No Pickles)
  * Max selections = 1

#### Pricing & Tax Defaults

* Price locked at product or combo level
* No cashier price override
* Tax category: Food (dine-in / takeaway split)
* Channel pricing enabled (Drive-thru / Kiosk)

#### Menu & Availability

* Breakfast / Lunch menus
* Automatic time cutoffs
* Emergency 86-item switch

#### Permissions Model

* Staff: Sell only
* Manager: Void / disable item
* Franchise Admin: Local pricing overrides
* Corporate: Menu & product ownership

#### Operational Defaults

* Kitchen Display System routing
* Auto re-fire on order changes
* Prep-time optimized

#### Success Metric

* Orders per minute
* Queue time
* Error rate

---

### Template Governance Rules (Both Templates)

* Templates define **defaults**, not hard locks
* Overrides allowed only where explicitly enabled
* All overrides are:

  * Audited
  * Timestamped
  * Scoped (location / channel)

---

### Onboarding Flow Using Templates

1. Select Business Type

   * Café / Beverage Chain
   * Fast-Food / QSR Chain

2. Apply Template

   * Products
   * Menus
   * Permissions

3. Optional Adjustments

   * Tax rules
   * Pricing tiers
   * Locations

4. Go Live Checklist

   * Test order
   * Receipt validation
   * Kitchen routing check

---

### Why Templates Matter

Templates:

* Reduce onboarding time from weeks to hours
* Prevent configuration mistakes
* Enforce best practices
* Allow safe scaling across hundreds of stores



**This is how enterprise POS systems scale reliably.**
