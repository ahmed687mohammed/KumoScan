import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Upload, BookOpen, Save, X } from 'lucide-react';

export default function AddManga() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    alternativeTitle: '',
    description: '',
    author: '',
    artist: '',
    year: '',
    status: 'ongoing',
    language: 'Arabic',
    genres: [],
    featured: false
  });
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const genres = [
    'action', 'adventure', 'comedy', 'drama', 'fantasy', 'horror', 
    'mystery', 'romance', 'sci-fi', 'slice-of-life', 'sports', 'supernatural'
  ];

  const genreLabels = {
    'action': 'أكشن',
    'adventure': 'مغامرة',
    'comedy': 'كوميدي',
    'drama': 'دراما',
    'fantasy': 'خيال',
    'horror': 'رعب',
    'mystery': 'غموض',
    'romance': 'رومانسي',
    'sci-fi': 'خيال علمي',
    'slice-of-life': 'شريحة من الحياة',
    'sports': 'رياضة',
    'supernatural': 'خارق للطبيعة'
  };

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function handleGenreChange(genre, checked) {
    setFormData(prev => ({
      ...prev,
      genres: checked 
        ? [...prev.genres, genre]
        : prev.genres.filter(g => g !== genre)
    }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
    }
  }

  async function uploadCoverImage() {
    if (!coverImage) return null;
    
    try {
      const formData = new FormData();
      formData.append('image', coverImage);
      
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
    
    if (!formData.title.trim()) {
      setMessage('عنوان المانغا مطلوب');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // إضافة المانغا إلى Firestore
      const mangaData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        views: 0,
        rating: 0,
        ratingsCount: 0,
        favoritesCount: 0,
        chaptersCount: 0
      };

      const docRef = await addDoc(collection(db, 'manga'), mangaData);
      
      // رفع صورة الغلاف إذا تم اختيارها
      if (coverImage) {
        const coverImageUrl = await uploadCoverImage();
        await updateDoc(doc(db, 'manga', docRef.id), {
          coverImage: coverImageUrl
        });
      }

      setMessage('تم إضافة المانغا بنجاح!');
      
      // إعادة تعيين النموذج
      setFormData({
        title: '',
        alternativeTitle: '',
        description: '',
        author: '',
        artist: '',
        year: '',
        status: 'ongoing',
        language: 'Arabic',
        genres: [],
        featured: false
      });
      setCoverImage(null);
      
      // التوجه إلى صفحة إدارة المانغا بعد 2 ثانية
      setTimeout(() => {
        navigate('/admin/manga');
      }, 2000);

    } catch (error) {
      console.error('خطأ في إضافة المانغا:', error);
      setMessage('حدث خطأ في إضافة المانغا. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إضافة مانغا جديدة</h1>
        <p className="text-gray-600 mt-2">أضف مانغا جديدة إلى مكتبة الموقع</p>
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
                  <span>المعلومات الأساسية</span>
                </CardTitle>
                <CardDescription>
                  أدخل المعلومات الأساسية للمانغا
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">العنوان *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="أدخل عنوان المانغا"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="alternativeTitle">العنوان البديل</Label>
                    <Input
                      id="alternativeTitle"
                      name="alternativeTitle"
                      value={formData.alternativeTitle}
                      onChange={handleInputChange}
                      placeholder="العنوان الإنجليزي أو الياباني"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="أدخل وصف المانغا..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="author">المؤلف</Label>
                    <Input
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      placeholder="اسم المؤلف"
                    />
                  </div>
                  <div>
                    <Label htmlFor="artist">الرسام</Label>
                    <Input
                      id="artist"
                      name="artist"
                      value={formData.artist}
                      onChange={handleInputChange}
                      placeholder="اسم الرسام"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="year">سنة النشر</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      value={formData.year}
                      onChange={handleInputChange}
                      placeholder="2024"
                      min="1900"
                      max="2030"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">الحالة</Label>
                    <Select value={formData.status} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ongoing">مستمر</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="hiatus">متوقف مؤقتاً</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">اللغة</Label>
                    <Select value={formData.language} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, language: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arabic">العربية</SelectItem>
                        <SelectItem value="English">الإنجليزية</SelectItem>
                        <SelectItem value="Japanese">اليابانية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genres */}
            <Card>
              <CardHeader>
                <CardTitle>التصنيفات</CardTitle>
                <CardDescription>
                  اختر التصنيفات المناسبة للمانغا
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {genres.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={genre}
                        checked={formData.genres.includes(genre)}
                        onCheckedChange={(checked) => handleGenreChange(genre, checked)}
                      />
                      <Label htmlFor={genre} className="text-sm">
                        {genreLabels[genre]}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cover Image and Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>صورة الغلاف</span>
                </CardTitle>
                <CardDescription>
                  ارفع صورة غلاف المانغا
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {coverImage ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(coverImage)}
                        alt="معاينة الغلاف"
                        className="w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm text-gray-600">{coverImage.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCoverImage(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        إزالة
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">اختر صورة الغلاف</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات إضافية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, featured: checked }))
                    }
                  />
                  <Label htmlFor="featured">
                    مانغا مميزة
                  </Label>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  ستظهر في القسم المميز بالصفحة الرئيسية
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/manga')}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>جاري الحفظ...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                حفظ المانغا
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}