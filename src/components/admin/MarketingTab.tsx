import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Bell, Plus, Edit, Trash, CheckCircle2, XCircle, Layout, Smartphone, Monitor, Calendar, Link as LinkIcon, Save, X, Megaphone } from 'lucide-react';
import { Announcement } from '../../types';

export function MarketingTab() {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  
  const [formData, setFormData] = useState<Partial<Announcement>>({
    type: 'banner', title: '', message: '', active: true, mobileOnly: false, desktopOnly: false
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.type) return;

    if (editingAnn) {
      await updateAnnouncement(editingAnn.id, formData);
    } else {
      await addAnnouncement({
        id: `ann-${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title,
        message: formData.message || '',
        type: formData.type as any,
        active: formData.active || false,
        link: formData.link,
        mobileOnly: formData.mobileOnly,
        desktopOnly: formData.desktopOnly,
        startDate: formData.startDate,
        endDate: formData.endDate,
      } as Announcement);
    }
    setIsEditing(false);
    setEditingAnn(null);
    setFormData({ type: 'banner', title: '', message: '', active: true, mobileOnly: false, desktopOnly: false });
  };

  const toggleStatus = async (ann: Announcement) => {
    await updateAnnouncement(ann.id, { active: !ann.active });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-orange-500" />
            Marketing & Announcements
          </h1>
          <p className="text-zinc-500 mt-1">Manage top banners, promo popups, and site-wide notices.</p>
        </div>
        <button
          onClick={() => { setEditingAnn(null); setFormData({ type: 'banner', title: '', message: '', active: true }); setIsEditing(true); }}
          className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" /> Create Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-zinc-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mb-6">
              <Bell className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">No announcements yet</h3>
            <p className="text-zinc-500 mt-1 max-w-sm">Use announcements to inform customers about sales, holiday hours, or new arrivals.</p>
          </div>
        ) : announcements.map(ann => (
          <div key={ann.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center gap-6 group">
            <div className={`p-4 rounded-2xl flex-shrink-0 ${ann.type === 'popup' ? 'bg-indigo-50 text-indigo-500' : ann.type === 'banner' ? 'bg-orange-50 text-orange-500' : 'bg-zinc-50 text-zinc-500'}`}>
              {ann.type === 'popup' ? <Layout className="w-6 h-6" /> : ann.type === 'banner' ? <Monitor className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-zinc-900">{ann.title}</h3>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${ann.active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  {ann.active ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-sm text-zinc-500 line-clamp-1">{ann.message}</p>
              <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  {ann.mobileOnly ? <Smartphone className="w-3 h-3" /> : ann.desktopOnly ? <Monitor className="w-3 h-3" /> : <><Smartphone className="w-3 h-3" /><Monitor className="w-3 h-3" /></>}
                  Devices
                </span>
                {ann.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(ann.startDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStatus(ann)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${ann.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                {ann.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {ann.active ? 'Running' : 'Paused'}
              </button>
              <button
                onClick={() => { setEditingAnn(ann); setFormData(ann); setIsEditing(true); }}
                className="p-3 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => deleteAnnouncement(ann.id)}
                className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-2xl font-black text-zinc-900">{editingAnn ? 'Edit Announcement' : 'New Announcement'}</h2>
                <p className="text-sm text-zinc-500">Configure how and where your notice appears.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none bg-white font-medium mt-1"
                  >
                    <option value="banner">Top Banner</option>
                    <option value="popup">Center Popup</option>
                    <option value="notice">Floating Notice</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Message Content</label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 mt-1 resize-none"
                  placeholder="e.g. Get 20% off all sneakers this weekend! Use code SHOE20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Redirect Link (Optional)</label>
                <div className="relative mt-1">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={formData.link || ''}
                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://solemate.co.ke/sale/sneakers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mobileOnly: !formData.mobileOnly, desktopOnly: false })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border font-bold transition-all ${formData.mobileOnly ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-zinc-200 text-zinc-500'}`}
                >
                  <Smartphone className="w-5 h-5" /> Mobile Only
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, desktopOnly: !formData.desktopOnly, mobileOnly: false })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border font-bold transition-all ${formData.desktopOnly ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-zinc-200 text-zinc-500'}`}
                >
                  <Monitor className="w-5 h-5" /> Desktop Only
                </button>
              </div>
            </form>
            <div className="p-8 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-8 py-3 rounded-2xl font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSave}
                className="px-12 py-3 bg-zinc-900 text-white rounded-2xl font-black hover:bg-zinc-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingAnn ? 'Update' : 'Launch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
