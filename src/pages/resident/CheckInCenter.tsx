import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button, Alert } from '../../components/ui';
import { Calendar, Clock, MapPin, CheckCircle, Clock as ClockIcon, XCircle, MapPin as MapPinIcon } from 'lucide-react';

export function CheckInCenter() {
  const { currentUserId, courses, registrations, venues, checkIns, checkIn } = useAppStore();
  const today = new Date().toISOString().split('T')[0];

  const myRegs = registrations.filter(
    r => r.residentId === currentUserId && (r.status === 'registered' || r.status === 'promoted')
  );

  const todaySessions = myRegs
    .map(r => {
      const course = courses.find(c => c.id === r.courseId);
      const session = course?.sessions.find(s => s.date === today);
      if (!course || !session) return null;
      const venue = venues.find(v => v.id === session.venueId);
      const existingCheckIn = checkIns.find(c => c.registrationId === r.id && c.sessionId === session.id);
      return { reg: r, course, session, venue, checkIn: existingCheckIn };
    })
    .filter(Boolean) as Array<any>;

  return (
    <div className="space-y-6">
      <Alert type="info">
        <MapPinIcon size={16} className="inline mr-1" />
        签到说明：课程开始后 10 分钟内签到为正常，超过 10 分钟将记录为迟到。
      </Alert>

      {todaySessions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar size={40} className="mx-auto text-gray-400 mb-3" />
            <h4 className="font-medium text-gray-900">今日暂无课程</h4>
            <p className="text-sm text-gray-500 mt-1">请查看「我的报名」了解完整课程安排</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {todaySessions.map(({ reg, course, session, venue, checkIn: existing }) => (
            <Card key={`${reg.id}-${session.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                    {existing && <StatusBadge status={existing.status} />}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1"><Calendar size={14} />{session.date}</span>
                    <span className="flex items-center gap-1"><Clock size={14} />{session.startTime} - {session.endTime}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} />{venue?.name || '待分配'}</span>
                  </div>

                  {existing && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {existing.status === 'checked_in' && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={14} />
                          已签到 · {existing.checkedInAt?.slice(11, 16)}
                        </span>
                      )}
                      {existing.status === 'late' && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <ClockIcon size={14} />
                          迟到 {existing.lateMinutes} 分钟 · {existing.checkedInAt?.slice(11, 16)}
                        </span>
                      )}
                      {existing.status === 'absent' && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle size={14} />
                          未签到
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  {!existing ? (
                    <Button
                      size="lg"
                      onClick={() => checkIn(reg.id, session.id, course.id, currentUserId)}
                      className="px-8 py-3 text-base"
                    >
                      {session.locked ? '立即签到' : '课程开始后可签到'}
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" disabled>
                      已完成签到
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card title="签到历史">
        {checkIns.filter(c => c.residentId === currentUserId).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">暂无签到记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">课程</th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">日期</th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">时间</th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">状态</th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">签到时间</th>
                </tr>
              </thead>
              <tbody>
                {checkIns.filter(c => c.residentId === currentUserId).map(ci => {
                  const c = courses.find(co => co.id === ci.courseId);
                  const s = c?.sessions.find(se => se.id === ci.sessionId);
                  return (
                    <tr key={ci.id} className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-900">{c?.name || '-'}</td>
                      <td className="py-3 px-2 text-gray-600">{s?.date || '-'}</td>
                      <td className="py-3 px-2 text-gray-600">{s ? `${s.startTime}-${s.endTime}` : '-'}</td>
                      <td className="py-3 px-2"><StatusBadge status={ci.status} /></td>
                      <td className="py-3 px-2 text-gray-600">{ci.checkedInAt?.slice(0, 16) || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
