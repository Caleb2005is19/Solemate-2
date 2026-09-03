# Solemate Database Schema & Migration Guide

This document contains the complete database design, entity models, field definitions, and migration scripts for Solemate. You can copy this file, export it, or use the SQL script to spin up your database on PostgreSQL, Supabase, Neon, MySQL, or MongoDB.

---

## 1. Entity Overview & Relationships

```
 users (id) ───────< orders (userId) ────────< order_items (orderId, productId)
    │                      │                            │
    │ (role='seller')      │                            │
    v                      │                            │
 sellers (id) ─────< products (sellerId) ───────────────┘
                           │
                           ├───────< reviews (productId, userId)
                           │
 coupons (code) ────< orders (couponCode)

 Singletons / Site Configuration:
 ├─ site_settings
 ├─ theme_settings
 ├─ feature_toggles
 ├─ homepage_sections
 ├─ announcements
 ├─ content_blocks
 └─ contact_messages
```

---

## 2. Table / Collection Schemas

### 1. `users`
Represents registered customers, marketplace sellers, and administrators.
- `id` (VARCHAR / UUID, Primary Key): Unique authentication ID (e.g. Auth UID).
- `email` (VARCHAR, Unique, Required): User's login email address.
- `display_name` (VARCHAR, Required): Full name.
- `phone` (VARCHAR, Optional): Contact or M-Pesa phone number.
- `location` (TEXT, Optional): Delivery address or estate.
- `city` (VARCHAR, Optional): City / Town (e.g. Nairobi).
- `role` (VARCHAR / ENUM): `'admin'`, `'seller'`, or `'client'` (Default: `'client'`).
- `created_at` (TIMESTAMP): Account registration timestamp.

### 2. `sellers`
Multi-vendor seller accounts.
- `id` (VARCHAR / UUID, Primary Key): Links to `users.id`.
- `name` (VARCHAR, Required): Business or shop name.
- `email` (VARCHAR, Required): Shop contact email.
- `status` (VARCHAR / ENUM): `'Active'` or `'Suspended'` (Default: `'Active'`).
- `joined_date` (DATE): Onboarding date.

### 3. `products`
The sneaker catalog and inventory.
- `id` (UUID / VARCHAR, Primary Key): Product identifier.
- `name` (VARCHAR, Required): e.g. "Air Jordan 1 High OG Chicago".
- `brand` (VARCHAR, Required): e.g. "Nike", "Adidas", "New Balance", "Puma".
- `price` (NUMERIC / DECIMAL, Required): Current sale price in KES.
- `original_price` (NUMERIC / DECIMAL, Optional): Strikethrough price.
- `image` (TEXT, Required): Primary high-res thumbnail URL.
- `images` (JSONB / ARRAY): Additional product photo gallery URLs.
- `category` (VARCHAR, Required): e.g. "Lifestyle", "Running", "Basketball".
- `gender` (VARCHAR / ENUM): `'Men'`, `'Women'`, `'Unisex'`, or `'Kids'`.
- `color` (VARCHAR, Required): Primary color tag (e.g. "Red/White/Black").
- `colors` (JSONB): Variant definitions `[{ "name": "Red", "hex": "#FF0000", "images": [] }]`.
- `description` (TEXT, Required): Full product markdown / description.
- `is_new` (BOOLEAN): Badge flag for new releases.
- `in_stock` (BOOLEAN): Master stock availability flag.
- `stock` (INTEGER): Available inventory quantity.
- `seller_id` (VARCHAR / UUID, Foreign Key -> `sellers.id`, Optional).
- `created_at` (TIMESTAMP): Date added.

### 4. `orders`
Customer purchases and transactions.
- `id` (UUID / VARCHAR, Primary Key): Order identifier.
- `user_id` (VARCHAR / UUID, Foreign Key -> `users.id`, Optional for guests).
- `customer_info` (JSONB / OBJECT):
  - `firstName` (VARCHAR)
  - `lastName` (VARCHAR)
  - `email` (VARCHAR)
  - `phone` (VARCHAR)
  - `location` (TEXT)
  - `city` (VARCHAR)
- `subtotal` (NUMERIC): Order items subtotal before discounts.
- `discount` (NUMERIC): Applied coupon discount amount.
- `coupon_code` (VARCHAR, Optional): Applied promo code.
- `vat_amount` (NUMERIC): Calculated VAT / Tax.
- `delivery_fee` (NUMERIC): Shipping fee.
- `total` (NUMERIC, Required): Final amount paid.
- `status` (VARCHAR / ENUM): `'Pending'`, `'Processing'`, `'Shipped'`, `'Delivered'`, or `'Cancelled'`.
- `payment_method` (VARCHAR): `'mpesa'` or `'card'`.
- `payment_status` (VARCHAR / ENUM): `'Paid'`, `'Pending'`, or `'Failed'`.
- `mpesa_receipt` (VARCHAR, Optional): M-Pesa transaction code (e.g. SIK9X73892).
- `verification_method` (VARCHAR): `'Automatic'` or `'Manual'`.
- `seller_ids` (JSONB / ARRAY): Sellers included in this order.
- `date` (TIMESTAMP): Date order was placed.

