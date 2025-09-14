import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Loader2 } from 'lucide-react';

export default function FavoriteButton({ mangaId, mangaTitle, className = '' }) {
  const { currentUser, userProfile } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkFavoriteStatus();
  }, [currentUser, mangaId]);

  async function checkFavoriteStatus() {
    if (!currentUser) {
      setIsFavorite(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const favorites = userData.favorites || [];
        setIsFavorite(favorites.includes(mangaId));
      }
    } catch (error) {
      console.error('خطأ في التحقق من حالة المفضلة:', error);
    }
  }

  async function toggleFavorite() {
    if (!currentUser) {
      setMessage('يجب تسجيل الدخول لإضافة المانغا للمفضلة');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const userRef = doc(db, 'users', currentUser.uid);
      const mangaRef = doc(db, 'manga', mangaId);

      if (isFavorite) {
        // إزالة من المفضلة
        await updateDoc(userRef, {
          favorites: arrayRemove(mangaId)
        });
        
        await updateDoc(mangaRef, {
          favoritesCount: increment(-1)
        });
        
        setIsFavorite(false);
        setMessage('تم إزالة المانغا من المفضلة');
      } else {
        // إضافة للمفضلة
        await updateDoc(userRef, {
          favorites: arrayUnion(mangaId)
        });
        
        await updateDoc(mangaRef, {
          favoritesCount: increment(1)
        });
        
        setIsFavorite(true);
        setMessage('تم إضافة المانغا للمفضلة');
      }
    } catch (error) {
      console.error('خطأ في تحديث المفضلة:', error);
      setMessage('خطأ في تحديث المفضلة');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={toggleFavorite}
        disabled={loading}
        variant={isFavorite ? 'default' : 'outline'}
        className={`${className} ${
          isFavorite 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'border-red-600 text-red-600 hover:bg-red-50'
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
        )}
        {loading 
          ? 'جاري التحديث...' 
          : isFavorite 
            ? 'في المفضلة' 
            : 'إضافة للمفضلة'
        }
      </Button>
      
      {message && (
        <Alert className={message.includes('تم') ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription className="text-sm">{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

