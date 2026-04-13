import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { niceClasses } from '@/data/niceClassesData';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SavedItem {
  id: string;
  query: string;
  class_number: number;
  items: any;
}

export default function SavedPage() {
  const { t, language } = useLanguage();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 LOAD DATA
  useEffect(() => {
    const fetchSaved = async () => {
      const { data, error } = await supabase
        .from('saved_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setSaved(data || []);
      }

      setLoading(false);
    };

    fetchSaved();
  }, []);

  // 🔥 EXPORT CSV
  const handleExport = () => {
    const csv = ['Class,Query,Items']
      .concat(
        saved.map((s) => {
          const items = Array.isArray(s.items) ? s.items.join('; ') : '';
          return `${s.class_number},"${s.query}","${items}"`;
        })
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'nice-saved-results.csv';
    a.click();

    URL.revokeObjectURL(url);
  };

  // 🔥 DELETE
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('saved_results')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
    } else {
      setSaved((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {t('Kết quả đã lưu', 'Saved Results')}
        </h1>

        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t('Xuất CSV', 'Export CSV')}
        </Button>
      </div>

      <div className="space-y-3">
        {loading && <p>Loading...</p>}

        {!loading &&
          saved.map((item) => {
            const cls = niceClasses.find(
              (c) => c.classNumber === item.class_number
            );

            const items = Array.isArray(item.items)
              ? item.items
              : [];

            return (
              <Card key={item.id}>
                <CardContent className="flex items-start justify-between py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                      {item.class_number}
                    </div>

                    <div>
                      <h3 className="font-semibold">{item.query}</h3>

                      <p className="text-sm text-muted-foreground">
                        {cls
                          ? language === 'vi'
                            ? cls.titleVi
                            : cls.titleEn
                          : ''}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {items.map((it: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {it}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}

        {!loading && saved.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            {t('Chưa có dữ liệu lưu', 'No saved results')}
          </p>
        )}
      </div>
    </div>
  );
}