import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Mail, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ExternalLink, 
  Building2, 
  Smartphone, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { toast } from './Toast';

export interface UserLead {
  id: number;
  name: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  message?: string;
  city?: string;
  status: 'new' | 'converted';
  source?: string;
  created_at: string;
}

interface ProfileLeadsManagerProps {
  profile: any;
}

export const ProfileLeadsManager: React.FC<ProfileLeadsManagerProps> = ({ profile }) => {
  const [leads, setLeads] = useState<UserLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'converted'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeads = async (showToastFeedback = false) => {
    if (!profile?.id) return;
    if (showToastFeedback) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/leads/profile/${profile.id}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        if (showToastFeedback) toast.success('Leads list updated.');
      }
    } catch (err: any) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
      if (showToastFeedback) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [profile?.id]);

  const handleUpdateStatus = async (leadId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'converted' ? 'new' : 'converted';
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l));
        toast.success(nextStatus === 'converted' ? 'Marked as Converted!' : 'Marked as New Lead');
      }
    } catch (e: any) {
      toast.error('Failed to update lead status');
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!window.confirm('Are you sure you want to delete this captured lead?')) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        toast.success('Lead removed');
      }
    } catch (e) {
      toast.error('Failed to delete lead');
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) {
      toast.error('No leads available to export.');
      return;
    }

    const headers = ['Name', 'WhatsApp / Phone', 'Email', 'Company', 'Note', 'Status', 'Date Captured'];
    const rows = leads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${l.status || 'new'}"`,
      `"${l.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chipng_leads_${profile.username || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads CSV downloaded successfully!');
  };

  const filteredLeads = leads.filter(l => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter || (!l.status && statusFilter === 'new');
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (l.name && l.name.toLowerCase().includes(query)) ||
      (l.whatsapp && l.whatsapp.includes(query)) ||
      (l.email && l.email.toLowerCase().includes(query)) ||
      (l.company && l.company.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const totalCount = leads.length;
  const newCount = leads.filter(l => l.status === 'new' || !l.status).length;
  const convertedCount = leads.filter(l => l.status === 'converted').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-white dark:bg-[#111318] border border-neutral-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D2F843]/20 flex items-center justify-center text-[#5b7300] dark:text-[#D2F843]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 dark:text-white tracking-tight">
                  Lead Generation CRM
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold">
                  2-Way Tap Sync
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Every prospect who submits their contact info on your CHIP card or digital profile appears here.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => fetchLeads(true)}
              className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Refresh leads"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#6c8600] dark:text-[#D2F843]' : ''}`} />
            </button>

            <button
              onClick={exportCSV}
              disabled={leads.length === 0}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
              Total Captured Leads
            </span>
            <div className="text-3xl font-extrabold text-neutral-950 dark:text-white mt-1">
              {totalCount}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Via physical NFC taps & bio link
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              New / Awaiting Follow-Up
            </span>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {newCount}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Ready for 1-click WhatsApp chat
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-[#D2F843] uppercase tracking-wider block">
              Converted Deals & Contacts
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-[#D2F843] mt-1">
              {convertedCount}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Successfully networked & closed
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111318] border border-neutral-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial ${
              statusFilter === 'all'
                ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial ${
              statusFilter === 'new'
                ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            New ({newCount})
          </button>
          <button
            onClick={() => setStatusFilter('converted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial ${
              statusFilter === 'converted'
                ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            Converted ({convertedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, WhatsApp, company..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 rounded-xl text-xs text-neutral-950 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-950 dark:focus:border-white"
          />
        </div>
      </div>

      {/* Leads List or Empty State */}
      <div className="bg-white dark:bg-[#111318] border border-neutral-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#D2F843]" />
            <span>Loading captured leads...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 sm:p-16 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center text-neutral-400 mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-neutral-950 dark:text-white">
              {searchQuery ? 'No matching leads found' : 'No leads captured yet'}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
              {searchQuery 
                ? 'Try searching with a different term or clear the filter.' 
                : 'When prospects tap your physical CHIP card or view your digital bio link and share their contact information, they will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-white/5">
            {filteredLeads.map((lead) => {
              const cleanPhone = (lead.whatsapp || '').replace(/[^0-9]/g, '');
              const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(lead.name)},%20it%20was%20great%20connecting%20via%20CHIP%20NG!` : null;
              const isConverted = lead.status === 'converted';

              return (
                <div
                  key={lead.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-neutral-950 dark:text-white truncate">
                          {lead.name}
                        </h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          isConverted 
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#D2F843] border border-emerald-500/30' 
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}>
                          {isConverted ? 'Converted' : 'New Lead'}
                        </span>
                      </div>

                      {lead.company && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{lead.company}</span>
                        </div>
                      )}

                      {lead.message && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 p-2.5 rounded-xl bg-neutral-100/60 dark:bg-white/5 border border-neutral-200/50 dark:border-white/5">
                          "{lead.message}"
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(lead.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {lead.city && <span>• {lead.city}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        title="Chat with lead on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}?subject=Great%20connecting%20via%20CHIP%20NG`}
                        className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-800 dark:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Send email to lead"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(lead.id, lead.status)}
                      className="px-3 py-2 rounded-xl border border-neutral-200/80 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                      title={isConverted ? 'Mark as New' : 'Mark as Converted'}
                    >
                      {isConverted ? 'Revert to New' : '✓ Mark Converted'}
                    </button>

                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
