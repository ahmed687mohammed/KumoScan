import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, updateDoc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Star, StarIcon } from 'lucide-react';

export default function Rating({ mangaId, type = 'manga' }) {
  const { currentUser } = useAuth();
  const [currentRating, setCurrentRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRating();
  }, [mangaId]);

  async function loadRating() {
    try {
      setLoading(true);
      
      // جلب تقييم المانغا
      const mangaDoc = await getDoc(doc(db, 'manga', mangaId));
      if (mangaDoc.exists()) {
        const data = mangaDoc.data();
        setCurrentRating(data.rating || 0);
        setTotalRatings(data.ratingsCount || 0);
      }
      
      // جلب تقييم المستخدم إذا كان مسجلاً
      if (currentUser) {
        const userRatingDoc = await getDoc(doc(db, 'manga', mangaId, 'ratings', currentUser.uid));
        if (userRatingDoc.exists()) {
          setUserRating(userRatingDoc.data().rating || 0);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب التقييم:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRating(rating) {
    if (!currentUser) {
      setMessage('يجب تسجيل الدخول لإضافة تقييم');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');

      const mangaRef = doc(db, 'manga', mangaId);
      const userRatingRef = doc(db, 'manga', mangaId, 'ratings', currentUser.uid);
      
      // التحقق من وجود تقييم سابق للمستخدم
      const existingRating = await getDoc(userRatingRef);
      const hadPreviousRating = existingRating.exists();
      const previousRating = hadPreviousRating ? existingRating.data().rating : 0;
      
      // حفظ تقييم المستخدم
      await setDoc(userRatingRef, {
        rating,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // تحديث إحصائيات المانغا
      const mangaDoc = await getDoc(mangaRef);
      const mangaData = mangaDoc.data();
      const currentTotal = mangaData.rating || 0;
      const currentCount = mangaData.ratingsCount || 0;
      
      let newTotal, newCount;
      
      if (hadPreviousRating) {
        // تحديث تقييم موجود
        newTotal = ((currentTotal * currentCount) - previousRating + rating) / currentCount;
        newCount = currentCount;
      } else {
        // تقييم جديد
        newTotal = ((currentTotal * currentCount) + rating) / (currentCount + 1);
        newCount = currentCount + 1;
      }
      
      await updateDoc(mangaRef, {
        rating: Math.round(newTotal * 10) / 10, // تقريب لرقم عشري واحد
        ratingsCount: newCount
      });
      
      setUserRating(rating);
      setCurrentRating(newTotal);
      setTotalRatings(newCount);
      setMessage('تم حفظ تقييمك بنجاح');
      
    } catch (error) {
      console.error('خطأ في حفظ التقييم:', error);
      setMessage('خطأ في حفظ التقييم');
    } finally {
      setSubmitting(false);
    }
  }

  const StarButton = ({ index, filled, hovered, onClick, onMouseEnter, onMouseLeave }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={submitting}
      className={`p-1 transition-colors ${
        filled || hovered 
          ? 'text-yellow-500' 
          : 'text-gray-300 hover:text-yellow-400'
      } ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Star 
        className={`h-6 w-6 ${filled || hovered ? 'fill-current' : ''}`} 
      />
    </button>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="flex space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span>تقييم المانغا</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert className={message.includes('بنجاح') ? 'border-green-500' : 'border-red-500'}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Current Rating Display */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(currentRating)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold">{currentRating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-gray-600">
            {totalRatings} {totalRatings === 1 ? 'تقييم' : 'تقييم'}
          </p>
        </div>

        {/* User Rating */}
        {currentUser ? (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">
              {userRating > 0 ? 'تقييمك:' : 'قيم هذه المانغا:'}
            </p>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarButton
                  key={star}
                  index={star}
                  filled={star <= userRating}
                  hovered={star <= hoveredRating}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                />
              ))}
            </div>
            {userRating > 0 && (
              <div className="text-center mt-2">
                <p className="text-sm text-gray-600">
                  لقد قيمت هذه المانغا بـ {userRating} {userRating === 1 ? 'نجمة' : 'نجوم'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRating(0)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  إزالة التقييم
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t pt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              سجل دخولك لإضافة تقييم
            </p>
            <Button variant="outline" size="sm">
              تسجيل الدخول
            </Button>
          </div>
        )}

        {/* Rating Breakdown */}
        {totalRatings > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">توزيع التقييمات:</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center space-x-2 text-sm">
                  <span className="w-4">{stars}</span>
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${totalRatings > 0 ? (Math.random() * 100) : 0}%` // مؤقت - يجب حساب النسبة الفعلية
                      }}
                    />
                  </div>
                  <span className="w-8 text-gray-600">
                    {Math.floor(Math.random() * totalRatings)} {/* مؤقت */}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

