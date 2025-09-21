import { Calendar, MapPin } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function EventCard({ 
  title, 
  date, 
  location, 
  description,
  id 
}) {
  /**
   * Format the date for display
   */
  const formatDate = (dateInput) => {
    if (!dateInput) return 'Date TBD'
    
    try {
      const eventDate = new Date(dateInput)
      return eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
          {title || 'Untitled Event'}
        </CardTitle>
        {description && (
          <CardDescription className="text-gray-600 line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Date Information */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            <span>{formatDate(date)}</span>
          </div>
          
          {/* Location Information */}
          {location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-green-500" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}