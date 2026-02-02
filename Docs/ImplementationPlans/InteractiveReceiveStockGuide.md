# Interactive Receive Stock Guide - Implementation Plan

## Goal
Create an interactive tutorial/guide on the Product Catalog page that teaches users how to receive stock, explaining what happens at each step of the process.

---

## Proposed Solution

### Approach: Custom Tutorial Component
Create a lightweight, custom tutorial system using React state and CSS animations rather than adding a heavy third-party library.

### Features
1. **Step-by-step walkthrough** with highlighted elements
2. **Informative tooltips** explaining each action
3. **Progress indicator** showing current step
4. **Skip/Dismiss option** for experienced users
5. **Auto-trigger** on first visit (using localStorage)
6. **Manual trigger** via a help button

---

## Implementation Steps

### 1. Create Tutorial Component
**File**: `dashboard/src/components/ReceiveStockTutorial.tsx`

**Features**:
- Overlay with spotlight effect on target elements
- Tooltip with step information
- Navigation buttons (Next, Previous, Skip)
- Progress dots
- Smooth transitions

### 2. Tutorial Steps

#### Step 1: Welcome
- **Target**: None (center modal)
- **Message**: "Welcome to the Product Catalog! Let's learn how to receive stock for your products."

#### Step 2: Product Actions Menu
- **Target**: Actions menu (three dots) on first product
- **Message**: "Click the actions menu on any product to see available options."

#### Step 3: Receive Stock Button
- **Target**: "Receive Stock" menu item
- **Message**: "Select 'Receive Stock' to add inventory for this product."

#### Step 4: Batch Number
- **Target**: Batch number field in modal
- **Message**: "Each stock receipt gets a unique batch number for tracking. This is auto-generated but you can customize it."

#### Step 5: Quantity
- **Target**: Quantity field
- **Message**: "Enter the quantity you're receiving. This will be added to your current stock level."

#### Step 6: Optional Fields
- **Target**: Lot number, expiry date, cost fields
- **Message**: "Add optional details like lot number, expiry date, and cost per unit for better inventory management."

#### Step 7: Current Stock Display
- **Target**: Current stock indicator in modal
- **Message**: "See your current stock level here. After submitting, this will update automatically."

#### Step 8: Submit
- **Target**: Submit button
- **Message**: "Click 'Receive Stock' to save. The stock quantity will update immediately in the catalog."

#### Step 9: Stock Column
- **Target**: Stock column in table
- **Message**: "Your updated stock levels appear here with color-coded badges: 🟢 Green (>10), 🟡 Amber (1-10), 🔴 Red (0)."

### 3. Add Help Button
**Location**: Product Catalog header (next to "Add Product")

**Button**:
- Icon: Question mark or info icon
- Label: "Tutorial" or "Help"
- Triggers the guide on click

### 4. Persistence
Use `localStorage` to track:
- Whether user has completed the tutorial
- Option to reset/replay tutorial

---

## Technical Design

### Component Structure
```
ReceiveStockTutorial/
├── TutorialOverlay (backdrop with spotlight)
├── TutorialTooltip (content box with arrow)
├── TutorialControls (Next, Prev, Skip buttons)
└── ProgressIndicator (step dots)
```

### State Management
```typescript
interface TutorialState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  targetElement: HTMLElement | null;
}
```

### Styling Approach
- CSS animations for smooth transitions
- Backdrop with semi-transparent overlay
- Spotlight effect using box-shadow or clip-path
- Tooltip with arrow pointing to target element
- Responsive positioning

---

## Files to Create/Modify

### New Files
1. **[NEW]** `dashboard/src/components/ReceiveStockTutorial.tsx` - Main tutorial component
2. **[NEW]** `dashboard/src/hooks/useTutorial.ts` - Custom hook for tutorial state management

### Modified Files
1. **[MODIFY]** `page.tsx` - Add tutorial component and help button
2. **[MODIFY]** `ReceiveStockModal.tsx` - Add data attributes for tutorial targeting

---

## User Experience Flow

1. **First-time user** visits Product Catalog
2. Tutorial automatically starts (if not completed before)
3. Overlay appears with welcome message
4. User clicks "Start Tutorial" or "Skip"
5. If started, highlights each element in sequence
6. User can navigate forward/backward or skip anytime
7. On completion, tutorial is marked as done
8. **Help button** always available to replay tutorial

---

## Alternative: Simpler Approach

If the full tutorial is too complex, we could implement a simpler version:

### Info Panel Approach
- Add an expandable info panel at the top of the page
- Contains step-by-step instructions with screenshots/icons
- Collapsible to save space
- Always accessible but not intrusive

---

## Recommendation

**Implement the full custom tutorial component** for the best user experience. It's more engaging and effective than static documentation, and doesn't require external dependencies.
