# Design Guidelines: Natural Products E-Commerce Platform

## Design Approach

**Reference-Based Approach** combining:
- **Shopify/Etsy**: Clean product presentation with trust-building elements
- **Notion**: Organized admin panels with clear hierarchy
- **Airbnb**: Card-based layouts for products and categories

**Core Principle**: Establish trust through clean, spacious design that emphasizes product quality and natural authenticity.

---

## Typography

**Font Families**:
- **Primary**: Open Sans (body text, UI elements, product descriptions)
- **Display**: Serif font for main headings and hero text (Playfair Display or Lora via Google Fonts)

**Scale**:
- Hero headings: `text-5xl md:text-6xl lg:text-7xl` (serif)
- Section headings: `text-3xl md:text-4xl` (serif)
- Product names: `text-xl font-semibold` (Open Sans)
- Body text: `text-base` (Open Sans)
- UI labels: `text-sm font-medium` (Open Sans)
- Metadata: `text-xs text-muted-foreground` (Open Sans)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **4, 6, 8, 12, 16, 20, 24** for consistency
- Section padding: `py-16 md:py-24`
- Card padding: `p-6`
- Component gaps: `gap-4` to `gap-8`
- Container max-width: `max-w-7xl mx-auto px-4`

**Grid Systems**:
- Product grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
- Category cards: `grid-cols-1 md:grid-cols-3 gap-8`
- Admin tables: Full-width responsive tables with `overflow-x-auto`

---

## Component Library

### Navigation
**Main Header**:
- Sticky top navigation with subtle shadow on scroll
- Logo (left), search bar (center), icons for cart/wishlist/account (right)
- Secondary nav below: category links, promotional banner space
- Mobile: hamburger menu, bottom tab bar for primary actions

### Product Components
**Product Card**:
- Aspect ratio 3:4 image container
- "New" badge (top-left), discount badge (top-right)
- Product name, weight/volume, price (strikethrough if discounted)
- Quick add-to-cart button overlay on hover
- Star rating display with review count

**Product Detail Page**:
- Two-column layout: image gallery (left 60%), details (right 40%)
- Large image viewer with thumbnail strip below
- Breadcrumb navigation
- Clear CTA section: quantity selector, add-to-cart, add-to-wishlist
- Tabbed sections: Description, Composition, Storage, Usage, Contraindications
- Related products carousel at bottom

### Shopping Experience
**Cart Drawer**: Slide-in from right, overlay backdrop, scrollable product list, sticky checkout button at bottom

**Checkout Flow**: Multi-step with progress indicator
- Step 1: Contact info & delivery address
- Step 2: Delivery method (SDEK/Boxberry selection with map)
- Step 3: Payment method
- Step 4: Review & confirm
- Clear summary sidebar showing: subtotal, delivery, discounts, bonuses, total

### Admin Panels
**Dashboard Layout**:
- Left sidebar: navigation menu with role-based items, collapsed on mobile
- Top bar: breadcrumbs, search, user profile dropdown
- Main content: stats cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-4), data tables, charts

**Data Tables**: 
- Alternating row backgrounds for readability
- Action buttons (edit, delete) in rightmost column
- Pagination below table
- Bulk action toolbar when items selected

### User Account
**Profile Pages**: Tabbed interface
- Personal info
- Order history (timeline view with status badges)
- Saved addresses (card grid)
- Payment methods (card list with last 4 digits)
- Bonus balance & transaction history
- Support chat interface

### Support Chat
**Chat Widget**:
- Fixed bottom-right position with notification badge
- Expandable chat window (400px width, 600px height)
- Message bubbles: user (right-aligned), consultant (left-aligned)
- Input area with attachment button
- Real-time typing indicators

---

## Images

**Hero Section**: 
Large full-width hero with high-quality lifestyle photography showing natural products in organic settings (wooden backgrounds, natural light, fresh ingredients). Height: `h-[60vh] md:h-[70vh]`. Overlay with subtle dark gradient for text readability.

**Product Images**: 
Clean white background studio shots for catalog. Multiple angles for product detail pages. Consistent aspect ratios throughout.

**Category Cards**: 
Lifestyle images representing each category (e.g., honey products with honeycomb, herbs with fresh plants).

**Trust Elements**: 
Certification badges, delivery partner logos, customer photos in testimonials.

**Empty States**: 
Friendly illustrations for empty cart, wishlist, no search results.

---

## Key UI Patterns

**Cards**: Rounded corners (`rounded-lg`), subtle border (`border border-border`), hover effect (`hover:shadow-md transition-shadow`)

**Buttons**: 
- Primary: Full Shadcn button (green background with automatic hover states)
- On images: Backdrop blur (`backdrop-blur-md bg-white/20`)
- Icon buttons: Circular with border for actions like wishlist, compare

**Badges**: 
- Status badges: pill-shaped with semantic colors
- Discount: bold with percentage
- "New" tag: simple text badge

**Forms**: 
Shadcn form components with consistent spacing, clear labels above inputs, helper text below, validation states

**Modals**: 
Centered overlays with backdrop blur, max-width 600px, padding p-6, rounded-lg

---

## Page-Specific Layouts

### Landing Page
1. **Hero**: Full-width image, centered serif headline, subheading, primary CTA
2. **Featured Categories**: 3-column grid with image cards
3. **New Products**: 4-column scrollable carousel
4. **Value Propositions**: 3-column grid with icons (natural, certified, fast delivery)
5. **Promotional Banner**: Discount/promocode highlight section
6. **Newsletter Signup**: Simple centered form with benefit statement

### Catalog Page
- Left sidebar: filters (categories, price range, attributes) - collapsible on mobile
- Main area: sort dropdown, view toggle (grid/list), product grid
- Pagination or infinite scroll at bottom

### Admin Dashboard
- Stats overview cards (total orders, revenue, products, users)
- Recent orders table
- Quick actions menu
- Charts: sales over time, top products

---

## Accessibility & Polish

- Focus states: clear outline on all interactive elements
- Loading states: skeleton screens for product grids, spinners for actions
- Error states: clear error messages with retry options
- Success feedback: toast notifications for actions
- Smooth transitions: `transition-all duration-200` for subtle interactions
- Consistent spacing rhythm across all pages