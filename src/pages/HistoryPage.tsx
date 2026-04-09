import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Clock } from 'lucide-react';
import { useState } from 'react';

const mockHistory = [
  { id: 1, query: 'phần mềm quản lý bán hàng', classes: [9, 42], confidence: 0.92, date: '2026-04-04 10:30' },
  { id: 2, query: 'quần áo thể thao', classes: [25], confidence: 0.95, date: '2026-04-04 09:15' },
  { id: 3, query: 'dịch vụ tư vấn pháp lý', classes: [45], confidence: 0.88, date: '2026-04-03 16:42' },
  { id: 4, query: 'mỹ phẩm chăm sóc da mặt', classes: [3], confidence: 0.91, date: '2026-04-03 14:20' },
  { id: 5, query: 'dịch vụ nhà hàng ăn uống', classes: [43], confidence: 0.96, date: '2026-04-02 11:05' },
  { id: 6, query: 'thiết bị y tế chẩn đoán', classes: [10], confidence: 0.87, date: '2026-04-02 08:30' },
  { id: 7, query: 'bia thủ công craft beer', classes: [32, 33], confidence: 0.83, date: '2026-04-01 15:20' },
  { id: 8, query: 'dịch vụ giáo dục trực tuyến', classes: [41, 42], confidence: 0.89, date: '2026-04-01 10:10' },
];

export default function HistoryPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = mockHistory.filter((h) => h.query.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">{t('Lịch sử tra cứu', 'Search History')}</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Tìm trong lịch sử...', 'Search history...')}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{item.query}</p>
                <div className="mt-1 flex items-center gap-2">
                  {item.classes.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">Class {c}</Badge>
                  ))}
                  <Badge variant={item.confidence >= 0.9 ? 'default' : 'outline'} className="text-xs">
                    {Math.round(item.confidence * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {item.date}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">{t('Không tìm thấy kết quả', 'No results found')}</p>
        )}
      </div>
    </div>
  );
}
