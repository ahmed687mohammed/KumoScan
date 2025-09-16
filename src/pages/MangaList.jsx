import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, orderBy, limit, getDocs, where, startAfter, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, BookOpen, Star, Clock, TrendingUp, Heart, Calendar, Eye } from 'lucide-react';

// مكون MangaCard المنفصل
function MangaCard({ manga, genres }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // معالجة التاريخ بشكل آمن
  const formatDate = (date) => {
    if (!date) return 'غير محدد';
    
    try {
      if (date.toDate) {
        return date.toDate().toLocaleDateString('ar-SA');
      } else if (date instanceof Date) {
        return date.toLocaleDateString('ar-SA');
      }
      return 'غير محدد';
    } catch (error) {
      console.error('خطأ في تنسيق التاريخ:', error);
      return 'غير محدد';
    }
  };

  return (
    <Card className="group overflow-hidden border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      <CardContent className="p-0 h-full flex flex-col">
        <Link to={`/manga/${manga.id}`} className="flex flex-col h-full">
          {/* صورة الغلاف مع تحسينات */}
          <div className="relative overflow-hidden bg-gray-100">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="h-12 w-12 text-gray-400 animate-pulse">📖</div>
              </div>
            )}
            
            <img
              src={imageError ? '/placeholder-manga.jpg' : manga.coverImage}
              alt={manga.title}
              className={`w-full h-64 object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {/* Overlay effects */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300" />
            
            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col items-end space-y-2">
              {manga.status && (
                <Badge className="bg-green-600 hover:bg-green-700 px-2 py-1 text-xs">
                  {manga.status === 'ongoing' ? 'مستمر' : 'مكتمل'}
                </Badge>
              )}
            </div>
            
            {/* Rating overlay */}
            <div className="absolute bottom-3 left-3">
              <div className="flex items-center bg-black bg-opacity-70 text-white px-2 py-1 rounded-full">
                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                <span className="text-xs font-semibold">{manga.rating || '0.0'}</span>
              </div>
            </div>
          </div>

          {/* محتوى البطاقة */}
          <div className="p-4 flex-1 flex flex-col">
            {/* العنوان */}
            <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
              {manga.title}
            </h3>

            {/* العنوان البديل */}
            {manga.alternativeTitle && (
              <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                {manga.alternativeTitle}
              </p>
            )}

            {/* الوصف */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-1">
              {manga.description || 'لا يوجد وصف متاح لهذه المانغا'}
            </p>

            {/* التصنيفات */}
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {manga.genres.slice(0, 2).map((genre) => (
                  <Badge 
                    key={genre} 
                    variant="secondary" 
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200"
                  >
                    {genres.find(g => g.value === genre)?.label || genre}
                  </Badge>
                ))}
                {manga.genres.length > 2 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{manga.genres.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* الإحصائيات */}
            <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{manga.chaptersCount || 0}</span>
                <span className="text-xs">فصل</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {manga.views ? (manga.views > 1000 ? `${(manga.views / 1000).toFixed(1)}K` : manga.views) : 0}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-red-600" />
                <span className="font-medium">{manga.favoritesCount || 0}</span>
              </div>
            </div>

            {/* تاريخ النشر */}
            <div className="text-xs text-gray-400 mt-2 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(manga.createdAt)}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function MangaList({ filter = 'all' }) {
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();

  const genres = [
    { value: 'all', label: 'جميع التصنيفات' },
    { value: 'action', label: 'أكشن' },
    { value: 'romance', label: 'رومانسي' },
    { value: 'comedy', label: 'كوميدي' },
    { value: 'drama', label: 'دراما' },
    { value: 'fantasy', label: 'خيال' },
    { value: 'horror', label: 'رعب' },
    { value: 'mystery', label: 'غموض' },
    { value: 'slice-of-life', label: 'شريحة من الحياة' }
  ];

  const sortOptions = [
    { value: 'latest', label: 'الأحدث' },
    { value: 'popular', label: 'الأكثر شعبية' },
    { value: 'rating', label: 'الأعلى تقييماً' },
    { value: 'title', label: 'الاسم (أ-ي)' },
    { value: 'chapters', label: 'عدد الفصول' }
  ];

  useEffect(() => {
    loadManga(true);
  }, [filter, sortBy, selectedGenre]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  // دالة جديدة لجلب عدد فصول المانغا
  async function getChaptersCount(mangaId) {
    try {
      const chaptersRef = collection(db, 'manga', mangaId, 'chapters');
      const chaptersQuery = query(chaptersRef);
      const chaptersSnapshot = await getDocs(chaptersQuery);
      return chaptersSnapshot.size;
    } catch (error) {
      console.error('خطأ في جلب عدد الفصول:', error);
      return 0;
    }
  }

  async function loadManga(reset = false) {
    try {
      setLoading(true);
      
      let mangaQuery;
      const mangaRef = collection(db, 'manga');
      
      // بناء الاستعلام حسب الفلتر
      if (filter === 'favorites' && userProfile?.favorites) {
        if (userProfile.favorites.length === 0) {
          setManga([]);
          setLoading(false);
          return;
        }
        mangaQuery = query(
          mangaRef,
          where('__name__', 'in', userProfile.favorites),
          limit(12)
        );
      } else if (filter === 'latest') {
        mangaQuery = query(
          mangaRef,
          orderBy('createdAt', 'desc'),
          limit(12)
        );
      } else if (filter === 'popular') {
        mangaQuery = query(
          mangaRef,
          orderBy('views', 'desc'),
          limit(12)
        );
      } else {
        // فلتر عام
        let orderField = 'createdAt';
        let orderDirection = 'desc';
        
        switch (sortBy) {
          case 'popular':
            orderField = 'views';
            break;
          case 'rating':
            orderField = 'rating';
            break;
          case 'title':
            orderField = 'title';
            orderDirection = 'asc';
            break;
          case 'chapters':
            orderField = 'chaptersCount';
            break;
          default:
            orderField = 'createdAt';
            orderDirection = 'desc';
        }
        
        mangaQuery = query(
          mangaRef,
          orderBy(orderField, orderDirection),
          limit(12)
        );
        
        // إضافة فلتر النوع إذا تم اختياره
        if (selectedGenre !== 'all') {
          mangaQuery = query(
            mangaRef,
            where('genres', 'array-contains', selectedGenre),
            orderBy(orderField, orderDirection),
            limit(12)
          );
        }
      }
      
      // إضافة pagination إذا لم يكن reset
      if (!reset && lastDoc) {
        mangaQuery = query(mangaQuery, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(mangaQuery);
      
      // جلب البيانات مع عدد الفصول الحقيقي
      const mangaData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = { id: doc.id, ...doc.data() };
          
          // إذا لم يكن هناك chaptersCount أو نريد التأكد من العدد الحقيقي
          if (!data.chaptersCount || sortBy === 'chapters') {
            data.chaptersCount = await getChaptersCount(doc.id);
          }
          
          // التأكد من وجود صورة الغلاف
          if (!data.coverImage) {
            data.coverImage = '/placeholder-manga.jpg';
          }
          
          return data;
        })
      );
      
      if (reset) {
        setManga(mangaData);
      } else {
        setManga(prev => [...prev, ...mangaData]);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 12);
      
    } catch (error) {
      console.error('خطأ في جلب المانغا:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    // تنفيذ البحث (يمكن تحسينه لاحقاً)
    const filtered = manga.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setManga(filtered);
  }

  function getPageTitle() {
    switch (filter) {
      case 'latest':
        return 'أحدث المانغا';
      case 'popular':
        return 'الأكثر شعبية';
      case 'favorites':
        return 'المفضلة';
      default:
        return 'جميع المانغا';
    }
  }

  function getPageIcon() {
    switch (filter) {
      case 'latest':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'popular':
        return <TrendingUp className="h-6 w-6 text-red-600" />;
      case 'favorites':
        return <Heart className="h-6 w-6 text-pink-600" />;
      default:
        return <BookOpen className="h-6 w-6 text-green-600" />;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          {getPageIcon()}
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث عن المانغا..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          
          {filter === 'all' && (
            <div className="flex gap-2">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre.value} value={genre.value}>
                      {genre.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="الترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : manga.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد مانغا متاحة</p>
          <p className="text-gray-400 mt-2">
            {filter === 'favorites' 
              ? 'لم تضف أي مانغا إلى المفضلة بعد'
              : 'جرب تغيير معايير البحث أو الفلتر'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {manga.map((item) => (
              <MangaCard key={item.id} manga={item} genres={genres} />
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button onClick={() => loadManga(false)} disabled={loading}>
                {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}