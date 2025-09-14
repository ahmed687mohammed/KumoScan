import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Chrome, BookOpen } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError('كلمات المرور غير متطابقة');
    }

    if (formData.password.length < 6) {
      return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password, formData.displayName);
      navigate('/');
    } catch (error) {
      setError('فشل في إنشاء الحساب. تحقق من البيانات المدخلة.');
    }

    setLoading(false);
  }

  async function handleGoogleSignup() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      setError('فشل في إنشاء الحساب باستخدام Google.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            إنشاء حساب جديد
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            أو{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              تسجيل الدخول إلى حسابك
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>انضم إلى KumoScan</CardTitle>
            <CardDescription>
              أنشئ حسابك للاستمتاع بقراءة المانغا وحفظ المفضلة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="displayName">الاسم</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="أدخل اسمك"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="أعد إدخال كلمة المرور"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">أو</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                >
                  <Chrome className="h-4 w-4 mr-2" />
                  إنشاء حساب باستخدام Google
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              بإنشاء حساب، فإنك توافق على{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                شروط الاستخدام
              </Link>{' '}
              و{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                سياسة الخصوصية
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

