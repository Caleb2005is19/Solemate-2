import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Inbox, Mail, User, Clock, Trash, CheckCircle, Search, MailOpen, AlertCircle, X, Reply } from 'lucide-react';
import { format } from 'date-fns';
import { ContactMessage } from '../../types';

export function MessagesTab() {
  const { contactMessages, updateContactMessage, deleteContactMessage } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

  const handleRead = async (msg: ContactMessage) => {
    setSelectedMsg(msg);
    if (msg.status === 'unread') {
      await updateContactMessage(msg.id, { status: 'read' });
    }
  };

  const markReplied = async (id: string) => {
    await updateContactMessage(id, { status: 'replied' });
    setSelectedMsg(prev => prev ? { ...prev, status: 'replied' } : null);
  };

  const filtered = contactMessages.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
          <Inbox className="w-8 h-8 text-orange-500" />
          Customer Messages
        </h1>
        <p className="text-zinc-500 mt-1">Inquiries from the contact form and customer support requests.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar/List */}
        <div className="w-full md:w-1/3 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[70vh] custom-scrollbar pr-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 font-bold">No messages found.</div>
            ) : filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => handleRead(msg)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedMsg?.id === msg.id 
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-200' 
                  : msg.status === 'unread'
                  ? 'bg-white border-zinc-200 shadow-sm'
                  : 'bg-zinc-50 border-transparent text-zinc-500'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] uppercase font-black tracking-widest ${selectedMsg?.id === msg.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {msg.status}
                  </span>
                  <span className="text-[10px] font-bold opacity-75">{format(new Date(msg.createdAt), 'MMM dd')}</span>
                </div>
                <h4 className="font-bold truncate">{msg.subject}</h4>
                <p className={`text-xs truncate ${selectedMsg?.id === msg.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{msg.name}</p>
                {msg.status === 'unread' && (
                  <div className="absolute right-2 top-2 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Reader */}
        <div className="flex-1 bg-white rounded-3xl border border-zinc-100 shadow-sm min-h-[500px] flex flex-col">
          {selectedMsg ? (
            <div className="flex-1 flex flex-col animate-in fade-in duration-300">
              <div className="p-8 border-b border-zinc-50 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-500">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900">{selectedMsg.subject}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-zinc-600">{selectedMsg.name}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-sm text-zinc-500 underline">{selectedMsg.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteContactMessage(selectedMsg.id).then(() => setSelectedMsg(null))}
                    className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex items-center gap-2 mb-6 text-xs font-black text-zinc-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" /> Received {format(new Date(selectedMsg.createdAt), 'PPPP p')}
                </div>
                <div className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                  {selectedMsg.message}
                </div>
              </div>
              <div className="p-8 border-t border-zinc-50 bg-zinc-50/50 flex gap-4">
                <a
                  href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                  onClick={() => markReplied(selectedMsg.id)}
                  className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-black hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Reply className="w-5 h-5" /> Reply via Email
                </a>
                <button
                  onClick={() => markReplied(selectedMsg.id)}
                  disabled={selectedMsg.status === 'replied'}
                  className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${selectedMsg.status === 'replied' ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                >
                  <CheckCircle className="w-5 h-5" />
                  {selectedMsg.status === 'replied' ? 'Marked as Replied' : 'Mark Replied'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 p-10 text-center">
              <MailOpen className="w-20 h-20 mb-6 opacity-20" />
              <h3 className="text-xl font-bold text-zinc-400">Select a message to read</h3>
              <p className="max-w-xs mt-2 font-medium">Keep your customers happy by responding quickly to their inquiries.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
