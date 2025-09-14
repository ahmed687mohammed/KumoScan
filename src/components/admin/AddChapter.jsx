import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Upload, BookOpen, Save, X, Plus, Trash2 } from 'lucide-react';

export default function AddChapter() {
  const navigate = useNavigate();
  const { id: mangaId } = useParams();
  const [formData, setFormData] = useState({
    chapterNumber: '',
    title: '',
  });
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function handleImageChange(e, index) {
    const file = e.target.files[0];
    if (file) {
      const newPages = [...pages];
      newPages[index] = { file, preview: URL.createObjectURL(file) };
      setPages(newPages);
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
      
      const data = await response.json();
      
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error('فشل في رفع الصورة إلى ImgBB');
      }
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      throw error;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
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

      // رفع جميع صور الصفحات إلى ImgBB
      const pageUrls = [];
      for (const page of pages) {
        if (page && page.file) {
          const pageUrl = await uploadPageImage(page.file);
          pageUrls.push(pageUrl);
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

      const docRef = await addDoc(collection(db, 'manga', mangaId, 'chapters'), chapterData);
      
      // تحديث عدد فصول المانغا
      await updateDoc(doc(db, 'manga', mangaId), {
        chaptersCount: increment(1),
        lastUpdated: serverTimestamp()
      });

      setMessage('تم إضافة الفصل بنجاح!');
      
      // إعادة تعيين النموذج
      setFormData({
        chapterNumber: '',
        title: '',
      });
      setPages([]);
      
      // التوجه إلى صفحة تفاصيل المانغا بعد 2 ثانية
      setTimeout(() => {
        navigate(`/manga/${mangaId}`);
      }, 2000);

    } catch (error) {
      console.error('خطأ في إضافة الفصل:', error);
      setMessage('حدث خطأ في إضافة الفصل. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                  onClick={() => navigate(`/manga/${mangaId}`)}
                  className="w-full"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
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
          </div>
        </div>

        {/* Pages Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>صفحات الفصل</span>
              <Button type="button" onClick={addPage} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة صفحة
              </Button>
            </CardTitle>
            <CardDescription>
              ارفع صفحات الفصل بالترتيب الصحيح
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
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
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => document.getElementById(`page-${index}`).click()}
                        >
                          تغيير الصورة
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">اختر صورة الصفحة</p>
                        <Input
                          id={`page-${index}`}
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