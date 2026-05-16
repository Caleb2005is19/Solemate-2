export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  location?: string;
  city?: string;
  role?: 'admin' | 'seller' | 'client';
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Suspended';
  joinedDate: string;
}

export interface ProductColor {
  name: string;
  hex?: string;
  images: string[];
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
  colors?: ProductColor[];
  description: string;
  isNew?: boolean;
  inStock: boolean;
  stock?: number;
  sellerId?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: number;
  selectedColor?: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  userId?: string;
  sellerIds?: string[];
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    city: string;
  };
  items: CartItem[];
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  date: string;
  paymentMethod: string;
  mpesaReceipt?: string;
  paymentStatus?: 'Paid' | 'Failed' | 'Pending';
  paymentError?: string;
  verificationMethod?: 'Automatic' | 'Manual';
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SiteSettings {
  businessName: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  phoneNumbers: string[];
  whatsappNumber: string;
  location: string;
  googleMapsEmbed: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  footerText: string;
  seo: {
    title: string;
    description: string;
  };
  currency: string;
  deliveryFee: number;
  taxPercentage: number;
  openingHours: string;
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  darkMode: boolean;
  buttonStyle: 'pill' | 'rounded' | 'sharp';
}

export interface FeatureToggles {
  enableReviews: boolean;
  enableCoupons: boolean;
  enableWishlist: boolean;
  enablePickupStation: boolean;
  enableGuestCheckout: boolean;
  maintenanceMode: boolean;
}

export interface ContentBlock {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface Announcement {
  id: string;
  type: 'banner' | 'popup' | 'notice';
  title: string;
  message: string;
  link?: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface HomepageSection {
  id: string;
  type: 'hero' | 'featured_products' | 'categories' | 'banner' | 'newsletter' | 'dynamic_products' | 'trust_badges';
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string;
  link?: string;
  order: number;
  active: boolean;
  config?: {
    limit?: number;
    category?: string;
    backgroundColor?: string;
    textColor?: string;
    fullWidth?: boolean;
    buttonText?: string;
    items?: { icon?: string; title: string; description: string }[];
  };
}
