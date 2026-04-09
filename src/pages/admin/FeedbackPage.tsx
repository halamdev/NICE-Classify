import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

const mockFeedback = [
  { id: 1, query: 'phần mềm quản lý', aiClass: 9, correct: true, expert: 'Admin', date: '2026-04-04' },
  { id: 2, query: 'dịch vụ giao pizza', aiClass: 39, correct: false, expertClass: 43, expert: 'Admin', date: '2026-04-03', note: 'Giao pizza là dịch vụ nhà hàng, không phải vận tải' },
  { id: 3, query: 'nước hoa cao cấp', aiClass: 3, correct: true, expert: 'Admin', date: '2026-04-03' },
  { id: 4, query: 'dịch vụ bảo vệ', aiClass: 45, correct: true, expert: 'Admin', date: '2026-04-02' },
  { id: 5, query: 'xe đạp điện', aiClass: 12, correct: false, expertClass: 12, expert: 'Admin', date: '2026-04-01', note: 'Đúng class nhưng cần thêm class 9 cho phần điện tử' },
];

export default function FeedbackPage() {
  const { t } = useLanguage();
  const accuracy = (mockFeedback.filter((f) => f.correct).length / mockFeedback.length) * 100;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('Phản hồi & Đánh giá AI', 'AI Feedback & Evaluation')}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('Tổng phản hồi', 'Total Feedback')}</p>
              <p className="text-2xl font-bold">{mockFeedback.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ThumbsUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('Độ chính xác AI', 'AI Accuracy')}</p>
              <p className="text-2xl font-bold">{accuracy.toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ThumbsDown className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('Cần cải thiện', 'Needs Improvement')}</p>
              <p className="text-2xl font-bold">{mockFeedback.filter((f) => !f.correct).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {mockFeedback.map((fb) => (
          <Card key={fb.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">"{fb.query}"</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">AI → Class {fb.aiClass}</Badge>
                    {fb.correct ? (
                      <Badge className="bg-green-100 text-green-800">
                        <ThumbsUp className="mr-1 h-3 w-3" /> {t('Đúng', 'Correct')}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <ThumbsDown className="mr-1 h-3 w-3" /> {t('Sai', 'Incorrect')}
                        {fb.expertClass && ` → Class ${fb.expertClass}`}
                      </Badge>
                    )}
                  </div>
                  {fb.note && <p className="mt-2 text-sm text-muted-foreground italic">"{fb.note}"</p>}
                </div>
                <span className="text-xs text-muted-foreground">{fb.date}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
