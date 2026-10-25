import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
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
import { Plus, Edit, Trash2, Search, Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ছবি ৫MB এর কম হতে হবে' : 'Photo must be under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadNewsPhoto = async (): Promise<string | null> => {
    if (!selectedImage) return formData.image_url || null;

    try {
      setIsUploading(true);
      const compressedBlob = await compressImage(selectedImage, 1200, 800, 0.88);
      const fileName = `news/${Date.now()}-${selectedImage.name.replace(/\s+/g, '_')}`;

      const { data, error } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        title: language === 'bn' ? 'ছবি আপলোড ব্যর্থ' : 'Photo upload failed',
        description: error.message || 'ত্রুটি ঘটেছে',
        variant: 'destructive',
      });
      return formData.image_url || null;
    } finally {
      setIsUploading(false);
    }
  };

  // Enable realtime subscription
  useRealtimeSubscription({ table: 'news', queryKey: ['admin-news'] });

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
    setSelectedImage(null);
    setImagePreview(null);
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
    setSelectedImage(null);
    setImagePreview(news.image_url || null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImageUrl = formData.image_url;
    if (selectedImage) {
      const uploadedUrl = await uploadNewsPhoto();
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }
    const submissionData = { ...formData, image_url: finalImageUrl };
    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: submissionData });
    } else {
      createMutation.mutate(submissionData);
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
              {/* Photo Upload & Preview */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <Label className="text-sm font-bold flex items-center justify-between">
                  <span>{language === 'bn' ? 'সংবাদের ছবি আপলোড' : 'News Image Upload'}</span>
                  {isUploading && (
                    <span className="text-xs text-primary flex items-center gap-1 font-normal">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </span>
                  )}
                </Label>

                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 bg-black/5 group">
                    <img 
                      src={imagePreview} 
                      alt="News preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setFormData({ ...formData, image_url: '' });
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors"
                      title={language === 'bn' ? 'ছবি মুছে ফেলুন' : 'Remove photo'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-primary transition-colors bg-white">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs text-slate-500 mb-2">
                      {language === 'bn' ? 'কম্পিউটার বা মোবাইল থেকে ছবি সিলেক্ট করুন (সর্বোচ্চ ৫MB)' : 'Select image from device (Max 5MB)'}
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'ছবি বাছাই করুন' : 'Choose Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-muted-foreground block">
                    {language === 'bn' ? 'অথবা সরাসরি ছবির ওয়েব লিঙ্ক প্রদান করতে পারেন:' : 'Or enter direct image URL:'}
                  </span>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      setImagePreview(e.target.value || null);
                    }}
                    placeholder="https://..."
                    className="h-8 text-xs"
                  />
                </div>
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
