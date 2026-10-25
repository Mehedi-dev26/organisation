import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  UserPlus, 
  LogIn, 
  Facebook, 
  Youtube,
  Clock,
  Sparkles,
  Droplet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { logoUrl } = useSiteLogo();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { href: '/', label: 'nav.home' },
    { href: '/about', label: 'nav.about' },
    { href: '/members', label: 'nav.members' },
    { href: '/committee', label: 'nav.committee' },
    { href: '/blood-donors', label: 'nav.blood_donors', isBlood: true },
    { href: '/programs', label: 'nav.events' },
    { href: '/news', label: 'nav.news' },
    { href: '/gallery', label: 'nav.gallery' },
    { href: '/contact', label: 'nav.contact' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <>
      {/* 1. Top Contact & Helpline Bar (Scrolls away naturally on scroll) */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-xs py-1 px-4 border-b border-emerald-600/40">
        <div className="container mx-auto px-4 max-w-7xl flex flex-wrap items-center justify-between gap-2">
          {/* Left contact info */}
          <div className="flex items-center flex-wrap gap-4 md:gap-6">
            <a 
              href="tel:01916314315" 
              className="inline-flex items-center gap-1.5 font-medium hover:text-emerald-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>{language === 'bn' ? 'জরুরি হেল্পলাইন:' : 'Helpline:'} 01916314315</span>
            </a>
            
            <a 
              href="mailto:contact@somoyerbatighor.org" 
              className="hidden sm:inline-flex items-center gap-1.5 text-emerald-100 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-300" />
              <span>contact@somoyerbatighor.org</span>
            </a>

            <div className="hidden lg:inline-flex items-center gap-1.5 text-emerald-200/90">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>{language === 'bn' ? 'নওগাঁ, বাংলাদেশ' : 'Naogaon, Bangladesh'}</span>
            </div>
          </div>

          {/* Right badge & social links */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-emerald-900/60 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <Clock className="w-3 h-3 text-amber-300" />
              {language === 'bn' ? '২৪ ঘণ্টা মানবসেবায় নিয়োজিত' : '24/7 Humanitarian Support'}
            </span>

            <div className="flex items-center gap-2 text-emerald-200">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-white transition-colors p-1"
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-white transition-colors p-1"
                aria-label="YouTube"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Language Toggle in Topbar */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors border border-white/20"
              title="Change Language"
            >
              <Globe className="w-3 h-3 text-emerald-300" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar (Slimmer and Sticky on top) */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-card backdrop-blur-md border-b border-border shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-14 md:h-16 py-1">
            {/* Logo & Brand Identity (Matching Helpline Hello Naogaon style) */}
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 group flex-shrink-0">
              <img 
                src={logoUrl} 
                alt="সময়ের বাতিঘর" 
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 xl:w-12 xl:h-12 object-contain flex-shrink-0"
              />
              <div className="leading-tight">
                <div className="font-bold text-sm sm:text-base md:text-lg xl:text-[1.25rem] text-[#006a4e] dark:text-emerald-400 tracking-tight leading-none">
                  {language === 'bn' ? 'সময়ের বাতিঘর' : 'Samoyer Batighor'}
                </div>
                <div className="text-[10px] sm:text-[11px] xl:text-xs font-semibold text-[#006a4e] dark:text-emerald-400/90 mt-0.5 sm:mt-1">
                  {language === 'bn' ? 'একটি স্বেচ্ছাসেবী সামাজিক সংগঠন' : 'A voluntary welfare organization'}
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links (Visible from lg 1024px and up) */}
            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-2 lg:px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-lg text-xs lg:text-[13px] xl:text-sm font-semibold transition-all duration-200 inline-flex items-center gap-1 xl:gap-1.5 whitespace-nowrap",
                    location.pathname === link.href
                      ? "bg-primary text-primary-foreground shadow-sm font-bold"
                      : link.isBlood
                      ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.isBlood && (
                    <Droplet className="w-3.5 h-3.5 fill-red-600 text-red-600 animate-pulse flex-shrink-0" />
                  )}
                  <span>{t(link.label)}</span>
                </Link>
              ))}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 flex-shrink-0">
              {/* Member Registration (Desktop) */}
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                onClick={() => navigate('/member-registration')}
              >
                <UserPlus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                <span>{language === 'bn' ? 'সদস্য আবেদন' : 'Join Us'}</span>
              </Button>

              {/* Login Button */}
              <Button 
                variant="default" 
                size="sm" 
                className="flex items-center gap-1 text-xs sm:text-sm h-8 sm:h-9 font-semibold px-2.5 sm:px-3"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('nav.login')}</span>
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 text-foreground hover:bg-muted"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-5 h-5 text-destructive" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden bg-background border-t border-border px-4 py-4 animate-in slide-in-from-top-3 duration-200 shadow-xl">
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between",
                    location.pathname === link.href
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : link.isBlood
                      ? "text-red-600 hover:text-red-700 bg-red-50/50 dark:bg-red-950/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {link.isBlood && (
                      <Droplet className="w-4 h-4 text-red-600 fill-red-600 animate-pulse" />
                    )}
                    <span>{t(link.label)}</span>
                  </span>
                  {location.pathname === link.href ? (
                    <Sparkles className="w-3.5 h-3.5" />
                  ) : link.isBlood ? (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {language === 'bn' ? 'জরুরি' : 'Urgent'}
                    </span>
                  ) : null}
                </Link>
              ))}

              <div className="pt-3 mt-2 border-t border-border/80 flex flex-col gap-2">
                <Button 
                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold justify-center"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/member-dashboard/pay-dues');
                  }}
                >
                  <Heart className="w-4 h-4 mr-2 fill-white" />
                  {language === 'bn' ? 'অনলাইন চাঁদা বা অনুদান প্রদান' : 'Pay Dues / Donate'}
                </Button>

                <Button 
                  variant="outline"
                  className="w-full justify-center border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/member-registration');
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'নতুন সদস্য আবেদন ফরম' : 'Member Registration'}
                </Button>

                <a 
                  href="tel:01916314315"
                  className="mt-1 w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 py-2.5 rounded-lg text-sm font-bold"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'জরুরি কল: 01916314315' : 'Call Helpline: 01916314315'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
