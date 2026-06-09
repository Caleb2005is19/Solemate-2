import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, CheckCircle2, AlertTriangle, Calendar, Users, Eye, EyeOff, Sparkles, RefreshCw } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { formatPrice } from '../../utils';

interface CouponItem {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  maxUses?: number;
  usedCount?: number;
  expiryDate?: string;
}

export function CouponsTab() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create Coupon Form States
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState(15);
  const [newMaxUses, setNewMaxUses] = useState(100);
  const [newExpiry, setNewExpiry] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setRefreshing(true);
      if (!db) {
        console.warn('Firestore is not initialized.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      const list: CouponItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          code: data.code,
          discountPercentage: Number(data.discountPercentage ?? data.discount ?? 0),
          isActive: data.isActive !== false,
          maxUses: data.maxUses ?? 100,
          usedCount: data.usedCount ?? 0,
          expiryDate: data.expiryDate || '',
        });
      });
      setCoupons(list);
    } catch (err: any) {
      console.error('Error fetching coupons on client:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const formattedCode = newCode.trim().toUpperCase();
    if (!formattedCode) {
      setFormError('Please enter a coupon code e.g. OFF20');
      return;
    }

    if (newDiscount <= 0 || newDiscount > 100) {
      setFormError('Discount percentage must be between 1 and 100');
      return;
    }

    // Check if duplicate code exists
    const isDuplicate = coupons.some(c => c.code === formattedCode);
    if (isDuplicate) {
      setFormError(`Coupon code "${formattedCode}" already exists.`);
      return;
    }

    if (!db) {
      setFormError('Firebase is not initialized. Please configure API keys first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const couponPayload = {
        code: formattedCode,
        discountPercentage: Number(newDiscount),
        isActive: true,
        maxUses: Number(newMaxUses),
        usedCount: 0,
        expiryDate: newExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Defaults to 30 days
      };

      await addDoc(collection(db, 'coupons'), couponPayload);
      setFormSuccess(`Coupon "${formattedCode}" created successfully!`);
      setNewCode('');
      setNewDiscount(15);
      await fetchCoupons();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    if (!db) return;
    try {
      const nextActiveState = !coupon.isActive;
      // Sync local state immediately for instant feedback
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: nextActiveState } : c));

      await updateDoc(doc(db, 'coupons', coupon.id), {
        isActive: nextActiveState
      });
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      // Rollback
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: coupon.isActive } : c));
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon? The coupon will no longer be valid for users.')) return;
    if (!db) return;
    try {
      // Optimistic delete
      const previousCoupons = [...coupons];
      setCoupons(prev => prev.filter(c => c.id !== id));

      await deleteDoc(doc(db, 'coupons', id));
    } catch (err) {
      console.error('Error deleting coupon:', err);
      await fetchCoupons(); // revert
    }
  };

  const seedSampleCoupons = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const samples = [
        { code: 'SOLE20', discountPercentage: 20, isActive: true, maxUses: 200, usedCount: 14, expiryDate: '2026-12-31' },
         { code: 'WELCOME10', discountPercentage: 10, isActive: true, maxUses: 500, usedCount: 88, expiryDate: '2026-08-30' },
         { code: 'KICKS15', discountPercentage: 15, isActive: true, maxUses: 100, usedCount: 3, expiryDate: '2026-06-30' },
         { code: 'VIP30', discountPercentage: 30, isActive: false, maxUses: 50, usedCount: 50, expiryDate: '2026-05-15' }
      ];

      for (const sample of samples) {
        if (!coupons.some(c => c.code === sample.code)) {
          await addDoc(collection(db, 'coupons'), sample);
        }
      }
      await fetchCoupons();
    } catch (err) {
      console.error('Error seeding coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-zinc-800 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2 text-zinc-100">
            <Ticket className="w-6 h-6 text-orange-500" />
            Promo Coupon Codes
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Configure discount codes for customer purchases, seasonal offers, and marketing campaigns.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchCoupons}
            disabled={refreshing}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-100 rounded-xl transition-all disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {coupons.length === 0 && !loading && (
            <button
              onClick={seedSampleCoupons}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-sm font-bold transition-all"
            >
              <Sparkles className="w-4 h-4" /> Seed Samples
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Creation Form (Col Span 4) */}
        <div className="lg:col-span-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-1.5 border-b border-zinc-800 pb-3">
            <Plus className="w-5 h-5 text-orange-500" />
            Create New Coupon
          </h3>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label htmlFor="code-input" className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-1.5">Coupon Code (Uppercase)</label>
              <input
                id="code-input"
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. SNEAKER25"
                required
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500 uppercase font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="discount-input" className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-1.5">Discount %</label>
                <input
                  id="discount-input"
                  type="number"
                  min="1"
                  max="100"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div>
                <label htmlFor="uses-input" className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-1.5">Max Uses</label>
                <input
                  id="uses-input"
                  type="number"
                  min="1"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label htmlFor="expiry-input" className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-1.5">Expiry Date</label>
              <input
                id="expiry-input"
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold"
              />
            </div>

            {formError && (
              <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold leading-relaxed">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-green-950/50 border border-green-500/30 text-green-400 rounded-xl text-xs font-bold leading-relaxed">
                {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Coupon Code'}
            </button>
          </form>
        </div>

        {/* Coupons List Display (Col Span 8) */}
        <div className="lg:col-span-8 bg-zinc-900/10 rounded-2xl border border-zinc-800">
          <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
            <h3 className="text-lg font-bold text-zinc-100">Configured Coupons ({coupons.length})</h3>
            <span className="text-xs uppercase px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 font-bold">Standard Store Mode</span>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="py-20 text-center flex flex-col justify-center items-center gap-3">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-500 font-medium">Fetching active store coupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="py-16 text-center max-w-sm mx-auto space-y-4">
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl flex items-center justify-center mx-auto">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-300">No promo coupons yet</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Create your first promotion code in the form to start receiving discounted M-Pesa or Card orders.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`relative p-5 rounded-2xl border transition-all ${
                      coupon.isActive 
                        ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700' 
                        : 'bg-zinc-950/20 border-zinc-900 opacity-60'
                    }`}
                  >
                    {/* Active/Inactive Ribbon */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-xl font-black text-sm tracking-wide flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        {coupon.code}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            coupon.isActive 
                              ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'
                          }`}
                          title={coupon.isActive ? 'Suspend Coupon' : 'Activate Coupon'}
                        >
                          {coupon.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Offer metrics */}
                    <div className="space-y-3.5 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Discount Percentage</span>
                        <span className="font-bold text-emerald-400">{coupon.discountPercentage}% Off</span>
                      </div>

                      {/* Usage progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Users className="w-3 h-3 text-orange-500" /> Uses limit
                          </span>
                          <span className="font-bold text-zinc-300">
                            {coupon.usedCount ?? 0} / {coupon.maxUses ?? 'No limit'}
                          </span>
                        </div>
                        {coupon.maxUses && (
                          <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                            <div 
                              className="bg-orange-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (((coupon.usedCount ?? 0) / (coupon.maxUses || 1)) * 100))}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {coupon.expiryDate && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 border-t border-zinc-900 pt-2.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Expires: <strong>{coupon.expiryDate}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
