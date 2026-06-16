import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { Card, Button, Alert, StatusBadge } from '../../components/ui';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, Users, XCircle, Info, ChevronRight } from 'lucide-react';
import { EquipmentLabels, EquipmentType, ChangeImpact } from '../../types';

export function Scheduling() {
  const {
    courses, venues, registrations, assignVenueToSession,
    rescheduleSession, checkVenueConflict, checkEquipmentMatch, lockCourse,
  } = useAppStore();

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<{ courseId: string; sessionId: string } | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [lastImpact, setLastImpact] = useState<ChangeImpact | null>(null);

  const pendingScheduling = courses.filter(c => c.status === 'approved' || c.status === 'scheduled');
  const currentCourse = courses.find(c => c.id === selectedCourse);

  const handleAssign = (courseId: string, sessionId: string, venueId: string) => {
    const course = courses.find(c => c.id === courseId);
    const session = course?.sessions.find(s => s.id === sessionId);
    if (!course || !session) return;

    const conflict = checkVenueConflict(venueId, session.date, session.startTime, session.endTime, courseId, sessionId);
    if (conflict.hasConflict) return;

    assignVenueToSession(courseId, sessionId, venueId);
  };

  const handleEditSubmit = () => {
    if (!editingSession || !editDate || !editStart || !editEnd) return;
    const impact = rescheduleSession(editingSession.courseId, editingSession.sessionId, editDate, editStart, editEnd);
    setLastImpact(impact);
    setEditingSession(null);
  };

  const openEdit = (courseId: string, sessionId: string) => {
    const course = courses.find(c => c.id === courseId);
    const session = course?.sessions.find(s => s.id === sessionId);
    if (!session) return;
    setEditingSession({ courseId, sessionId });
    setEditDate(session.date);
    setEditStart(session.startTime);
    setEditEnd(session.endTime);
    setLastImpact(null);
  };

  return (
    <div className="space-y-6">
      {lastImpact && (
        <Alert type="warning">
          <div className="flex items-center gap-2">
            <Info size={18} />
            <span>
              <strong>变更影响通知：</strong>
              {lastImpact.details}。
              影响正式报名 <strong>{lastImpact.affectedRegistrations}</strong> 人，
              影响候补人员 <strong>{lastImpact.affectedWaitlist}</strong> 人。
              已自动向相关人员发送通知。
            </span>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card title={`待排课课程（${pendingScheduling.length}）`}>
            <div className="space-y-2">
              {pendingScheduling.map(c => {
                const unscheduled = c.sessions.filter(s => !s.venueId).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCourse(c.id); setEditingSession(null); setLastImpact(null); }}
                    className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition-colors ${
                      selectedCourse === c.id ? 'bg-blue-50 border-blue-500' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.sessions.length} 节课</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unscheduled > 0 ? (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">{unscheduled}未排</span>
                      ) : (
                        <CheckCircle size={16} className="text-green-600" />
                      )}
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                );
              })}
              {pendingScheduling.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">暂无待排课课程</p>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!currentCourse ? (
            <Card>
              <p className="text-center py-12 text-gray-500">请从左侧选择课程进行排课</p>
            </Card>
          ) : (
            <>
              <Card
                title={currentCourse.name}
                actions={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={currentCourse.status} />
                    {currentCourse.status === 'scheduled' && !currentCourse.sessions.some(s => s.locked) && (
                      <Button size="sm" onClick={() => lockCourse(currentCourse.id)}>
                        <AlertTriangle size={14} className="mr-1" />锁定开课
                      </Button>
                    )}
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Users size={14} />人数上限 {currentCourse.maxParticipants}</span>
                    {(currentCourse.ageMin != null || currentCourse.ageMax != null) && (
                      <span>年龄: {currentCourse.ageMin || '不限'} - {currentCourse.ageMax || '不限'} 岁</span>
                    )}
                    {currentCourse.equipmentRequired.length > 0 && (
                      <span>所需器材: {currentCourse.equipmentRequired.map(e => EquipmentLabels[e as EquipmentType]).join('、')}</span>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                      <Calendar size={16} />课次安排与场馆分配
                    </p>
                    <div className="space-y-3">
                      {currentCourse.sessions.map((s, idx) => {
                        const isEditing = editingSession?.sessionId === s.id;
                        const assignedVenue = s.venueId ? venues.find(v => v.id === s.venueId) : null;
                        const regCount = registrations.filter(r => r.courseId === currentCourse.id && r.status === 'registered').length;
                        const waitCount = registrations.filter(r => r.courseId === currentCourse.id && r.status === 'waitlisted').length;

                        return (
                          <div key={s.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className={`p-4 ${assignedVenue ? 'bg-green-50' : 'bg-yellow-50'}`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">{idx + 1}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1 text-sm text-gray-700"><Calendar size={14} />{s.date}</span>
                                    <span className="flex items-center gap-1 text-sm text-gray-700"><Clock size={14} />{s.startTime} - {s.endTime}</span>
                                    {s.locked && <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded">已锁定</span>}
                                  </div>
                                </div>
                                {!s.locked && (
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(currentCourse.id, s.id)}>调整时间</Button>
                                  </div>
                                )}
                              </div>

                              {isEditing && (
                                <div className="mb-4 p-3 bg-white rounded-md border border-gray-200 space-y-3">
                                  <p className="text-sm font-medium text-gray-700">调整课次时间（将影响 {regCount} 名报名者和 {waitCount} 名候补）</p>
                                  <div className="flex gap-3">
                                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                    <input type="time" value={editStart} onChange={e => setEditStart(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                    <input type="time" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setEditingSession(null)}>取消</Button>
                                    <Button size="sm" onClick={handleEditSubmit}>确认调整</Button>
                                  </div>
                                </div>
                              )}

                              {assignedVenue ? (
                                <div className="flex items-center justify-between bg-white rounded-md p-3 border border-green-200">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-600" />
                                    <span className="flex items-center gap-1 text-sm text-gray-700">
                                      <MapPin size={14} className="text-green-600" />
                                      {assignedVenue.name}（{assignedVenue.building} {assignedVenue.floor}）
                                    </span>
                                    <span className="text-xs text-gray-500">清场 {assignedVenue.clearTimeMinutes} 分钟</span>
                                  </div>
                                  {!s.locked && (
                                    <span className="text-xs text-gray-500">已分配</span>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                    <AlertTriangle size={12} className="text-yellow-600" />
                                    请选择场馆（自动检测设备匹配与时间冲突）
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {venues.map(v => {
                                      const eqMatch = checkEquipmentMatch(v.id, currentCourse.equipmentRequired);
                                      const conflict = checkVenueConflict(v.id, s.date, s.startTime, s.endTime, currentCourse.id, s.id);
                                      const capacityOk = v.capacity >= currentCourse.maxParticipants;
                                      const disabled = conflict.hasConflict || !eqMatch.matched || !capacityOk;

                                      return (
                                        <button
                                          key={v.id}
                                          disabled={disabled || s.locked}
                                          onClick={() => handleAssign(currentCourse.id, s.id, v.id)}
                                          className={`p-3 rounded-md border text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                            disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm text-gray-900">{v.name}</span>
                                            <span className="text-xs text-gray-500">{v.capacity}人 {capacityOk ? '✓' : <span className="text-red-500">容量不足</span>}</span>
                                          </div>
                                          <p className="text-xs text-gray-500 mb-2">{v.building} {v.floor} · 清场{v.clearTimeMinutes}分钟</p>
                                          <div className="space-y-1">
                                            {!eqMatch.matched && (
                                              <p className="text-xs text-red-600 flex items-center gap-1">
                                                <XCircle size={12} />缺少器材: {eqMatch.missing.map(m => EquipmentLabels[m as EquipmentType]).join('、')}
                                              </p>
                                            )}
                                            {conflict.hasConflict && (
                                              <p className="text-xs text-red-600 flex items-center gap-1">
                                                <XCircle size={12} />{conflict.reason}
                                              </p>
                                            )}
                                            {eqMatch.matched && !conflict.hasConflict && capacityOk && (
                                              <p className="text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircle size={12} />设备与时间均满足
                                              </p>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
