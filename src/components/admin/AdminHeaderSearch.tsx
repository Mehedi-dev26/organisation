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
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
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

interface SearchInvoice {
  id: string;
  type: string;
  amount: number;
  payment_reference: string | null;
  receipt_number: string | null;
  description_bn: string | null;
  transaction_date: string;
  member_name?: string;
  source: 'transaction' | 'due';
}

export const AdminHeaderSearch: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [memberResults, setMemberResults] = useState<SearchMember[]>([]);
  const [invoiceResults, setInvoiceResults] = useState<SearchInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Debounced search query for both Members and Invoices/Transactions
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setMemberResults([]);
      setInvoiceResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        // 1. Search Members
        const membersPromise = supabase
          .from('members')
          .select('id, member_id, full_name, phone, blood_group, photo_url, status, member_type, occupation')
          .or(`member_id.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        // 2. Search Invoices / Transactions
        const trxPromise = supabase
          .from('transactions')
          .select('id, type, amount, payment_reference, receipt_number, description_bn, transaction_date')
          .or(`payment_reference.ilike.%${trimmed}%,receipt_number.ilike.%${trimmed}%,description_bn.ilike.%${trimmed}%`)
          .order('transaction_date', { ascending: false })
          .limit(5);

        // 3. Search Member Dues by transaction_id
        const duesPromise = supabase
          .from('member_dues')
          .select(`
            id,
            amount,
            month_year,
            transaction_id,
            payment_method,
            members (
              id,
              member_id,
              full_name
            )
          `)
          .ilike('transaction_id', `%${trimmed}%`)
          .limit(3);

        const [mRes, tRes, dRes] = await Promise.all([membersPromise, trxPromise, duesPromise]);

        setMemberResults((mRes.data as SearchMember[]) || []);

        const combinedInvoices: SearchInvoice[] = [];

        if (tRes.data) {
          tRes.data.forEach((t: any) => {
            combinedInvoices.push({
              id: t.id,
              type: t.type,
              amount: Number(t.amount || 0),
              payment_reference: t.payment_reference,
              receipt_number: t.receipt_number,
              description_bn: t.description_bn,
              transaction_date: t.transaction_date,
              source: 'transaction',
            });
          });
        }

        if (dRes.data) {
          dRes.data.forEach((d: any) => {
            if (d.transaction_id) {
              combinedInvoices.push({
                id: d.id,
                type: 'member_fee',
                amount: Number(d.amount || 0),
                payment_reference: d.transaction_id,
                receipt_number: null,
                description_bn: `${d.month_year} চাঁদা পেমেন্ট`,
                transaction_date: new Date().toISOString().split('T')[0],
                member_name: d.members?.full_name,
                source: 'due',
              });
            }
          });
        }

        setInvoiceResults(combinedInvoices);
      } catch (err) {
        console.error('Realtime admin search error:', err);
        setMemberResults([]);
        setInvoiceResults([]);
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

  const handleSelectInvoice = (inv: SearchInvoice) => {
    setIsOpen(false);
    setQuery('');
    const targetRef = inv.payment_reference || inv.receipt_number || inv.id;

    if (inv.source === 'due') {
      navigate(`/admin/payment-verification?search=${encodeURIComponent(targetRef)}`);
      return;
    }

    if (['expense', 'other_expense'].includes(inv.type)) {
      navigate(`/admin/finance?search=${encodeURIComponent(targetRef)}&tab=expense`);
    } else if (inv.type === 'member_fee') {
      navigate(`/admin/dues?search=${encodeURIComponent(targetRef)}`);
    } else {
      navigate(`/admin/finance?search=${encodeURIComponent(targetRef)}&tab=income`);
    }
  };

  const handleKeyDownNav = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      setIsOpen(false);
      const q = query.trim();
      if (q.toUpperCase().startsWith('TRX') || q.includes('-') || invoiceResults.length > 0) {
        navigate(`/admin/finance?search=${encodeURIComponent(q)}`);
      } else {
        navigate(`/admin/members?search=${encodeURIComponent(q)}`);
      }
    }
  };

  const totalResults = memberResults.length + invoiceResults.length;

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
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDownNav}
          placeholder={language === 'bn' ? 'সদস্য নাম, আইডি বা ইনভয়েস/রসিদ নম্বর...' : 'Search member or invoice/receipt...'}
          className="w-full h-10 pl-10 pr-20 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-200/90 focus:border-[#0B6B3A] focus:ring-2 focus:ring-[#0B6B3A]/20 transition-all outline-none font-medium shadow-xs"
        />

        {/* Clear or Keyboard Shortcut Pill */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setMemberResults([]);
                setInvoiceResults([]);
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
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150 max-h-96 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 px-3 bg-slate-50/70 shrink-0">
            <span>{language === 'bn' ? `খোঁজের ফলাফল (${totalResults})` : `Results (${totalResults})`}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {language === 'bn' ? 'ক্লিক করে সরাসরি পেজে যান' : 'Click to navigate'}
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-50 p-1 flex-1">
            {isLoading && totalResults === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0B6B3A]" />
                <span>{language === 'bn' ? 'তথ্য অনুসন্ধান হচ্ছে...' : 'Searching...'}</span>
              </div>
            ) : totalResults > 0 ? (
              <>
                {/* 1. Invoices & Transactions Section */}
                {invoiceResults.length > 0 && (
                  <div className="pb-1.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-[#0B6B3A]" />
                      <span>{language === 'bn' ? 'ইনভয়েস ও রসিদ ভাউচার' : 'Invoices & Receipts'}</span>
                    </div>
                    {invoiceResults.map((inv) => {
                      const isExpense = ['expense', 'other_expense'].includes(inv.type);
                      return (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => handleSelectInvoice(inv)}
                          className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-slate-800 transition-colors flex items-center justify-between gap-2.5 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {isExpense ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-[#0B6B3A] transition-colors truncate">
                                  {inv.payment_reference || inv.receipt_number || 'ভাউচার'}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isExpense ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isExpense ? (language === 'bn' ? 'খরচ' : 'Expense') : (language === 'bn' ? 'আয় / চাঁদা' : 'Income')}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {inv.description_bn || inv.member_name || inv.transaction_date}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-black ${isExpense ? 'text-rose-600' : 'text-emerald-700'}`}>
                              ৳{inv.amount.toLocaleString()}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0B6B3A] ml-auto transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Members Section */}
                {memberResults.length > 0 && (
                  <div className="pt-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#0B6B3A]" />
                      <span>{language === 'bn' ? 'সদস্যবৃন্দ' : 'Members'}</span>
                    </div>
                    {memberResults.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleSelectMember(member)}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-slate-800 transition-colors flex items-center justify-between gap-2.5 group"
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
                              <p className="text-xs font-bold text-slate-900 group-hover:text-[#0B6B3A] transition-colors truncate">
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
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{language === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                <AlertCircle className="w-5 h-5 text-slate-300 mx-auto" />
                <p>{language === 'bn' ? 'কোনো সদস্য বা ইনভয়েস পাওয়া যায়নি' : 'No matching member or invoice found'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeaderSearch;
