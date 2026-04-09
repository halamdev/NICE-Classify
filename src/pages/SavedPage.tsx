import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { niceClasses } from '@/data/niceClassesData';

const mockSaved = [
  { id: 1, query: 'phần mềm quản lý bán hàng', classNumber: 9, items: ['computer software', 'downloadable software'] },
  { id: 2, query: 'quần áo thể thao', classNumber: 25, items: ['sports clothing', 'athletic shoes'] },
  { id: 3, query: 'dịch vụ nhà hàng', classNumber: 43, items: ['restaurant services', 'catering'] },
];

export default function SavedPage() {
  const { t, language } = useLanguage();

  const handleExport = () => {
    const csv = ['Class,Query,Items']
      .concat(mockSaved.map((s) => `${s.classNumber},"${s.query}","${s.items.join('; ')}"`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nice-classification-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('Kết quả đã lưu', 'Saved Results')}</h1>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t('Xuất CSV', 'Export CSV')}
        </Button>
      </div>

      <div className="space-y-3">
        {mockSaved.map((item) => {
          const cls = niceClasses.find((c) => c.classNumber === item.classNumber);
          return (
            <Card key={item.id}>
              <CardContent className="flex items-start justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {item.classNumber}
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.query}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cls ? (language === 'vi' ? cls.titleVi : cls.titleEn) : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.items.map((it) => (
                        <Badge key={it} variant="outline" className="text-xs">{it}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
