import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BookOpen, TrendingUp, Clock, Star, ArrowRight } from 'lucide-react';

export default function Home() {
  const [latestManga, setLatestManga] = useState([]);
  const [popularManga, setPopularManga] = useState([]);
  const [featuredManga, setFeaturedManga] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    try {
      // جلب أحدث المانغا
      const latestQuery = query(
        collection(db, 'manga'),
        orderBy('createdAt', 'desc'),
        limit(8)
      );
      const latestSnapshot = await getDocs(latestQuery);
      const latest = latestSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLatestManga(latest);

      // جلب المانغا الأكثر شعبية
      const popularQuery = query(
        collection(db, 'manga'),
        orderBy('views', 'desc'),
        limit(8)
      );
      const popularSnapshot = await getDocs(popularQuery);
      const popular = popularSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPopularManga(popular);

      // جلب المانغا المميزة
      const featuredQuery = query(
        collection(db, 'manga'),
        where('featured', '==', true),
        limit(1)
      );
      const featuredSnapshot = await getDocs(featuredQuery);
      if (!featuredSnapshot.empty) {
        const featured = {
          id: featuredSnapshot.docs[0].id,
          ...featuredSnapshot.docs[0].data()
        };
        setFeaturedManga(featured);
      } else if (latest.length > 0) {
        // إذا لم توجد مانغا مميزة، استخدم أحدث مانغا
        setFeaturedManga(latest[0]);
      }

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  }

  const MangaCard = ({ manga, showBadge = false, badgeText = '' }) => (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        <Link to={`/manga/${manga.id}`}>
          <div className="relative">
            <img
              src={manga.coverImage || '/placeholder-manga.jpg'}
              alt={manga.title}
              className="w-full h-64 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
            />
            {showBadge && badgeText && (
              <Badge className="absolute top-2 right-2 bg-blue-600">
                {badgeText}
              </Badge>
            ))
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
              {manga.title}
            </h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {manga.description || 'لا يوجد وصف متاح'}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>{manga.chaptersCount || 0} فصل</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{manga.rating || '0.0'}</span>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل المحتوى...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {featuredManga && (
        <section className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={featuredManga.coverImage || '/placeholder-manga.jpg'}
              alt={featuredManga.title}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-600/80" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <Badge className="mb-4 bg-white/20 text-white">مميز</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {featuredManga.title}
              </h1>
              <p className="text-xl mb-6 opacity-90">
                {featuredManga.description?.slice(0, 150)}...
              </p>
              <div className="flex space-x-4">
                <Button size="lg" asChild>
                  <Link to={`/manga/${featuredManga.id}`}>
                    ابدأ القراءة
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  المزيد من التفاصيل
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Latest Manga Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">أحدث المانغا</h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/latest">
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {latestManga.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد مانغا متاحة حالياً</p>
              <p className="text-gray-400 mt-2">سيتم إضافة المحتوى قريباً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestManga.map((manga) => (
                <MangaCard 
                  key={manga.id} 
                  manga={manga} 
                  showBadge={true} 
                  badgeText="جديد" 
                />
              ))}
            </div>
          )}
        </section>

        {/* Popular Manga Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">الأكثر شعبية</h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/popular">
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {popularManga.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد مانغا شعبية حالياً</p>
              <p className="text-gray-400 mt-2">سيتم إضافة المحتوى قريباً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {popularManga.map((manga) => (
                <MangaCard 
                  key={manga.id} 
                  manga={manga} 
                  showBadge={true} 
                  badgeText="شائع" 
                />
              ))}
            </div>
          )}
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
          <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            انضم إلى مجتمع قراء المانغا
          </h2>
          <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
            اكتشف آلاف المانغا المترجمة، احفظ مفضلاتك، وتابع تقدمك في القراءة. 
            انضم إلى مجتمعنا المتنامي من محبي المانغا.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link to="/signup">
                إنشاء حساب مجاني
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/manga">
                تصفح المانغا
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

