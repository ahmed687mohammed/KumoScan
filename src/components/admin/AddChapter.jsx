import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, addDoc, serverTimestamp, updateDoc, increment, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Upload, BookOpen, Save, X, Plus, Trash2 } from 'lucide-react';

export default function AddChapter() {
  const navigate = useNavigate();
  const { id: mangaIdFromParams } = useParams();
  const [mangaList, setMangaList] = useState([]);
  const [selectedMangaId, setSelectedMangaId] = useState(mangaIdFromParams || '');
  const [formData, setFormData] = useState({
    chapterNumber: '',
    title: '',
  });
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mangaLoading, setMangaLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // جلب قائمة المانغا من Firebase
  useEffect(() => {
    async function fetchMangaList() {
      try {
        setMangaLoading(true);
        setError('');
        console.log('جاري جلب قائمة المانغا...');
        
        const mangaSnapshot = await getDocs(collection(db, 'manga'));
        
        if (mangaSnapshot.empty) {
          console.log('لا توجد مانغا في قاعدة البيانات');
          setMessage('لا توجد مانغا متاحة. يرجى إضافة مانغا أولاً.');
          setMangaLoading(false);
          return;
        }
        
        const mangaData = mangaSnapshot.docs
          .map(doc => {
            try {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title || 'بدون عنوان',
                coverImage: data.coverImage || '/placeholder-manga.jpg',
                chaptersCount: data.chaptersCount || 0,
                ...data
              };
            } catch (e) {
              console.error('خطأ في معالجة بيانات المانغا:', e, doc.id);
              return null;
            }
          })
          .filter(manga => manga !== null);
        
        console.log('تم جلب المانغا:', mangaData.length);
        setMangaList(mangaData);
        
        // إذا كان هناك mangaId في params، تأكد من أنه موجود في القائمة
        if (mangaIdFromParams && mangaData.some(manga => manga.id === mangaIdFromParams)) {
          console.log('تم تعيين المانغا من المعلمات:', mangaIdFromParams);
          setSelectedMangaId(mangaIdFromParams);
        }
      } catch (error) {
        console.error('خطأ في جلب قائمة المانغا:', error);
        setError('حدث خطأ في جلب قائمة المانغا. تأكد من اتصالك بالإنترنت.');
        setMessage('حدث خطأ في جلب قائمة المانغا. تأكد من اتصالك بالإنترنت.');
      } finally {
        setMangaLoading(false);
      }
    }

    fetchMangaList();
  }, [mangaIdFromParams]);

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function handleImageChange(e, index) {
    try {
      const file = e.target.files[0];
      if (file) {
        const newPages = [...pages];
        newPages[index] = { file, preview: URL.createObjectURL(file) };
        setPages(newPages);
      }
    } catch (error) {
      console.error('خطأ في معالجة الصورة:', error);
      setMessage('حدث خطأ في معالجة الصورة. يرجى المحاولة مرة أخرى.');
    }
  }

  function addPage() {
    setPages([...pages, null]);
  }

  function removePage(index) {
    const newPages = [...pages];
    newPages.splice(index, 1);
    setPages(newPages);
  }

  async function uploadPageImage(pageFile) {
    try {
      const formData = new FormData();
      formData.append('image', pageFile);
      
      const response = await fetch('https://api.imgbb.com/1/upload?key=58c8ffbe992840b5b93b5bd1c54b6bdc', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`خطأ في الرفع: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.error?.message || 'فشل في رفع الصورة إلى ImgBB');
      }
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      throw new Error(`فشل في رفع الصورة: ${error.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!selectedMangaId) {
      setMessage('يجب اختيار مانغا');
      return;
    }

    if (!formData.chapterNumber.trim()) {
      setMessage('رقم الفصل مطلوب');
      return;
    }

    if (pages.length === 0) {
      setMessage('يجب إضافة صفحة واحدة على الأقل');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setError('');

      // رفع جميع صور الصفحات إلى ImgBB
      const pageUrls = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page && page.file) {
          try {
            console.log(`جاري رفع الصفحة ${i + 1}...`);
            const pageUrl = await uploadPageImage(page.file);
            pageUrls.push(pageUrl);
            console.log(`تم رفع الصفحة ${i + 1} بنجاح`);
          } catch (error) {
            console.error(`فشل في رفع الصفحة ${i + 1}:`, error);
            throw new Error(`فشل في رفع الصفحة ${i + 1}: ${error.message}`);
          }
        }
      }

      // إضافة الفصل إلى Firestore
      const chapterData = {
        ...formData,
        chapterNumber: parseInt(formData.chapterNumber),
        pages: pageUrls,
        views: 0,
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      console.log('جاري إضافة الفصل إلى Firestore...');
      const docRef = await addDoc(collection(db, 'manga', selectedMangaId, 'chapters'), chapterData);
      
      // تحديث عدد فصول المانغا
      await updateDoc(doc(db, 'manga', selectedMangaId), {
        chaptersCount: increment(1),
        lastUpdated: serverTimestamp()
      });

      console.log('تم إضافة الفصل بنجاح:', docRef.id);
      setMessage('تم إضافة الفصل بنجاح!');
      
      // إعادة تعيين النموذج
      setFormData({
        chapterNumber: '',
        title: '',
      });
      setPages([]);
      
      // التوجه إلى صفحة تفاصيل المانغا بعد 2 ثانية
      setTimeout(() => {
        navigate(`/manga/${selectedMangaId}`);
      }, 2000);

    } catch (error) {
      console.error('خطأ في إضافة الفصل:', error);
      setError(error.message);
      setMessage('حدث خطأ في إضافة الفصل. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  if (mangaLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل قائمة المانغا...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <BookOpen className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (!mangaLoading && mangaList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">لا توجد مانغا</h2>
          <p className="text-gray-600 mb-4">
            لم يتم العثور على أي مانغا. يرجى إضافة مانغا أولاً قبل إضافة الفصول.
          </p>
          <Button onClick={() => navigate('/admin/add-manga')}>
            إضافة مانغا جديدة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إضافة فصل جديد</h1>
        <p className="text-gray-600 mt-2">أضف فصل جديد إلى المانغا</p>
      </div>

      {message && (
        <Alert className={message.includes('بنجاح') ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>معلومات الفصل</span>
                </CardTitle>
                <CardDescription>
                  أدخل المعلومات الأساسية للفصل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="manga">اختر المانغا *</Label>
                  <Select 
                    value={selectedMangaId} 
                    onValueChange={(value) => {
                      console.log('تم اختيار المانغا:', value);
                      setSelectedMangaId(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المانغا" />
                    </SelectTrigger>
                    <SelectContent>
                      {mangaList.map((manga) => (
                        <SelectItem key={manga.id} value={manga.id}>
                          {manga.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="chapterNumber">رقم الفصل *</Label>
                    <Input
                      id="chapterNumber"
                      name="chapterNumber"
                      type="number"
                      value={formData.chapterNumber}
                      onChange={handleInputChange}
                      placeholder="أدخل رقم الفصل"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">عنوان الفصل (اختياري)</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="عنوان الفصل"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إجراءات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(selectedMangaId ? `/manga/${selectedMangaId}` : '/admin')}
                  className="w-full"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !selectedMangaId}
                  className="w-full"
                >
                  {loading ? (
                    <>جاري الحفظ...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      حفظ الفصل
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            {selectedMangaId && (
              <Card>
                <CardHeader>
                  <CardTitle>المانغا المحددة</CardTitle>
                </CardHeader>
                <CardContent>
                  {mangaList.find(m => m.id === selectedMangaId)?.coverImage && (
                    <img
                      src={mangaList.find(m => m.id === selectedMangaId).coverImage}
                      alt="Cover"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="font-semibold">
                    {mangaList.find(m => m.id === selectedMangaId)?.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    الفصول الحالية: {mangaList.find(m => m.id === selectedMangaId)?.chaptersCount || 0}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Pages Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>صفحات الفصل</span>
              <Button 
                type="button" 
                onClick={addPage} 
                size="sm"
                disabled={!selectedMangaId}
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة صفحة
              </Button>
            </CardTitle>
            <CardDescription>
              ارفع صفحات الفصل بالترتيب الصحيح
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedMangaId ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">يجب اختيار مانغا أولاً</p>
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لم يتم إضافة أي صفحات بعد</p>
                <Button 
                  type="button" 
                  onClick={addPage} 
                  variant="outline" 
                  className="mt-4"
                >
                  إضافة أول صفحة
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pages.map((page, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    <div className="flex justify-between items-center mb-2">
                      <Label>الصفحة {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePage(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    {page ? (
                      <div className="space-y-2">
                        <img
                          src={page.preview}
                          alt={`معاينة الصفحة ${index + 1}`}
                          className="w-full h-48 object-contain rounded-lg mx-auto border"
                          onError={(e) => {
                            console.error('فشل تحميل الصورة:', page.preview);
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const input = document.getElementById(`page-${index}`);
                            if (input) input.click();
                          }}
                        >
                          تغيير الصورة
                        </Button>
                        <input
                          id={`page-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, index)}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">اختر صورة الصفحة</p>
                        <Input
                          id={`page-upload-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, index)}
                          className="max-w-xs mx-auto mt-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}