import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
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
    { href: '/members', label: 'nav.members' },
    { href: '/committee', label: 'nav.committee' },
    { href: '/news', label: 'nav.news' },
    { href: '/gallery', label: 'nav.gallery' },
    { href: '/contact', label: 'nav.contact' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0">
              <img 
                src={logo} 
                alt="সময়ের বাতিঘর" 
                className="w-7 h-7 md:w-10 md:h-10 object-contain"
              />
            </div>
            <div className="block">
              <h1 className="font-heading text-sm sm:text-lg md:text-xl font-bold text-foreground leading-tight truncate max-w-[120px] sm:max-w-none">
                {language === 'bn' ? 'সময়ের বাতিঘর' : 'Samoyer Batighor'}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block sm:block">
                {language === 'bn' ? 'একতাই শক্তি' : 'Unity is Strength'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === link.href
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {t(link.label)}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2 border-border hover:bg-accent"
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">{language === 'bn' ? 'EN' : 'বাং'}</span>
            </Button>

            {/* Login Button - Desktop */}
            <Button 
              variant="default" 
              size="sm" 
              className="hidden md:flex"
              onClick={() => navigate('/auth')}
            >
              {t('nav.login')}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {t(link.label)}
                </Link>
              ))}
              <Button 
                variant="default" 
                className="mt-4 mx-4"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/auth');
                }}
              >
                {t('nav.login')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
