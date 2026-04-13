import { useState } from 'react';
import { Search, Sparkles, ChevronRight, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { niceClasses } from '@/data/niceClassesData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClassResult {
  classNumber: number;
  confidence: number;
  reason: string;
  items: string[];
}

export default function SearchPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClassResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<number | null>(null);

const handleSearch = async () => {
  if (!query.trim()) return;

  setLoading(true);
  setResults([]);

  try {
    // 🔹 1. Gọi AI classification
    const { data, error } = await supabase.functions.invoke("classify", {
      body: {
        query: query.trim(),
        language,
      },
    });

    if (error) throw error;

    // 🔹 2. Nếu có kết quả → hiển thị + lưu DB
    if (data?.results) {
  setResults(data.results);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 🔹 1. LƯU HISTORY
    const { error: historyError } = await supabase
      .from("search_history")
      .insert([
        {
          user_id: user.id,
          query: query.trim(),
          results: data.results,
          language: language,
        },
      ]);

    if (historyError) {
      console.error("History error:", historyError);
    }

    // 🔹 2. AUTO SAVE (lấy kết quả tốt nhất)
    const best = data.results[0];

    if (best) {
      // ❗ tránh lưu trùng
      const { data: existing } = await supabase
        .from("saved_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("query", query.trim())
        .limit(1);

      if (!existing || existing.length === 0) {
        const { error: savedError } = await supabase
          .from("saved_results")
          .insert([
            {
              user_id: user.id,
              query: query.trim(),
              class_number: best.classNumber,
              items: best.items,
            },
          ]);

        if (savedError) {
          console.error("Saved error:", savedError);
        } else {
          console.log("Auto saved");
        }
      }
    }
  }
}
  } catch (err: any) {
    console.error("Search error:", err);

    toast({
      title: t("Lỗi", "Error"),
      description:
        err.message ||
        t(
          "Không thể phân loại. Thử lại sau.",
          "Classification failed. Try again later."
        ),
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  const getClassInfo = (num: number) => niceClasses.find((c) => c.classNumber === num);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('Tra cứu phân loại NICE', 'NICE Classification Search')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t(
            'Nhập mô tả sản phẩm/dịch vụ bằng ngôn ngữ thường để nhận gợi ý phân loại',
            'Enter a product/service description in natural language to get classification suggestions'
          )}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t(
                  'Ví dụ: phần mềm quản lý bán hàng, quần áo thể thao, dịch vụ tư vấn pháp lý...',
                  'e.g.: sales management software, sportswear, legal consulting services...'
                )}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? t('Đang phân tích...', 'Analyzing...') : t('Phân loại', 'Classify')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {t('Kết quả gợi ý', 'Suggested Results')} ({results.length})
          </h2>
          {results.map((result) => {
            const cls = getClassInfo(result.classNumber);
            const isExpanded = expandedClass === result.classNumber;
            return (
              <Card
                key={result.classNumber}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setExpandedClass(isExpanded ? null : result.classNumber)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                        {result.classNumber}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {cls
                            ? language === 'vi'
                              ? cls.titleVi
                              : cls.titleEn
                            : `Class ${result.classNumber}`}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {cls
                            ? language === 'vi'
                              ? cls.descriptionVi
                              : cls.descriptionEn
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={result.confidence >= 0.8 ? 'default' : result.confidence >= 0.5 ? 'secondary' : 'outline'}
                      >
                        {Math.round(result.confidence * 100)}%
                      </Badge>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="rounded-lg bg-muted p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                          <Info className="h-4 w-4 text-accent" />
                          {t('Lý do phân loại (XAI)', 'Classification Reasoning (XAI)')}
                        </div>
                        <p className="text-sm text-muted-foreground">{result.reason}</p>
                      </div>
                      {result.items.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium">{t('Mục liên quan', 'Related Items')}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.items.map((item, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { q: t('Phần mềm máy tính', 'Computer software'), c: '9' },
            { q: t('Quần áo thể thao', 'Sportswear'), c: '25' },
            { q: t('Dịch vụ nhà hàng', 'Restaurant services'), c: '43' },
            { q: t('Mỹ phẩm chăm sóc da', 'Skincare cosmetics'), c: '3' },
            { q: t('Dịch vụ tư vấn pháp lý', 'Legal consulting'), c: '45' },
            { q: t('Thiết bị y tế', 'Medical devices'), c: '10' },
          ].map(({ q, c }) => (
            <button
              key={q}
              onClick={() => { setQuery(q); }}
              className="rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="text-muted-foreground">Class {c} →</span>
              <p className="mt-0.5 font-medium">{q}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
