import { Link } from 'react-router-dom';
import { Facebook, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteLogo } from '@/hooks/useSiteLogo';

const Footer = () => {
  const { t, language } = useLanguage();
  const { logoUrl } = useSiteLogo();

  const quickLinks = [
    { href: '/about', label: 'nav.about' },
    { href: '/members', label: 'nav.members' },
    { href: '/committee', label: 'nav.committee' },
    { href: '/contact', label: 'nav.contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/share/1Bg4ityeXV/', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-white/40 shadow-lg overflow-hidden flex items-center justify-center p-1.5 flex-shrink-0">
                <img 
                  src={logoUrl} 
                  alt="সময়ের বাতিঘর" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold">
                  {language === 'bn' ? 'সময়ের বাতিঘর' : 'Samoyer Batighor'}
                </h3>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              {language === 'bn' 
                ? 'একতাই শক্তি, সেবাই ধর্ম। আমরা সমাজের সুবিধাবঞ্চিত মানুষদের পাশে দাঁড়াই।'
                : 'Unity is Strength, Service is Religion. We stand by the underprivileged people of society.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 text-sm"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">{t('footer.contactInfo')}</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                <span>{language === 'bn' ? 'নওগাঁ, রাজশাহী বিভাগ, বাংলাদেশ' : 'Naogaon, Rajshahi, Bangladesh'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                <span>+880 1916-314315</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <span>contact@somoyerbatighor.org</span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">{t('footer.followUs')}</h4>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} {language === 'bn' ? 'সময়ের বাতিঘর' : 'Samoyer Batighor'}. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
