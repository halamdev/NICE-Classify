import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { niceClasses } from '@/data/niceClassesData';
import { Upload, Download, Search, Plus, Edit, Database } from 'lucide-react';

export default function DataManagement() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = niceClasses.filter((c) => {
    const s = search.toLowerCase();
    return c.titleVi.toLowerCase().includes(s) || c.titleEn.toLowerCase().includes(s) || String(c.classNumber).includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('Quản lý dữ liệu NICE', 'NICE Data Management')}</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {t('Nhập dữ liệu', 'Import')}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('Xuất dữ liệu', 'Export')}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('Thêm mục', 'Add Item')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('Bảng phân loại NICE (NCL 13-2026)', 'NICE Classification (NCL 13-2026)')}
            </CardTitle>
            <Badge variant="secondary">45 {t('nhóm', 'classes')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm kiếm theo số nhóm hoặc tên...', 'Search by class number or name...')}
              className="pl-9"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>{t('Loại', 'Type')}</TableHead>
                  <TableHead>{t('Tên (VI)', 'Name (VI)')}</TableHead>
                  <TableHead>{t('Tên (EN)', 'Name (EN)')}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.classNumber}>
                    <TableCell className="font-bold">{c.classNumber}</TableCell>
                    <TableCell>
                      <Badge variant={c.type === 'goods' ? 'default' : 'secondary'}>
                        {c.type === 'goods' ? t('Hàng hóa', 'Goods') : t('Dịch vụ', 'Services')}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.titleVi}</TableCell>
                    <TableCell>{c.titleEn}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
