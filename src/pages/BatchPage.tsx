import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';

interface BatchItem {
  row: number;
  product: string;
  classNumber: number | null;
  confidence: number;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export default function BatchPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<BatchItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mock: simulate parsing file
    const mockItems: BatchItem[] = [
      { row: 1, product: 'Phần mềm kế toán doanh nghiệp', classNumber: null, confidence: 0, status: 'pending' },
      { row: 2, product: 'Quần áo thời trang nam', classNumber: null, confidence: 0, status: 'pending' },
      { row: 3, product: 'Dịch vụ vận chuyển hàng hóa', classNumber: null, confidence: 0, status: 'pending' },
      { row: 4, product: 'Mỹ phẩm chống nắng', classNumber: null, confidence: 0, status: 'pending' },
      { row: 5, product: 'Dịch vụ thiết kế website', classNumber: null, confidence: 0, status: 'pending' },
    ];
    setItems(mockItems);
    setProgress(0);
  };

  const handleProcess = async () => {
    setProcessing(true);
    const results = [
      { classNumber: 9, confidence: 0.93 },
      { classNumber: 25, confidence: 0.95 },
      { classNumber: 39, confidence: 0.88 },
      { classNumber: 3, confidence: 0.91 },
      { classNumber: 42, confidence: 0.94 },
    ];

    for (let i = 0; i < items.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, ...results[i], status: 'done' } : item
        )
      );
      setProgress(((i + 1) / items.length) * 100);
    }
    setProcessing(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">{t('Phân loại hàng loạt', 'Batch Classification')}</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
            <FileSpreadsheet className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-sm text-muted-foreground">
              {t('Tải lên file Excel/CSV chứa danh sách sản phẩm', 'Upload an Excel/CSV file with product list')}
            </p>
            <label>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <Button asChild variant="outline">
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('Chọn file', 'Choose file')}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{items.length} {t('sản phẩm', 'products')}</p>
            <div className="flex gap-2">
              <Button onClick={handleProcess} disabled={processing}>
                {processing ? t('Đang xử lý...', 'Processing...') : t('Bắt đầu phân loại', 'Start Classification')}
              </Button>
              {progress === 100 && (
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {t('Xuất kết quả', 'Export Results')}
                </Button>
              )}
            </div>
          </div>

          {processing && <Progress value={progress} />}

          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.row}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">#{item.row}</span>
                    <span className="font-medium">{item.product}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'done' && (
                      <>
                        <Badge>Class {item.classNumber}</Badge>
                        <Badge variant="outline">{Math.round(item.confidence * 100)}%</Badge>
                      </>
                    )}
                    {item.status === 'pending' && <Badge variant="secondary">{t('Chờ', 'Pending')}</Badge>}
                    {item.status === 'processing' && <Badge variant="secondary">{t('Đang xử lý', 'Processing')}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
