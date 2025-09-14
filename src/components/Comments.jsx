import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Reply, 
  Heart, 
  MoreVertical,
  Send,
  User,
  Trash2,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Comments({ mangaId, chapterId }) {
  const { currentUser, userProfile } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadComments();
  }, [mangaId, chapterId]);

  async function loadComments() {
    try {
      setLoading(true);
      const commentsRef = collection(db, 'manga', mangaId, 'chapters', chapterId, 'comments');
      const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(commentsQuery);
      
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // تنظيم التعليقات والردود
      const organizedComments = organizeComments(commentsData);
      setComments(organizedComments);
    } catch (error) {
      console.error('خطأ في جلب التعليقات:', error);
    } finally {
      setLoading(false);
    }
  }

  function organizeComments(commentsData) {
    const parentComments = commentsData.filter(comment => !comment.parentId);
    const replies = commentsData.filter(comment => comment.parentId);
    
    return parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(reply => reply.parentId === parent.id)
        .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
    }));
  }

  async function handleSubmitComment(e) {
    e.preventDefault();
    
    if (!currentUser) {
      setMessage('يجب تسجيل الدخول للتعليق');
      return;
    }

    if (!newComment.trim()) {
      setMessage('لا يمكن إرسال تعليق فارغ');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');

      const commentData = {
        text: newComment.trim(),
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.displayName || 'مستخدم',
        userPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        mangaId,
        chapterId
      };

      const commentsRef = collection(db, 'manga', mangaId, 'chapters', chapterId, 'comments');
      await addDoc(commentsRef, commentData);
      
      setNewComment('');
      await loadComments();
      setMessage('تم إضافة التعليق بنجاح');
    } catch (error) {
      console.error('خطأ في إضافة التعليق:', error);
      setMessage('خطأ في إضافة التعليق');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitReply(e, parentId) {
    e.preventDefault();
    
    if (!currentUser) {
      setMessage('يجب تسجيل الدخول للرد');
      return;
    }

    if (!replyText.trim()) {
      setMessage('لا يمكن إرسال رد فارغ');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');

      const replyData = {
        text: replyText.trim(),
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.displayName || 'مستخدم',
        userPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        parentId,
        mangaId,
        chapterId
      };

      const commentsRef = collection(db, 'manga', mangaId, 'chapters', chapterId, 'comments');
      await addDoc(commentsRef, replyData);
      
      setReplyText('');
      setReplyTo(null);
      await loadComments();
      setMessage('تم إضافة الرد بنجاح');
    } catch (error) {
      console.error('خطأ في إضافة الرد:', error);
      setMessage('خطأ في إضافة الرد');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLikeComment(commentId, currentLikes, likedBy) {
    if (!currentUser) {
      setMessage('يجب تسجيل الدخول للإعجاب');
      return;
    }

    try {
      const commentRef = doc(db, 'manga', mangaId, 'chapters', chapterId, 'comments', commentId);
      const hasLiked = likedBy?.includes(currentUser.uid);
      
      if (hasLiked) {
        // إزالة الإعجاب
        await updateDoc(commentRef, {
          likes: Math.max(0, currentLikes - 1),
          likedBy: likedBy.filter(uid => uid !== currentUser.uid)
        });
      } else {
        // إضافة الإعجاب
        await updateDoc(commentRef, {
          likes: currentLikes + 1,
          likedBy: [...(likedBy || []), currentUser.uid]
        });
      }
      
      await loadComments();
    } catch (error) {
      console.error('خطأ في تحديث الإعجاب:', error);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'manga', mangaId, 'chapters', chapterId, 'comments', commentId));
      await loadComments();
      setMessage('تم حذف التعليق');
    } catch (error) {
      console.error('خطأ في حذف التعليق:', error);
      setMessage('خطأ في حذف التعليق');
    }
  }

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.userPhoto} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{comment.userName}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {comment.createdAt?.toDate?.()?.toLocaleDateString('ar-SA')}
                </span>
                {(currentUser?.uid === comment.userId || userProfile?.role === 'admin') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <p className="text-gray-700 text-sm">{comment.text}</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeComment(comment.id, comment.likes || 0, comment.likedBy || [])}
              className={`text-xs ${comment.likedBy?.includes(currentUser?.uid) ? 'text-red-600' : 'text-gray-500'}`}
            >
              <Heart className={`h-3 w-3 mr-1 ${comment.likedBy?.includes(currentUser?.uid) ? 'fill-current' : ''}`} />
              {comment.likes || 0}
            </Button>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-xs text-gray-500"
              >
                <Reply className="h-3 w-3 mr-1" />
                رد
              </Button>
            )}
          </div>
          
          {/* Reply Form */}
          {replyTo === comment.id && (
            <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك..."
                rows={2}
                className="mb-2"
              />
              <div className="flex space-x-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  <Send className="h-3 w-3 mr-1" />
                  إرسال
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText('');
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>التعليقات ({comments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert className={message.includes('بنجاح') ? 'border-green-500' : 'border-red-500'}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Add Comment Form */}
        {currentUser ? (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="شاركنا رأيك في هذا الفصل..."
              rows={3}
            />
            <Button type="submit" disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'جاري الإرسال...' : 'إضافة تعليق'}
            </Button>
          </form>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">سجل دخولك لإضافة تعليق</p>
            <Button variant="outline" size="sm">
              تسجيل الدخول
            </Button>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-lg p-3">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تعليقات بعد</p>
            <p className="text-sm text-gray-400 mt-2">كن أول من يعلق على هذا الفصل</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

