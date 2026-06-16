import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button } from '../../components/ui';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, Plus } from 'lucide-react';

export function ClubCourses() {
  const { currentUserId, courses, registrations, venues } = useAppStore();
  const myCourses = courses.filter(c => c.clubLeaderId === currentUserId);

  const getVenueName = (id?: string) => venues.find(v => v.id === id)?.name || '待分配';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/club/courses/new">
          <Button><Plus size={16} className="mr-1" />提交新课程</Button>
        </Link>
      </div>

      {myCourses.map(c => {
        const regCount = registrations.filter(r => r.courseId === c.id && r.status === 'registered').length;
        const waitCount = registrations.filter(r => r.courseId === c.id && r.status === 'waitlisted').length;
        return (
          <Card key={c.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                  <StatusBadge status={c.status} />
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{c.category}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{c.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Users size={14} />已报名 {regCount} 人 / 上限 {c.maxParticipants} 人{waitCount > 0 && `（候补 ${waitCount}）`}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} />共 {c.sessions.length} 节课</span>
                  {c.ageMin != null || c.ageMax != null && (
                    <span>年龄限制: {c.ageMin || '不限'} - {c.ageMax || '不限'} 岁</span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">课次安排</p>
                  <div className="grid gap-2">
                    {c.sessions.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded-md text-sm">
                        <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">{i + 1}</span>
                        <span className="flex items-center gap-1 text-gray-700"><Calendar size={14} />{s.date}</span>
                        <span className="flex items-center gap-1 text-gray-700"><Clock size={14} />{s.startTime} - {s.endTime}</span>
                        <span className="flex items-center gap-1 text-gray-700"><MapPin size={14} />{getVenueName(s.venueId)}</span>
                        {s.locked && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已锁定</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex flex-col gap-2">
                <Link to={`/course/${c.id}`}>
                  <Button variant="secondary" size="sm">查看详情</Button>
                </Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
