# Design Spec: Virtualized Unread Orders Modal

## 1. Context & Problem
During load testing (K6), tables can receive hundreds or thousands of unread orders. The current implementation in `TablesPage` renders all orders inside the modal simultaneously using `.map()`. This causes extreme DOM bloat (e.g., rendering 1000 order components = 10,000+ DOM nodes), completely freezing the browser and destroying UX.

## 2. Selected Approach
**Virtualized List (Infinite Scroll) using `@tanstack/react-virtual`**
The user has selected the virtualized approach. 

### Why `@tanstack/react-virtual`?
It is headless, lightweight, perfectly matches Next.js best practices, and allows us to keep our custom Tailwind styling without fighting third-party DOM structures.

## 3. How Virtualization Works (Answering the User's Question)
- **DOM Recycling:** Virtualization only renders the items currently visible in the scroll viewport (plus a few "overscan" items). If the list has 1,000 orders, it only renders ~5 items in the DOM.
- **Scrolling Back Up:** The 1,000 orders are kept purely in JavaScript memory (which is extremely cheap). When you scroll back up, the library calculates exactly which items should now be visible and instantly renders those specific 5 items. The DOM is constantly recycled. There is **zero lag** and no network requests are made when scrolling up or down.

## 4. Implementation Details

### A. Dependencies
```bash
npm i @tanstack/react-virtual
```

### B. Component Modifications (`TablesPage` - `isOrderModalOpen` Dialog)
- Replace the raw `.map()` over `unreadOrders` with a virtualized container.
- Create a `useVirtualizer` instance attached to a scrollable `div` ref.
- The `div` needs a fixed height or max-height (e.g., `max-h-[60vh]`).
- Inside the virtualizer, map over `virtualizer.getVirtualItems()` to render only the visible orders.
- Adjust absolute positioning of items based on `virtualItem.start` (the scroll offset calculated by the library).

### C. Styling (Tailwind)
- Container: `relative w-full overflow-y-auto max-h-[60vh]`
- Inner container: `relative w-full` with height set to `virtualizer.getTotalSize()`.
- Items: `absolute top-0 left-0 w-full` with `transform: translateY(${virtualItem.start}px)`.

## 5. Next Steps
Once this design is reviewed and approved, we will transition to execution mode to install the library and implement the virtualized list in `frontend/src/app/[locale]/admin/tables/page.tsx`.
