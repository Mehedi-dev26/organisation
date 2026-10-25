import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Search, Phone, Mail, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const Members = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Enable realtime subscription
  useRealtimeSubscription({ table: 'members', queryKey: ['public-members'] });

  const { data: members, isLoading } = useQuery({
    queryKey: ['public-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'approved')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredMembers = members?.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Hero */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t('members.title')}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            {language === 'bn' 
              ? 'আমাদের সকল সদস্যদের তালিকা দেখুন'
              : 'View the list of all our members'}
          </p>
        </div>
      </section>

      {/* Members List */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Search & Stats */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('members.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-muted-foreground">
              {t('members.total')}: <span className="font-semibold text-foreground">{filteredMembers?.length || 0}</span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredMembers?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === 'bn' ? 'কোন সদস্য পাওয়া যায়নি' : 'No members found'}
            </div>
          ) : (
            /* Members Grid */
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredMembers?.map((member) => {
                const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.full_name)}`;
                const memberTypeLabel = language === 'bn' 
                  ? (member.member_type === 'life' ? 'আজীবন সদস্য' : member.member_type === 'donor' ? 'দাতা সদস্য' : member.member_type === 'executive' ? 'কার্যনির্বাহী পরিষদ' : 'সাধারণ সদস্য')
                  : (member.member_type || 'General');

                return (
                  <Card key={member.id} className="group hover:shadow-xl transition-all duration-300 rounded-[24px] border border-slate-100 overflow-hidden hover:-translate-y-1">
                    <CardContent className="p-6 text-center">
                      <div className="relative mb-4 inline-block">
                        <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors shadow-2xs">
                          <img
                            src={member.photo_url || fallbackAvatar}
                            alt={member.full_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                          />
                        </div>
                        {member.blood_group && (
                          <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-xs">
                            {member.blood_group}
                          </div>
                        )}
                      </div>

                      <div className="mb-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
                          {memberTypeLabel}
                        </span>
                        <h3 className="font-heading font-bold text-lg text-foreground line-clamp-1">
                          {member.full_name}
                        </h3>
                        {member.member_id && (
                          <p className="text-xs font-mono font-bold text-[#0B6B3A] tracking-wider mt-0.5">
                            ID: {member.member_id}
                          </p>
                        )}
                      </div>

                      {(() => {
                        const displayAddress = member.present_address?.trim() || (() => {
                          if (!member.address) return '';
                          if (member.address.includes('বর্তমান:')) {
                            const match = member.address.match(/বর্তমান:\s*([^|]+)/);
                            if (match && match[1]) return match[1].trim();
                          }
                          if (member.address.includes('|')) {
                            return member.address.split('|')[0].replace(/বর্তমান[:ঃ]?\s*/i, '').trim();
                          }
                          return member.address.trim();
                        })();

                        return displayAddress ? (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-1" title={displayAddress}>
                            {displayAddress}
                          </p>
                        ) : null;
                      })()}

                      <div className="space-y-1.5 text-xs pt-3 border-t border-slate-100 text-muted-foreground">
                        {member.phone && (
                          <div className="flex items-center justify-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center justify-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default Members;
