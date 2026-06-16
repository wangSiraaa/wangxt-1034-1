import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge } from '../../components/ui';
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export function AdminDashboard() {
  const { courses, venues, registrations, blacklist } = useAppStore();

  const pending = courses.filter(c => c.status === 'pending_approval');
  const approved = courses.filter(c => c.status === 'approved');
  const scheduled = courses.filter(c => c.status === 'scheduled' || c.status === 'ongoing');
  const today = new Date().toISOString().split('T')[0];

  const todaysSessions = courses.flatMap(c =>
    c.sessions.filter(s => s.date === today && s.venueId).map(s => ({ ...s, courseName: c.name, courseId: c.id }))
  );

  const stats = [
    { label: '待审核课程', value: pending.length, icon: AlertTriangle, color: 'bg-yellow-500' },
    { label: '待排课课程', value: approved.length, icon: Calendar, color: 'bg-blue-500' },
    { label: '已排课课程', value: scheduled.length, icon: CheckCircle, color: 'bg-green-500' },
    { label: '场馆数量', value: venues.length, icon: MapPin, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <div className="flex items-center gap-4">
                <div className={`${s.color} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={`今日课表（${todaysSessions.length}节）`}>
          {todaysSessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">今日暂无排课</p>
          ) : (
            <div className="space-y-2">
              {todaysSessions.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => {
                const venue = venues.find(v => v.id === s.venueId);
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">{s.courseName}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Clock size={14} />{s.startTime}-{s.endTime}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} />{venue?.name}</span>
                      </div>
                    </div>
                    {s.locked ? (
                      <StatusBadge status="ongoing" />
                    ) : (
                      <span className="text-xs text-gray-500">未锁定</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="待办事项">
          <div className="space-y-3">
            {pending.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-yellow-600" />
                  <p className="font-medium text-yellow-800">{pending.length} 个课程等待审核</p>
                </div>
                <p className="text-sm text-yellow-700 mt-1">请前往「课程审核」处理</p>
              </div>
            )}
            {approved.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600" />
                  <p className="font-medium text-blue-800">{approved.length} 个课程需要排课</p>
                </div>
                <p className="text-sm text-blue-700 mt-1">请前往「排课中心」分配场馆</p>
              </div>
            )}
            {blacklist.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-red-600" />
                  <p className="font-medium text-red-800">黑名单中有 {blacklist.length} 名居民</p>
                </div>
                <p className="text-sm text-red-700 mt-1">可在「黑名单」页面管理</p>
              </div>
            )}
            {pending.length === 0 && approved.length === 0 && blacklist.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">暂无待办事项</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
