import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Clock, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface HistoryItem {
  id: string;
  query: string;
  results: Array<{ classNumber: number; confidence: number }> | null;
  language: string;
  created_at: string;
}

export default function HistoryPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setHistory(data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        query: row.query as string,
        results: row.results as Array<{ classNumber: number; confidence: number }> | null,
        language: row.language as string,
        created_at: row.created_at as string,
      })));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('search_history').delete().eq('id', id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast({ title: t('Đã xóa', 'Deleted') });
  };

  const filtered = history.filter((h) => h.query.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">{t('Lịch sử tra cứu', 'Search History')}</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Tìm trong lịch sử...', 'Search history...')} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">{t('Chưa có lịch sử tra cứu', 'No search history yet')}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.query}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {(item.results || []).map((r) => (
                      <Badge key={r.classNumber} variant="secondary" className="text-xs">Class {r.classNumber}</Badge>
                    ))}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="ml-2 flex-shrink-0 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
