import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button, Alert } from '../../components/ui';
import { Calendar, Clock, MapPin, Users, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MyRegistrations() {
  const { currentUserId, registrations, courses, venues, cancelRegistration, familyMembers } = useAppStore();
  const myRegs = registrations.filter(r => r.residentId === currentUserId);

  const activeRegs = myRegs.filter(r => r.status !== 'cancelled');
  const cancelledRegs = myRegs.filter(r => r.status === 'cancelled');

  const renderReg = (r: typeof myRegs[0]) => {
    const course = courses.find(c => c.id === r.courseId);
    if (!course) return null;
    const fm = familyMembers[currentUserId]?.find(f => f.id === r.familyMemberId);
    const nextSession = course.sessions[0];
    const venue = nextSession?.venueId ? venues.find(v => v.id === nextSession.venueId) : null;

    return (
      <Card key={r.id}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
              <StatusBadge status={r.status} />
              {fm && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  代报名：{fm.name}（{fm.relation}）
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Users size={14} />{course.category}</span>
              {nextSession && (
                <>
                  <span className="flex items-center gap-1"><Calendar size={14} />首课：{nextSession.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} />{nextSession.startTime} - {nextSession.endTime}</span>
                </>
              )}
              {venue && <span className="flex items-center gap-1"><MapPin size={14} />{venue.name}</span>}
            </div>

            {r.status === 'waitlisted' && r.waitlistPosition && (
              <Alert type="warning" className="mt-3">
                当前候补第 <strong>{r.waitlistPosition}</strong> 位，有人取消报名时将按顺序转正。
              </Alert>
            )}

            {r.status === 'promoted' && (
              <Alert type="success" className="mt-3">
                恭喜！您已从候补转为正式学员，请按时上课。
              </Alert>
            )}

            {r.cancelledAt && (
              <p className="text-sm text-gray-500 mt-2">取消时间：{r.cancelledAt}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Link to={`/course/${course.id}`}>
              <Button variant="secondary" size="sm">课程详情</Button>
            </Link>
            {r.status !== 'cancelled' && !nextSession?.locked && (
              <Button variant="danger" size="sm" onClick={() => cancelRegistration(r.id)}>
                取消报名
              </Button>
            )}
            {nextSession?.locked && r.status !== 'cancelled' && (
              <Link to="/resident/checkin">
                <Button size="sm">去签到</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">当前报名（{activeRegs.length}）</h3>
        {activeRegs.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <AlertTriangle size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">暂无报名，快去选课吧！</p>
              <Link to="/resident/courses" className="mt-4 inline-block">
                <Button>浏览课程</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeRegs.map(r => renderReg(r))}
          </div>
        )}
      </div>

      {cancelledRegs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">已取消（{cancelledRegs.length}）</h3>
          <div className="space-y-4 opacity-70">
            {cancelledRegs.map(r => renderReg(r))}
          </div>
        </div>
      )}
    </div>
  );
}
