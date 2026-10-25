import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  X, 
  Loader2, 
  User, 
  Phone, 
  Droplet, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SearchMember {
  id: string;
  member_id: string;
  full_name: string;
  phone: string | null;
  blood_group: string | null;
  photo_url: string | null;
  status: string | null;
  member_type: string | null;
  occupation: string | null;
}

export const AdminHeaderSearch: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, member_id, full_name, phone, blood_group, photo_url, status, member_type, occupation')
          .or(`member_id.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
          .order('created_at', { ascending: false })
          .limit(8);

        if (!error && data) {
          setResults(data as SearchMember[]);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Realtime member search error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectMember = (member: SearchMember) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/admin/members?search=${encodeURIComponent(member.member_id || member.full_name)}`);
  };

  const handleKeyDownNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        handleSelectMember(results[selectedIndex]);
      } else if (query.trim()) {
        e.preventDefault();
        setIsOpen(false);
        navigate(`/admin/members?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#0B6B3A]" />
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim() || results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDownNav}
          placeholder={
            language === 'bn'
              ? 'সদস্যের ID, নাম বা মোবাইল নম্বর দিয়ে সার্চ করুন...'
              : 'Search member by ID, name or phone...'
          }
          className="w-full h-10 pl-10 pr-16 bg-slate-100/80 hover:bg-slate-100/95 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-full border border-slate-200/80 focus:border-[#0B6B3A] focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/20 transition-all duration-200 shadow-2xs"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-3 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 bg-white/80 text-[10px] font-semibold text-slate-400 pointer-events-none shadow-2xs">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        )}
      </div>

      {/* Real-time Search Results Floating Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-200/90 z-50 overflow-hidden animate-in fade-in-50 zoom-in-98 duration-150">
          {/* Header bar */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0B6B3A] animate-pulse" />
              {language === 'bn' ? 'অনুসন্ধানের ফলাফল' : 'Real-time Results'}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {results.length} {language === 'bn' ? 'জন সদস্য' : 'members'}
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 p-1.5">
            {isLoading && results.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0B6B3A]" />
                <p className="text-xs font-medium">
                  {language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching members...'}
                </p>
              </div>
            ) : results.length > 0 ? (
              results.map((member, idx) => {
                const isSelected = selectedIndex === idx;
                const status = (member.status || 'pending').toLowerCase();
                const isApproved = status === 'approved' || status === 'active';
                const isPending = status === 'pending';

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectMember(member)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected ? 'bg-[#E6F4EA]/80 ring-1 ring-[#C8E6C9]' : 'hover:bg-slate-50/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10 rounded-full border border-emerald-200/70 shadow-2xs shrink-0">
                        <AvatarImage src={member.photo_url || ''} alt={member.full_name} className="object-cover" />
                        <AvatarFallback className="bg-[#E6F4EA] text-[#0B6B3A] font-bold text-xs">
                          {member.full_name?.charAt(0) || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0B6B3A] transition-colors truncate">
                            {member.full_name}
                          </p>
                          <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#0B6B3A] border border-[#C8E6C9] font-extrabold text-[10px]">
                            {member.member_id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                          {member.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {member.phone}
                            </span>
                          )}
                          {member.blood_group && (
                            <span className="flex items-center gap-0.5 font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md text-[10px]">
                              <Droplet className="w-2.5 h-2.5 fill-rose-500" />
                              {member.blood_group}
                            </span>
                          )}
                          {member.occupation && (
                            <span className="truncate text-slate-400">
                              • {member.occupation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isApproved ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{language === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                        </span>
                      ) : isPending ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {status}
                        </span>
                      )}

                      <div className="w-7 h-7 rounded-full bg-white border border-slate-200 group-hover:border-[#0B6B3A] group-hover:bg-[#0B6B3A] group-hover:text-white flex items-center justify-center transition-all text-slate-400">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 px-4 text-center text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'কোনো সদস্য খুঁজে পাওয়া যায়নি' : 'No members found'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {language === 'bn'
                    ? `"${query}" এর সাথে কোনো সদস্যের ID, নাম বা ফোন নম্বর মিলছে না`
                    : `No member matched "${query}" by ID, name or phone number`}
                </p>
              </div>
            )}
          </div>

          {/* Footer bar */}
          {results.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{language === 'bn' ? 'নির্বাচন করতে এন্টার চাপুন' : 'Press Enter to select'}</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/admin/members?search=${encodeURIComponent(query.trim())}`);
                }}
                className="font-bold text-[#0B6B3A] hover:underline cursor-pointer"
              >
                {language === 'bn' ? 'সদস্য তালিকায় সব দেখুন →' : 'View all in Members →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AdminHeaderSearch;
