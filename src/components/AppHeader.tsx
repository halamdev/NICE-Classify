import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="text-sm font-medium text-muted-foreground">
          {t('Hệ thống Phân loại NICE', 'NICE Classification System')}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
        className="gap-1.5"
      >
        <Globe className="h-4 w-4" />
        {language === 'vi' ? 'EN' : 'VI'}
      </Button>
    </header>
  );
}
