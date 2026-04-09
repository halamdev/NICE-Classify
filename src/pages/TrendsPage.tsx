import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendData = [
  { month: 'Jan', class9: 1200, class42: 980, class25: 850, class35: 1100 },
  { month: 'Feb', class9: 1350, class42: 1050, class25: 870, class35: 1080 },
  { month: 'Mar', class9: 1500, class42: 1200, class25: 900, class35: 1150 },
  { month: 'Apr', class9: 1420, class42: 1350, class25: 920, class35: 1200 },
  { month: 'May', class9: 1600, class42: 1500, class25: 880, class35: 1180 },
  { month: 'Jun', class9: 1750, class42: 1650, class25: 910, class35: 1220 },
];

const hotClasses = [
  { cls: 9, trend: 'up', pct: '+18%', label: 'Phần mềm & Công nghệ' },
  { cls: 42, trend: 'up', pct: '+22%', label: 'Dịch vụ IT & SaaS' },
  { cls: 35, trend: 'stable', pct: '+3%', label: 'Quảng cáo & Marketing' },
  { cls: 25, trend: 'down', pct: '-2%', label: 'Thời trang' },
  { cls: 5, trend: 'up', pct: '+15%', label: 'Dược phẩm & Y tế' },
];

export default function TrendsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">{t('Xu hướng đăng ký nhãn hiệu', 'Trademark Registration Trends')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('Xu hướng đăng ký theo nhóm (6 tháng)', 'Registration Trends by Class (6 months)')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="class9" stroke="hsl(215, 60%, 24%)" name="Class 9" strokeWidth={2} />
              <Line type="monotone" dataKey="class42" stroke="hsl(199, 80%, 46%)" name="Class 42" strokeWidth={2} />
              <Line type="monotone" dataKey="class25" stroke="hsl(142, 71%, 45%)" name="Class 25" />
              <Line type="monotone" dataKey="class35" stroke="hsl(38, 92%, 50%)" name="Class 35" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Nhóm ngành "hot"', 'Trending Classes')}</CardTitle>
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
                  <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
                    {pct}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
