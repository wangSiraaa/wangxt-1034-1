import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge } from '../../components/ui';
import { MapPin, Users, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { EquipmentLabels, EquipmentType } from '../../types';

export function Venues() {
  const { venues, courses, checkVenueConflict, getVenueUtilization } = useAppStore();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {venues.map(v => {
        const util = getVenueUtilization(v.id, today);
        const equipStatus = v.equipment.length > 0;
        return (
          <Card key={v.id} title={v.name}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>{v.building} {v.floor}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={14} />
                  <span>容纳人数：{v.capacity} 人</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={14} />
                  <span>清场时间：{v.clearTimeMinutes} 分钟</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  {equipStatus ? <CheckCircle size={14} className="text-green-600" /> : <AlertCircle size={14} className="text-yellow-600" />}
                  场馆设备
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {v.equipment.length === 0 ? (
                    <span className="text-sm text-gray-500">暂无设备</span>
                  ) : (
                    v.equipment.map(e => (
                      <span key={e} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                        {EquipmentLabels[e as EquipmentType]}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  今日使用情况
                </p>
                {util.length === 0 ? (
                  <p className="text-sm text-gray-500">今日暂无安排</p>
                ) : (
                  <div className="space-y-1">
                    {util.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-blue-600 font-mono">{u.start}-{u.end}</span>
                        <span className="truncate">{u.courseName}</span>
                      </div>
                    ))}
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
