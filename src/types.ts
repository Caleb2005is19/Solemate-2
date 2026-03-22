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

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  color: string;
  description: string;
  isNew?: boolean;
  inStock: boolean;
  sellerId?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: number;
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
  status: OrderStatus;
  date: string;
  paymentMethod: string;
}
