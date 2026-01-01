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
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Newspaper, 
  Calendar, 
  UserCog, 
  LogOut,
  Home,
  Settings
} from 'lucide-react';

const AdminSidebar = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const menuItems = [
    { 
      title: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', 
      url: '/admin', 
      icon: LayoutDashboard 
    },
    { 
      title: language === 'bn' ? 'সদস্য ব্যবস্থাপনা' : 'Members', 
      url: '/admin/members', 
      icon: Users 
    },
    { 
      title: language === 'bn' ? 'সংবাদ ব্যবস্থাপনা' : 'News', 
      url: '/admin/news', 
      icon: Newspaper 
    },
    { 
      title: language === 'bn' ? 'ইভেন্ট ব্যবস্থাপনা' : 'Events', 
      url: '/admin/events', 
      icon: Calendar 
    },
    { 
      title: language === 'bn' ? 'কমিটি ব্যবস্থাপনা' : 'Committee', 
      url: '/admin/committee', 
      icon: UserCog 
    },
    { 
      title: language === 'bn' ? 'সেটিংস' : 'Settings', 
      url: '/admin/settings', 
      icon: Settings 
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
            <Settings className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-heading font-bold text-sidebar-foreground">
                {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
              </h2>
              <p className="text-xs text-sidebar-foreground/70">
                {language === 'bn' ? 'ব্যবস্থাপনা প্যানেল' : 'Management Panel'}
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
                    <NavLink to={item.url} end={item.url === '/admin'}>
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

export default AdminSidebar;
