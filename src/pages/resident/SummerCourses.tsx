import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Card, StatusBadge, Button, Alert, Select } from '../../components/ui';
import { Calendar, Users, Clock, MapPin, ChevronRight, Sun, Sparkles, AlertTriangle, CheckCircle, Home } from 'lucide-react';
import { EquipmentLabels, EquipmentType, CourseCohort, CohortStatus } from '../../types';
import { format } from 'date-fns';

const weekDayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const cohortStatusLabels: Record<CohortStatus, string> = {
  upcoming: '即将开始',
  enrolling: '报名中',
  ongoing: '进行中',
  completed: '已结束',
  full: '已满员',
};

const cohortStatusColors: Record<CohortStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-800',
  enrolling: 'bg-green-100 text-green-800',
  ongoing: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
  full: 'bg-orange-100 text-orange-800',
};

export function SummerCourses() {
  const { courses, courseCohorts, registrations, venues, currentUserId, isBlacklisted, getCohortsByCourse } = useAppStore();
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const summerCourses = courses.filter(c => c.isSummerCamp);
  const blacklisted = isBlacklisted(currentUserId);

  const getCourseCohorts = (courseId: string) => {
    return courseCohorts.filter(c => c.courseId === courseId)
      .sort((a, b) => a.cohortNumber - b.cohortNumber);
  };

  const getMyRegistration = (courseId: string, cohortId: string) => {
    return registrations.find(
      r => r.courseId === courseId && r.cohortId === cohortId
        && r.residentId === currentUserId && r.status !== 'cancelled'
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sun className="w-8 h-8" />
          <h1 className="text-2xl font-bold">暑期班专区</h1>
        </div>
        <p className="text-white/90">连续八周滚动开班，家庭套票更优惠，快乐一夏！</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">🎯 滚动开班</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">👨‍👩‍👧 家庭套票</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">📅 灵活改期</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">🔄 候补递补</span>
        </div>
      </div>

      {blacklisted && (
        <Alert type="error">
          <AlertTriangle size={18} className="inline mr-2" />
          <strong>注意：</strong>您已被加入报名黑名单，暂无法报名新课程。如有疑问请联系社区管理员。
        </Alert>
      )}

      <div className="space-y-6">
        {summerCourses.map(course => {
          const cohorts = getCourseCohorts(course.id);
          const firstCohort = cohorts[0];
          const venue = firstCohort?.venueId ? venues.find(v => v.id === firstCohort.venueId) : null;
          const hasEquipmentLimit = course.equipmentLimitSlots != null && course.totalEquipmentStock != null;

          return (
            <Card key={course.id}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                    <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1">
                      <Sparkles size={12} />暑期班
                    </span>
                    {course.isRollingAdmission && (
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">滚动开班</span>
                    )}
                    {hasEquipmentLimit && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        器材限制：{course.equipmentLimitSlots}/{course.totalEquipmentStock}个名额
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{course.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      每期限{course.maxParticipants}人
                    </span>
                    {course.ageMin != null || course.ageMax != null ? (
                      <span>年龄：{course.ageMin || '不限'}-{course.ageMax || '不限'}岁</span>
                    ) : null}
                    {venue && (
                      <span className="flex items-center gap-1"><MapPin size={14} />{venue.name}</span>
                    )}
                    <span>共{cohorts.length}个班期</span>
                  </div>

                  {course.equipmentRequired.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {course.equipmentRequired.map(e => (
                        <span key={e} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {EquipmentLabels[e as EquipmentType]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={14} />滚动班期
                </h4>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {cohorts.map(cohort => {
                    const myReg = getMyRegistration(course.id, cohort.id);
                    const cohortVenue = cohort.venueId ? venues.find(v => v.id === cohort.venueId) : null;
                    const isFull = cohort.enrolledCount >= cohort.maxParticipants;

                    return (
                      <div
                        key={cohort.id}
                        className={`border rounded-lg p-3 transition-all ${
                          myReg ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cohortStatusColors[cohort.status]}`}>
                            {cohortStatusLabels[cohort.status]}
                          </span>
                          {myReg && <StatusBadge status={myReg.status} />}
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">{cohort.name}</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {cohort.startDate} 至 {cohort.endDate}
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
                          {cohortVenue && (
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              {cohortVenue.name}
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          {myReg ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full"
                              onClick={() => navigate(`/course/${course.id}`)}
                            >
                              查看详情
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => navigate(`/summer-course/${course.id}?cohort=${cohort.id}`)}
                              disabled={blacklisted || cohort.status === 'completed'}
                            >
                              {isFull ? '立即候补' : '立即报名'}
                              <ChevronRight size={14} className="ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}

        {summerCourses.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Sun className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无暑期班课程</h3>
              <p className="mt-1 text-sm text-gray-500">敬请期待，暑期班即将上线！</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
