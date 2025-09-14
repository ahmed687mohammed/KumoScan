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
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  BookOpen,
  Star,
  Calendar
} from 'lucide-react';

export default function MangaManagement() {
  const [manga, setManga] = useState([]);
  const [filteredManga, setFilteredManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadManga();
  }, []);

  useEffect(() => {
    // تصفية المانغا حسب البحث
    const filtered = manga.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.genres?.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredManga(filtered);
  }, [manga, searchTerm]);

  async function loadManga() {
    try {
      setLoading(true);
      const mangaQuery = query(collection(db, 'manga'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(mangaQuery);
      const mangaData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setManga(mangaData);
    } catch (error) {
      console.error('خطأ في جلب المانغا:', error);
      setMessage('خطأ في جلب بيانات المانغا');
    } finally {
      setLoading(false);
    }
  }

  async function deleteManga(mangaId, title) {
    if (!window.confirm(`هل أنت متأكد من حذف "${title}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'manga', mangaId));
      setManga(prev => prev.filter(item => item.id !== mangaId));
      setMessage('تم حذف المانغا بنجاح');
    } catch (error) {
      console.error('خطأ في حذف المانغا:', error);
      setMessage('خطأ في حذف المانغا');
    }
  }

  async function toggleFeatured(mangaId, currentStatus) {
    try {
      await updateDoc(doc(db, 'manga', mangaId), {
        featured: !currentStatus
      });
      
      setManga(prev => prev.map(item =>
        item.id === mangaId ? { ...item, featured: !currentStatus } : item
      ));
      
      setMessage(`تم ${!currentStatus ? 'إضافة' : 'إزالة'} المانغا ${!currentStatus ? 'إلى' : 'من'} المميزة`);
    } catch (error) {
      console.error('خطأ في تحديث حالة المانغا المميزة:', error);
      setMessage('خطأ في تحديث حالة المانغا');
    }
  }

  function getStatusBadge(status) {
    const statusMap = {
      'ongoing': { label: 'مستمر', color: 'bg-green-100 text-green-800' },
      'completed': { label: 'مكتمل', color: 'bg-blue-100 text-blue-800' },
      'hiatus': { label: 'متوقف مؤقتاً', color: 'bg-yellow-100 text-yellow-800' },
      'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل المانغا...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المانغا</h1>
          <p className="text-gray-600 mt-2">إدارة وتحرير المانغا الموجودة في الموقع</p>
        </div>
        <Button asChild>
          <Link to="/admin/add-manga">
            <Plus className="h-4 w-4 mr-2" />
            إضافة مانغا جديدة
          </Link>
        </Button>
      </div>

      {message && (
        <Alert className={message.includes('بنجاح') ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="ابحث في المانغا..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{manga.length}</p>
            <p className="text-sm text-gray-600">إجمالي المانغا</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {manga.filter(m => m.status === 'ongoing').length}
            </p>
            <p className="text-sm text-gray-600">مانغا مستمرة</p>
          </div>
        </Card>
      </div>

      {/* Manga Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المانغا ({filteredManga.length})</CardTitle>
          <CardDescription>
            جميع المانغا الموجودة في الموقع
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredManga.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد مانغا مضافة بعد'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الغلاف</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>المؤلف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الفصول</TableHead>
                    <TableHead>المشاهدات</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>تاريخ الإضافة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManga.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <img
                          src={item.coverImage || '/placeholder-manga.jpg'}
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.featured && (
                            <Badge variant="secondary" className="mt-1">
                              <Star className="h-3 w-3 mr-1" />
                              مميز
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.author || 'غير محدد'}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.chaptersCount || 0}</TableCell>
                      <TableCell>{item.views || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          {item.rating || '0.0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {item.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'غير محدد'}
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
                              <Link to={`/manga/${item.id}`} target="_blank">
                                <Eye className="h-4 w-4 mr-2" />
                                عرض
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFeatured(item.id, item.featured)}>
                              <Star className="h-4 w-4 mr-2" />
                              {item.featured ? 'إزالة من المميز' : 'إضافة للمميز'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteManga(item.id, item.title)}
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

