import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Card, Input, TextArea, Button, Alert, Select } from '../../components/ui';
import { EquipmentLabels, EquipmentType, SessionSchedule } from '../../types';
import { Plus, Trash2, Calendar, Clock, Users, ShieldCheck } from 'lucide-react';

export function NewCourse() {
  const navigate = useNavigate();
  const { submitCourse, currentUserId } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('瑜伽');
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [minParticipants, setMinParticipants] = useState(5);
  const [ageMin, setAgeMin] = useState<string>('');
  const [ageMax, setAgeMax] = useState<string>('');
  const [equipmentRequired, setEquipmentRequired] = useState<EquipmentType[]>([]);
  const [sessions, setSessions] = useState<SessionSchedule[]>([
    { id: '1', date: '', startTime: '19:00', endTime: '20:30' },
  ]);
  const [error, setError] = useState('');

  const toggleEquipment = (eq: EquipmentType) => {
    setEquipmentRequired(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const addSession = () => {
    const last = sessions[sessions.length - 1];
    const nextDate = last.date ? (() => {
      const d = new Date(last.date);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })() : '';
    setSessions([...sessions, {
      id: Math.random().toString(36).slice(2, 8),
      date: nextDate,
      startTime: last?.startTime || '19:00',
      endTime: last?.endTime || '20:30',
    }]);
  };

  const updateSession = (id: string, field: keyof SessionSchedule, value: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSession = (id: string) => {
    if (sessions.length > 1) setSessions(sessions.filter(s => s.id !== id));
  };

  const handleSubmit = () => {
    setError('');
    if (!name.trim()) return setError('请输入课程名称');
    if (!description.trim()) return setError('请输入课程描述');
    if (sessions.some(s => !s.date)) return setError('请完善所有课次的日期');
    if (sessions.some(s => !s.startTime || !s.endTime)) return setError('请完善所有课次的时间');

    submitCourse({
      name: name.trim(),
      description: description.trim(),
      category,
      clubLeaderId: currentUserId,
      maxParticipants,
      minParticipants,
      equipmentRequired,
      ageMin: ageMin ? parseInt(ageMin) : undefined,
      ageMax: ageMax ? parseInt(ageMax) : undefined,
      sessions,
    });

    navigate('/club/courses');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card title="提交新课程">
        <div className="space-y-6">
          {error && <Alert type="error">{error}</Alert>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="课程名称 *" value={name} onChange={e => setName(e.target.value)} placeholder="例如：成人瑜伽基础班" />
            <Select
              label="课程分类"
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={[
                { value: '瑜伽', label: '瑜伽' },
                { value: '舞蹈', label: '舞蹈' },
                { value: '乒乓球', label: '乒乓球' },
                { value: '羽毛球', label: '羽毛球' },
                { value: '音乐', label: '音乐' },
                { value: '健身', label: '健身' },
                { value: '书法', label: '书法' },
                { value: '其他', label: '其他' },
              ]}
            />
          </div>

          <TextArea label="课程描述 *" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="请详细描述课程内容、适合人群、教学目标等" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <Input label="最少开班人数" type="number" min={1} value={minParticipants} onChange={e => setMinParticipants(parseInt(e.target.value) || 1)} />
              <Input label="最大容纳人数 *" type="number" min={1} value={maxParticipants} onChange={e => setMaxParticipants(parseInt(e.target.value) || 1)} />
            </div>
            <div className="flex gap-3">
              <Input label="最小年龄" type="number" placeholder="不限" value={ageMin} onChange={e => setAgeMin(e.target.value)} />
              <Input label="最大年龄" type="number" placeholder="不限" value={ageMax} onChange={e => setAgeMax(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <ShieldCheck size={16} />所需器材
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(Object.keys(EquipmentLabels) as EquipmentType[]).map(eq => (
                <label
                  key={eq}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors ${
                    equipmentRequired.includes(eq)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input type="checkbox" checked={equipmentRequired.includes(eq)} onChange={() => toggleEquipment(eq)} className="sr-only" />
                  {EquipmentLabels[eq]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar size={16} />连续课次安排
              </label>
              <Button variant="ghost" size="sm" onClick={addSession}>
                <Plus size={16} className="mr-1" />添加课次
              </Button>
            </div>
            <div className="space-y-3">
              {sessions.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">{idx + 1}</span>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      <input
                        type="date"
                        value={s.date}
                        onChange={e => updateSession(s.id, 'date', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      <input
                        type="time"
                        value={s.startTime}
                        onChange={e => updateSession(s.id, 'startTime', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      <input
                        type="time"
                        value={s.endTime}
                        onChange={e => updateSession(s.id, 'endTime', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeSession(s.id)}
                    disabled={sessions.length === 1}
                    className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <Users size={12} className="inline mr-1" />
              可添加多节连续课程，场馆管理员将根据您的时间需求统一排课
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => navigate(-1)}>取消</Button>
            <Button onClick={handleSubmit}>提交审核</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
