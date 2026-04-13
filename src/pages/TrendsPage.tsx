import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TrendsPage() {
  const { t } = useLanguage();

  // ✅ HOOK PHẢI Ở ĐÂY
  const [trendData, setTrendData] = useState<any[]>([]);
  const [hotClasses, setHotClasses] = useState<any[]>([]);

  // ✅ useEffect cũng phải ở đây
  useEffect(() => {
    const fetchTrends = async () => {
      const { data, error } = await supabase
        .from('search_history')
        .select('*');

      if (error) {
        console.error(error);
        return;
      }

      if (!data) return;

      // 🔹 group theo tháng
      const monthly: Record<string, Record<number, number>> = {};

      data.forEach((item) => {
        const date = new Date(item.created_at);
        const month = date.toLocaleString('en-US', { month: 'short' });

        if (!monthly[month]) monthly[month] = {};

        const results = Array.isArray(item.results) ? item.results : [];

        results.forEach((r: any) => {
          const cls = r.classNumber;

          if (!monthly[month][cls]) monthly[month][cls] = 0;
          monthly[month][cls]++;
        });
      });

      const months = Object.keys(monthly);

      const chart = months.map((m) => ({
        month: m,
        class9: monthly[m][9] || 0,
        class42: monthly[m][42] || 0,
        class25: monthly[m][25] || 0,
        class35: monthly[m][35] || 0,
      }));

      setTrendData(chart);

      // 🔹 tính top class
      const total: Record<number, number> = {};

      data.forEach((item) => {
        const results = Array.isArray(item.results) ? item.results : [];

        results.forEach((r: any) => {
          const cls = r.classNumber;

          if (!total[cls]) total[cls] = 0;
          total[cls]++;
        });
      });

      const sorted = Object.entries(total)
        .map(([cls, count]) => ({
          cls: Number(cls),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const hot = sorted.map((s) => ({
        cls: s.cls,
        trend: 'up',
        pct: `${s.count}`,
        label: `Class ${s.cls}`,
      }));

      setHotClasses(hot);
    };

    fetchTrends();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">
        {t('Xu hướng đăng ký nhãn hiệu', 'Trademark Registration Trends')}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('Xu hướng đăng ký theo nhóm (6 tháng)', 'Registration Trends by Class (6 months)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="class9" stroke="hsl(215, 60%, 24%)" />
              <Line type="monotone" dataKey="class42" stroke="hsl(199, 80%, 46%)" />
              <Line type="monotone" dataKey="class25" stroke="hsl(142, 71%, 45%)" />
              <Line type="monotone" dataKey="class35" stroke="hsl(38, 92%, 50%)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('Nhóm ngành "hot"', 'Trending Classes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hotClasses.map(({ cls, trend, pct, label }) => (
              <div key={cls} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {cls}
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {trend === 'stable' && <Minus className="h-4 w-4 text-yellow-500" />}
                  <Badge>{pct}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}