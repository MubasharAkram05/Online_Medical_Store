
# WP-Style Admin Orders Enhancement Plan

**Information Gathered:**
- Complex page: carts table, orders list, modals (detail/edit/prescription/receipt)
- CSS: Basic cards/table (needs gradients/glass/hover animations)
- Dependencies: adminService/dialog context/buttons/cards
- Features: Status editing, payment approve/reject, prescription verification

**Plan:**
```
1. Header → Gradient w/ WP glow + shimmer count
2. Cart Cards → Glass hover, status pulse badges, mini-charts
3. Orders Table → Sortable sticky header, zebra hover glow
4. Modals → Glass backdrop, slide-in cards, animated badges
5. Status Badges → 6 color variants w/ pulse/shine
6. Actions → Hover lift buttons, loading spinners
```

**Dependent Files:**
- `AdminOrdersPage.css` (main)
- `AdminOrdersPage.js` (JS minor - classNames)

**Followup Steps:**
1. Apply CSS → Test hover/animations
2. `npm start` → /admin/orders
3. Visual match Dashboard quality

**Ready to implement? Y/N**

