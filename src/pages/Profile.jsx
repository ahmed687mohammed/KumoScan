import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../lib/firebase';
import { User, BookOpen, Heart, Clock, Settings } from 'lucide-react';

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [readingProgress, setReadingProgress] = useState([]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      loadUserData();
    }
  }, [userProfile]);

  async function loadUserData() {
    try {
      // جلب المفضلة
      if (userProfile?.favorites && userProfile.favorites.length > 0) {
        const mangaQuery = query(
          collection(db, 'manga'),
          where('__name__', 'in', userProfile.favorites)
        );
        const mangaSnapshot = await getDocs(mangaQuery);
        const favoriteManga = mangaSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFavorites(favoriteManga);
      }

      // جلب تقدم القراءة
      if (userProfile?.readingProgress) {
        const progressData = Object.entries(userProfile.readingProgress).map(([mangaId, progress]) => ({
          mangaId,
          ...progress
        }));
        setReadingProgress(progressData);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage('');

      // تحديث ملف Firebase Auth
      await updateProfile(currentUser, {
        displayName: displayName
      });

      // تحديث ملف Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName
      });

      setMessage('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      setMessage('خطأ في تحديث الملف الشخصي');
    }

    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي</h1>
        <p className="text-gray-600 mt-2">إدارة معلوماتك الشخصية ومكتبة المانغا</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>المعلومات</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>المفضلة</span>
          </TabsTrigger>
          <TabsTrigger value="reading" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>قيد القراءة</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>السجل</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>المعلومات الشخصية</span>
              </CardTitle>
              <CardDescription>
                قم بتحديث معلوماتك الشخصية هنا
              </CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">الاسم</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="أدخل اسمك"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>تاريخ الانضمام</Label>
                    <Input
                      value={userProfile?.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'غير محدد'}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <Label>نوع الحساب</Label>
                    <Input
                      value={userProfile?.role === 'admin' ? 'مدير' : 'مستخدم'}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'جاري التحديث...' : 'تحديث المعلومات'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>المانغا المفضلة</span>
              </CardTitle>
              <CardDescription>
                المانغا التي أضفتها إلى قائمة المفضلة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد مانغا في المفضلة بعد</p>
                  <p className="text-sm text-gray-400 mt-2">
                    ابدأ بإضافة المانغا المفضلة لديك لتظهر هنا
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.map((manga) => (
                    <div key={manga.id} className="border rounded-lg p-4">
                      <img
                        src={manga.coverImage || '/placeholder-manga.jpg'}
                        alt={manga.title}
                        className="w-full h-48 object-cover rounded mb-3"
                      />
                      <h3 className="font-semibold text-sm mb-2">{manga.title}</h3>
                      <p className="text-xs text-gray-600 mb-3">{manga.description?.slice(0, 100)}...</p>
                      <Button size="sm" className="w-full">
                        قراءة
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reading">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>قيد القراءة</span>
              </CardTitle>
              <CardDescription>
                المانغا التي تقرأها حالياً وتقدمك فيها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {readingProgress.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد مانغا قيد القراءة</p>
                  <p className="text-sm text-gray-400 mt-2">
                    ابدأ بقراءة مانغا لتتبع تقدمك
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readingProgress.map((progress) => (
                    <div key={progress.mangaId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{progress.mangaTitle || 'مانغا'}</h3>
                          <p className="text-sm text-gray-600">
                            الفصل {progress.lastChapter} - آخر قراءة: {progress.lastRead?.toDate?.()?.toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <Button size="sm">
                          متابعة القراءة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>سجل القراءة</span>
              </CardTitle>
              <CardDescription>
                سجل المانغا والفصول التي قرأتها مؤخراً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">سيتم إضافة هذه الميزة قريباً</p>
                <p className="text-sm text-gray-400 mt-2">
                  ستتمكن من رؤية سجل كامل لقراءاتك هنا
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

