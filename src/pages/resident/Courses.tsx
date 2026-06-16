import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button, Alert, Select } from '../../components/ui';
import { Calendar, Users, Clock, MapPin, ChevronRight, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import { EquipmentLabels, EquipmentType } from '../../types';

export function ResidentCourses() {
  const { courses, registrations, venues, currentUserId, isBlacklisted } = useAppStore();
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];

  const filtered = courses.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (statusFilter === 'scheduled' && !['scheduled', 'ongoing'].includes(c.status)) return false;
    if (statusFilter === 'approved' && c.status !== 'approved') return false;
    if (statusFilter === 'pending' && !['pending_approval'].includes(c.status)) return false;
    return true;
  });

  const blacklisted = isBlacklisted(currentUserId);

  return (
    <div className="space-y-4">
      {blacklisted && (
        <Alert type="error">
          <AlertTriangle size={18} className="inline mr-2" />
          <strong>注意：</strong>您已被加入报名黑名单，暂无法报名新课程。如有疑问请联系社区管理员。
        </Alert>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter size={16} />
          <span>筛选：</span>
        </div>
        <Select
          value={category}
          onChange={e => setCategory(e.target.value)}
          options={categories.map(c => ({ value: c, label: c === 'all' ? '全部分类' : c }))}
          className="w-36"
        />
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'scheduled', label: '可报名' },
            { value: 'approved', label: '待排课' },
            { value: 'pending', label: '待审核' },
          ]}
          className="w-36"
        />
      </div>

      {filtered.map(c => {
        const regCount = registrations.filter(r => r.courseId === c.id && r.status === 'registered').length;
        const waitCount = registrations.filter(r => r.courseId === c.id && r.status === 'waitlisted').length;
        const myReg = registrations.find(r => r.courseId === c.id && r.residentId === currentUserId && r.status !== 'cancelled');
        const firstVenue = c.sessions[0]?.venueId ? venues.find(v => v.id === c.sessions[0].venueId) : null;
        const isFull = regCount >= c.maxParticipants;
        const isLocked = c.sessions[0]?.locked;
        const canRegister = (c.status === 'scheduled' || c.status === 'ongoing') && c.sessions.every(s => !!s.venueId);

        return (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                  <StatusBadge status={c.status} />
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{c.category}</span>
                  {isFull && !myReg && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">已满员，可候补</span>
                  )}
                  {isLocked && (
                    <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded">已开课</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {regCount}/{c.maxParticipants}人
                    {waitCount > 0 && <span className="text-orange-600">（候补{waitCount}）</span>}
                  </span>
                  <span className="flex items-center gap-1"><Calendar size={14} />共{c.sessions.length}节课</span>
                  {firstVenue && (
                    <span className="flex items-center gap-1"><MapPin size={14} />{firstVenue.name}</span>
                  )}
                  {c.ageMin != null || c.ageMax != null && (
                    <span>年龄：{c.ageMin || '不限'}-{c.ageMax || '不限'}岁</span>
                  )}
                </div>

                {c.equipmentRequired.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.equipmentRequired.map(e => (
                      <span key={e} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {EquipmentLabels[e as EquipmentType]}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {c.sessions.slice(0, 2).map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      <Calendar size={12} />{s.date}
                      <Clock size={12} className="ml-1" />{s.startTime}
                      {i === 0 && c.sessions.length > 2 && <span className="text-gray-400">+{c.sessions.length - 1}节</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {myReg ? (
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={myReg.status} />
                    {myReg.status === 'waitlisted' && myReg.waitlistPosition && (
                      <span className="text-xs text-orange-600">候补第 {myReg.waitlistPosition} 位</span>
                    )}
                    <Link to={`/course/${c.id}`}>
                      <Button variant="secondary" size="sm">查看详情</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    {!isFull && !isLocked && !blacklisted && c.status !== 'pending_approval' && c.status !== 'rejected' && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    <Link to={`/course/${c.id}`}>
                      <Button size="sm">
                        {isLocked ? '课程详情' : isFull ? '立即候补' : '立即报名'}
                        <ChevronRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
