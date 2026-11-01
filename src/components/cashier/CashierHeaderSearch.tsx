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
  Receipt, 
  ArrowUpRight, 
  Wallet,
  CheckCircle2, 
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
}

export const CashierHeaderSearch: React.FC = () => {
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
          .select('id, member_id, full_name, phone, blood_group, photo_url, status, member_type')
          .or(`member_id.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
          .order('created_at', { ascending: false })
          .limit(6);

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
    navigate(`/cashier/dues?search=${encodeURIComponent(member.member_id || member.full_name)}`);
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
        navigate(`/cashier/dues?search=${encodeURIComponent(query.trim())}`);
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
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDownNav}
          placeholder={language === 'bn' ? 'সদস্য আইডি, নাম বা মোবাইল নম্বর দিয়ে সার্চ...' : 'Search member by ID, name or phone...'}
          className="w-full h-10 pl-10 pr-20 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-200/90 focus:border-[#0B6B3A] focus:ring-2 focus:ring-[#0B6B3A]/20 transition-all outline-none font-medium shadow-xs"
        />

        {/* Clear or Keyboard Shortcut Pill */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Floating Results Card */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 px-3 bg-slate-50/70">
            <span>{language === 'bn' ? `খোঁজের ফলাফল (${results.length})` : `Results (${results.length})`}</span>
            <span className="text-[10px] text-slate-400">{language === 'bn' ? 'চাঁদা দেখতে ক্লিক করুন' : 'Click to view dues'}</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 p-1">
            {isLoading && results.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0B6B3A]" />
                <span>{language === 'bn' ? 'তথ্য অনুসন্ধান হচ্ছে...' : 'Searching...'}</span>
              </div>
            ) : results.length > 0 ? (
              results.map((member, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectMember(member)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-emerald-50/80 text-emerald-950 shadow-2xs' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-8 h-8 rounded-full border border-slate-200 shrink-0">
                        <AvatarImage src={member.photo_url || ''} alt={member.full_name} className="object-cover" />
                        <AvatarFallback className="bg-emerald-100 text-[#0B6B3A] text-xs font-bold">
                          {member.full_name?.charAt(0) || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {member.full_name}
                          </p>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-[#0B6B3A]">
                            {member.member_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {member.phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {member.phone}
                            </span>
                          )}
                          {member.blood_group && (
                            <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">
                              {member.blood_group}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-[#0B6B3A]">
                      <Receipt className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{language === 'bn' ? 'চাঁদা' : 'Dues'}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                <AlertCircle className="w-5 h-5 text-slate-300 mx-auto" />
                <p>{language === 'bn' ? 'কোনো সদস্য পাওয়া যায়নি' : 'No matching member found'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierHeaderSearch;
