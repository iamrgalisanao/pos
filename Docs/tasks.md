# POS Project Task Tracking

This document tracks the granular tasks required to fulfill the [POS Project Implementation Roadmap](./POS_Project_Roadmap.md).

## Phase 1: MVP - Transactional Foundation (M1-M3)
*Goal: Reliable checkout for single-store retail.*

### 🛠️ Backend Infrastructure
- [x] Database Schema Design (Multi-tenant)
- [x] Dockerized Environment (Postgres, Redis)
- [x] JWT Authentication & Middleware
- [x] Staff & Store Management API
- [x] Product & Category Management API
- [x] Transaction Engine (Orders, Items, Payments)
- [x] Inventory Tracking (Atomic stock decrement)
- [x] Real-time Dashboard Stats API
- [ ] Stripe Integration for Card Payments
- [ ] Thermal Printer Service (Mock/Real)

### 🖥️ Dashboard & Terminal UI
- [x] Responsive Dashboard Layout
- [x] Authentication Flow (Login/Logout)
- [x] Key Metrics Cards (Revenue, Orders, etc.)
- [x] Recent Transactions List
- [x] Functional POS Terminal (Cart, Search, Checkout)
- [x] Inventory Viewer with Low Stock Alerts
- [ ] Product/SKU Management UI (CRUD)
- [ ] Customer Management UI
- [ ] Basic Analytics Reports (CSV Export)

### ✅ Quality & Testing
- [x] Automated Database Seeding
- [ ] Unit Tests for Order Processing Logic
- [ ] API Integration Tests
- [ ] Basic Security Audit (RLS verification)

---

## Phase 2: Core - Operational Scale (M4-M6)
*Goal: Full F&B Support with Kitchen routing and Offline capacity.*

### 🔄 Sync & Offline Engine
- [x] Backend Vector Clock & Delta Log Schema
- [x] Log Mutations in Backend (Insert/Update/Delete)
- [x] Implement Client-side Persistence (Dexie/IndexedDB)
- [x] Build Background Sync Service (Push/Pull deltas)
- [x] Add Online/Offline Interceptors to API Layer
- [x] Update Terminal Order Flow for Offline Queueing
- [x] Create UI Connectivity Status Indicator
- [x] Define Sync Conflict Resolution Strategy (Server-wins)

### 🍳 Kitchen Display System (KDS)
- [x] Real-time Order Firing (Socket.io Backend)
- [x] KDS Dashboard UI
- [x] Order Status Transitions (Received -> Preparing -> Ready)
- [x] Comprehensive KDS Guidelines Documentation
- [x] KDS Product Filtering (Station Routing)
    - [x] Add `send_to_kds` flag to Database (Product Categories)
    - [x] Update Category APIs & Dashboard UI
    - [x] Include routing data in terminal checkout payload
    - [x] Implement UI filtering on KDS screen
- [x] Advanced Station Routing (e.g., Drinks to Bar, Food to Kitchen)

### 🛡️ Store Operations
- [x] Shared Sidebar & Navigation Layout
- [x] Role-Based Access Control (RBAC)
    - [x] Apply `authorize` middleware to restricted backend routes
    - [x] Implement conditional rendering in `Sidebar.tsx` based on user role
    - [x] Verify access restrictions for Cashier vs Manager roles
- [x] Individual Terminal ID Registration & Heartbeat
- [x] Advanced SKU Management (Variations, Batch/Lot Tracking)
    - [x] Apply database schema updates for variants and batches
    - [x] Implement backend controllers for product variations
    - [x] Implement batch receipt and tracking logic
    - [x] Update Inventory UI to support variants and batches
    - [x] Integrate variant selection in Terminal UI
- [x] Multi-store Admin Dashboard (Global Metrics View)
    - [x] Create Implementation Plan
    - [x] Implement Global Metrics Aggregation (Revenue/Orders)
    - [x] Build Store Comparison Analytics API
    - [x] Create Global Overview Dashboard UI
    - [x] Implement Multi-store Switcher & Navigation
    - [x] Add Global Stats/Charts for Owners/Managers

---

## Phase 3: Advanced - Growth & CRM (M7-M9)
*Goal: Deep customer engagement and rich analytics.*

### 💎 Loyalty & CRM
- [ ] Customer Profiles & Purchase History
- [ ] Tiered Loyalty Program (Points calculation)
- [ ] Voucher & Promo Code Engine
- [ ] Email/SMS notification triggers

### 📊 Advanced Analytics
- [ ] Historical Sales Trends Chart
- [ ] Product Performance Analysis (Best/Worst Sellers)
- [ ] Staff Performance Tracking
- [ ] Automated Scheduled Reports

---

## Phase 4: Enterprise - Multi-Store Expansion (M10-M12)
*Goal: Support for large franchises and 3rd party ecosystems.*

### 🌐 Enterprise Features
- [ ] Franchise Global Master Data Management
- [ ] Centralized Tax & Compliance Configuration
- [ ] 3rd Party Integrations (Grab, UberEats, etc.)
- [ ] Public API Gateway for Developers

### 🚀 Scaling & Security
- [ ] Multi-region Database Replication
- [ ] Advanced Penetration Testing
- [ ] Load Testing (Up to 5,000 concurrent terminals)
