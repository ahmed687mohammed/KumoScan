import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, getDoc, collection, query, orderBy, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Home, 
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  Heart
} from 'lucide-react';

export default function ChapterReader() {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [manga, setManga] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState('single'); // single, double, scroll
  const [zoom, setZoom] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const pageRef = useRef(null);

  useEffect(() => {
    loadChapterData();
  }, [mangaId, chapterId]);

  useEffect(() => {
    // إخفاء/إظهار الضوابط عند تحريك الماوس
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    // keyboard navigation
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          previousPage();
          break;
        case 'ArrowRight':
          nextPage();
          break;
        case 'Home':
          setCurrentPage(0);
          break;
        case 'End':
          setCurrentPage(pages.length - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [pages.length, currentPage]);

  async function loadChapterData() {
    try {
      setLoading(true);
      
      // جلب معلومات المانغا
      const mangaDoc = await getDoc(doc(db, 'manga', mangaId));
      if (mangaDoc.exists()) {
        setManga({ id: mangaDoc.id, ...mangaDoc.data() });
      }
      
      // جلب معلومات الفصل
      const chapterDoc = await getDoc(doc(db, 'manga', mangaId, 'chapters', chapterId));
      if (chapterDoc.exists()) {
        const chapterData = { id: chapterDoc.id, ...chapterDoc.data() };
        setChapter(chapterData);
        
        // تعديل هنا: استخدام pages مباشرة من بيانات الفصل
        setPages(chapterData.pages || []);
        
        // تحديث عدد المشاهدات
        await updateDoc(doc(db, 'manga', mangaId, 'chapters', chapterId), {
          views: increment(1)
        });
      }
      
      // جلب قائمة الفصول
      const chaptersQuery = query(
        collection(db, 'manga', mangaId, 'chapters'),
        orderBy('chapterNumber', 'asc')
      );
      const chaptersSnapshot = await getDocs(chaptersQuery);
      const chaptersData = chaptersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChapters(chaptersData);
      
      // تحديث تقدم القراءة للمستخدم المسجل
      if (currentUser) {
        await updateReadingProgress();
      }
      
    } catch (error) {
      console.error('خطأ في جلب بيانات الفصل:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateReadingProgress() {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`readingProgress.${mangaId}`]: {
          lastChapter: chapter?.chapterNumber,
          lastRead: new Date(),
          mangaTitle: manga?.title
        }
      });
    } catch (error) {
      console.error('خطأ في تحديث تقدم القراءة:', error);
    }
  }

  function nextPage() {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      // الانتقال للفصل التالي
      const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
      if (currentIndex < chapters.length - 1) {
        const nextChapter = chapters[currentIndex + 1];
        navigate(`/manga/${mangaId}/chapter/${nextChapter.id}`);
      }
    }
  }

  function previousPage() {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      // الانتقال للفصل السابق
      const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
      if (currentIndex > 0) {
        const prevChapter = chapters[currentIndex - 1];
        navigate(`/manga/${mangaId}/chapter/${prevChapter.id}`);
      }
    }
  }

  function getCurrentChapterIndex() {
    return chapters.findIndex(ch => ch.id === chapterId);
  }

  function handleChapterChange(newChapterId) {
    navigate(`/manga/${mangaId}/chapter/${newChapterId}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <BookOpen className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>جاري تحميل الفصل...</p>
        </div>
      </div>
    );
  }

  if (!chapter || !manga) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            لم يتم العثور على الفصل المطلوب.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Header Controls */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  الرئيسية
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/manga/${mangaId}`}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  {manga.title}
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={chapterId} onValueChange={handleChapterChange}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      الفصل {ch.chapterNumber}: {ch.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{zoom}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16">
        {pages.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">لا توجد صفحات متاحة لهذا الفصل</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-screen p-4">
            {readingMode === 'scroll' ? (
              // Scroll Mode
              <div className="max-w-4xl mx-auto space-y-2">
                {pages.map((page, index) => (
                  <img
                    key={index}
                    src={page.imageUrl || page} // تعديل هنا: دعم كلا النوعين من التخزين
                    alt={`صفحة ${index + 1}`}
                    className="w-full h-auto"
                    style={{ transform: `scale(${zoom / 100})` }}
                  />
                ))}
              </div>
            ) : (
              // Single/Double Page Mode
              <div className="relative">
                <img
                  ref={pageRef}
                  src={pages[currentPage]?.imageUrl || pages[currentPage]} // تعديل هنا: دعم كلا النوعين من التخزين
                  alt={`صفحة ${currentPage + 1}`}
                  className="max-w-full max-h-screen object-contain"
                  style={{ transform: `scale(${zoom / 100})` }}
                  onClick={nextPage}
                />
                
                {/* Navigation Arrows */}
                <Button
                  variant="ghost"
                  size="lg"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70"
                  onClick={previousPage}
                  disabled={currentPage === 0 && getCurrentChapterIndex() === 0}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70"
                  onClick={nextPage}
                  disabled={currentPage === pages.length - 1 && getCurrentChapterIndex() === chapters.length - 1}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                صفحة {currentPage + 1} من {pages.length}
              </span>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{chapter.views || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReadingMode(readingMode === 'single' ? 'scroll' : 'single')}
              >
                <Settings className="h-4 w-4 mr-2" />
                {readingMode === 'single' ? 'وضع التمرير' : 'وضع الصفحة'}
              </Button>
              
              {getCurrentChapterIndex() > 0 && (
                <Button variant="ghost" size="sm" onClick={() => {
                  const prevChapter = chapters[getCurrentChapterIndex() - 1];
                  handleChapterChange(prevChapter.id);
                }}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  الفصل السابق
                </Button>
              )}
              
              {getCurrentChapterIndex() < chapters.length - 1 && (
                <Button variant="ghost" size="sm" onClick={() => {
                  const nextChapter = chapters[getCurrentChapterIndex() + 1];
                  handleChapterChange(nextChapter.id);
                }}>
                  الفصل التالي
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}