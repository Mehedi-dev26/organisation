import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Gallery = () => {
  const { t, language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
    { id: 1, url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop', title: language === 'bn' ? 'বার্ষিক সভা ২০২৪' : 'Annual Meeting 2024' },
    { id: 2, url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop', title: language === 'bn' ? 'শীতবস্ত্র বিতরণ' : 'Winter Clothes Distribution' },
    { id: 3, url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop', title: language === 'bn' ? 'সদস্য সমাবেশ' : 'Member Gathering' },
    { id: 4, url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop', title: language === 'bn' ? 'বৃক্ষরোপণ' : 'Tree Plantation' },
    { id: 5, url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop', title: language === 'bn' ? 'স্বাস্থ্য ক্যাম্প' : 'Health Camp' },
    { id: 6, url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop', title: language === 'bn' ? 'শিক্ষা কার্যক্রম' : 'Education Program' },
    { id: 7, url: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&h=600&fit=crop', title: language === 'bn' ? 'সামাজিক অনুষ্ঠান' : 'Social Event' },
    { id: 8, url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop', title: language === 'bn' ? 'পুরস্কার বিতরণ' : 'Award Ceremony' },
    { id: 9, url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop', title: language === 'bn' ? 'কর্মশালা' : 'Workshop' },
  ];

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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer"
                  onClick={() => setSelectedImage(image.url)}
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-primary-foreground font-medium text-sm">
                      {image.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lightbox */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 border-0 bg-transparent">
            {selectedImage && (
              <img
                src={selectedImage.replace('w=800&h=600', 'w=1200&h=800')}
                alt="Gallery"
                className="w-full h-auto rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
