import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button } from '../../components/ui';
import { Calendar, Users, Clock, CheckCircle, Clock4, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ClubDashboard() {
  const { currentUserId, courses, registrations } = useAppStore();
  const myCourses = courses.filter(c => c.clubLeaderId === currentUserId);

  const stats = [
    { label: '全部课程', value: myCourses.length, icon: Calendar, color: 'bg-blue-500' },
    { label: '已排课', value: myCourses.filter(c => c.status === 'scheduled' || c.status === 'ongoing').length, icon: CheckCircle, color: 'bg-green-500' },
    { label: '待审核', value: myCourses.filter(c => c.status === 'pending_approval').length, icon: Clock4, color: 'bg-yellow-500' },
    { label: '已驳回', value: myCourses.filter(c => c.status === 'rejected').length, icon: XCircle, color: 'bg-red-500' },
  ];

  const recentCourses = myCourses.slice(0, 5);

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

      <Card
        title="我的课程"
        actions={
          <Link to="/club/courses/new">
            <Button>提交新课程</Button>
          </Link>
        }
      >
        <div className="space-y-3">
          {recentCourses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">暂无课程，点击右上角提交新课程</p>
          ) : (
            recentCourses.map(c => {
              const regCount = registrations.filter(r => r.courseId === c.id && r.status === 'registered').length;
              return (
                <Link
                  key={c.id}
                  to={`/course/${c.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{c.name}</h4>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={14} />{c.sessions.length}节课</span>
                      <span className="flex items-center gap-1"><Users size={14} />{regCount}/{c.maxParticipants}人</span>
                      {c.sessions[0] && (
                        <span className="flex items-center gap-1"><Clock size={14} />首课 {c.sessions[0].date}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
