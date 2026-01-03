import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Newspaper, Image, Phone, Info, UserCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { href: '/', icon: Home, label: 'nav.home' },
    { href: '/about', icon: Info, label: 'nav.about' },
    { href: '/members', icon: Users, label: 'nav.members' },
    { href: '/news', icon: Newspaper, label: 'nav.news' },
    { href: '/gallery', icon: Image, label: 'nav.gallery' },
    { href: '/contact', icon: Phone, label: 'nav.contact' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 min-w-[50px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight text-center",
                isActive && "font-semibold"
              )}>
                {t(item.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
