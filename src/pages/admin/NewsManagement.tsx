import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';

interface News {
  id: string;
  title_bn: string;
  title_en: string | null;
  content_bn: string | null;
  content_en: string | null;
  image_url: string | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string | null;
}

const NewsManagement = () => {
  const { language } = useLanguage();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title_bn: '',
    title_en: '',
    content_bn: '',
    content_en: '',
    image_url: '',
    is_published: false,
  });

  const { data: newsList, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as News[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('news').insert([{
        ...data,
        created_by: user?.id,
        published_at: data.is_published ? new Date().toISOString() : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'সংবাদ যোগ হয়েছে' : 'News added' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('news').update({
        ...data,
        published_at: data.is_published ? new Date().toISOString() : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'সংবাদ আপডেট হয়েছে' : 'News updated' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'সংবাদ মুছে ফেলা হয়েছে' : 'News deleted' });
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title_bn: '',
      title_en: '',
      content_bn: '',
      content_en: '',
      image_url: '',
      is_published: false,
    });
    setEditingNews(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (news: News) => {
    setEditingNews(news);
    setFormData({
      title_bn: news.title_bn,
      title_en: news.title_en || '',
      content_bn: news.content_bn || '',
      content_en: news.content_en || '',
      image_url: news.image_url || '',
      is_published: news.is_published || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredNews = newsList?.filter(news =>
    news.title_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    news.title_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">
            {language === 'bn' ? 'সংবাদ ব্যবস্থাপনা' : 'News Management'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'bn' ? 'সকল সংবাদ দেখুন ও পরিচালনা করুন' : 'View and manage all news'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!isAdmin} onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'নতুন সংবাদ' : 'Add News'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNews 
                  ? (language === 'bn' ? 'সংবাদ সম্পাদনা' : 'Edit News')
                  : (language === 'bn' ? 'নতুন সংবাদ যোগ করুন' : 'Add New News')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'} *</Label>
                <Input
                  value={formData.title_bn}
                  onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}</Label>
                <Input
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিস্তারিত (বাংলা)' : 'Content (Bengali)'}</Label>
                <Textarea
                  value={formData.content_bn}
                  onChange={(e) => setFormData({ ...formData, content_bn: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিস্তারিত (ইংরেজি)' : 'Content (English)'}</Label>
                <Textarea
                  value={formData.content_en}
                  onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'ছবি URL' : 'Image URL'}</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>{language === 'bn' ? 'প্রকাশ করুন' : 'Publish'}</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingNews ? (language === 'bn' ? 'আপডেট' : 'Update') : (language === 'bn' ? 'সংরক্ষণ' : 'Save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'bn' ? 'সংবাদ খুঁজুন...' : 'Search news...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'bn' ? 'শিরোনাম' : 'Title'}</TableHead>
                  <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                  <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                  <TableHead>{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {language === 'bn' ? 'কোন সংবাদ পাওয়া যায়নি' : 'No news found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNews?.map((news) => (
                    <TableRow key={news.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {language === 'bn' ? news.title_bn : (news.title_en || news.title_bn)}
                      </TableCell>
                      <TableCell>
                        {news.created_at ? new Date(news.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={news.is_published ? 'default' : 'secondary'}>
                          {news.is_published 
                            ? (language === 'bn' ? 'প্রকাশিত' : 'Published') 
                            : (language === 'bn' ? 'খসড়া' : 'Draft')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(news)} disabled={!isAdmin}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(news.id)} disabled={!isAdmin}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsManagement;
