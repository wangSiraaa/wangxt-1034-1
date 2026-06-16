import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Card, Button, Input, TextArea, Select } from '../../components/ui';
import { Users, UserX, Plus, Calendar } from 'lucide-react';

export function BlacklistPage() {
  const { blacklist, users, addToBlacklist } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedResident, setSelectedResident] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const residents = users.filter(u => u.role === 'resident');

  const handleAdd = () => {
    if (!selectedResident || !reason.trim()) return;
    addToBlacklist({
      residentId: selectedResident,
      reason: reason.trim(),
      expiresAt: expiresAt || undefined,
      createdBy: 'a1',
    });
    setSelectedResident('');
    setReason('');
    setExpiresAt('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <Card
        title="黑名单管理"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-1" />添加黑名单
          </Button>
        }
      >
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900">新增黑名单</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="选择居民"
                value={selectedResident}
                onChange={e => setSelectedResident(e.target.value)}
                options={[{ value: '', label: '请选择' }, ...residents.map(r => ({ value: r.id, label: `${r.name} (${r.phone})` }))]}
              />
              <Input
                label="到期时间（可选，留空表示永久）"
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>
            <TextArea label="限制原因" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="请说明加入黑名单的原因" />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
              <Button variant="danger" onClick={handleAdd}>确认加入黑名单</Button>
            </div>
          </div>
        )}

        {blacklist.length === 0 ? (
          <p className="text-center py-8 text-gray-500">暂无黑名单记录</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {blacklist.map(b => {
              const resident = residents.find(r => r.id === b.residentId);
              const now = new Date();
              const expired = b.expiresAt && new Date(b.expiresAt) < now;
              return (
                <div key={b.id} className="py-4 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <UserX size={20} className="text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{resident?.name || '未知用户'}</h4>
                        {expired ? (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">已过期</span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">限制中</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{resident?.phone}</p>
                      <p className="text-sm text-gray-700 mt-2">原因：{b.reason}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={12} />加入时间: {b.createdAt}</span>
                        {b.expiresAt && <span>到期时间: {b.expiresAt}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
