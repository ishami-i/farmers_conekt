# Modern E-Commerce Card Structure & CSS Guide

## HTML Structure

The products are dynamically rendered using this HTML structure:

```html
<div class="ecom-product-card" data-product-id="123">
  
  <!-- Product Image Container -->
  <div class="ecom-product-image-wrapper">
    <img 
      src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea"
      alt="Fresh Tomatoes" 
      class="ecom-product-image"
    />
    <!-- Optional discount badge -->
    <div class="ecom-badge-discount">-20%</div>
  </div>
  
  <!-- Product Info Container -->
  <div class="ecom-product-body">
    
    <!-- Category Badge -->
    <div class="ecom-product-category">Vegetables</div>
    
    <!-- Product Name -->
    <h3 class="ecom-product-name">Fresh Tomatoes</h3>
    
    <!-- Location & Harvest Time -->
    <div class="ecom-product-meta">
      <span class="ecom-meta-item">📍 Gasabo</span>
      <span class="ecom-meta-item">⏱️ Harvested</span>
    </div>
    
    <!-- Price Section -->
    <div class="ecom-product-price-section">
      <span class="ecom-price">5000</span>
      <span class="ecom-unit">per kg</span>
    </div>
    
    <!-- Footer: Quantity Selector & Add Button -->
    <div class="ecom-product-footer">
      
      <!-- Quantity Selector -->
      <div class="ecom-qty-selector">
        <button class="ecom-qty-btn" onclick="window.quickAddToCart(123, -1)">−</button>
        <input 
          type="number" 
          class="ecom-qty-input" 
          id="qty-123" 
          value="1" 
          min="1"
        />
        <button class="ecom-qty-btn" onclick="window.quickAddToCart(123, 1)">+</button>
      </div>
      
      <!-- Add to Cart Button -->
      <button class="ecom-add-btn" onclick="window.quickAddToCart(123, 0)">
        <span class="ecom-cart-icon">🛒</span>
        <span class="ecom-add-text">Add</span>
      </button>
      
    </div>
  </div>
</div>
```

---

## CSS Classes & Styling

### `.ecom-product-card`
Main card container. Features:
- White background with rounded corners
- Shadow on normal state, elevated shadow on hover
- Smooth transform animation (translateY -6px hover)
- Full height flex container

```css
.ecom-product-card {
  background: var(--white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(26, 60, 46, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
}
```

### `.ecom-product-image-wrapper`
Image container with fixed aspect ratio:
- Fixed height: 200px
- Gradient background fallback  
- Relative positioning for discount badge
- overflow: hidden for image zoom effect

```css
.ecom-product-image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, var(--cream-dark) 0%, var(--cream) 100%);
  overflow: hidden;
}
```

### `.ecom-product-image`
The actual product image:
- Covers full container with object-fit
- Scales up 1.08x on card hover
- Smooth 0.4s transition for zoom

```css
.ecom-product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
```

### `.ecom-badge-discount`
Optional discount badge in top-right:
- Red background (--red: #e05c5c)
- Positioned absolutely in corner
- White text, rounded edges

```css
.ecom-badge-discount {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--red);
  color: var(--white);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
}
```

### `.ecom-product-body`
Content area with flexing:
- 16px padding on all sides
- Flex column layout
- Flex: 1 to fill available space

```css
.ecom-product-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
```

### `.ecom-product-category`
Category badge styling:
- Green background (--green-light)
- Green-deep text color
- Rounded pill shape (border-radius: 20px)
- Uppercase with letter-spacing
- Width fit-content so it doesn't stretch

```css
.ecom-product-category {
  display: inline-block;
  background: var(--green-light);
  color: var(--green-deep);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  margin-bottom: 10px;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### `.ecom-product-name`
Product title:
- Large font (1.1rem)
- Bold weight (700)
- Line-height 1.3 for multi-line
- Word-break to prevent overflow

```css
.ecom-product-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 8px;
  line-height: 1.3;
  word-break: break-word;
}
```

### `.ecom-product-meta`
Location and harvest time info:
- Flex column layout
- Grows to fill space (flex: 1)
- 6px gap between items
- 12px margin-bottom

```css
.ecom-product-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  flex: 1;
}

.ecom-meta-item {
  font-size: 0.85rem;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 6px;
}
```

### `.ecom-product-price-section`
Price display with unit:
- Flex row with 60: 8px gap
- Bottom border for visual separation
- 12px bottom padding

```css
.ecom-product-price-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--cream-dark);
  padding-bottom: 12px;
}

.ecom-price {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--green-mid);
}

.ecom-unit {
  font-size: 0.8rem;
  color: var(--text-light);
}
```

### `.ecom-product-footer`
Bottom row with quantity & button:
- Flex row with 10px gap
- align-items: center for vertical alignment

```css
.ecom-product-footer {
  display: flex;
  gap: 10px;
  align-items: center;
}
```

### `.ecom-qty-selector`
Quantity control container:
- Flex row layout
- Border with cream-dark color
- Cream background
- Border-radius: 6px
- overflow: hidden to clip rounded effect

```css
.ecom-qty-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--cream-dark);
  border-radius: 6px;
  background: var(--cream);
  overflow: hidden;
}
```

### `.ecom-qty-btn`
Plus/minus buttons:
- 32x32 px size
- Green mid color, hover brightens
- Flex centered
- Smooth transitions

```css
.ecom-qty-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--green-mid);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ecom-qty-btn:hover {
  background: var(--green-light);
  color: var(--white);
}
```

### `.ecom-qty-input`
Number input field:
- 40px width, 32px height
- Text align center
- No visible spinner buttons
- Background transparent

```css
.ecom-qty-input {
  width: 40px;
  height: 32px;
  border: none;
  text-align: center;
  font-weight: 600;
  background: transparent;
  color: var(--text-dark);
  font-size: 0.9rem;
}

