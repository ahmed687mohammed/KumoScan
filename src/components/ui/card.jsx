import * as React from "react"
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Star, Heart, Eye } from 'lucide-react'
import { cn } from "@/lib/utils"

const MangaCard = ({ manga }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-0 h-full">
        <Link to={`/manga/${manga.id}`} className="block h-full">
          <div className="relative overflow-hidden">
            {/* مؤشر التحميل */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <BookOpen className="h-12 w-12 text-muted-foreground animate-pulse" />
              </div>
            )}
            
            {/* صورة الغلاف */}
            <img
              src={imageError ? '/placeholder-manga.jpg' : manga.coverImage}
              alt={manga.title}
              className={cn(
                "w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {/* Overlay effects */}
            
            
            {/* Badge الحالة */}
            {manga.status && (
              <Badge className="absolute top-2 right-2 bg-green-600">
                {manga.status === 'ongoing' ? 'مستمر' : 'مكتمل'}
              </Badge>
            )}
          </div>
          
          {/* محتوى البطاقة */}
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {manga.title}
            </h3>
            
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {manga.description || 'لا يوجد وصف متاح'}
            </p>
            
            {/* التصنيفات */}
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {manga.genres.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* الإحصائيات */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{manga.chaptersCount || 0} فصل</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{manga.rating || '0.0'}</span>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

export default MangaCard