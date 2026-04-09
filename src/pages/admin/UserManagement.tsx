import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Shield, UserCheck, UserX } from 'lucide-react';

const mockUsers = [
  { id: 1, email: 'admin@example.com', name: 'Admin User', role: 'admin', status: 'active', searches: 150 },
  { id: 2, email: 'user1@company.com', name: 'Nguyễn Văn A', role: 'enterprise', status: 'active', searches: 89 },
  { id: 3, email: 'user2@gmail.com', name: 'Trần Thị B', role: 'individual', status: 'active', searches: 34 },
  { id: 4, email: 'user3@corp.vn', name: 'Lê Minh C', role: 'enterprise', status: 'inactive', searches: 12 },
  { id: 5, email: 'user4@email.com', name: 'Phạm Văn D', role: 'individual', status: 'active', searches: 67 },
];

export default function UserManagement() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('Quản lý người dùng', 'User Management')}</h1>
        <Badge variant="secondary">
          <Users className="mr-1 h-3 w-3" />
          {mockUsers.length} {t('người dùng', 'users')}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Admin', count: mockUsers.filter((u) => u.role === 'admin').length, icon: Shield },
          { label: t('Doanh nghiệp', 'Enterprise'), count: mockUsers.filter((u) => u.role === 'enterprise').length, icon: UserCheck },
          { label: t('Cá nhân', 'Individual'), count: mockUsers.filter((u) => u.role === 'individual').length, icon: Users },
        ].map(({ label, count, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <Icon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Tên', 'Name')}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>{t('Vai trò', 'Role')}</TableHead>
                <TableHead>{t('Trạng thái', 'Status')}</TableHead>
                <TableHead>{t('Tra cứu', 'Searches')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : u.role === 'enterprise' ? 'secondary' : 'outline'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'active' ? 'default' : 'destructive'}>
                      {u.status === 'active' ? t('Hoạt động', 'Active') : t('Khóa', 'Inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.searches}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      {u.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
