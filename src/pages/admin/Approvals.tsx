import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button, Alert, TextArea } from '../../components/ui';
import { Calendar, Users, Clock, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { EquipmentLabels, EquipmentType } from '../../types';

export function Approvals() {
  const { courses, approveCourse, rejectCourse, users } = useAppStore();
  const pending = courses.filter(c => c.status === 'pending_approval' || c.status === 'rejected');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <Card>
          <p className="text-center py-8 text-gray-500">暂无待审核课程</p>
        </Card>
      ) : (
        pending.map(c => {
          const leader = users.find(u => u.id === c.clubLeaderId);
          const isExpanded = expanded === c.id;
          return (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                    <StatusBadge status={c.status} />
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{c.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">负责人：{leader?.name} | 联系方式：{leader?.phone}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Users size={14} />人数 {c.minParticipants}-{c.maxParticipants}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} />共 {c.sessions.length} 节课</span>
                    {(c.ageMin != null || c.ageMax != null) && (
                      <span>年龄: {c.ageMin || '不限'} - {c.ageMax || '不限'} 岁</span>
                    )}
                    {c.equipmentRequired.length > 0 && (
                      <span>器材: {c.equipmentRequired.map(e => EquipmentLabels[e as EquipmentType]).join('、')}</span>
                    )}
                  </div>

                  {c.rejectionReason && (
                    <Alert type="error" className="mt-3">
                      <strong>上次驳回原因：</strong>{c.rejectionReason}
                    </Alert>
                  )}

                  <button
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                    className="flex items-center gap-1 text-sm text-blue-600 mt-3 hover:text-blue-700"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? '收起课次详情' : '查看课次详情'}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-600 mb-2">{c.description}</p>
                      <p className="text-sm font-medium text-gray-700">课次安排：</p>
                      {c.sessions.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md text-sm">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">{i + 1}</span>
                          <span className="flex items-center gap-1 text-gray-700"><Calendar size={14} />{s.date || '待确定'}</span>
                          <span className="flex items-center gap-1 text-gray-700"><Clock size={14} />{s.startTime} - {s.endTime}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {c.status === 'pending_approval' && (
                  <div className="ml-4 flex flex-col gap-2">
                    <Button size="sm" onClick={() => approveCourse(c.id)}>
                      <Check size={14} className="mr-1" />审核通过
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setRejectingId(rejectingId === c.id ? null : c.id)}>
                      <X size={14} className="mr-1" />驳回
                    </Button>
                  </div>
                )}
              </div>

              {rejectingId === c.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-3">
                  <TextArea label="驳回原因" rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="请填写驳回原因" />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setRejectingId(null); setRejectReason(''); }}>取消</Button>
                    <Button variant="danger" size="sm" onClick={() => {
                      if (rejectReason.trim()) {
                        rejectCourse(c.id, rejectReason.trim());
                        setRejectingId(null);
                        setRejectReason('');
                      }
                    }}>确认驳回</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
