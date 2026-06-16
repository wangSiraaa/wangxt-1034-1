import { useAppStore } from '../store/appStore';
import { Card, StatusBadge, Button } from '../components/ui';
import { Bell, Check, Calendar, Clock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotificationsPage() {
  const { currentUserId, notifications, markNotificationRead } = useAppStore();
  const myNotifs = notifications.filter(n => n.userId === currentUserId);

  const typeIcons: Record<string, any> = {
    course_approved: Calendar,
    course_rejected: Bell,
    venue_assigned: Calendar,
    venue_changed: Calendar,
    course_rescheduled: Clock,
    promoted_from_waitlist: Check,
    registration_cancelled: Trash2,
    course_cancelled: Trash2,
    checkin_reminder: Bell,
  };

  const typeColors: Record<string, string> = {
    course_approved: 'bg-green-100 text-green-700',
    course_rejected: 'bg-red-100 text-red-700',
    venue_assigned: 'bg-blue-100 text-blue-700',
    venue_changed: 'bg-yellow-100 text-yellow-700',
    course_rescheduled: 'bg-orange-100 text-orange-700',
    promoted_from_waitlist: 'bg-green-100 text-green-700',
    registration_cancelled: 'bg-gray-100 text-gray-700',
    course_cancelled: 'bg-red-100 text-red-700',
    checkin_reminder: 'bg-purple-100 text-purple-700',
  };

  if (myNotifs.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Bell size={40} className="mx-auto text-gray-400 mb-3" />
          <h4 className="font-medium text-gray-900">暂无通知</h4>
          <p className="text-sm text-gray-500 mt-1">您的所有通知都已处理完毕</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {myNotifs.map(n => {
        const Icon = typeIcons[n.type] || Bell;
        return (
          <Card key={n.id}>
            <div
              className={`flex items-start gap-4 ${!n.read ? 'bg-blue-50 -m-5 p-5 rounded-lg mb-0' : ''}`}
              onClick={() => !n.read && markNotificationRead(n.id)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[n.type] || 'bg-gray-100 text-gray-700'}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{n.title}</h4>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                </div>
                <p className="text-sm text-gray-600">{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('zh-CN')}</p>
              </div>
              {n.relatedCourseId && (
                <Link to={`/course/${n.relatedCourseId}`}>
                  <Button variant="ghost" size="sm">查看</Button>
                </Link>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
