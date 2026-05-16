import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Palette, Type, Square, Layout, Save, Loader2, Check } from 'lucide-react';
import { ThemeSettings } from '../../types';

export function ThemeSettingsTab() {
  const { themeSettings, updateThemeSettings } = useStore();
  const [formData, setFormData] = useState<Partial<ThemeSettings>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (themeSettings) {
      setFormData(themeSettings);
    }
  }, [themeSettings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateThemeSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Theme Customization</h1>
          <p className="text-sm text-zinc-500">Change your site's appearance without touching a single line of code.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Apply Theme'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colors */}
        <section className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-zinc-900">Colors & Palette</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-900">Primary Color</p>
                <p className="text-xs text-zinc-500">Buttons, links, and main accents</p>
              </div>
              <input
                type="color"
                value={formData.primaryColor || '#f97316'}
                onChange={e => handleInputChange('primaryColor', e.target.value)}
                className="w-14 h-12 p-1 rounded-xl border border-zinc-200 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-900">Secondary Color</p>
                <p className="text-xs text-zinc-500">Secondary actions and backgrounds</p>
              </div>
              <input
                type="color"
                value={formData.secondaryColor || '#18181b'}
                onChange={e => handleInputChange('secondaryColor', e.target.value)}
                className="w-14 h-12 p-1 rounded-xl border border-zinc-200 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Typography & Shapes */}
        <section className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Type className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-zinc-900">Typography & Shapes</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Font Family</label>
              <select
                value={formData.fontFamily || 'Inter'}
                onChange={e => handleInputChange('fontFamily', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none bg-white font-medium mt-1"
              >
                <option value="Inter">Inter (Modern & Clean)</option>
                <option value="Space Grotesk">Space Grotesk (Tech & Bold)</option>
                <option value="Playfair Display">Playfair Display (Elegant)</option>
                <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Button Style</label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                {(['pill', 'rounded', 'sharp'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => handleInputChange('buttonStyle', style)}
                    className={`px-4 py-3 rounded-xl border font-bold text-sm capitalize transition-all ${formData.buttonStyle === style ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Border Radius</label>
              <select
                value={formData.borderRadius || '1rem'}
                onChange={e => handleInputChange('borderRadius', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none bg-white font-medium mt-1"
              >
                <option value="0px">None (Sharp)</option>
                <option value="0.5rem">Subtle (Rounded)</option>
                <option value="1rem">Cozy (More Rounded)</option>
                <option value="2rem">Organic (Extra Rounded)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Live Preview Card */}
        <section className="md:col-span-2 bg-zinc-900 p-8 rounded-[2rem] text-white">
          <div className="flex items-center gap-3 mb-6">
            <Layout className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold">Quick UI Preview</h2>
          </div>
          <div className="bg-white rounded-3xl p-8" style={{ borderRadius: formData.borderRadius }}>
            <div className="flex flex-col md:flex-row gap-6 items-center text-zinc-900">
              <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center" style={{ borderRadius: `calc(${formData.borderRadius} / 1.5)` }}>
                <Palette className="w-10 h-10 text-zinc-400" style={{ color: formData.primaryColor }} />
              </div>
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-black" style={{ fontFamily: formData.fontFamily }}>Your Store Branding</h3>
                <p className="text-zinc-500 text-sm">This is how your theme settings will apply to your components.</p>
              </div>
              <div className="md:ml-auto flex gap-3">
                <button 
                  className={`px-8 py-3 font-black text-white shadow-lg transition-transform active:scale-95`} 
                  style={{ 
                    backgroundColor: formData.primaryColor,
                    borderRadius: formData.buttonStyle === 'pill' ? '999px' : formData.buttonStyle === 'sharp' ? '0px' : formData.borderRadius
                  }}
                >
                  Buy Now
                </button>
                <button 
                  className={`px-8 py-3 font-bold border-2 border-zinc-100 text-zinc-900 transition-transform active:scale-95`}
                  style={{ 
                    borderRadius: formData.buttonStyle === 'pill' ? '999px' : formData.buttonStyle === 'sharp' ? '0px' : formData.borderRadius
                  }}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
