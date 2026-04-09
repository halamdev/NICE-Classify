import {
  Search, LayoutDashboard, History, BookmarkCheck, FileUp,
  BarChart3, TrendingUp, Settings, Users, Database, MessageSquare,
  Shield, LogOut, Globe
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { role, signOut, user } = useAuth();
  const { t } = useLanguage();

  const mainItems = [
    { title: t('Tra cứu', 'Search'), url: '/search', icon: Search },
    { title: t('Bảng điều khiển', 'Dashboard'), url: '/dashboard', icon: LayoutDashboard },
    { title: t('Lịch sử', 'History'), url: '/history', icon: History },
    { title: t('Đã lưu', 'Saved'), url: '/saved', icon: BookmarkCheck },
  ];

  const enterpriseItems = [
    { title: t('Phân loại hàng loạt', 'Batch Classify'), url: '/batch', icon: FileUp },
    { title: t('Sức khỏe danh mục', 'Portfolio Health'), url: '/portfolio', icon: BarChart3 },
    { title: t('Xu hướng', 'Trends'), url: '/trends', icon: TrendingUp },
  ];

  const adminItems = [
    { title: t('Quản lý dữ liệu', 'Data Management'), url: '/admin/data', icon: Database },
    { title: t('Quản lý người dùng', 'User Management'), url: '/admin/users', icon: Users },
    { title: t('Phản hồi AI', 'AI Feedback'), url: '/admin/feedback', icon: MessageSquare },
    { title: t('Cài đặt', 'Settings'), url: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-sidebar-primary" />
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground">NICE Classify</h1>
              <p className="text-xs text-sidebar-foreground/60">NCL 13-2026</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Chính', 'Main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(role === 'enterprise' || role === 'admin') && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('Doanh nghiệp', 'Enterprise')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {enterpriseItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('Quản trị', 'Admin')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <div className="mb-2 truncate text-xs text-sidebar-foreground/60">
            {user.email}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t('Đăng xuất', 'Sign out')}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
