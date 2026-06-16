import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Card, StatusBadge, Button, Alert, Select } from '../components/ui';
import { Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle, UserPlus, Shield, ChevronLeft } from 'lucide-react';
import { EquipmentLabels, EquipmentType } from '../types';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    courses, venues, registrations, users, checkIns, currentUserId, familyMembers,
    registerCourse, cancelRegistration, isBlacklisted,
  } = useAppStore();

  const course = courses.find(c => c.id === id);
  const [registrantType, setRegistrantType] = useState<'self' | 'family'>('self');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  if (!course) {
    return (
      <Card>
        <p className="text-center py-8 text-gray-500">课程不存在</p>
        <div className="text-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>返回</Button>
        </div>
      </Card>
    );
  }

  const leader = users.find(u => u.id === course.clubLeaderId);
  const regCount = registrations.filter(r => r.courseId === course.id && r.status === 'registered').length;
  const waitlist = registrations
    .filter(r => r.courseId === course.id && r.status === 'waitlisted')
    .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));
  const isFull = regCount >= course.maxParticipants;
  const isLocked = course.sessions[0]?.locked;
  const myFm = familyMembers[currentUserId] || [];
  const blacklisted = isBlacklisted(currentUserId);

  const myRegs = registrations.filter(
    r => r.courseId === course.id && r.residentId === currentUserId && r.status !== 'cancelled'
  );

  const handleRegister = () => {
    setResult(null);
    const fmId = registrantType === 'family' ? selectedFamily : undefined;
    const res = registerCourse(course.id, currentUserId, fmId);
    setResult({
      type: res.success ? (res.status === 'waitlisted' ? 'warning' : 'success') : 'error',
      message: res.message,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ChevronLeft size={16} />返回
      </button>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <StatusBadge status={course.status} />
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-sm">{course.category}</span>
            </div>
            <p className="text-sm text-gray-500">负责人：{leader?.name} | 电话：{leader?.phone}</p>
          </div>
        </div>

        <p className="text-gray-700 mb-6">{course.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">已报名 / 上限</p>
            <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
              <Users size={16} className="text-blue-600" />
              {regCount} / {course.maxParticipants}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">最少开班人数</p>
            <p className="text-lg font-semibold text-gray-900">{course.minParticipants} 人</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">课次总数</p>
            <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
              <Calendar size={16} className="text-green-600" />
              {course.sessions.length} 节
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">年龄限制</p>
            <p className="text-lg font-semibold text-gray-900">
              {course.ageMin || '不限'} - {course.ageMax || '不限'}
            </p>
          </div>
        </div>

        {course.equipmentRequired.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Shield size={14} />所需器材
            </p>
            <div className="flex flex-wrap gap-2">
              {course.equipmentRequired.map(e => (
                <span key={e} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
                  {EquipmentLabels[e as EquipmentType]}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
            <Calendar size={14} />课次安排
          </p>
          <div className="space-y-2">
            {course.sessions.map((s, i) => {
              const venue = venues.find(v => v.id === s.venueId);
              return (
                <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                  <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">{i + 1}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-700"><Calendar size={14} />{s.date}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-700"><Clock size={14} />{s.startTime} - {s.endTime}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-700 flex-1">
                    <MapPin size={14} />
                    {venue ? `${venue.name}（${venue.building} ${venue.floor}）` : '场馆待分配'}
                  </span>
                  {s.locked && <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded">已锁定</span>}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {currentUserId && users.find(u => u.id === currentUserId)?.role === 'resident' && (
        <Card title="报名 / 候补">
          {blacklisted && (
            <Alert type="error" className="mb-4">
              <AlertTriangle size={18} className="inline mr-2" />
              <strong>报名受限：</strong>您已被加入报名黑名单，暂无法报名。如有疑问请联系社区管理员。
            </Alert>
          )}

          {isLocked && (
            <Alert type="warning" className="mb-4">
              <AlertTriangle size={18} className="inline mr-2" />
              <strong>课程已开课：</strong>本课程已锁定，无法继续报名或候补。
            </Alert>
          )}

          {(course.status === 'pending_approval' || course.status === 'rejected') && (
            <Alert type="warning" className="mb-4">
              <AlertTriangle size={18} className="inline mr-2" />
              课程尚未审核通过，暂不可报名。
            </Alert>
          )}

          {myRegs.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">我的报名情况：</p>
              {myRegs.map(r => {
                const fm = myFm.find(f => f.id === r.familyMemberId);
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} />
                      <span className="text-sm text-gray-700">
                        {fm ? `代 ${fm.name}（${fm.relation}）` : '本人报名'}
                      </span>
                      {r.status === 'waitlisted' && r.waitlistPosition && (
                        <span className="text-sm text-orange-600">候补第 {r.waitlistPosition} 位</span>
                      )}
                    </div>
                    {!isLocked && r.status !== 'cancelled' && (
                      <Button size="sm" variant="danger" onClick={() => cancelRegistration(r.id)}>取消</Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!blacklisted && !isLocked && course.status !== 'pending_approval' && course.status !== 'rejected' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">报名对象</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setRegistrantType('self')}
                    className={`flex-1 p-3 rounded-md border text-left transition-colors ${
                      registrantType === 'self' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">本人报名</p>
                    <p className="text-xs text-gray-500 mt-0.5">使用当前账号身份</p>
                  </button>
                  <button
                    onClick={() => setRegistrantType('family')}
                    disabled={myFm.length === 0}
                    className={`flex-1 p-3 rounded-md border text-left transition-colors disabled:opacity-50 ${
                      registrantType === 'family' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus size={16} />
                      <p className="font-medium text-sm text-gray-900">代家庭成员报名</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{myFm.length === 0 ? '暂无家庭成员' : `共 ${myFm.length} 位家庭成员`}</p>
                  </button>
                </div>
              </div>

              {registrantType === 'family' && myFm.length > 0 && (
                <Select
                  label="选择家庭成员"
                  value={selectedFamily}
                  onChange={e => setSelectedFamily(e.target.value)}
                  options={[{ value: '', label: '请选择' }, ...myFm.map(f => ({ value: f.id, label: `${f.name}（${f.relation}，${f.age}岁）` }))]}
                />
              )}

              {result && (
                <Alert type={result.type as any}>
                  {result.type === 'success' && <CheckCircle size={16} className="inline mr-2" />}
                  {result.type === 'warning' && <AlertTriangle size={16} className="inline mr-2" />}
                  {result.type === 'error' && <AlertTriangle size={16} className="inline mr-2" />}
                  {result.message}
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {isFull ? (
                    <span className="text-orange-600 flex items-center gap-1">
                      <AlertTriangle size={14} />当前已满员，报名后将进入候补队列
                    </span>
                  ) : (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} />还有 {course.maxParticipants - regCount} 个名额
                    </span>
                  )}
                </p>
                <Button
                  onClick={handleRegister}
                  disabled={registrantType === 'family' && !selectedFamily}
                >
                  {isFull ? '立即候补' : '立即报名'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {waitlist.length > 0 && (
        <Card title={`候补队列（${waitlist.length}人）`}>
          <div className="space-y-2">
            {waitlist.map((w, i) => {
              const user = users.find(u => u.id === w.residentId);
              const fm = familyMembers[w.residentId]?.find(f => f.id === w.familyMemberId);
              return (
                <div key={w.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                  <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {w.waitlistPosition || i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    {fm && <p className="text-xs text-gray-500">代：{fm.name}（{fm.relation}）</p>}
                  </div>
                  <span className="text-xs text-gray-500">候补于 {w.registeredAt}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {registrations.filter(r => r.courseId === course.id && r.status !== 'cancelled').length > 0 && (
        <Card title={`报名学员（${regCount}人）`}>
          <div className="space-y-2">
            {registrations
              .filter(r => r.courseId === course.id && (r.status === 'registered' || r.status === 'promoted'))
              .map(r => {
                const user = users.find(u => u.id === r.residentId);
                const fm = familyMembers[r.residentId]?.find(f => f.id === r.familyMemberId);
                const checkedCount = checkIns.filter(c => c.registrationId === r.id && c.status !== 'absent' && c.status !== 'not_started').length;
                return (
                  <div key={r.id} className="flex items-center gap-4 p-3 bg-green-50 rounded-md border border-green-100">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Users size={18} className="text-green-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <StatusBadge status={r.status} />
                        {fm && <span className="text-xs text-gray-500">（代 {fm.name}）</span>}
                      </div>
                      <p className="text-xs text-gray-500">报名于 {r.registeredAt}</p>
                    </div>
                    <span className="text-xs text-gray-500">已签到 {checkedCount}/{course.sessions.length}</span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}
