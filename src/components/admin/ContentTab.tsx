import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { FileText, Plus, Edit, Trash, Search, ExternalLink, Loader2, Save, X, Globe } from 'lucide-react';
import { ContentBlock } from '../../types';

export function ContentTab() {
  const { contentBlocks, addContentBlock, updateContentBlock, deleteContentBlock } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<ContentBlock>>({
    title: '', slug: '', content: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) return;

    if (editingBlock) {
      await updateContentBlock(editingBlock.id, {
        ...formData,
        lastUpdated: new Date().toISOString()
      });
    } else {
      await addContentBlock({
        id: `block-${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title,
        slug: formData.slug,
        content: formData.content || '',
        lastUpdated: new Date().toISOString()
      } as ContentBlock);
    }
    setIsEditing(false);
    setEditingBlock(null);
    setFormData({ title: '', slug: '', content: '' });
  };

  const openEdit = (block: ContentBlock) => {
    setEditingBlock(block);
    setFormData(block);
    setIsEditing(true);
  };

  const filtered = contentBlocks.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-500" />
            Content Management
          </h1>
          <p className="text-zinc-500 mt-1">Create and manage static pages, policies, and legal content.</p>
        </div>
        <button
          onClick={() => { setEditingBlock(null); setFormData({ title: '', slug: '', content: '' }); setIsEditing(true); }}
          className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Block
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by title or slug..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(block => (
          <div key={block.id} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEdit(block)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                   onClick={() => deleteContentBlock(block.id)}
                   className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-1">{block.title}</h3>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1">
               <Globe className="w-3 h-3" /> /{block.slug}
            </p>
            <div className="text-sm text-zinc-500 line-clamp-3 mb-6 font-medium leading-relaxed">
              {block.content.replace(/<[^>]*>/g, '')}
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50">
               <span className="text-[10px] font-black text-zinc-400 uppercase">
                 Updated {new Date(block.lastUpdated).toLocaleDateString()}
               </span>
               <a 
                 href={`/p/${block.slug}`} 
                 target="_blank" 
                 rel="noreferrer"
                 className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1"
               >
                 View <ExternalLink className="w-3 h-3" />
               </a>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 h-[80vh] flex flex-col">
            <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-2xl font-black text-zinc-900">{editingBlock ? 'Edit Content Block' : 'Create Content Block'}</h2>
                <p className="text-sm text-zinc-500">HTML is supported for advanced formatting.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Page Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 mt-1"
                    placeholder="e.g. Terms of Service"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 mt-1"
                    placeholder="e.g. terms-of-service"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Content (Markdown/HTML Support)</label>
                <textarea
                  required
                  rows={15}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-6 py-4 rounded-3xl border border-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 mt-1 font-mono text-sm leading-relaxed"
                  placeholder="Paste your content here..."
                />
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
                Save Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
