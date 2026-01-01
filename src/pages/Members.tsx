import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
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
                {filteredMembers?.map((member) => (
                  <Card key={member.id} className="group hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 overflow-hidden">
                        <img
                          src={member.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.full_name}`}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                        {member.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {member.joining_date 
                          ? (language === 'bn' 
                            ? `সদস্য হয়েছেন: ${new Date(member.joining_date).getFullYear()}` 
                            : `Member since: ${new Date(member.joining_date).getFullYear()}`)
                          : ''}
                      </p>
                      <div className="space-y-2 text-sm">
                        {member.phone && (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span>{member.email}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Members;
