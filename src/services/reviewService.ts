import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Review } from '../types';

export const reviewService = {
  async getReviews(productId: string): Promise<Review[]> {
    if (!db) return [];
    
    try {
      const reviewsRef = collection(db, 'products', productId, 'reviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  },

  async addReview(productId: string, userId: string, userName: string, rating: number, comment: string): Promise<Review | null> {
    if (!db) return null;

    try {
      const reviewsRef = collection(db, 'products', productId, 'reviews');
      const newReview = {
        productId,
        userId,
        userName,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(reviewsRef, newReview);
      return { 
        id: docRef.id, 
        ...newReview 
      };
    } catch (error) {
      console.error("Error adding review:", error);
      return null;
    }
  },

  async hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    if (!db) return false;

    try {
      const ordersRef = collection(db, 'orders');
      const querySnapshot = await getDocs(ordersRef);
      
      // Simple check local: filter orders for this user and containing this product
      // In a real app we'd use a better query, but for now this works given the structure
      const userOrders = querySnapshot.docs.map(doc => doc.data());
      
      return userOrders.some(order => 
        order.userId === userId && 
        order.status === 'Delivered' && 
        order.items.some((item: any) => item.id === productId)
      );
    } catch (error) {
      console.error("Error checking purchase history:", error);
      return false;
    }
  }
};
