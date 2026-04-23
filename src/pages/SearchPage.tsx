import { useState } from 'react';
import { Search, Sparkles, ChevronRight, Info, GitBranch, Cpu, Zap } from 'lucide-react';
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

interface RuleCandidate { classNumber: number; ruleScore: number; matchedKeywords: string[] }
interface VectorCandidate { classNumber: number; vectorScore: number }
interface HybridCandidate { classNumber: number; hybridScore: number }

interface PipelineTrace {
  tokens?: string[];
  detected_language?: string;
  rule_candidates?: RuleCandidate[];
  vector_topk?: VectorCandidate[];
  hybrid_topk?: HybridCandidate[];
  llm_model?: string;
  rule_top3?: number[];
  vector_top3?: number[];
}

export default function SearchPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClassResult[]>([]);
  const [pipelineTrace, setPipelineTrace] = useState<PipelineTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setPipelineTrace(null);
    setShowTrace(false);

    try {
      const { data, error } = await supabase.functions.invoke('classify', {
        body: { query: query.trim(), language },
      });

      if (error) throw error;

      if (data?.results) {
        setResults(data.results);
      }
      if (data?.pipeline_trace) {
        setPipelineTrace(data.pipeline_trace);
      }

      // Lưu vào search_history
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data?.results) {
        await supabase.from('search_history').insert({
          user_id: user.id,
          query: query.trim(),
          results: data.results,
          language,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('Không thể phân loại. Thử lại sau.', 'Classification failed. Try again later.');
      toast({ title: t('Lỗi', 'Error'), description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getClassInfo = (num: number) => niceClasses.find((c) => c.classNumber === num);

  const handleSave = async (result: ClassResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('saved_results').insert({
      user_id: user.id,
      query: query.trim(),
      class_number: result.classNumber,
      items: result.items,
    });
    toast({ title: t('Đã lưu', 'Saved'), description: `Class ${result.classNumber}` });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('Tra cứu phân loại NICE', 'NICE Classification Search')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('Nhập mô tả sản phẩm/dịch vụ bằng ngôn ngữ thường để nhận gợi ý phân loại', 'Enter a product/service description in natural language to get classification suggestions')}
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
                placeholder={t('Ví dụ: phần mềm quản lý bán hàng, quần áo thể thao, dịch vụ tư vấn pháp lý...', 'e.g.: sales management software, sportswear, legal consulting services...')}
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

      {/* Pipeline Progress Indicator */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span>{t('Đang xử lý ...', 'Processing ...')}</span>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {[t('NLP', 'NLP'), t('Rule-based', 'Rule-based'), t('TF-IDF Vector', 'TF-IDF Vector'), t('LLM Re-rank', 'LLM Re-rank')].map((step, i) => (
                <Badge key={i} variant="outline" className="text-xs border-blue-300 text-blue-600 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                  {step}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Trace Panel */}
      {pipelineTrace && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4 text-slate-500" />
                {t('Pipeline Trace – Minh bạch quá trình xử lý', 'Pipeline Trace – Processing Transparency')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowTrace(!showTrace)}>
                <ChevronRight className={`h-4 w-4 transition-transform ${showTrace ? 'rotate-90' : ''}`} />
                {showTrace ? t('Thu gọn', 'Collapse') : t('Xem chi tiết', 'View Details')}
              </Button>
            </div>
          </CardHeader>
          {showTrace && (
            <CardContent className="space-y-4 text-sm">
              {/* Step 1: NLP */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                <p className="mb-1 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs">1</span>
                  {t('NLP Preprocessing', 'NLP Preprocessing')}
                  <Badge variant="secondary" className="ml-1 text-xs">{pipelineTrace.detected_language === 'vi' ? 'Tiếng Việt' : 'English'}</Badge>
                </p>
                <p className="text-muted-foreground">{t('Tokens:', 'Tokens:')} <span className="font-mono text-xs">{pipelineTrace.tokens?.join(' | ') || '—'}</span></p>
              </div>

              {/* Step 2: Rule-based */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-xs">2</span>
                  {t('Rule-based Filter', 'Rule-based Filter')}
                  <Badge variant="secondary" className="ml-1 text-xs">{pipelineTrace.rule_candidates?.length || 0} {t('ứng viên', 'candidates')}</Badge>
                </p>
                <div className="flex flex-wrap gap-1">
                  {(pipelineTrace.rule_candidates || []).map((r) => (
                    <span key={r.classNumber} className="rounded bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs text-orange-800 dark:text-orange-200">
                      Class {r.classNumber} ({(r.ruleScore * 100).toFixed(0)}%) {r.matchedKeywords.length > 0 && `→ "${r.matchedKeywords[0]}"`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 3: Vector */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-white text-xs">3</span>
                  {t('TF-IDF Vector Search', 'TF-IDF Vector Search')}
                  <Badge variant="secondary" className="ml-1 text-xs">{t('Cosine Similarity', 'Cosine Similarity')}</Badge>
                </p>
                <div className="flex flex-wrap gap-1">
                  {(pipelineTrace.vector_topk || []).map((v) => (
                    <span key={v.classNumber} className="rounded bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs text-purple-800 dark:text-purple-200">
                      Class {v.classNumber} ({v.vectorScore.toFixed(3)})
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 4: Hybrid */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs">4</span>
                  {t('Hybrid Score (Rule 45% + Vector 55%)', 'Hybrid Score (Rule 45% + Vector 55%)')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(pipelineTrace.hybrid_topk || []).map((h) => (
                    <span key={h.classNumber} className="rounded bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs text-green-800 dark:text-green-200">
                      Class {h.classNumber} ({(h.hybridScore * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 5: LLM */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs">5</span>
                  {t('LLM Re-ranking & XAI', 'LLM Re-ranking & XAI')}
                  <Badge variant="secondary" className="ml-1 text-xs">{pipelineTrace.llm_model || 'gemini-flash'}</Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('LLM chỉ re-rank trong tập ứng viên đã lọc — không tự tạo class mới', 'LLM only re-ranks within pre-filtered candidates — no hallucination')}</p>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {t('Kết quả gợi ý', 'Suggested Results')} ({results.length})
          </h2>
          {results.map((result) => {
            const cls = getClassInfo(result.classNumber);
            const isExpanded = expandedClass === result.classNumber;
            return (
              <Card key={result.classNumber} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setExpandedClass(isExpanded ? null : result.classNumber)}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                        {result.classNumber}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {cls ? (language === 'vi' ? cls.titleVi : cls.titleEn) : `Class ${result.classNumber}`}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {cls ? (language === 'vi' ? cls.descriptionVi : cls.descriptionEn) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.confidence >= 0.8 ? 'default' : result.confidence >= 0.5 ? 'secondary' : 'outline'}>
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
                              <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleSave(result); }}>
                          {t('Lưu kết quả này', 'Save this result')}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state with examples */}
      {!loading && results.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('Ví dụ tra cứu:', 'Try searching:')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { q: t('Phần mềm máy tính (tải xuống)', 'Computer software (downloadable)'), c: '9' },
              { q: t('Dịch vụ thiết kế phần mềm SaaS', 'SaaS software design service'), c: '42' },
              { q: t('Quần áo thể thao', 'Sportswear'), c: '25' },
              { q: t('Dịch vụ nhà hàng', 'Restaurant services'), c: '43' },
              { q: t('Mỹ phẩm chăm sóc da', 'Skincare cosmetics'), c: '3' },
              { q: t('Dịch vụ tư vấn pháp lý nhãn hiệu', 'Trademark legal consulting'), c: '45' },
            ].map(({ q, c }) => (
              <button key={q} onClick={() => { setQuery(q); }} className="rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted">
                <span className="text-muted-foreground">Class {c} →</span>
                <p className="mt-0.5 font-medium">{q}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
