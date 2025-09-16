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
import { Search, Filter, BookOpen, Star, Clock, TrendingUp, Heart } from 'lucide-react';

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
            // محاولة جلب صورة افتراضية إذا لم توجد
            const mangaDoc = await getDoc(doc.ref);
            const fullData = mangaDoc.data();
            data.coverImage = fullData?.coverImage || '/placeholder-manga.jpg';
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

  const MangaCard = ({ manga }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <Link to={`/manga/${manga.id}`}>
          <div className="relative">
            <img
              src={manga.coverImage || '/placeholder-manga.jpg'}
              alt={manga.title}
              className="w-full h-64 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = '/placeholder-manga.jpg';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 rounded-t-lg" />
            {manga.status && (
              <Badge className="absolute top-2 right-2 bg-green-600">
                {manga.status === 'ongoing' ? 'مستمر' : 'مكتمل'}
              </Badge>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
              {manga.title}
            </h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {manga.description || 'لا يوجد وصف متاح'}
            </p>
            
            {/* Genres */}
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {manga.genres.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genres.find(g => g.value === genre)?.label || genre}
                  </Badge>
                ))}
              </div>
            )}
            
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
                  <SelectValue />
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
                  <SelectValue />
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
              <MangaCard key={item.id} manga={item} />
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