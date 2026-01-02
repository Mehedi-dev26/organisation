import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Image, Loader2, AlertCircle } from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/imageUtils';

interface GalleryImage {
  id: string;
  title_bn: string;
  title_en: string | null;
  description_bn: string | null;
  description_en: string | null;
  image_url: string;
  category: string | null;
  event_date: string | null;
  sort_order: number | null;
  is_published: boolean | null;
  created_at: string | null;
}

const GalleryManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Form state
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [category, setCategory] = useState('general');
  const [eventDate, setEventDate] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Fetch gallery images
  const { data: images, isLoading } = useQuery({
    queryKey: ['admin-gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  // Reset form
  const resetForm = () => {
    setTitleBn('');
    setTitleEn('');
    setDescriptionBn('');
    setDescriptionEn('');
    setCategory('general');
    setEventDate('');
    setIsPublished(true);
    setSelectedFile(null);
    setPreviewUrl('');
    setEditingImage(null);
  };

  // Handle file selection with preview
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload and compress image
  const uploadImage = async (file: File): Promise<string> => {
    setUploadProgress(language === 'bn' ? 'ছবি কম্প্রেস করা হচ্ছে...' : 'Compressing image...');
    
    // Compress image to save storage (max 800x800, 70% quality for gallery)
    const compressedBlob = await compressImage(file, 800, 800, 0.7);
    
    const originalSize = file.size;
    const compressedSize = compressedBlob.size;
    const savings = Math.round((1 - compressedSize / originalSize) * 100);
    
    console.log(`Image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${savings}% saved)`);
    
    setUploadProgress(language === 'bn' ? 'ছবি আপলোড করা হচ্ছে...' : 'Uploading image...');
    
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `gallery/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery-images')
      .upload(filePath, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      
      let imageUrl = editingImage?.image_url || '';
      
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      if (!imageUrl) {
        throw new Error(language === 'bn' ? 'ছবি আপলোড করুন' : 'Please upload an image');
      }

      const imageData = {
        title_bn: titleBn,
        title_en: titleEn || null,
        description_bn: descriptionBn || null,
        description_en: descriptionEn || null,
        image_url: imageUrl,
        category,
        event_date: eventDate || null,
        is_published: isPublished,
      };

      if (editingImage) {
        const { error } = await supabase
          .from('gallery_images')
          .update(imageData)
          .eq('id', editingImage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gallery_images')
          .insert(imageData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      toast.success(
        editingImage 
          ? (language === 'bn' ? 'ছবি আপডেট হয়েছে' : 'Image updated successfully')
          : (language === 'bn' ? 'ছবি যোগ হয়েছে' : 'Image added successfully')
      );
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setUploading(false);
      setUploadProgress('');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      toast.success(language === 'bn' ? 'ছবি মুছে ফেলা হয়েছে' : 'Image deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Open edit dialog
  const openEditDialog = (image: GalleryImage) => {
    setEditingImage(image);
    setTitleBn(image.title_bn);
    setTitleEn(image.title_en || '');
    setDescriptionBn(image.description_bn || '');
    setDescriptionEn(image.description_en || '');
    setCategory(image.category || 'general');
    setEventDate(image.event_date || '');
    setIsPublished(image.is_published ?? true);
    setPreviewUrl(image.image_url);
    setIsDialogOpen(true);
  };

  // Categories
  const categories = [
    { value: 'general', label: language === 'bn' ? 'সাধারণ' : 'General' },
    { value: 'event', label: language === 'bn' ? 'অনুষ্ঠান' : 'Event' },
    { value: 'charity', label: language === 'bn' ? 'দাতব্য' : 'Charity' },
    { value: 'meeting', label: language === 'bn' ? 'সভা' : 'Meeting' },
    { value: 'education', label: language === 'bn' ? 'শিক্ষা' : 'Education' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {language === 'bn' ? 'গ্যালারি ব্যবস্থাপনা' : 'Gallery Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'bn' ? 'সংগঠনের ছবি আপলোড ও পরিচালনা করুন' : 'Upload and manage organization photos'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'নতুন ছবি' : 'New Image'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingImage 
                  ? (language === 'bn' ? 'ছবি সম্পাদনা' : 'Edit Image')
                  : (language === 'bn' ? 'নতুন ছবি যোগ করুন' : 'Add New Image')
                }
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'ছবি' : 'Image'} *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewUrl('');
                          setSelectedFile(null);
                        }}
                      >
                        {language === 'bn' ? 'ছবি পরিবর্তন' : 'Change Image'}
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Image className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <span className="text-muted-foreground">
                        {language === 'bn' ? 'ছবি নির্বাচন করুন' : 'Select an image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>
                {/* Storage tip */}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'bn' 
                    ? 'ছবি স্বয়ংক্রিয়ভাবে কম্প্রেস হবে (সর্বোচ্চ 800x800px)' 
                    : 'Images will be auto-compressed (max 800x800px)'}
                </p>
              </div>

              {/* Title Bengali */}
              <div className="space-y-2">
                <Label htmlFor="titleBn">{language === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'} *</Label>
                <Input
                  id="titleBn"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  placeholder={language === 'bn' ? 'ছবির শিরোনাম লিখুন' : 'Enter image title'}
                />
              </div>

              {/* Title English */}
              <div className="space-y-2">
                <Label htmlFor="titleEn">{language === 'bn' ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}</Label>
                <Input
                  id="titleEn"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Enter image title in English"
                />
              </div>

              {/* Description Bengali */}
              <div className="space-y-2">
                <Label htmlFor="descBn">{language === 'bn' ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}</Label>
                <Textarea
                  id="descBn"
                  value={descriptionBn}
                  onChange={(e) => setDescriptionBn(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Description English */}
              <div className="space-y-2">
                <Label htmlFor="descEn">{language === 'bn' ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}</Label>
                <Textarea
                  id="descEn"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Date */}
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ইভেন্টের তারিখ' : 'Event Date'}</Label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between">
                <Label>{language === 'bn' ? 'প্রকাশিত' : 'Published'}</Label>
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              {/* Upload Progress */}
              {uploadProgress && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={uploading || !titleBn}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                  </>
                ) : (
                  editingImage 
                    ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
                    : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save')
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Storage Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">
                {language === 'bn' ? 'স্টোরেজ অপ্টিমাইজেশন' : 'Storage Optimization'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? 'ফ্রি প্ল্যানে 1GB স্টোরেজ আছে। সব ছবি স্বয়ংক্রিয়ভাবে কম্প্রেস করা হয় যাতে আপনি বেশি ছবি আপলোড করতে পারেন। প্রতিটি ছবি প্রায় 50-150KB হবে।'
                  : 'Free plan includes 1GB storage. All images are auto-compressed so you can upload more. Each image will be ~50-150KB.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden group">
              <div className="aspect-square relative">
                <img
                  src={image.image_url}
                  alt={image.title_bn}
                  className="w-full h-full object-cover"
                />
                {!image.is_published && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                    {language === 'bn' ? 'অপ্রকাশিত' : 'Unpublished'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary"
                    onClick={() => openEditDialog(image)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive"
                    onClick={() => {
                      if (confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) {
                        deleteMutation.mutate(image.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">
                  {language === 'bn' ? image.title_bn : (image.title_en || image.title_bn)}
                </h3>
                {image.category && (
                  <span className="text-xs text-muted-foreground">
                    {categories.find(c => c.value === image.category)?.label || image.category}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {language === 'bn' ? 'কোনো ছবি নেই' : 'No images yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'bn' 
                ? 'আপনার সংগঠনের কার্যক্রমের ছবি আপলোড করুন'
                : 'Upload photos of your organization activities'}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'প্রথম ছবি যোগ করুন' : 'Add First Image'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GalleryManagement;
