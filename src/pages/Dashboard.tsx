import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookmarkCheck, TrendingUp, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { niceClasses } from '@/data/niceClassesData';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const COLORS = [
  'hsl(215, 60%, 24%)',
  'hsl(199, 80%, 46%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(270, 60%, 50%)',
  'hsl(180, 60%, 40%)',
  'hsl(30, 80%, 55%)',
];

const pieData = [
  { name: 'Hàng hóa', value: 65 },
  { name: 'Dịch vụ', value: 35 },
];

export default function Dashboard() {
  const { t, language } = useLanguage();

  const [chartData, setChartData] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [totalSearches, setTotalSearches] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      // 🔢 Tổng search
      setTotalSearches(data.length);

      // 🕒 Recent
      setRecent(data.slice(0, 5));

      // 📊 Thống kê class
      const classCount: Record<number, number> = {};

      data.forEach((item) => {
        const results = Array.isArray(item.results) ? item.results : [];

        results.forEach((r: any) => {
          const cls = r.classNumber;
          if (!classCount[cls]) classCount[cls] = 0;
          classCount[cls]++;
        });
      });

      const stats = Object.entries(classCount).map(([cls, count]) => {
        const classNumber = Number(cls);
        const nice = niceClasses.find((c) => c.classNumber === classNumber);

        return {
          name: `${classNumber}`,
          label: nice
            ? language === 'vi'
              ? nice.titleVi
              : nice.titleEn
            : '',
          count,
        };
      });

      setChartData(stats);
      setLoading(false);
    };

    fetchData();
  }, [language]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {t('Bảng điều khiển', 'Dashboard')}
      </h1>

      {/* 🔢 STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('Tổng tra cứu', 'Total Searches')}
              </p>
              <p className="text-2xl font-bold">{totalSearches}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BookmarkCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('Kết quả đã lưu', 'Saved Results')}
              </p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('Nhóm quan tâm', 'Classes of Interest')}
              </p>
              <p className="text-2xl font-bold">{chartData.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('Độ chính xác TB', 'Avg. Accuracy')}
              </p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📊 CHART */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {t('Top nhóm NICE quan tâm', 'Top NICE Classes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    value,
                    t('Lượt tra cứu', 'Searches'),
                  ]}
                  labelFormatter={(label: string) => {
                    const item = chartData.find((d) => d.name === label);
                    return `Class ${label}: ${item?.label || ''}`;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(215, 60%, 24%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 🍰 PIE */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('Hàng hóa vs Dịch vụ', 'Goods vs Services')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 🕒 RECENT */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('Tra cứu gần đây', 'Recent Searches')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading && <p>Loading...</p>}

            {!loading &&
              recent.map((item) => {
                const first = item.results?.[0];

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{item.query}</p>
                      <div className="mt-1 flex gap-1">
                        {first && (
                          <Badge variant="secondary" className="text-xs">
                            Class {first.classNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}