import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, getDoc, collection, query, orderBy, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Comments from '../components/Comments';
import Rating from '../components/Rating';
import FavoriteButton from '../components/FavoriteButton';
import { 
  BookOpen, 
  Heart, 
  Star, 
  Calendar, 
  User, 
  Eye, 
  MessageCircle,
  Play,
  Clock,
  Tag
} from 'lucide-react';

export default function MangaDetail() {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    loadMangaDetails();
  }, [id]);

  useEffect(() => {
    if (userProfile && manga) {
      setIsFavorite(userProfile.favorites?.includes(manga.id) || false);
    }
  }, [userProfile, manga]);

  async function loadMangaDetails() {
    try {
      setLoading(true);
      
      // جلب تفاصيل المانغا
      const mangaDoc = await getDoc(doc(db, 'manga', id));
      if (mangaDoc.exists()) {
        const mangaData = { id: mangaDoc.id, ...mangaDoc.data() };
        setManga(mangaData);
        
        // تحديث عدد المشاهدات
        await updateDoc(doc(db, 'manga', id), {
          views: (mangaData.views || 0) + 1
        });
      }
      
      // جلب الفصول
      const chaptersQuery = query(
        collection(db, 'manga', id, 'chapters'),
        orderBy('chapterNumber', 'asc')
      );
      const chaptersSnapshot = await getDocs(chaptersQuery);
      const chaptersData = chaptersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChapters(chaptersData);
      
    } catch (error) {
      console.error('خطأ في جلب تفاصيل المانغا:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite() {
    if (!currentUser) {
      // توجيه المستخدم لتسجيل الدخول
      return;
    }

    try {
      setFavoriteLoading(true);
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (isFavorite) {
        await updateDoc(userRef, {
          favorites: arrayRemove(manga.id)
        });
        setIsFavorite(false);
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(manga.id)
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('خطأ في تحديث المفضلة:', error);
    } finally {
      setFavoriteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل تفاصيل المانغا...</p>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            لم يتم العثور على المانغا المطلوبة.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Cover Image */}
        <div className="md:col-span-1">
          <img
            src={manga.coverImage || '/placeholder-manga.jpg'}
            alt={manga.title}
            className="w-full rounded-lg shadow-lg"
          />
        </div>
        
        {/* Manga Info */}
        <div className="md:col-span-2">
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{manga.title}</h1>
            {manga.alternativeTitle && (
              <p className="text-lg text-gray-600 mb-4">{manga.alternativeTitle}</p>
            )}
            
            {/* Status and Rating */}
            <div className="flex items-center space-x-4 mb-4">
              <Badge className={manga.status === 'ongoing' ? 'bg-green-600' : 'bg-blue-600'}>
                {manga.status === 'ongoing' ? 'مستمر' : 'مكتمل'}
              </Badge>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">{manga.rating || '0.0'}</span>
                <span className="text-gray-500">({manga.ratingsCount || 0} تقييم)</span>
              </div>
            </div>
            
            {/* Genres */}
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map((genre) => (
                  <Badge key={genre} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-sm text-gray-600">الفصول</p>
                <p className="font-semibold">{chapters.length}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Eye className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm text-gray-600">المشاهدات</p>
                <p className="font-semibold">{manga.views || 0}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Heart className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <p className="text-sm text-gray-600">المفضلة</p>
                <p className="font-semibold">{manga.favoritesCount || 0}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <p className="text-sm text-gray-600">آخر تحديث</p>
                <p className="font-semibold text-xs">
                  {manga.lastUpdated?.toDate?.()?.toLocaleDateString('ar-SA') || 'غير محدد'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-4">
              {chapters.length > 0 && (
                <Button size="lg" asChild>
                  <Link to={`/manga/${manga.id}/chapter/${chapters[0].id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    ابدأ القراءة
                  </Link>
                </Button>
              )}
              
              <Button
                size="lg"
                variant={isFavorite ? "default" : "outline"}
                onClick={toggleFavorite}
                disabled={favoriteLoading || !currentUser}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'في المفضلة' : 'أضف للمفضلة'}
              </Button>
            </div>
            
            {!currentUser && (
              <p className="text-sm text-gray-500 mt-2">
                <Link to="/login" className="text-blue-600 hover:underline">
                  سجل دخولك
                </Link> لإضافة المانغا للمفضلة
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs Section */}
           <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">المعلومات</TabsTrigger>
          <TabsTrigger value="chapters">الفصول</TabsTrigger>
          <TabsTrigger value="rating">التقييم</TabsTrigger>
          <TabsTrigger value="comments">التعليقات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chapters">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>قائمة الفصول ({chapters.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chapters.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد فصول متاحة حالياً</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      to={`/manga/${manga.id}/chapter/${chapter.id}`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            الفصل {chapter.chapterNumber}: {chapter.title}
                          </h3>
                          {chapter.publishedAt && (
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              {chapter.publishedAt.toDate?.()?.toLocaleDateString('ar-SA')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Eye className="h-4 w-4" />
                          <span>{chapter.views || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="description">
          <Card>
            <CardHeader>
              <CardTitle>الوصف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {manga.description || 'لا يوجد وصف متاح لهذه المانغا.'}
                </p>
                
                {manga.author && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold">معلومات إضافية</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">المؤلف:</span> {manga.author}
                      </div>
                      {manga.artist && (
                        <div>
                          <span className="font-medium">الرسام:</span> {manga.artist}
                        </div>
                      )}
                      {manga.year && (
                        <div>
                          <span className="font-medium">سنة النشر:</span> {manga.year}
                        </div>
                      )}
                      {manga.language && (
                        <div>
                          <span className="font-medium">اللغة:</span> {manga.language}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rating">
          <Rating mangaId={manga.id} />
        </TabsContent>
        
        <TabsContent value="comments">
          <Comments mangaId={manga.id} chapterId="general" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

