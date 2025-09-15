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
  Heart,
  Maximize,
  Minimize
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
  const [readingMode, setReadingMode] = useState('single');
  const [zoom, setZoom] = useState(100);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    loadChapterData();
  }, [mangaId, chapterId]);

  useEffect(() => {
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
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [pages.length, currentPage, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  async function loadChapterData() {
    try {
      setLoading(true);
      
      const mangaDoc = await getDoc(doc(db, 'manga', mangaId));
      if (mangaDoc.exists()) {
        setManga({ id: mangaDoc.id, ...mangaDoc.data() });
      }
      
      const chapterDoc = await getDoc(doc(db, 'manga', mangaId, 'chapters', chapterId));
      if (chapterDoc.exists()) {
        const chapterData = { id: chapterDoc.id, ...chapterDoc.data() };
        setChapter(chapterData);
        setPages(chapterData.pages || []);
        
        await updateDoc(doc(db, 'manga', mangaId, 'chapters', chapterId), {
          views: increment(1)
        });
      }
      
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

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen?.().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen?.();
    }
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
    <div className="min-h-screen bg-black text-white relative" ref={readerRef}>
      {/* Floating Controls */}
      <div className={`fixed top-4 right-4 z-50 flex flex-col gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleFullscreen}
          className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
        
        <Select value={chapterId} onValueChange={handleChapterChange}>
          <SelectTrigger className="w-48 bg-black/50 border-gray-600 backdrop-blur-sm">
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
      </div>

      {/* Main Content */}
      <div className="pt-4">
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
              <div className="max-w-4xl mx-auto space-y-2">
                {pages.map((page, index) => (
                  <img
                    key={index}
                    src={page.imageUrl || page}
                    alt={`صفحة ${index + 1}`}
                    className="w-full h-auto"
                    style={{ transform: `scale(${zoom / 100})` }}
                  />
                ))}
              </div>
            ) : (
              <div className="relative">
                <img
                  ref={pageRef}
                  src={pages[currentPage]?.imageUrl || pages[currentPage]}
                  alt={`صفحة ${currentPage + 1}`}
                  className="max-w-full max-h-screen object-contain cursor-pointer"
                  style={{ transform: `scale(${zoom / 100})` }}
                  onClick={nextPage}
                />
                
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                  onClick={previousPage}
                  disabled={currentPage === 0 && getCurrentChapterIndex() === 0}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
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

      {/* Bottom Progress Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
              صفحة {currentPage + 1} من {pages.length}
            </span>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReadingMode(readingMode === 'single' ? 'scroll' : 'single')}
                className="bg-black/50 backdrop-blur-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                {readingMode === 'single' ? 'وضع التمرير' : 'وضع الصفحة'}
              </Button>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation between chapters (floating at bottom corners) */}
      <div className={`fixed bottom-4 left-4 right-4 z-50 flex justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {getCurrentChapterIndex() > 0 && (
          <Button
            variant="secondary"
            onClick={() => {
              const prevChapter = chapters[getCurrentChapterIndex() - 1];
              handleChapterChange(prevChapter.id);
            }}
            className="bg-black/50 backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            الفصل السابق
          </Button>
        )}
        
        {getCurrentChapterIndex() < chapters.length - 1 && (
          <Button
            variant="secondary"
            onClick={() => {
              const nextChapter = chapters[getCurrentChapterIndex() + 1];
              handleChapterChange(nextChapter.id);
            }}
            className="bg-black/50 backdrop-blur-sm ml-auto"
          >
            الفصل التالي
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}