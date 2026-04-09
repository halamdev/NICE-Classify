import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookmarkCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { niceClasses } from '@/data/niceClassesData';

const mockSearchStats = [
  { classNumber: 9, count: 45 }, { classNumber: 25, count: 38 },
  { classNumber: 42, count: 32 }, { classNumber: 35, count: 28 },
  { classNumber: 43, count: 22 }, { classNumber: 3, count: 18 },
  { classNumber: 5, count: 15 }, { classNumber: 41, count: 12 },
];

const COLORS = ['hsl(215, 60%, 24%)', 'hsl(199, 80%, 46%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(270, 60%, 50%)', 'hsl(180, 60%, 40%)', 'hsl(30, 80%, 55%)'];

const pieData = [
  { name: 'Hàng hóa', value: 65 },
  { name: 'Dịch vụ', value: 35 },
];

export default function Dashboard() {
  const { t, language } = useLanguage();

  const chartData = mockSearchStats.map((s) => {
    const cls = niceClasses.find((c) => c.classNumber === s.classNumber);
    return {
      name: `${s.classNumber}`,
      label: cls ? (language === 'vi' ? cls.titleVi : cls.titleEn) : '',
      count: s.count,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('Bảng điều khiển', 'Dashboard')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('Tổng tra cứu', 'Total Searches'), value: '210', icon: Search, change: '+12%' },
          { label: t('Kết quả đã lưu', 'Saved Results'), value: '47', icon: BookmarkCheck, change: '+5' },
          { label: t('Nhóm quan tâm', 'Classes of Interest'), value: '14', icon: BarChart3, change: '' },
          { label: t('Độ chính xác TB', 'Avg. Accuracy'), value: '94%', icon: TrendingUp, change: '+2%' },
        ].map(({ label, value, icon: Icon, change }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
                {change && <span className="text-xs text-green-600">{change}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('Top nhóm NICE quan tâm', 'Top NICE Classes of Interest')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [value, t('Lượt tra cứu', 'Searches')]}
                  labelFormatter={(label: string) => {
                    const item = chartData.find((d) => d.name === label);
                    return `Class ${label}: ${item?.label || ''}`;
                  }}
                />
                <Bar dataKey="count" fill="hsl(215, 60%, 24%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Hàng hóa vs Dịch vụ', 'Goods vs Services')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Tra cứu gần đây', 'Recent Searches')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { query: 'phần mềm quản lý bán hàng', classes: [9, 42], time: '2 phút trước' },
              { query: 'quần áo thể thao nam nữ', classes: [25, 28], time: '15 phút trước' },
              { query: 'dịch vụ giao hàng nhanh', classes: [39], time: '1 giờ trước' },
              { query: 'mỹ phẩm organic thiên nhiên', classes: [3, 5], time: '3 giờ trước' },
            ].map((item) => (
              <div key={item.query} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{item.query}</p>
                  <div className="mt-1 flex gap-1">
                    {item.classes.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">
                        Class {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
