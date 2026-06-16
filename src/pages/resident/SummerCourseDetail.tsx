import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button, Alert, Select, Input } from '../../components/ui';
import { Calendar, Users, Clock, MapPin, ChevronLeft, Sun, Users2, Ticket, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { EquipmentLabels, EquipmentType, CoursePackage, CourseCohort, FamilyMember } from '../../types';

const weekDayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function SummerCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    courses, courseCohorts, coursePackages, registrations, venues,
    currentUserId, familyMembers, isBlacklisted, getFamilyMembers,
    registerWithCohort, purchasePackage, addNotification
  } = useAppStore();

  const [selectedCohort, setSelectedCohort] = useState<string>(searchParams.get('cohort') || '');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const course = courses.find(c => c.id === courseId);
  const cohorts = courseCohorts.filter(c => c.courseId === courseId)
    .sort((a, b) => a.cohortNumber - b.cohortNumber);
  const packages = coursePackages.filter(p => p.courseId === courseId);
  const myFamilyMembers = getFamilyMembers(currentUserId);
  const blacklisted = isBlacklisted(currentUserId);

  useEffect(() => {
    if (!selectedCohort && cohorts.length > 0) {
      setSelectedCohort(cohorts[0].id);
    }
  }, [cohorts, selectedCohort]);

  useEffect(() => {
    if (!selectedPackage && packages.length > 0) {
      setSelectedPackage(packages[0].id);
    }
  }, [packages, selectedPackage]);

  const selectedPkg = packages.find(p => p.id === selectedPackage);
  const selectedCohortData = cohorts.find(c => c.id === selectedCohort);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleRegister = () => {
    if (!selectedCohort) {
      setMessage({ type: 'error', text: '请选择班期' });
      return;
    }

    if (selectedPkg?.isFamilyPackage && selectedMembers.length === 0) {
      setMessage({ type: 'error', text: '家庭套票请至少选择一位家庭成员' });
      return;
    }

    if (selectedPkg?.isFamilyPackage && selectedPkg.maxFamilyMembers && selectedMembers.length > selectedPkg.maxFamilyMembers) {
      setMessage({ type: 'error', text: `家庭套票最多支持${selectedPkg.maxFamilyMembers}人` });
      return;
    }

    const memberIds = selectedPkg?.isFamilyPackage ? selectedMembers : [myFamilyMembers[0]?.id].filter(Boolean);

    if (selectedPkg && selectedPkg.sessionCount > 1) {
      const result = purchasePackage(courseId!, selectedPackage, currentUserId, memberIds);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => navigate('/my-registrations'), 1500);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } else {
      const memberId = memberIds[0] || undefined;
      const result = registerWithCohort(courseId!, selectedCohort, currentUserId, memberId, selectedPackage || undefined);
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.status === 'waitlisted' ? `报名成功，当前候补第${result.waitlistPosition}位` : '报名成功！'
        });
        setTimeout(() => navigate('/my-registrations'), 1500);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    }
  };

  const myReg = registrations.find(
    r => r.courseId === courseId && r.cohortId === selectedCohort
      && r.residentId === currentUserId && r.status !== 'cancelled'
  );

  if (!course) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">课程不存在</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft size={16} /> 返回
      </button>

      <Card>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{course.name}</h1>
              <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1">
                <Sun size={12} />暑期班
              </span>
              {course.isRollingAdmission && (
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">滚动开班</span>
              )}
            </div>
            <p className="text-gray-600">{course.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Users className="mx-auto text-blue-500 mb-1" size={20} />
            <div className="text-lg font-semibold">{course.maxParticipants}</div>
            <div className="text-xs text-gray-500">每班人数</div>
          </div>
          <div className="text-center">
            <Calendar className="mx-auto text-green-500 mb-1" size={20} />
            <div className="text-lg font-semibold">{cohorts.length}</div>
            <div className="text-xs text-gray-500">滚动班期</div>
          </div>
          <div className="text-center">
            <Clock className="mx-auto text-purple-500 mb-1" size={20} />
            <div className="text-lg font-semibold">8周</div>
            <div className="text-xs text-gray-500">完整课程</div>
          </div>
          <div className="text-center">
            <Users2 className="mx-auto text-orange-500 mb-1" size={20} />
            <div className="text-lg font-semibold">
              {course.ageMin || '不限'}-{course.ageMax || '不限'}
            </div>
            <div className="text-xs text-gray-500">适用年龄</div>
          </div>
        </div>

        {course.equipmentRequired.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">所需器材</div>
            <div className="flex flex-wrap gap-2">
              {course.equipmentRequired.map(e => (
                <span key={e} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded">
                  {EquipmentLabels[e as EquipmentType]}
                </span>
              ))}
            </div>
          </div>
        )}

        {course.equipmentLimitSlots != null && course.totalEquipmentStock != null && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <Info size={16} />
              <span>
                器材限制说明：由于器材库存有限，本期仅开放 <strong>{course.equipmentLimitSlots}</strong> 个器材保障名额（总库存 {course.totalEquipmentStock} 个），超出名额的学员需自备器材或候补。
              </span>
            </div>
          </div>
        )}
      </Card>

      {blacklisted && (
        <Alert type="error">
          <AlertTriangle size={18} className="inline mr-2" />
          <strong>注意：</strong>您已被加入报名黑名单，暂无法报名。如有疑问请联系社区管理员。
        </Alert>
      )}

      {myReg && (
        <Alert type="success">
          <CheckCircle size={18} className="inline mr-2" />
          您已报名本班期，状态：<strong>{myReg.status === 'waitlisted' ? `候补第${myReg.waitlistPosition}位` : '已报名'}</strong>
        </Alert>
      )}

      {message && (
        <Alert type={message.type}>
          {message.type === 'error' && <AlertTriangle size={18} className="inline mr-2" />}
          {message.type === 'success' && <CheckCircle size={18} className="inline mr-2" />}
          {message.text}
        </Alert>
      )}

      {!myReg && !blacklisted && (
        <>
          <Card title="选择班期">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {cohorts.map(cohort => {
                const venue = cohort.venueId ? venues.find(v => v.id === cohort.venueId) : null;
                const isFull = cohort.enrolledCount >= cohort.maxParticipants;
                const isSelected = selectedCohort === cohort.id;

                return (
                  <div
                    key={cohort.id}
                    onClick={() => cohort.status !== 'completed' && setSelectedCohort(cohort.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : cohort.status === 'completed'
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-gray-900">{cohort.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        cohort.status === 'enrolling' ? 'bg-green-100 text-green-800' :
                        cohort.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        cohort.status === 'full' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cohort.status === 'enrolling' ? '报名中' :
                         cohort.status === 'upcoming' ? '即将开始' :
                         cohort.status === 'full' ? '已满员' : '已结束'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {cohort.startDate} ~ {cohort.endDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {weekDayLabels[cohort.weekDay]} {cohort.startTime}-{cohort.endTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        {cohort.enrolledCount}/{cohort.maxParticipants}人
                        {cohort.waitlistCount > 0 && <span className="text-orange-600">（候{cohort.waitlistCount}）</span>}
                      </div>
                      {venue && (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          {venue.name}
                        </div>
                      )}
                    </div>
                    {isFull && cohort.status !== 'completed' && (
                      <div className="mt-2 text-xs text-orange-600 text-center">
                        已满员，可候补
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {packages.length > 0 && (
            <Card title="选择套餐">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {packages.map(pkg => {
                  const isSelected = selectedPackage === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Ticket className={isSelected ? 'text-blue-500' : 'text-gray-400'} size={18} />
                        <span className="font-medium text-gray-900">{pkg.name}</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-500 mb-2">¥{pkg.price}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>共 {pkg.sessionCount} 次课</div>
                        {pkg.validDays && <div>{pkg.validDays}天有效</div>}
                        {pkg.isFamilyPackage && (
                          <div className="text-green-600">
                            👨‍👩‍👧 家庭套票（最多{pkg.maxFamilyMembers}人）
                          </div>
                        )}
                        {pkg.description && <div className="text-xs text-gray-500 pt-1">{pkg.description}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {selectedPkg?.isFamilyPackage && (
            <Card title="选择家庭成员">
              <p className="text-sm text-gray-600 mb-4">
                家庭套票可在家庭成员间共享，选择使用套票的成员：
              </p>
              <div className="flex flex-wrap gap-3">
                {myFamilyMembers.map(member => {
                  const isSelected = selectedMembers.includes(member.id);
                  const ageOk = (course.ageMin == null || member.age >= course.ageMin)
                    && (course.ageMax == null || member.age <= course.ageMax);

                  return (
                    <div
                      key={member.id}
                      onClick={() => ageOk && handleMemberToggle(member.id)}
                      className={`px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : ageOk
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.relation} · {member.age}岁</div>
                      {!ageOk && <div className="text-xs text-red-500 mt-1">年龄不符合</div>}
                    </div>
                  );
                })}
              </div>
              {selectedMembers.length > 0 && (
                <div className="mt-4 text-sm text-blue-600">
                  已选择 {selectedMembers.length} 位家庭成员
                </div>
              )}
            </Card>
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={handleRegister}>
              {selectedPkg?.isFamilyPackage ? '购买家庭套票' :
               selectedPkg && selectedPkg.sessionCount > 1 ? '购买课次包' :
               selectedCohortData?.enrolledCount && selectedCohortData.enrolledCount >= (selectedCohortData?.maxParticipants || 0)
                 ? '立即候补' : '立即报名'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
