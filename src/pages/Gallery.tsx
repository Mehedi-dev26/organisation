import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, ImageIcon } from 'lucide-react';

interface GalleryImage {
  id: string;
  title_bn: string;
  title_en: string | null;
  description_bn: string | null;
  description_en: string | null;
  image_url: string;
  category: string | null;
  event_date: string | null;
}

const Gallery = () => {
  const { t, language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Fetch published gallery images from database
  const { data: images, isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {t('gallery.title')}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              {language === 'bn' 
                ? 'আমাদের বিভিন্ন কার্যক্রমের স্মৃতিচারণ'
                : 'Memories from our various activities'}
            </p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : images && images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.image_url}
                      alt={language === 'bn' ? image.title_bn : (image.title_en || image.title_bn)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div>
                        <span className="text-primary-foreground font-medium text-sm block">
                          {language === 'bn' ? image.title_bn : (image.title_en || image.title_bn)}
                        </span>
                        {image.event_date && (
                          <span className="text-primary-foreground/70 text-xs">
                            {new Date(image.event_date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {language === 'bn' ? 'কোনো ছবি নেই' : 'No images yet'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'bn' 
                    ? 'শীঘ্রই আমাদের কার্যক্রমের ছবি যোগ করা হবে'
                    : 'Photos of our activities will be added soon'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Lightbox */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 border-0 bg-transparent">
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage.image_url}
                  alt={language === 'bn' ? selectedImage.title_bn : (selectedImage.title_en || selectedImage.title_bn)}
                  className="w-full h-auto rounded-lg max-h-[80vh] object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                  <h3 className="text-white font-medium">
                    {language === 'bn' ? selectedImage.title_bn : (selectedImage.title_en || selectedImage.title_bn)}
                  </h3>
                  {(selectedImage.description_bn || selectedImage.description_en) && (
                    <p className="text-white/80 text-sm mt-1">
                      {language === 'bn' 
                        ? selectedImage.description_bn 
                        : (selectedImage.description_en || selectedImage.description_bn)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
