import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, CreditCard, User, Key, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  icon: React.ElementType;
  labelBn: string;
  labelEn: string;
  action?: () => void;
}

const MemberMobileNav = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState('dashboard');

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems: NavItem[] = [
    { 
      id: 'dashboard',
      icon: LayoutDashboard, 
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
    },
    { 
      id: 'dues',
      icon: CreditCard, 
      labelBn: 'চাঁদা',
      labelEn: 'Dues',
    },
    { 
      id: 'profile',
      icon: User, 
      labelBn: 'প্রোফাইল',
      labelEn: 'Profile',
    },
    { 
      id: 'password',
      icon: Key, 
      labelBn: 'পাসওয়ার্ড',
      labelEn: 'Password',
    },
    { 
      id: 'logout',
      icon: LogOut, 
      labelBn: 'লগআউট',
      labelEn: 'Logout',
      action: handleLogout,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom shadow-lg">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id && item.id !== 'logout';
          const isLogout = item.id === 'logout';

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  scrollToSection(item.id);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary bg-primary/10 scale-105" 
                  : isLogout
                    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all duration-300",
                isActive && "bg-primary/20"
              )}>
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} 
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium truncate max-w-full mt-0.5",
                isActive && "font-semibold"
              )}>
                {language === 'bn' ? item.labelBn : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MemberMobileNav;
