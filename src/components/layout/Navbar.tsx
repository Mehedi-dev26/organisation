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
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { href: '/', label: 'nav.home' },
    { href: '/about', label: 'nav.about' },
    { href: '/committee', label: 'nav.committee' },
    { href: '/members', label: 'nav.members' },
    { href: '/blood-donors', label: 'nav.blood_donors', isBlood: true },
    { href: '/events', label: 'nav.events' },
    { href: '/news', label: 'nav.news' },
    { href: '/gallery', label: 'nav.gallery' },
    { href: '/contact', label: 'nav.contact' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* 1. Top Contact & Helpline Bar (Inspired by Helpline Hello Naogaon) */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-xs py-1.5 px-4 border-b border-emerald-600/40">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left contact info */}
          <div className="flex items-center flex-wrap gap-4 md:gap-6">
            <a 
              href="tel:+8801700000000" 
              className="inline-flex items-center gap-1.5 font-medium hover:text-emerald-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>{language === 'bn' ? 'জরুরি হেল্পলাইন:' : 'Helpline:'} +880 1700-000000</span>
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

      {/* 2. Main Navigation Bar */}
      <nav className="bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo & Brand Identity */}
            <Link to="/" className="flex items-center gap-2.5 md:gap-3.5 group">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-primary to-teal-500 p-0.5 shadow-md group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img 
                    src={logo} 
                    alt="সময়ের বাতিঘর" 
                    className="w-8 h-8 md:w-11 md:h-11 object-contain"
                  />
                </div>
              </div>
              <div className="block">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-heading text-base sm:text-lg md:text-xl font-bold text-foreground leading-tight tracking-tight">
                    {language === 'bn' ? 'সময়ের বাতিঘর' : 'Samoyer Batighor'}
                  </h1>
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {language === 'bn' ? 'একতাই শক্তি, সেবাই ধর্ম' : 'Unity is Strength, Service is Religion'}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 inline-flex items-center gap-1.5",
                    location.pathname === link.href
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : link.isBlood
                      ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.isBlood && (
                    <Droplet className="w-3.5 h-3.5 fill-red-600 text-red-600 animate-pulse" />
                  )}
                  <span>{t(link.label)}</span>
                </Link>
              ))}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Quick Donation / Dues Pay Button */}
              <Button 
                variant="default"
                size="sm" 
                className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold shadow-md shadow-rose-500/20 text-xs sm:text-sm px-2.5 sm:px-3.5 h-8 sm:h-9"
                onClick={() => navigate('/member/pay-dues')}
              >
                <Heart className="w-3.5 h-3.5 mr-1 sm:mr-1.5 fill-white text-white animate-pulse" />
                <span>{language === 'bn' ? 'চাঁদা / অনুদান' : 'Donate / Pay'}</span>
              </Button>

              {/* Member Registration (Desktop) */}
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => navigate('/member-registration')}
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                <span>{language === 'bn' ? 'সদস্য আবেদন' : 'Join Us'}</span>
              </Button>

              {/* Login Button */}
              <Button 
                variant="default" 
                size="sm" 
                className="flex items-center gap-1 text-xs sm:text-sm h-8 sm:h-9 font-semibold"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('nav.login')}</span>
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden h-9 w-9 text-foreground hover:bg-muted"
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
          <div className="xl:hidden bg-background border-t border-border px-4 py-4 animate-in slide-in-from-top-3 duration-200 shadow-xl">
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
                    navigate('/member/pay-dues');
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
                  href="tel:+8801700000000"
                  className="mt-1 w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 py-2.5 rounded-lg text-sm font-bold"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'জরুরি কল: +880 1700-000000' : 'Call Helpline: +880 1700-000000'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
