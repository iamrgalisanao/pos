# Implementation Plan: Template Configuration Management

Transforming the hardcoded onboarding logic into a centralized, versioned, and UI-manageable platform asset system.

## Proposed Changes

### Database Schema

#### [NEW] `database/20260131_template_management.sql` (to be applied via migration)
Create tables to store templates as first-class citizens:
- `business_templates`: Metadata (name, vertical, description).
- `business_template_versions`: The actual blueprints (status, version_code, config JSONB).

```sql
CREATE TABLE business_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    vertical VARCHAR(50) NOT NULL, -- 'cafe', 'fast-food', etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE business_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES business_templates(id),
    version_code VARCHAR(20) NOT NULL, -- '1.0', '1.1'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'deprecated'
    config JSONB NOT NULL, -- Stores categories, modifier groups, and default rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applied_template_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applied_template_version UUID;
```

---

### Backend Components

#### [MODIFY] [onboardingController.ts](file:///e:/2026/Pos/backend/src/controllers/onboardingController.ts)
Refactor `applyIndustryTemplate` to:
1. Fetch the latest `published` version of the requested template from `business_template_versions`.
2. Iterate through the `config.categories` and `config.modifier_groups` to populate the tenant's catalog.
3. Log the application in the `tenants` table.

#### [NEW] [templateController.ts](file:///e:/2026/Pos/backend/src/controllers/templateController.ts)
Implement admin-only endpoints:
- `GET /api/platform/templates`: List all templates.
- `POST /api/platform/templates`: Create a new blueprint.
- `PUT /api/platform/templates/:id/versions`: Create a new draft or publish a version.
- `GET /api/platform/templates/:id/comparison`: Compare versions before publishing.

#### [MODIFY] [index.ts](file:///e:/2026/Pos/backend/src/index.ts)
- Register Super Admin middleware for `/api/platform/*` routes.
- Import and attach `templateController`.

---

### Frontend Components (Platform UI)

#### [NEW] [Templates Page](file:///e:/2026/Pos/dashboard/src/app/platform/templates/page.tsx)
- Modern list view of all templates with status badges.
- Filtering by vertical and status.

#### [NEW] [Template Detail/Editor](file:///e:/2026/Pos/dashboard/src/app/platform/templates/[id]/page.tsx)
- Tabbed interface to view/edit:
    - **Categories**: Default naming and KDS routing setup.
    - **Modifier Groups**: Selection rules (min/max/required).
    - **Config JSON**: Advanced JSON editor for power users.

---

## Verification Plan

### Automated Tests
- **API Validation**: Verify that `onboardingController` returns 404 if no published version is found.
- **Data Integrity**: Ensure that applying a template to a new tenant creates records with the correct `tenant_id`.

### Manual Verification
- **Deployment Flow**:
    1. Create a "Luxury Dining" template via Platform UI.
    2. Add "Entrees" and "Wine Selection" (with modifiers) to the template.
    3. Publish version 1.0.
    4. Onboard a new tenant using this template.
    5. Verify the new tenant has the predefined menu structure.
