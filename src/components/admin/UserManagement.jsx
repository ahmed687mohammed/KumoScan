import { useState, useEffect } from 'react';
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
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Search, 
  Users, 
  MoreVertical,
  Shield,
  User,
  Calendar,
  Mail,
  Crown
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // تصفية المستخدمين حسب البحث
    const filtered = users.filter(user =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  async function loadUsers() {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      setMessage('خطأ في جلب بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId, newRole, userName) {
    if (!window.confirm(`هل أنت متأكد من تغيير دور "${userName}" إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم'}؟`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setMessage(`تم تحديث دور المستخدم بنجاح`);
    } catch (error) {
      console.error('خطأ في تحديث دور المستخدم:', error);
      setMessage('خطأ في تحديث دور المستخدم');
    }
  }

  function getRoleBadge(role) {
    if (role === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <Crown className="h-3 w-3 mr-1" />
          مدير
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />
        مستخدم
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Users className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
        <p className="text-gray-600 mt-2">إدارة حسابات المستخدمين وصلاحياتهم</p>
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
              placeholder="ابحث في المستخدمين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === 'admin').length}
            </p>
            <p className="text-sm text-gray-600">المديرين</p>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين ({filteredUsers.length})</CardTitle>
          <CardDescription>
            جميع المستخدمين المسجلين في الموقع
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمين مسجلين بعد'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصورة</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>المفضلة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{user.displayName || 'غير محدد'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.favorites?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {user.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'غير محدد'}
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
                            {user.role === 'admin' ? (
                              <DropdownMenuItem 
                                onClick={() => updateUserRole(user.id, 'user', user.displayName)}
                              >
                                <User className="h-4 w-4 mr-2" />
                                تحويل إلى مستخدم
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => updateUserRole(user.id, 'admin', user.displayName)}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                تحويل إلى مدير
                              </DropdownMenuItem>
                            )}
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

