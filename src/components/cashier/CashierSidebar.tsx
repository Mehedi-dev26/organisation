import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  LogOut,
  Home,
  Wallet,
  Receipt,
  History
} from 'lucide-react';

const CashierSidebar = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const menuItems = [
    { 
      title: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', 
      url: '/cashier', 
      icon: LayoutDashboard 
    },
    { 
      title: language === 'bn' ? 'আর্থিক ব্যবস্থাপনা' : 'Finance', 
      url: '/cashier/finance', 
      icon: Wallet 
    },
    { 
      title: language === 'bn' ? 'বকেয়া চাঁদা' : 'Dues', 
      url: '/cashier/dues', 
      icon: Receipt 
    },
    { 
      title: language === 'bn' ? 'বিগত বছরের হিসাব' : 'Yearly Accounts', 
      url: '/cashier/yearly-accounts', 
      icon: History 
    },
  ];

  const isActive = (path: string) => {
    if (path === '/cashier') {
      return location.pathname === '/cashier';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-heading font-bold text-sidebar-foreground">
                {language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}
              </h2>
              <p className="text-xs text-sidebar-foreground/70">
                {language === 'bn' ? 'আর্থিক প্যানেল' : 'Finance Panel'}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {language === 'bn' ? 'প্রধান মেনু' : 'Main Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    className="hover:bg-sidebar-accent"
                  >
                    <NavLink to={item.url} end={item.url === '/cashier'}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-sidebar-accent">
              <NavLink to="/">
                <Home className="w-4 h-4" />
                {!collapsed && <span>{language === 'bn' ? 'হোম পেজ' : 'Home Page'}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={signOut}
              className="hover:bg-destructive/20 text-destructive"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CashierSidebar;
