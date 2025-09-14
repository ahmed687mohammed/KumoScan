import { Link } from 'react-router-dom';
import { BookOpen, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">KumoScan</span>
            </div>
            <p className="text-gray-300 mb-4">
              موقع قراءة المانغا الأول في العالم العربي. اقرأ أحدث فصول المانغا المترجمة بجودة عالية ومجاناً.
            </p>
            <div className="flex items-center text-sm text-gray-400">
              <span>صُنع بـ</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>للمجتمع العربي</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/manga" className="text-gray-300 hover:text-white transition-colors">
                  جميع المانغا
                </Link>
              </li>
              <li>
                <Link to="/latest" className="text-gray-300 hover:text-white transition-colors">
                  أحدث الفصول
                </Link>
              </li>
              <li>
                <Link to="/popular" className="text-gray-300 hover:text-white transition-colors">
                  الأكثر شعبية
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">التصنيفات</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/genre/action" className="text-gray-300 hover:text-white transition-colors">
                  أكشن
                </Link>
              </li>
              <li>
                <Link to="/genre/romance" className="text-gray-300 hover:text-white transition-colors">
                  رومانسي
                </Link>
              </li>
              <li>
                <Link to="/genre/comedy" className="text-gray-300 hover:text-white transition-colors">
                  كوميدي
                </Link>
              </li>
              <li>
                <Link to="/genre/drama" className="text-gray-300 hover:text-white transition-colors">
                  دراما
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            © 2025 KumoScan. جميع الحقوق محفوظة.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              سياسة الخصوصية
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              شروط الاستخدام
            </Link>
            <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
              اتصل بنا
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

