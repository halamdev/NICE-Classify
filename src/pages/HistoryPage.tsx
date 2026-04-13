import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HistoryItem {
  id: string;
  query: string;
  results: any;
  created_at: string;
}

export default function HistoryPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 LOAD DATA TỪ SUPABASE
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
      } else {
        setHistory(data || []);
      }

      setLoading(false);
    };

    fetchHistory();
  }, []);

  // 🔍 FILTER SEARCH
  const filtered = history.filter((h) =>
    h.query.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">
        {t('Lịch sử tra cứu', 'Search History')}
      </h1>

      {/* 🔍 Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Tìm trong lịch sử...', 'Search history...')}
          className="pl-9"
        />
      </div>

      {/* 📊 LIST */}
      <div className="space-y-3">
        {loading && (
          <p className="text-center text-muted-foreground">Loading...</p>
        )}

        {!loading &&
          filtered.map((item) => {
            const firstResult = item.results?.[0]; // lấy class đầu

            return (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{item.query}</p>

                    <div className="mt-1 flex items-center gap-2">
                      {firstResult && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            Class {firstResult.classNumber}
                          </Badge>

                          <Badge
                            variant={
                              firstResult.confidence >= 0.9
                                ? 'default'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {Math.round(firstResult.confidence * 100)}%
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            {t('Không tìm thấy kết quả', 'No results found')}
          </p>
        )}
      </div>
    </div>
  );
}