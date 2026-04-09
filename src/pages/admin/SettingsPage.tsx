import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, Cpu, Globe } from 'lucide-react';

export default function AdminSettings() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t('Cài đặt hệ thống', 'System Settings')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('Cơ sở dữ liệu', 'Database')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('Phiên bản NICE', 'NICE Version')}</span>
            <Badge>NCL 13-2026</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('Số nhóm', 'Classes')}</span>
            <Badge variant="secondary">45</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('Trạng thái', 'Status')}</span>
            <Badge className="bg-green-100 text-green-800">{t('Hoạt động', 'Active')}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            {t('AI Engine', 'AI Engine')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('Mô hình', 'Model')}</span>
            <Badge variant="secondary">Lovable AI (Gemini)</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('Độ chính xác TB', 'Avg. Accuracy')}</span>
            <Badge>94%</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('Ngôn ngữ', 'Language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('Ngôn ngữ hỗ trợ', 'Supported Languages')}</span>
            <div className="flex gap-1">
              <Badge variant="outline">Tiếng Việt</Badge>
              <Badge variant="outline">English</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
