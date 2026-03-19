export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  description: string;
  isNew?: boolean;
  inStock: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: number;
}
