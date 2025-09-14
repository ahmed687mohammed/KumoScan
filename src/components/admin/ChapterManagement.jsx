import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { collection, getDocs, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  BookOpen,
  Calendar,
  FileText
} from 'lucide-react';

export default function ChapterManagement() {
  const [chapters, setChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [mangaList, setMangaList] = useState([]);
  const [selectedManga, setSelectedManga] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMangaAndChapters();
  }, []);

  useEffect(() => {
    // تصفية الفصول حسب البحث والمانغا المحددة
    let filtered = chapters;
    
    if (selectedManga !== 'all') {
      filtered = filtered.filter(chapter => chapter.mangaId === selectedManga);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(chapter =>
        chapter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.chapterNumber.toString().includes(searchTerm)
      );
    }
    
    setFilteredChapters(filtered);
  }, [chapters, selectedManga, searchTerm]);

  async function loadMangaAndChapters() {
    try {
      setLoading(true);
      
      // جلب قائمة المانغا
      const mangaSnapshot = await getDocs(collection(db, 'manga'));
      const mangaData = mangaSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMangaList(mangaData);
      
      // جلب جميع الفصول من جميع المانغا
      const allChapters = [];
      
      for (const manga of mangaData) {
        const chaptersQuery = query(
          collection(db, 'manga', manga.id, 'chapters'),
          orderBy('chapterNumber', 'desc')
        );
        const chaptersSnapshot = await getDocs(chaptersQuery);
        
        const chaptersData = chaptersSnapshot.docs.map(doc => ({
          id: doc.id,
          mangaId: manga.id,
          mangaTitle: manga.title,
          ...doc.data()
        }));
        
        allChapters.push(...chaptersData);
      }
      
      setChapters(allChapters);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      setMessage('خطأ في جلب بيانات الفصول');
    } finally {
      setLoading(false);
    }
  }

  async function deleteChapter(mangaId, chapterId, chapterNumber) {
    if (!window.confirm(`هل أنت متأكد من حذف الفصل ${chapterNumber}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'manga', mangaId, 'chapters', chapterId));
      
      // تحديث عدد الفصول في المانغا
      const mangaRef = doc(db, 'manga', mangaId);
      const mangaData = mangaList.find(m => m.id === mangaId);
      if (mangaData) {
        await updateDoc(mangaRef, {
          chaptersCount: (mangaData.chaptersCount || 0) - 1,
          lastUpdated: new Date()
        });
      }
      
      setChapters(prev => prev.filter(item => item.id !== chapterId));
      setMessage('تم حذف الفصل بنجاح');
    } catch (error) {
      console.error('خطأ في حذف الفصل:', error);
      setMessage('خطأ في حذف الفصل');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل الفصول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الفصول</h1>
          <p className="text-gray-600 mt-2">إدارة وتحرير فصول المانغا في الموقع</p>
        </div>
        <Button asChild>
          <Link to="/admin/add-chapter">
            <Plus className="h-4 w-4 mr-2" />
            إضافة فصل جديد
          </Link>
        </Button>
      </div>

      {message && (
        <Alert className={message.includes('بنجاح') ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="ابحث في الفصول..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedManga} onValueChange={setSelectedManga}>
          <SelectTrigger>
            <SelectValue placeholder="جميع المانغا" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المانغا</SelectItem>
            {mangaList.map((manga) => (
              <SelectItem key={manga.id} value={manga.id}>
                {manga.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{chapters.length}</p>
            <p className="text-sm text-gray-600">إجمالي الفصول</p>
          </div>
        </Card>
      </div>

      {/* Chapters Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفصول ({filteredChapters.length})</CardTitle>
          <CardDescription>
            جميع الفصول الموجودة في الموقع
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredChapters.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || selectedManga !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد فصول مضافة بعد'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المانغا</TableHead>
                    <TableHead>رقم الفصل</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>عدد الصفحات</TableHead>
                    <TableHead>المشاهدات</TableHead>
                    <TableHead>تاريخ النشر</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChapters.map((chapter) => (
                    <TableRow key={`${chapter.mangaId}-${chapter.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{chapter.mangaTitle}</p>
                          <p className="text-sm text-gray-500">ID: {chapter.mangaId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-lg">
                          {chapter.chapterNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {chapter.title || 'بدون عنوان'}
                      </TableCell>
                      <TableCell>
                        {chapter.pages?.length || 0} صفحة
                      </TableCell>
                      <TableCell>{chapter.views || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {chapter.publishedAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'غير محدد'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/manga/${chapter.mangaId}/chapter/${chapter.id}`} target="_blank">
                                <Eye className="h-4 w-4 mr-2" />
                                عرض الفصل
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/edit-chapter/${chapter.mangaId}/${chapter.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                تعديل
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteChapter(chapter.mangaId, chapter.id, chapter.chapterNumber)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}