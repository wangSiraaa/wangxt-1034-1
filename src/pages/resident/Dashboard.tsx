import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button } from '../../components/ui';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Bell, Users, ChevronRight } from 'lucide-react';

export function ResidentDashboard() {
  const { currentUserId, courses, registrations, notifications, checkIns, venues } = useAppStore();
  const myRegs = registrations.filter(r => r.residentId === currentUserId && r.status !== 'cancelled');
  const today = new Date().toISOString().split('T')[0];

  const todayCourses = myRegs
    .filter(r => r.status === 'registered' || r.status === 'promoted')
    .map(r => {
      const course = courses.find(c => c.id === r.courseId);
      const nextSession = course?.sessions.find(s => s.date >= today);
      if (!course || !nextSession || nextSession.date !== today) return null;
      return { reg: r, course, session: nextSession };
    })
    .filter(Boolean) as Array<any>;

  const unreadNotifs = notifications.filter(n => n.userId === currentUserId && !n.read).slice(0, 3);

  const stats = [
    { label: '已报名课程', value: myRegs.filter(r => r.status === 'registered' || r.status === 'promoted').length, color: 'bg-blue-500' },
    { label: '候补中', value: myRegs.filter(r => r.status === 'waitlisted').length, color: 'bg-orange-500' },
    { label: '今日课程', value: todayCourses.length, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <div className="flex items-center gap-4">
              <div className={`${s.color} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="今日课程"
            actions={
              <Link to="/resident/my">
                <Button variant="ghost" size="sm">查看全部 <ChevronRight size={14} /></Button>
              </Link>
            }
          >
            {todayCourses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">今日暂无课程安排</p>
            ) : (
              <div className="space-y-3">
                {todayCourses.map(({ reg, course, session }) => {
                  const venue = venues.find(v => v.id === session.venueId);
                  const checkedIn = checkIns.some(c => c.registrationId === reg.id && c.sessionId === session.id);
                  return (
                    <div key={reg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{course.name}</h4>
                          <StatusBadge status={reg.status} />
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Clock size={14} />{session.startTime} - {session.endTime}</span>
                          <span className="flex items-center gap-1"><MapPin size={14} />{venue?.name || '待分配'}</span>
                        </div>
                      </div>
                      <Link to="/resident/checkin">
                        <Button size="sm" variant={checkedIn ? 'secondary' : 'primary'}>
                          {checkedIn ? '查看签到' : '去签到'}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card
            title="最新通知"
            actions={
              <Link to="/resident/notifications">
                <Button variant="ghost" size="sm">全部通知 <ChevronRight size={14} /></Button>
              </Link>
            }
          >
            {unreadNotifs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">暂无未读通知</p>
            ) : (
              <div className="space-y-3">
                {unreadNotifs.map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Bell size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{n.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card title="快速入口">
          <div className="space-y-2">
            <Link to="/resident/courses">
              <div className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Calendar size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">浏览课程</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
            <Link to="/resident/my">
              <div className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <Users size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">我的报名</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
            <Link to="/resident/checkin">
              <div className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <MapPin size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">签到中心</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
