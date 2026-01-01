import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

const Contact = () => {
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(
      language === 'bn' 
        ? 'আপনার বার্তা সফলভাবে পাঠানো হয়েছে!'
        : 'Your message has been sent successfully!'
    );
    
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: language === 'bn' ? 'ঠিকানা' : 'Address',
      content: language === 'bn' ? 'ঢাকা, বাংলাদেশ' : 'Dhaka, Bangladesh',
    },
    {
      icon: Phone,
      title: language === 'bn' ? 'ফোন' : 'Phone',
      content: '+880 1XXX-XXXXXX',
    },
    {
      icon: Mail,
      title: language === 'bn' ? 'ইমেইল' : 'Email',
      content: 'info@samoyerbatighor.org',
    },
    {
      icon: Clock,
      title: language === 'bn' ? 'অফিস সময়' : 'Office Hours',
      content: language === 'bn' ? 'শনি - বৃহঃ: সকাল ১০টা - বিকাল ৫টা' : 'Sat - Thu: 10 AM - 5 PM',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              {language === 'bn' 
                ? 'আমাদের সাথে যোগাযোগ করুন'
                : 'Get in touch with us'}
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Form */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
                <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                  {language === 'bn' ? 'বার্তা পাঠান' : 'Send a Message'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.name')}</Label>
                    <Input id="name" name="name" required placeholder={language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.email')}</Label>
                    <Input id="email" name="email" type="email" required placeholder={language === 'bn' ? 'আপনার ইমেইল লিখুন' : 'Enter your email'} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('contact.phone')}</Label>
                    <Input id="phone" name="phone" placeholder={language === 'bn' ? 'আপনার ফোন নম্বর লিখুন' : 'Enter your phone number'} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.message')}</Label>
                    <Textarea id="message" name="message" required rows={5} placeholder={language === 'bn' ? 'আপনার বার্তা লিখুন' : 'Enter your message'} />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                        {language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        {t('contact.send')}
                      </span>
                    )}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                  {language === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact Information'}
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((info) => (
                    <div key={info.title} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{info.title}</h3>
                        <p className="text-muted-foreground">{info.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Map Placeholder */}
                <div className="mt-8 rounded-xl overflow-hidden border border-border bg-muted aspect-video flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{language === 'bn' ? 'মানচিত্র শীঘ্রই আসছে' : 'Map coming soon'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
