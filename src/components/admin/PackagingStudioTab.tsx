import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Download,
  Move3d,
  Palette,
  QrCode,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { buildPackagingThemes } from '../../utils/packagingPresets';
import obsidianMockup from '../../assets/images/solemate_bag_obsidian_mockup_1794746572009.jpg';
import kraftMockup from '../../assets/images/solemate_bag_kraft_mockup_1794746572028.jpg';
import orangeMockup from '../../assets/images/solemate_bag_orange_mailer_1794746572544.jpg';

const MOCKUP_CONCEPTS = [
  {
    id: 'obsidian',
    title: 'Obsidian Streetwear Carrier',
    subtitle: 'Matte Black 250gsm · Spot Brand Accent & White',
    image: obsidianMockup
  },
  {
    id: 'kraft',
    title: 'Nairobi Kraft Boutique Bag',
    subtitle: '180gsm Natural Virgin Kraft · 2-Color Screen Print',
    image: kraftMockup
  },
  {
    id: 'blaze',
    title: 'Blaze Drop Non-Woven Tote',
    subtitle: 'High-Visibility Orange Stock · Vertical Band',
    image: orangeMockup
  }
];

export function PackagingStudioTab() {
  const { themeSettings, siteSettings } = useStore();
  const brandThemes = buildPackagingThemes(themeSettings, siteSettings).slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Studio Launch Hero Banner */}
      <div className="bg-zinc-950 text-white rounded-2xl p-6 sm:p-8 border border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
            <Sparkles className="w-4 h-4" />
            Full-Screen Print &amp; 3D CAD Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Packaging &amp; Bag Print Studio
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Design Uhuru carrier bags (S/M/L), rope &amp; ribbon Gift Bags, Single/Double/Drawer Sneaker Boxes, and Courier Mailers synced to your live store colors — with an interactive 3D mockup viewer and verified scannable QR codes.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {brandThemes.map((t) => (
              <div
                key={t.id}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
              >
                <span
                  className="w-3.5 h-3.5 rounded-sm border border-white/20"
                  style={{ backgroundColor: t.bagHex }}
                />
                <span className="text-zinc-300 font-medium">{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <Link
            to="/admin/packaging"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
          >
            <Move3d className="w-4 h-4" />
            Open Full-Page 3D Studio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Capabilities Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            icon: ShoppingBag,
            title: 'Uhuru, Gift & Mailer Bags',
            desc: 'Small, Medium & Large Uhuru carriers, rope/ribbon gift bags, poly mailers & dust pouches.'
          },
          {
            icon: Box,
            title: 'Sneaker Box Die-Lines',
            desc: 'Single flip-top, oversized double collector, and slide-out drawer boxes with top lid art.'
          },
          {
            icon: Palette,
            title: 'Auto Store Theme Sync',
            desc: 'Derives bag colorways automatically from your active site theme colors, logo & WhatsApp.'
          },
          {
            icon: QrCode,
            title: 'Guaranteed Scannable QR',
            desc: '4-module quiet zone matrix QR codes with live camera scan check & placement options.'
          }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-2"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Studio Concept Reference Mockups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900">Photorealistic Reference Concepts</h2>
          <Link
            to="/admin/packaging"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
          >
            Customize in 3D Studio
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MOCKUP_CONCEPTS.map((concept) => (
            <div
              key={concept.id}
              className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[3/4] bg-zinc-100 overflow-hidden">
                <img
                  src={concept.image}
                  alt={concept.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-zinc-900 truncate">{concept.title}</h3>
                  <p className="text-xs text-zinc-500 truncate">{concept.subtitle}</p>
                </div>
                <a
                  href={concept.image}
                  download={`solemate-${concept.id}-bag-mockup.jpg`}
                  className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold inline-flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  JPG
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
