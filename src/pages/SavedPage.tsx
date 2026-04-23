import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { niceClasses } from '@/data/niceClassesData';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SavedItem {
  id: string;
  query: string;
  class_number: number;
  items: string[] | null;
  notes: string | null;
  created_at: string;
}

export default function SavedPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSaved(); }, []);

  const fetchSaved = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('saved_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSaved(data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        query: row.query as string,
        class_number: row.class_number as number,
        items: row.items as string[] | null,
        notes: row.notes as string | null,
        created_at: row.created_at as string,
      })));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('saved_results').delete().eq('id', id);
    setSaved((prev) => prev.filter((s) => s.id !== id));
    toast({ title: t('Đã xóa', 'Deleted') });
  };

  const handleExport = () => {
    const csv = ['Class,Tên nhóm,Query,Các mục']
      .concat(saved.map((s) => {
        const cls = niceClasses.find((c) => c.classNumber === s.class_number);
        const title = cls ? (language === 'vi' ? cls.titleVi : cls.titleEn) : '';
        return `${s.class_number},"${title}","${s.query}","${(s.items || []).join('; ')}"`;
      }))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'nice-classification-results.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('Kết quả đã lưu', 'Saved Results')}</h1>
        {saved.length > 0 && (
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('Xuất CSV', 'Export CSV')}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : saved.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">{t('Chưa có kết quả đã lưu', 'No saved results yet')}</p>
      ) : (
        <div className="space-y-3">
          {saved.map((item) => {
            const cls = niceClasses.find((c) => c.classNumber === item.class_number);
            return (
              <Card key={item.id}>
                <CardContent className="flex items-start justify-between py-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                      {item.class_number}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{cls ? (language === 'vi' ? cls.titleVi : cls.titleEn) : `Class ${item.class_number}`}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.query}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(item.items || []).map((it, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{it}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="ml-2 flex-shrink-0 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
