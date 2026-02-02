# Mobile-Friendly Terminal UI Plan

Redesign the Terminal UI to ensure a seamless experience on tablets and mobile devices.

## Proposed Changes

### Dashboard

#### [MODIFY] [page.tsx](file:///e:/2026/Pos/dashboard/src/app/terminal/page.tsx)
-   **State Management**: Add `isCartOpen` state for mobile view.
-   **Layout**: 
    -   Change the main container from `flex h-screen` to a responsive `flex-col` or `lg:flex-row`.
    -   Implement a mobile-only "View Cart" floating button.
    -   Convert the fixed sidebar into a slide-over/drawer on small screens (`fixed inset-y-0 right-0 w-full md:w-[420px]`).
-   **Responsive Classes**:
    -   Adjust padding and margins for smaller screens (e.g., `p-8` to `p-4`).
    -   Refine `grid-cols` for the product catalog (e.g., `grid-cols-2` to `grid-cols-1` or `grid-cols-2` on very small screens).
    -   Hide desktop-only elements like the date/time summary on mobile.
-   **Touch Optimization**:
    -   Increase size of quantity steppers for easier touch input.
    -   Ensure the "Place Order" button is prominently positioned and easily clickable on mobile.
    -   Adjust search bar width and positioning.

## Verification Plan

### Manual Verification
-   Resize the browser window to mobile and tablet widths.
-   Verify the cart drawer opens and closes correctly on mobile.
-   Check that the product grid is legible and usable in vertical and horizontal orientations.
-   Test the checkout flow on mobile to ensure all elements are reachable.
