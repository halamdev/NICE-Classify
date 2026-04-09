import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<string>('individual');
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/search');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, account_type: accountType },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: t('Đăng ký thành công', 'Registration successful'),
          description: t('Vui lòng kiểm tra email để xác nhận tài khoản.', 'Please check your email to confirm your account.'),
        });
      }
    } catch (err: any) {
      toast({
        title: t('Lỗi', 'Error'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}>
          <Globe className="mr-1 h-4 w-4" />
          {language === 'vi' ? 'EN' : 'VI'}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">NICE Classify</CardTitle>
          <CardDescription>
            {t(
              'Hệ thống hỗ trợ phân loại NICE cho đăng ký nhãn hiệu',
              'NICE Classification Support System for Trademark Registration'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label>{t('Họ và tên', 'Full name')}</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('Nguyễn Văn A', 'John Doe')}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('Mật khẩu', 'Password')}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label>{t('Loại tài khoản', 'Account type')}</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">{t('Cá nhân', 'Individual')}</SelectItem>
                    <SelectItem value="enterprise">{t('Doanh nghiệp', 'Enterprise')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t('Đang xử lý...', 'Processing...')
                : isLogin
                  ? t('Đăng nhập', 'Sign in')
                  : t('Đăng ký', 'Sign up')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? t('Chưa có tài khoản?', "Don't have an account?") : t('Đã có tài khoản?', 'Already have an account?')}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary underline">
              {isLogin ? t('Đăng ký', 'Sign up') : t('Đăng nhập', 'Sign in')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
