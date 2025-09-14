import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Eye, 
  Heart,
  Calendar,
  Star
} from 'lucide-react';

export default function Statistics() {
  const [stats, setStats] = useState({
    totalManga: 0,
    totalUsers: 0,
    totalChapters: 0,
    totalViews: 0,
    totalFavorites: 0,
    avgRating: 0
  });
  const [topManga, setTopManga] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  async function loadStatistics() {
    try {
      setLoading(true);
      
      // جلب إحصائيات المانغا
      const mangaSnapshot = await getDocs(collection(db, 'manga'));
      const mangaData = mangaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // جلب إحصائيات المستخدمين
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // حساب الإحصائيات
      let totalChapters = 0;
      let totalViews = 0;
      let totalFavorites = 0;
      let totalRatings = 0;
      let ratingSum = 0;
      
      for (const manga of mangaData) {
        const chaptersSnapshot = await getDocs(collection(db, 'manga', manga.id, 'chapters'));
        totalChapters += chaptersSnapshot.size;
        totalViews += manga.views || 0;
        totalFavorites += manga.favoritesCount || 0;
        
        if (manga.rating && manga.ratingsCount) {
          totalRatings += manga.ratingsCount;
          ratingSum += manga.rating * manga.ratingsCount;
        }
      }
      
      // حساب متوسط التقييم
      const avgRating = totalRatings > 0 ? (ratingSum / totalRatings).toFixed(1) : 0;
      
      setStats({
        totalManga: mangaData.length,
        totalUsers: usersData.length,
        totalChapters,
        totalViews,
        totalFavorites,
        avgRating
      });
      
      // جلب أفضل المانغا (الأكثر مشاهدة)
      const topMangaQuery = query(
        collection(db, 'manga'),
        orderBy('views', 'desc'),
        limit(5)
      );
      const topMangaSnapshot = await getDocs(topMangaQuery);
      const topMangaData = topMangaSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTopManga(topMangaData);
      
      // جلب أحدث المستخدمين
      const recentUsersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const recentUsersData = recentUsersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentUsers(recentUsersData);
      
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', description }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الإحصائيات</h1>
        <p className="text-gray-600 mt-2">نظرة شاملة على أداء الموقع</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="إجمالي المانغا"
          value={stats.totalManga}
          icon={BookOpen}
          color="blue"
          description="المانغا المتاحة في الموقع"
        />
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.totalUsers}
          icon={Users}
          color="green"
          description="المستخدمين المسجلين"
        />
        <StatCard
          title="إجمالي الفصول"
          value={stats.totalChapters}
          icon={BookOpen}
          color="purple"
          description="الفصول المتاحة للقراءة"
        />
        <StatCard
          title="إجمالي المشاهدات"
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          color="red"
          description="مشاهدات جميع المانغا"
        />
        <StatCard
          title="إجمالي المفضلة"
          value={stats.totalFavorites}
          icon={Heart}
          color="pink"
          description="إضافات المفضلة"
        />
        <StatCard
          title="متوسط التقييم"
          value={stats.avgRating}
          icon={Star}
          color="yellow"
          description="من 5 نجوم"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Manga */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>أفضل المانغا</span>
            </CardTitle>
            <CardDescription>
              المانغا الأكثر مشاهدة في الموقع
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topManga.map((manga, index) => (
                <div key={manga.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <img
                    src={manga.coverImage || '/placeholder-manga.jpg'}
                    alt={manga.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{manga.title}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {manga.views || 0}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {manga.rating || '0.0'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>أحدث المستخدمين</span>
            </CardTitle>
            <CardDescription>
              المستخدمين الذين انضموا مؤخراً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.displayName || 'مستخدم جديد'}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {user.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'اليوم'}
                    </div>
                  </div>
                  {user.role === 'admin' && (
                    <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      مدير
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معدل الفصول</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalManga > 0 ? Math.round(stats.totalChapters / stats.totalManga) : 0}
              </p>
              <p className="text-sm text-gray-600">فصل لكل مانغا</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معدل المشاهدات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.totalManga > 0 ? Math.round(stats.totalViews / stats.totalManga) : 0}
              </p>
              <p className="text-sm text-gray-600">مشاهدة لكل مانغا</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معدل المفضلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalUsers > 0 ? Math.round(stats.totalFavorites / stats.totalUsers) : 0}
              </p>
              <p className="text-sm text-gray-600">مفضلة لكل مستخدم</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

