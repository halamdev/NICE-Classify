import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
const radarData = [
  { subject: 'Class 9', A: 90, fullMark: 100 },
  { subject: 'Class 25', A: 75, fullMark: 100 },
  { subject: 'Class 35', A: 60, fullMark: 100 },
  { subject: 'Class 42', A: 85, fullMark: 100 },
  { subject: 'Class 43', A: 40, fullMark: 100 },
  { subject: 'Class 41', A: 55, fullMark: 100 },
];

export default function PortfolioPage() {
  const { t } = useLanguage();

const [radarData, setRadarData] = useState<any[]>([]);
const [healthScore, setHealthScore] = useState(0);
useEffect(() => {
  const fetchPortfolio = async () => {
    const { data, error } = await supabase
      .from('saved_results')
      .select('*');

    if (error) {
      console.error(error);
      return;
    }

    if (!data) return;

    // 🔹 đếm số lần mỗi class
    const classCount: Record<number, number> = {};

    data.forEach((item) => {
      const cls = item.class_number;
      if (!classCount[cls]) classCount[cls] = 0;
      classCount[cls]++;
    });

    // 🔹 chọn top class
    const top = Object.entries(classCount)
      .map(([cls, count]) => ({
        cls: Number(cls),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const max = Math.max(...top.map((t) => t.count), 1);

    // 🔹 radar data
    const radar = top.map((t) => ({
      subject: `Class ${t.cls}`,
      A: Math.round((t.count / max) * 100),
      fullMark: 100,
    }));

    setRadarData(radar);

    // 🔹 health score (đơn giản)
    const score = Math.min(100, Object.keys(classCount).length * 10);
    setHealthScore(score);
  };

  fetchPortfolio();
}, []);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">{t('Sức khỏe danh mục nhãn hiệu', 'Portfolio Health Score')}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('Điểm sức khỏe tổng thể', 'Overall Health Score')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-primary">
              <span className="text-4xl font-bold">{healthScore}</span>
              <span className="absolute bottom-2 text-xs text-muted-foreground">/100</span>
            </div>
            <Badge className="mt-4" variant={healthScore >= 80 ? 'default' : 'secondary'}>
              {healthScore >= 80 ? t('Tốt', 'Good') : healthScore >= 60 ? t('Trung bình', 'Average') : t('Cần cải thiện', 'Needs Improvement')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Phạm vi bảo hộ', 'Protection Coverage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Coverage" dataKey="A" stroke="hsl(215, 60%, 24%)" fill="hsl(215, 60%, 24%)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>{t('Gợi ý cải thiện', 'Improvement Suggestions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { cls: 36, tip: t('Cân nhắc đăng ký Class 36 cho dịch vụ tài chính', 'Consider registering Class 36 for financial services') },
              { cls: 38, tip: t('Mở rộng bảo hộ sang Class 38 cho viễn thông', 'Expand protection to Class 38 for telecommunications') },
              { cls: 16, tip: t('Bổ sung Class 16 nếu có sản phẩm in ấn', 'Add Class 16 if you have printed materials') },
            ].map(({ cls, tip }) => (
              <div key={cls} className="flex items-start gap-3 rounded-lg border p-3">
                <Badge variant="outline">Class {cls}</Badge>
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
