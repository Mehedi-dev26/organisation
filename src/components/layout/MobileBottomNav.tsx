import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Newspaper, Image, Phone, UserCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const location = useLocation();
  const { t, language } = useLanguage();

  const navItems = [
    { href: '/', icon: Home, label: 'nav.home' },
    { href: '/members', icon: Users, label: 'nav.members' },
    { href: '/news', icon: Newspaper, label: 'nav.news' },
    { href: '/gallery', icon: Image, label: 'nav.gallery' },
    { href: '/contact', icon: Phone, label: 'nav.contact' },
    { href: '/auth', icon: UserCircle, labelBn: 'লগইন', labelEn: 'Login' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-300 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:scale-95"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
              
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-primary/15 shadow-sm" 
                  : "hover:bg-accent"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive && "stroke-[2.5] scale-110"
                )} />
              </div>
              
              <span className={cn(
                "text-[9px] font-medium leading-tight text-center transition-all duration-300",
                isActive ? "font-bold text-primary" : "text-muted-foreground"
              )}>
                {item.label ? t(item.label) : (language === 'bn' ? item.labelBn : item.labelEn)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
