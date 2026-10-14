import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter, Clock } from 'lucide-react';
import { Logo } from './Logo';
import { useStore } from '../context/StoreContext';
import { formatDisplayPhone } from '../utils/contactHelpers';

export function Footer() {
  const { siteSettings } = useStore();

  const businessName = siteSettings?.businessName || 'Solemate.co.ke';
  const location = siteSettings?.location || 'Nairobi CBD, Kenya';
  const phone = siteSettings?.phoneNumbers?.[0] || siteSettings?.whatsappNumber || '+254 700 000 000';
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const email = siteSettings?.contactEmail || 'hello@solemate.co.ke';
  const openingHours = siteSettings?.openingHours || 'Mon - Sat: 8:00 AM - 8:00 PM';

  const instagram = siteSettings?.socialMedia?.instagram;
  const facebook = siteSettings?.socialMedia?.facebook;
  const twitter = siteSettings?.socialMedia?.twitter;

  const getSocialUrl = (input?: string, base?: string) => {
    if (!input) return '#';
    if (input.startsWith('http')) return input;
    const clean = input.replace(/^@/, '');
    return `${base}${clean}`;
  };

  return (
    <footer className="bg-zinc-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="Solemate Home">
              <Logo variant="icon" size={34} color="#f97316" />
              <div className="flex flex-col leading-none">
                <span className="font-black text-xl tracking-tight text-white">
                  Solemate<span className="text-orange-500">.co.ke</span>
                </span>
                <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-400 uppercase -mt-0.5">
                  SOLE MATE KE
                </span>
              </div>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Nairobi's premium destination for authentic sneakers and footwear. We bring you the latest drops and timeless classics.
            </p>
            <div className="flex gap-4">
              <a
                href={getSocialUrl(instagram, 'https://instagram.com/')}
                target={instagram ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label="Solemate Instagram page"
                className="p-2 bg-white/5 rounded-full hover:bg-orange-500 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={getSocialUrl(facebook, 'https://facebook.com/')}
                target={facebook ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label="Solemate Facebook page"
                className="p-2 bg-white/5 rounded-full hover:bg-orange-500 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={getSocialUrl(twitter, 'https://twitter.com/')}
                target={twitter ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label="Solemate Twitter page"
                className="p-2 bg-white/5 rounded-full hover:bg-orange-500 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="font-bold text-lg mb-6 text-white">Quick Links</p>
            <ul className="space-y-4 text-zinc-400 text-sm">
              <li><Link to="/shop" className="hover:text-orange-500 transition-colors">Shop All</Link></li>
              <li><Link to="/shop?gender=Men" className="hover:text-orange-500 transition-colors">Men's Collection</Link></li>
              <li><Link to="/shop?gender=Women" className="hover:text-orange-500 transition-colors">Women's Collection</Link></li>
              <li><Link to="/shop?wishlist=true" className="hover:text-orange-500 transition-colors">My Wishlist</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <p className="font-bold text-lg mb-6 text-white">Customer Service</p>
            <ul className="space-y-4 text-zinc-400 text-sm">
              <li><Link to="/profile" className="hover:text-orange-500 transition-colors">My Account</Link></li>
              <li><Link to="/my-orders" className="hover:text-orange-500 transition-colors">Track Order</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Returns & Exchanges</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <p className="font-bold text-lg mb-6 text-white">Contact Us</p>
            <ul className="space-y-4 text-zinc-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <span>{location}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-orange-500 shrink-0" />
                <a href={`tel:${cleanPhone}`} className="hover:text-orange-400 transition-colors">
                  {formatDisplayPhone(phone)}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-orange-500 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-orange-400 transition-colors">
                  {email}
                </a>
              </li>
              {openingHours && (
                <li className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
                  <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{openingHours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center text-zinc-500 text-xs">
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved. Authentic Sneakers Kenya.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms-of-service" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
