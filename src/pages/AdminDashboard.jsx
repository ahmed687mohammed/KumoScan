import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  MessageCircle, 
  Plus,
  Settings,
  TrendingUp,
  Eye,
  Heart,
  Calendar
} from 'lucide-react';

// Import admin components
import MangaManagement from '../components/admin/MangaManagement';
import UserManagement from '../components/admin/UserManagement';
import AddManga from '../components/admin/AddManga';
import AddChapter from '../components/admin/AddChapter'; // إضافة الاستيراد
import Statistics from '../components/admin/Statistics';

export default function AdminDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalManga: 0,
    totalUsers: 0,
    totalChapters: 0,
    totalViews: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // جلب إحصائيات المانغا
      const mangaSnapshot = await getDocs(collection(db, 'manga'));
      const mangaData = mangaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // جلب إحصائيات المستخدمين
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // حساب إجمالي الفصول والمشاهدات
      let totalChapters = 0;
      let totalViews = 0;
      
      for (const manga of mangaData) {
        const chaptersSnapshot = await getDocs(collection(db, 'manga', manga.id, 'chapters'));
        totalChapters += chaptersSnapshot.size;
        totalViews += manga.views || 0;
      }
      
      setStats({
        totalManga: mangaData.length,
        totalUsers: usersSnapshot.size,
        totalChapters,
        totalViews
      });
      
      // جلب النشاط الحديث (أحدث المانغا)
      const recentMangaQuery = query(
        collection(db, 'manga'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentMangaSnapshot = await getDocs(recentMangaQuery);
      const recentMangaData = recentMangaSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'manga'
      }));
      
      setRecentActivity(recentMangaData);
      
    } catch (error) {
      console.error('خطأ في جلب بيانات لوحة الإدارة:', error);
    } finally {
      setLoading(false);
    }
  }

  const sidebarItems = [
    { path: '/admin', label: 'لوحة التحكم', icon: BarChart3 },
    { path: '/admin/manga', label: 'إدارة المانغا', icon: BookOpen },
    { path: '/admin/add-manga', label: 'إضافة مانغا', icon: Plus },
    { path: '/admin/add-chapter', label: 'إضافة فصل', icon: Plus }, // إضافة العنصر
    { path: '/admin/users', label: 'إدارة المستخدمين', icon: Users },
    { path: '/admin/statistics', label: 'الإحصائيات', icon: TrendingUp },
    { path: '/admin/settings', label: 'الإعدادات', icon: Settings }
  ];

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل لوحة الإدارة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">لوحة الإدارة</h2>
            <p className="text-sm text-gray-600 mt-1">KumoScan</p>
          </div>
          
          <nav className="px-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Routes>
            <Route path="/" element={
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
                  <p className="text-gray-600 mt-2">نظرة عامة على إحصائيات الموقع</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="إجمالي المانغا"
                    value={stats.totalManga}
                    icon={BookOpen}
                    color="blue"
                  />
                  <StatCard
                    title="إجمالي المستخدمين"
                    value={stats.totalUsers}
                    icon={Users}
                    color="green"
                  />
                  <StatCard
                    title="إجمالي الفصول"
                    value={stats.totalChapters}
                    icon={MessageCircle}
                    color="purple"
                  />
                  <StatCard
                    title="إجمالي المشاهدات"
                    value={stats.totalViews.toLocaleString()}
                    icon={Eye}
                    color="red"
                  />
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>النشاط الحديث</span>
                      </CardTitle>
                      <CardDescription>
                        أحدث المانغا المضافة للموقع
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center space-x-4">
                            <img
                              src={activity.coverImage || '/placeholder-manga.jpg'}
                              alt={activity.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{activity.title}</p>
                              <p className="text-xs text-gray-500">
                                {activity.createdAt?.toDate?.()?.toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                            <Badge variant="secondary">جديد</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>الإحصائيات السريعة</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">متوسط الفصول لكل مانغا</span>
                          <span className="font-semibold">
                            {stats.totalManga > 0 ? Math.round(stats.totalChapters / stats.totalManga) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">متوسط المشاهدات لكل مانغا</span>
                          <span className="font-semibold">
                            {stats.totalManga > 0 ? Math.round(stats.totalViews / stats.totalManga) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">المانغا النشطة</span>
                          <span className="font-semibold text-green-600">
                            {recentActivity.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>إجراءات سريعة</CardTitle>
                    <CardDescription>
                      الإجراءات الأكثر استخداماً في لوحة الإدارة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4">
                      <Button asChild>
                        <Link to="/admin/add-manga">
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة مانغا جديدة
                        </Link>
                      </Button>
                      {/* إضافة الزر الجديد */}
                      <Button asChild>
                        <Link to="/admin/add-chapter">
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة فصل جديد
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/admin/manga">
                          <BookOpen className="h-4 w-4 mr-2" />
                          إدارة المانغا
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/admin/users">
                          <Users className="h-4 w-4 mr-2" />
                          إدارة المستخدمين
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            } />
            <Route path="/manga" element={<MangaManagement />} />
            <Route path="/add-manga" element={<AddManga />} />
            <Route path="/add-chapter" element={<AddChapter />} /> {/* إضافة المسار */}
            <Route path="/users" element={<UserManagement />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">صفحة الإعدادات قيد التطوير</p>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}