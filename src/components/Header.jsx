import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Settings, BookOpen, Menu, X } from 'lucide-react';

export default function Header() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">KumoScan</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              الرئيسية
            </Link>
            <Link to="/manga" className="text-gray-700 hover:text-blue-600 transition-colors">
              المانغا
            </Link>
            <Link to="/latest" className="text-gray-700 hover:text-blue-600 transition-colors">
              أحدث الفصول
            </Link>
            <Link to="/popular" className="text-gray-700 hover:text-blue-600 transition-colors">
              الأكثر شعبية
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                    <span>{userProfile?.displayName || currentUser.displayName || 'المستخدم'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>الملف الشخصي</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>المفضلة</span>
                    </Link>
                  </DropdownMenuItem>
                  {userProfile?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>لوحة الإدارة</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2">
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">إنشاء حساب</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                الرئيسية
              </Link>
              <Link 
                to="/manga" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                المانغا
              </Link>
              <Link 
                to="/latest" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                أحدث الفصول
              </Link>
              <Link 
                to="/popular" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                الأكثر شعبية
              </Link>
              
              {currentUser ? (
                <div className="pt-4 border-t space-y-2">
                  <Link 
                    to="/profile" 
                    className="block text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    الملف الشخصي
                  </Link>
                  <Link 
                    to="/favorites" 
                    className="block text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    المفضلة
                  </Link>
                  {userProfile?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      لوحة الإدارة
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block text-red-600 hover:text-red-700 transition-colors"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t space-y-2">
                  <Link 
                    to="/login" 
                    className="block text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