### 5. `order_items`
Individual line items for each order.
- `id` (UUID / VARCHAR, Primary Key).
- `order_id` (UUID / VARCHAR, Foreign Key -> `orders.id` ON DELETE CASCADE).
- `product_id` (UUID / VARCHAR, Foreign Key -> `products.id` ON DELETE SET NULL).
- `name` (VARCHAR): Snapshot of product name at purchase.
- `price` (NUMERIC): Snapshot of unit price at purchase.
- `quantity` (INTEGER): Quantity purchased.
- `selected_size` (NUMERIC): Shoe size (e.g. 41, 42, 43, 44).
- `selected_color` (VARCHAR, Optional).
- `image` (TEXT, Optional).

### 6. `reviews`
Verified buyer feedback and ratings.
- `id` (UUID / VARCHAR, Primary Key).
- `product_id` (UUID / VARCHAR, Foreign Key -> `products.id` ON DELETE CASCADE).
- `user_id` (VARCHAR / UUID, Foreign Key -> `users.id` ON DELETE CASCADE).
- `user_name` (VARCHAR): Reviewer display name.
- `rating` (INTEGER): 1 through 5 stars.
- `comment` (TEXT): Review message.
- `created_at` (TIMESTAMP).

### 7. `coupons`
Discount codes.
- `id` (UUID / VARCHAR, Primary Key).
- `code` (VARCHAR, Unique): Uppercase coupon code (e.g. "SOLE20").
- `discount_percentage` (NUMERIC): Percentage discount (e.g. 20 for 20% off).
- `is_active` (BOOLEAN): Whether code can currently be redeemed.
- `max_uses` (INTEGER): Maximum allowed total usages.
- `used_count` (INTEGER): Number of times already redeemed.
- `expiry_date` (TIMESTAMP, Optional).

### 8. `settings`
Single row or key-value store for app-wide configuration.
- `key` (VARCHAR, Primary Key): `'site'`, `'theme'`, or `'features'`.
- `data` (JSONB):
  - **site**: `businessName`, `logo`, `contactEmail`, `phoneNumbers`, `whatsappNumber`, `location`, `googleMapsEmbed`, `socialMedia`, `deliveryFee`, `taxPercentage`, `currency`, etc.
  - **theme**: `primaryColor`, `secondaryColor`, `fontFamily`, `borderRadius`, `darkMode`, `buttonStyle`.
  - **features**: `enableReviews`, `enableCoupons`, `enableWishlist`, `enablePickupStation`, `enableGuestCheckout`, `maintenanceMode`.
- `updated_at` (TIMESTAMP).

### 9. `homepage_sections`
CMS layout builder for dynamic homepage sections.
- `id` (UUID / VARCHAR, Primary Key).
- `type` (VARCHAR): `'hero'`, `'featured_products'`, `'categories'`, `'banner'`, `'newsletter'`, `'dynamic_products'`, or `'trust_badges'`.
- `title` (VARCHAR, Optional).
- `subtitle` (VARCHAR, Optional).
- `content` (TEXT, Optional).
- `image` (TEXT, Optional).
- `link` (TEXT, Optional).
- `display_order` (INTEGER): Order index for sorting.
- `active` (BOOLEAN): Section visibility toggle.
- `config` (JSONB): Custom block parameters.

### 10. `announcements`
Top notification banners and alert modals.
- `id` (UUID / VARCHAR, Primary Key).
- `type` (VARCHAR): `'banner'`, `'popup'`, or `'notice'`.
- `title` (VARCHAR).
- `message` (TEXT).
- `link` (TEXT, Optional).
- `active` (BOOLEAN).
- `start_date` (TIMESTAMP, Optional).
- `end_date` (TIMESTAMP, Optional).
- `mobile_only` (BOOLEAN).
- `desktop_only` (BOOLEAN).

### 11. `contact_messages`
Inquiries submitted via the Contact form.
- `id` (UUID / VARCHAR, Primary Key).
- `name` (VARCHAR): Sender's name.
- `email` (VARCHAR): Sender's email.
- `subject` (VARCHAR, Optional).
- `message` (TEXT): Message body.
- `status` (VARCHAR): `'unread'`, `'read'`, or `'replied'`.
- `created_at` (TIMESTAMP).

### 12. `content_blocks`
Legal policies and informational pages.
- `id` (UUID / VARCHAR, Primary Key).
- `slug` (VARCHAR, Unique): e.g. `'privacy-policy'`, `'terms-of-service'`, `'shipping-returns'`.
- `title` (VARCHAR).
- `content` (TEXT).
- `last_updated` (TIMESTAMP).

---

## 3. TypeScript Interfaces

```typescript
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  location?: string;
  city?: string;
  role: 'admin' | 'seller' | 'client';
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  color: string;
  colors?: { name: string; hex: string; images: string[] }[];
  description: string;
  isNew?: boolean;
  inStock: boolean;
  stock?: number;
  sellerId?: string;
  createdAt?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize: number;
  selectedColor?: string;
  image?: string;
}

export interface Order {
  id: string;
  userId?: string;
  items: OrderItem[];
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    city: string;
  };
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  vatAmount?: number;
  deliveryFee?: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: 'mpesa' | 'card';
  paymentStatus: 'Paid' | 'Failed' | 'Pending';
  mpesaReceipt?: string;
  verificationMethod?: 'Automatic' | 'Manual';
  sellerIds?: string[];
  date: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  expiryDate?: string;
}
```
