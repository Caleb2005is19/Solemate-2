import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Layout, 
  Plus, 
  GripVertical, 
  Edit, 
  Trash, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X, 
  Settings, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { HomepageSection } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export function HomepageBuilderTab() {
  const { homepageSections, addHomepageSection, updateHomepageSection, deleteHomepageSection, reorderHomepageSections } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [formData, setFormData] = useState<Partial<HomepageSection>>({});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) return;

    if (editingSection) {
      await updateHomepageSection(editingSection.id, formData);
    } else {
      const nextOrder = homepageSections.length > 0 
        ? Math.max(...homepageSections.map(s => s.order)) + 1 
        : 0;
        
      await addHomepageSection({
        id: `section-${Math.random().toString(36).substr(2, 9)}`,
        type: formData.type as any,
        title: formData.title || '',
        order: nextOrder,
        active: true,
        config: formData.config || {}
      } as HomepageSection);
    }
    setIsEditing(false);
    setEditingSection(null);
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...homepageSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    await reorderHomepageSections(newSections);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
            <Layout className="w-8 h-8 text-orange-500" />
            Homepage Builder
          </h1>
          <p className="text-zinc-500 mt-1">Design your homepage by arranging and configuring content sections.</p>
        </div>
        <button
          onClick={() => { setEditingSection(null); setFormData({ type: 'hero', active: true, config: {} }); setIsEditing(true); }}
          className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add Section
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {homepageSections.map((section, index) => (
            <motion.div
              key={section.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-6 group hover:border-orange-200 transition-colors ${!section.active ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              <div className="flex flex-col gap-1">
                <button 
                  disabled={index === 0}
                  onClick={() => moveSection(index, 'up')}
                  className="p-1 text-zinc-300 hover:text-zinc-600 disabled:opacity-0"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center text-zinc-200">
                   <GripVertical className="w-5 h-5" />
                </div>
                <button 
                  disabled={index === homepageSections.length - 1}
                  onClick={() => moveSection(index, 'down')}
                  className="p-1 text-zinc-300 hover:text-zinc-600 disabled:opacity-0"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-zinc-50 rounded-2xl text-zinc-400">
                {section.type === 'hero' ? <Layout className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-zinc-900 capitalize italic tracking-tight underline decoration-orange-500/30">
                    {section.type.replace('_', ' ')}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${section.active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {section.active ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <h4 className="text-xl font-black text-zinc-800 mt-1">{section.title || 'Untitled Section'}</h4>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{section.subtitle || 'No subtitle provided.'}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateHomepageSection(section.id, { active: !section.active })}
                  className={`p-3 rounded-xl transition-all ${section.active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
                >
                  {section.active ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                </button>
                <button
                  onClick={() => { setEditingSection(section); setFormData(section); setIsEditing(true); }}
                  className="p-3 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                >
                  <Edit className="w-6 h-6" />
                </button>
                <button
                  onClick={() => deleteHomepageSection(section.id)}
                  className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {homepageSections.length === 0 && (
           <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 p-20 rounded-[3rem] text-center">
              <Layout className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-400">Homepage is empty</h3>
              <p className="text-zinc-400 max-w-xs mx-auto mt-2">Start adding sections like Hero Banners or Featured Products to build your landing page.</p>
           </div>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
          >
            <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-3xl font-black text-zinc-900">Configure Section</h2>
                <p className="text-zinc-500 font-medium">Customize the layout and content of this homepage block.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors font-black text-zinc-900 border border-zinc-200"><X className="w-8 h-8" /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Section Type</label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                       {['hero', 'featured_products', 'categories', 'banner', 'newsletter', 'trust_badges'].map(type => (
                         <button
                           key={type}
                           type="button"
                           onClick={() => setFormData({ ...formData, type: type as any })}
                           className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.type === type ? 'border-orange-500 bg-orange-50' : 'border-zinc-100 hover:border-zinc-200 bg-zinc-50'}`}
                         >
                            <span className={`text-sm font-black capitalize ${formData.type === type ? 'text-orange-600' : 'text-zinc-500'}`}>
                              {type.replace('_', ' ')}
                            </span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Display Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 outline-none focus:border-orange-500 bg-zinc-50 mt-2 font-bold text-zinc-900"
                      placeholder="e.g. New Summer Drops"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Subtitle / Description</label>
                    <textarea
                      rows={3}
                      value={formData.subtitle}
                      onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 outline-none focus:border-orange-500 bg-zinc-50 mt-2 font-medium text-zinc-700"
                      placeholder="e.g. Explore our latest exclusive collection of premium kicks."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Banner Image URL</label>
                    <div className="mt-2 space-y-4">
                      {formData.image && (
                         <div className="aspect-video rounded-3xl overflow-hidden border border-zinc-100 shadow-inner bg-zinc-50 relative group">
                            <img src={formData.image} className="w-full h-full object-cover" alt="Preview"/>
                            <button 
                              type="button" 
                              onClick={() => setFormData({...formData, image: ''})}
                              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-xl text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <Trash className="w-5 h-5"/>
                            </button>
                         </div>
                      )}
                      <input
                        type="text"
                        value={formData.image || ''}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 outline-none focus:border-orange-500 bg-zinc-50 font-bold"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Call to Action Link</label>
                    <input
                      type="text"
                      value={formData.link || ''}
                      onChange={e => setFormData({ ...formData, link: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 outline-none focus:border-orange-500 bg-zinc-50 mt-2 font-bold"
                      placeholder="/shop"
                    />
                  </div>
                  
                  {formData.type === 'featured_products' && (
                     <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex gap-4">
                        <Settings className="w-6 h-6 text-orange-500 shrink-0" />
                        <div>
                           <h4 className="font-bold text-orange-700">Automation Settings</h4>
                           <p className="text-sm text-orange-600/80">This section automatically pulls products marked as "New" or high-rated.</p>
                        </div>
                     </div>
                  )}
                </div>
              </div>
            </form>

            <div className="p-10 border-t border-zinc-100 bg-white flex justify-end gap-5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-10 py-4 rounded-2xl font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest text-sm"
              >
                Discard
              </button>
              <button
                type="submit"
                onClick={handleSave}
                className="px-16 py-4 bg-orange-500 text-white rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95 flex items-center gap-3 uppercase tracking-widest text-sm"
              >
                <Save className="w-6 h-6" />
                {editingSection ? 'Update Section' : 'Add to Home'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
