/**
 * Customer Tabs Component
 *
 * NOTE: This component is intentionally not extracted as a separate reusable component.
 * Following YAGNI (You Aren't Gonna Need It) principle, the tab functionality is
 * implemented directly in the customer detail page since:
 *
 * 1. Single use case - only used in customers/[id]/page.tsx
 * 2. No reusability needed - no other pages need these tabs
 * 3. Tight coupling - tabs are coupled to customer data structure
 *
 * If multiple pages need similar tab layouts in the future, extract at that time.
 *
 * Current implementation location: src/app/(dashboard)/customers/[id]/page.tsx
 * Lines: ~211-340 (Tabs component with 4 tabs: Info, Lands, Bookings, Bills)
 */

// This file serves as documentation only
// The actual tabs implementation is in customers/[id]/page.tsx
export {}