/* Hide number spinner */
.ecom-qty-input::-webkit-outer-spin-button,
.ecom-qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.ecom-qty-input[type="number"] {
  -moz-appearance: textfield;
}
```

### `.ecom-add-btn`
Add to cart button:
- Flex: 1 to fill remaining space
- Green-bright background
- White text
- Height: 32px
- Hover: darker green + lift effect
- Active: no lift (ease back down)

```css
.ecom-add-btn {
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--green-bright);
  color: var(--white);
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.ecom-add-btn:hover {
  background: var(--green-mid);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3);
}

.ecom-add-btn:active {
  transform: translateY(0);
}
```

---

## Cart Badge Styling

### `.nav-badge`
The red circle showing item count:
- Inline-block display
- Red background
- White text
- 20x20px size
- Centered content
- Pulse animation on addition

```css
.nav-badge {
  display: inline-block;
  background: var(--red);
  color: var(--white);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  animation: badgePulse 0.3s ease;
}

@keyframes badgePulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## Responsive Breakpoints

### Tablet (≤ 768px)
```css
@media (max-width: 768px) {
  .ecom-product-image-wrapper {
    height: 180px;
  }
  .ecom-product-footer {
    flex-direction: column;
    gap: 8px;
  }
  .ecom-qty-selector {
    width: 100%;
  }
  .ecom-add-btn {
    width: 100%;
  }
}
```

### Mobile (≤ 480px)
```css
@media (max-width: 480px) {
  .ecom-product-image-wrapper {
    height: 150px;
  }
  .ecom-product-name {
    font-size: 0.95rem;
  }
  .ecom-price {
    font-size: 1.1rem;
  }
}
```

---

## Color Scheme

The design uses the existing Farmer Conekt color palette:

| Variable | Hex | Usage |
|----------|-----|-------|
| `--green-deep` | #1a3c2e | Text/dark elements |
| `--green-mid` | #2d6a4f | Buttons/primary |
| `--green-bright` | #52b788 | Add button |
| `--green-light` | #95d5b2 | Category badge |
| `--cream` | #f8f4ed | Background/qty field |
| `--cream-dark` | #ede8df | Borders |
| `--red` | #e05c5c | Cart badge/discount |
| `--white` | #ffffff | Text/backgrounds |
| `--text-dark` | #1a2e1f | Primary text |
| `--text-light` | #7a9487 | Secondary text |

---

## JavaScript Functions

### `window.quickAddToCart(productId, action)`
**Parameters:**
- `productId` (number): Product ID from window.allProducts
- `action` (number): -1 (decrease), 0 (add to cart), 1 (increase)

**Behavior:**
- action = 0: Adds item with current quantity to cart
- action = -1: Decreases quantity (min 1)
- action = 1: Increases quantity
- Updates cart badge automatically
- Shows toast notification

### `window.validateQuantity(productId)`
**Ensures quantity input stays valid:**
- Minimum value of 1
- No decimals or negative
- Called on input change

### `updateCartBadge()`
**Updates cart count display:**
- Calculates total items in cart
- Sets badge text
- Shows/hides badge based on count
- Updates `#cart-count` element

---

## Animation Details

### Product Card Hover
- Duration: 0.3s
- Timing: cubic-bezier(0.4, 0, 0.2, 1)
- Effect: translateY(-6px), shadow elevation
- Image zoom: 1.08x scale over 0.4s

### Badge Pulse (on add)
- Duration: 0.3s
- Scale: 0.8 → 1.15 → 1.0
- Opacity: 0 → 1
- Creates "pop" effect

### Button Hover
- Add button: translateY(-2px) + shadow
- Active state: back to Y(0)
- Duration: 0.3s ease
- Smooth feedback

---

## Browser DevTools Tips

### Debugging Product Cards
```javascript
// In browser console:
window.allProducts.length  // See loaded products
window.cart  // See current cart
console.log(cart)  // View cart contents
```

### Testing Quick Add
```javascript
// Manually trigger add to cart:
window.quickAddToCart(1, 0)  // Add product 1 with qty 1

// Check cart badge:
document.getElementById('cart-count').textContent  // See count
```

### Local Storage
```javascript
// View cart in storage:
JSON.parse(localStorage.getItem('buyerCart'))

// Clear cart:
localStorage.removeItem('buyerCart')
```

---

## Performance Optimizations

1. **Grid Layout** - CSS Grid for efficient product layout
2. **Smooth Animations** - GPU-accelerated transforms
3. **Lazy Images** - SVG fallback + onerror handling
4. **Event Delegation** - Cards generate onclick handlers
5. **LocalStorage** - Client-side cart (no server calls needed)
