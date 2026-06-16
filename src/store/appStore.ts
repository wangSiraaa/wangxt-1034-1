import { create } from 'zustand';
import type {
  User, FamilyMember, Venue, Course, Registration,
  CheckInRecord, BlacklistEntry, Notification, CourseStatus,
  RegistrationStatus, SessionSchedule, ConflictInfo, ChangeImpact,
  CoursePackage, RegistrationPackage, CourseCohort, CohortStatus,
  WaitlistBlockReason, PackageType
} from '../types';
import {
  mockUsers, mockFamilyMembers, mockVenues, mockCourses,
  mockRegistrations, mockCheckIns, mockBlacklist, mockNotifications,
  mockCoursePackages, mockCourseCohorts
} from '../data/mockData';

interface AppState {
  currentUserId: string;
  users: User[];
  familyMembers: Record<string, FamilyMember[]>;
  venues: Venue[];
  courses: Course[];
  registrations: Registration[];
  checkIns: CheckInRecord[];
  blacklist: BlacklistEntry[];
  notifications: Notification[];
  coursePackages: CoursePackage[];
  registrationPackages: RegistrationPackage[];
  courseCohorts: CourseCohort[];

  setCurrentUser: (id: string) => void;
  getCurrentUser: () => User | undefined;
  getFamilyMembers: (residentId: string) => FamilyMember[];

  submitCourse: (course: Omit<Course, 'id' | 'status' | 'createdAt'>) => void;
  approveCourse: (courseId: string) => void;
  rejectCourse: (courseId: string, reason: string) => void;
  assignVenueToSession: (courseId: string, sessionId: string, venueId: string) => void;
  rescheduleSession: (courseId: string, sessionId: string, date: string, startTime: string, endTime: string) => ChangeImpact;
  lockCourse: (courseId: string) => void;

  registerCourse: (courseId: string, residentId: string, familyMemberId?: string) =>
    { success: boolean; message: string; status?: RegistrationStatus; waitlistPosition?: number };
  cancelRegistration: (registrationId: string) => void;
  promoteFromWaitlist: (courseId: string) => Registration[];

  checkIn: (registrationId: string, sessionId: string, courseId: string, residentId: string) => void;

  isBlacklisted: (residentId: string) => boolean;
  addToBlacklist: (entry: Omit<BlacklistEntry, 'id' | 'createdAt'>) => void;

  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;

  checkVenueConflict: (venueId: string, date: string, startTime: string, endTime: string, excludeCourseId?: string, excludeSessionId?: string) => ConflictInfo;
  checkEquipmentMatch: (venueId: string, required: string[]) => { matched: boolean; missing: string[] };
  getVenueUtilization: (venueId: string, date: string) => Array<{ start: string; end: string; courseName: string }>;

  createCohort: (courseId: string, data: Omit<CourseCohort, 'id' | 'courseId' | 'enrolledCount' | 'waitlistCount' | 'status'>) => CourseCohort;
  getCohortsByCourse: (courseId: string) => CourseCohort[];
  updateCohort: (cohortId: string, data: Partial<CourseCohort>) => void;

  getCoursePackages: (courseId: string) => CoursePackage[];
  createCoursePackage: (pkg: Omit<CoursePackage, 'id'>) => CoursePackage;

  purchasePackage: (courseId: string, packageId: string, residentId: string, familyMemberIds: string[]) =>
    { success: boolean; message: string; registrationPackage?: RegistrationPackage };
  getRegistrationPackages: (residentId: string) => RegistrationPackage[];
  getRegistrationPackageById: (pkgId: string) => RegistrationPackage | undefined;

  rescheduleSingleSession: (courseId: string, sessionId: string, newDate: string, newStartTime: string, newEndTime: string, reason: string) => ChangeImpact;
  cancelSingleSession: (courseId: string, sessionId: string, reason: string) => { affected: number; refundSessions: number };

  registerWithCohort: (courseId: string, cohortId: string, residentId: string, familyMemberId?: string, packageId?: string) =>
    { success: boolean; message: string; status?: RegistrationStatus; waitlistPosition?: number };

  getWaitlistWithBlockReasons: (courseId: string) => Array<{ registration: Registration; blockReason: WaitlistBlockReason; blockDetail: string; canAutoPromote: boolean }>;
  promoteFromWaitlistWithCheck: (courseId: string, count?: number) => { promoted: Registration[]; blocked: Array<{ registration: Registration; reason: string }> };
  manuallyPromoteWaitlist: (registrationId: string) => { success: boolean; message: string };

  getEquipmentLimitedCourses: () => Array<{ course: Course; availableSlots: number; equipmentLimit: number; totalStock: number }>;
  setEquipmentLimit: (courseId: string, limitSlots: number, totalStock: number) => void;

  checkWaitlistPromotable: (registration: Registration) => { canPromote: boolean; blockReason: WaitlistBlockReason; blockDetail: string };
}

const genId = () => Math.random().toString(36).slice(2, 11);

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUserId: 'r1',
  users: mockUsers,
  familyMembers: mockFamilyMembers,
  venues: mockVenues,
  courses: mockCourses,
  registrations: mockRegistrations,
  checkIns: mockCheckIns,
  blacklist: mockBlacklist,
  notifications: mockNotifications,
  coursePackages: mockCoursePackages,
  registrationPackages: [],
  courseCohorts: mockCourseCohorts,

  setCurrentUser: (id) => set({ currentUserId: id }),
  getCurrentUser: () => get().users.find(u => u.id === get().currentUserId),
  getFamilyMembers: (residentId) => get().familyMembers[residentId] || [],

  submitCourse: (courseData) => {
    const newCourse: Course = {
      ...courseData,
      id: genId(),
      status: 'pending_approval',
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((s) => ({ courses: [...s.courses, newCourse] }));
    get().addNotification({
      userId: newCourse.clubLeaderId,
      type: 'course_approved',
      title: '课程已提交审核',
      content: `「${newCourse.name}」已提交，等待场馆管理员审核。`,
      relatedCourseId: newCourse.id,
    });
  },

  approveCourse: (courseId) => {
    set((s) => ({
      courses: s.courses.map(c => c.id === courseId ? { ...c, status: 'approved' as CourseStatus } : c)
    }));
    const course = get().courses.find(c => c.id === courseId);
    if (course) {
      get().addNotification({
        userId: course.clubLeaderId,
        type: 'course_approved',
        title: '课程审核通过',
        content: `「${course.name}」已通过审核，请等待场馆排课。`,
        relatedCourseId: course.id,
      });
    }
  },

  rejectCourse: (courseId, reason) => {
    set((s) => ({
      courses: s.courses.map(c => c.id === courseId ? { ...c, status: 'rejected' as CourseStatus, rejectionReason: reason } : c)
    }));
    const course = get().courses.find(c => c.id === courseId);
    if (course) {
      get().addNotification({
        userId: course.clubLeaderId,
        type: 'course_rejected',
        title: '课程审核未通过',
        content: `「${course.name}」未通过审核，原因：${reason}`,
        relatedCourseId: course.id,
      });
    }
  },

  assignVenueToSession: (courseId, sessionId, venueId) => {
    set((s) => ({
      courses: s.courses.map(c => {
        if (c.id !== courseId) return c;
        const allAssigned = c.sessions.every(sess => sess.id === sessionId ? true : !!sess.venueId);
        return {
          ...c,
          status: allAssigned ? 'scheduled' as CourseStatus : c.status,
          sessions: c.sessions.map(sess =>
            sess.id === sessionId ? { ...sess, venueId } : sess
          ),
        };
      })
    }));
    const course = get().courses.find(c => c.id === courseId);
    if (course) {
      get().addNotification({
        userId: course.clubLeaderId,
        type: 'venue_assigned',
        title: '场馆已分配',
        content: `「${course.name}」的场馆已完成分配，请前往查看。`,
        relatedCourseId: course.id,
      });
      get().registrations.filter(r => r.courseId === courseId && r.status === 'registered').forEach(r => {
        get().addNotification({
          userId: r.residentId,
          type: 'venue_assigned',
          title: '课程场地已确定',
          content: `您报名的「${course.name}」场地已分配，可查看详情。`,
          relatedCourseId: course.id,
          relatedRegistrationId: r.id,
        });
      });
    }
  },

  rescheduleSession: (courseId, sessionId, date, startTime, endTime) => {
    const course = get().courses.find(c => c.id === courseId);
    const session = course?.sessions.find(s => s.id === sessionId);
    const oldDate = session?.date;
    const oldStart = session?.startTime;

    set((s) => ({
      courses: s.courses.map(c =>
        c.id !== courseId ? c : {
          ...c,
          sessions: c.sessions.map(sess =>
            sess.id === sessionId ? { ...sess, date, startTime, endTime } : sess
          ),
        }
      )
    }));

    const regs = get().registrations.filter(r => r.courseId === courseId);
    const impact: ChangeImpact = {
      type: oldDate === date ? 'time_change' : 'reschedule',
      affectedRegistrations: regs.filter(r => r.status === 'registered').length,
      affectedWaitlist: regs.filter(r => r.status === 'waitlisted').length,
      details: `课程时间从 ${oldDate} ${oldStart} 调整为 ${date} ${startTime}`,
    };

    if (course) {
      regs.forEach(r => {
        get().addNotification({
          userId: r.residentId,
          type: 'course_rescheduled',
          title: '课程时间调整通知',
          content: `「${course.name}」的上课时间有调整：${impact.details}`,
          relatedCourseId: course.id,
          relatedRegistrationId: r.id,
        });
      });
    }

    return impact;
  },

  lockCourse: (courseId) => {
    set((s) => ({
      courses: s.courses.map(c =>
        c.id !== courseId ? c : {
          ...c,
          status: 'ongoing' as CourseStatus,
          sessions: c.sessions.map(sess => ({ ...sess, locked: true })),
        }
      )
    }));
  },

  registerCourse: (courseId, residentId, familyMemberId) => {
    const course = get().courses.find(c => c.id === courseId);
    if (!course) return { success: false, message: '课程不存在' };

    if (course.status === 'cancelled') return { success: false, message: '课程已取消' };
    if (course.status === 'completed') return { success: false, message: '课程已结束' };
    if (course.status === 'pending_approval' || course.status === 'rejected') {
      return { success: false, message: '课程尚未审核通过，暂不可报名' };
    }

    if (get().isBlacklisted(residentId)) {
      return { success: false, message: '您已被加入报名黑名单，暂无法报名。如有疑问请联系管理员。' };
    }

    const firstSession = course.sessions[0];
    if (firstSession && firstSession.locked) {
      return { success: false, message: '课程已开课，无法报名' };
    }

    const existing = get().registrations.find(
      r => r.courseId === courseId && r.residentId === residentId
        && r.familyMemberId === familyMemberId && r.status !== 'cancelled'
    );
    if (existing) {
      return { success: false, message: '您已报名过此课程' };
    }

    if (familyMemberId) {
      const fm = get().familyMembers[residentId]?.find(f => f.id === familyMemberId);
      if (fm) {
        if (course.ageMin != null && fm.age < course.ageMin) {
          return { success: false, message: `${fm.name}年龄${fm.age}岁，低于课程最小年龄${course.ageMin}岁限制` };
        }
        if (course.ageMax != null && fm.age > course.ageMax) {
          return { success: false, message: `${fm.name}年龄${fm.age}岁，超过课程最大年龄${course.ageMax}岁限制` };
        }
      }
    }

    const registeredCount = get().registrations.filter(
      r => r.courseId === courseId && r.status === 'registered'
    ).length;

    let status: RegistrationStatus = 'registered';
    let waitlistPosition: number | undefined;

    if (registeredCount >= course.maxParticipants) {
      status = 'waitlisted';
      const waitlistCount = get().registrations.filter(
        r => r.courseId === courseId && r.status === 'waitlisted'
      ).length;
      waitlistPosition = waitlistCount + 1;
    }

    const newReg: Registration = {
      id: genId(),
      courseId,
      residentId,
      familyMemberId,
      status,
      waitlistPosition,
      registeredAt: new Date().toISOString().split('T')[0],
    };

    set((s) => ({ registrations: [...s.registrations, newReg] }));

    return {
      success: true,
      message: status === 'registered' ? '报名成功！' : `报名成功，当前候补第${waitlistPosition}位`,
      status,
      waitlistPosition,
    };
  },

  cancelRegistration: (registrationId) => {
    const reg = get().registrations.find(r => r.id === registrationId);
    if (!reg) return;

    set((s) => ({
      registrations: s.registrations.map(r =>
        r.id === registrationId ? { ...r, status: 'cancelled' as RegistrationStatus, cancelledAt: new Date().toISOString().split('T')[0] } : r
      )
    }));

    if (reg.status === 'registered') {
      const promoted = get().promoteFromWaitlist(reg.courseId);
      promoted.forEach(p => {
        const course = get().courses.find(c => c.id === reg.courseId);
        if (course) {
          get().addNotification({
            userId: p.residentId,
            type: 'promoted_from_waitlist',
            title: '候补转正通知',
            content: `恭喜！您已从「${course.name}」候补中转为正式学员。`,
            relatedCourseId: course.id,
            relatedRegistrationId: p.id,
          });
        }
      });
    } else if (reg.status === 'waitlisted') {
      set((s) => ({
        registrations: s.registrations.map(r => {
          if (r.courseId !== reg.courseId || r.status !== 'waitlisted') return r;
          if (!r.waitlistPosition || !reg.waitlistPosition) return r;
          if (r.waitlistPosition > reg.waitlistPosition) {
            return { ...r, waitlistPosition: r.waitlistPosition - 1 };
          }
          return r;
        })
      }));
    }
  },

  promoteFromWaitlist: (courseId) => {
    const registeredCount = get().registrations.filter(
      r => r.courseId === courseId && r.status === 'registered'
    ).length;
    const course = get().courses.find(c => c.id === courseId);
    if (!course) return [];

    const available = course.maxParticipants - registeredCount;
    if (available <= 0) return [];

    const waitlisted = get().registrations
      .filter(r => r.courseId === courseId && r.status === 'waitlisted')
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0))
      .slice(0, available);

    const promotedIds = waitlisted.map(w => w.id);

    set((s) => ({
      registrations: s.registrations.map(r => {
        if (promotedIds.includes(r.id)) {
          return { ...r, status: 'promoted' as RegistrationStatus, promotedAt: new Date().toISOString().split('T')[0], waitlistPosition: undefined };
        }
        if (r.courseId === courseId && r.status === 'waitlisted' && r.waitlistPosition) {
          const idx = waitlisted.findIndex(w => w.id === r.id);
          if (idx >= 0) return r;
          const newPos = r.waitlistPosition - available;
          return { ...r, waitlistPosition: newPos > 0 ? newPos : undefined };
        }
        return r;
      })
    }));

    return waitlisted;
  },

  checkIn: (registrationId, sessionId, courseId, residentId) => {
    const session = get().courses.find(c => c.id === courseId)?.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const now = new Date();
    const [h, m] = session.startTime.split(':').map(Number);
    const sessionStart = new Date(now);
    sessionStart.setHours(h, m, 0, 0);

    const diffMs = now.getTime() - sessionStart.getTime();
    const lateMinutes = Math.floor(diffMs / 60000);

    let status: 'checked_in' | 'late' = 'checked_in';
    if (lateMinutes > 10) status = 'late';

    const existing = get().checkIns.find(
      c => c.registrationId === registrationId && c.sessionId === sessionId
    );

    if (existing) {
      set((s) => ({
        checkIns: s.checkIns.map(c =>
          c.id === existing.id ? { ...c, status, checkedInAt: now.toISOString(), lateMinutes: status === 'late' ? lateMinutes : undefined } : c
        )
      }));
    } else {
      set((s) => ({
        checkIns: [...s.checkIns, {
          id: genId(),
          courseId,
          sessionId,
          registrationId,
          residentId,
          status,
          checkedInAt: now.toISOString(),
          lateMinutes: status === 'late' ? lateMinutes : undefined,
        }]
      }));
    }
  },

  isBlacklisted: (residentId) => {
    const now = new Date();
    return get().blacklist.some(b => {
      if (b.residentId !== residentId) return false;
      if (b.expiresAt && new Date(b.expiresAt) < now) return false;
      return true;
    });
  },

  addToBlacklist: (entry) => {
    set((s) => ({
      blacklist: [...s.blacklist, { ...entry, id: genId(), createdAt: new Date().toISOString().split('T')[0] }]
    }));
  },

  addNotification: (notif) => {
    set((s) => ({
      notifications: [{ ...notif, id: genId(), read: false, createdAt: new Date().toISOString() }, ...s.notifications]
    }));
  },

  markNotificationRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  checkVenueConflict: (venueId, date, startTime, endTime, excludeCourseId, excludeSessionId) => {
    const venue = get().venues.find(v => v.id === venueId);
    if (!venue) return { hasConflict: true, reason: '场馆不存在' };

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const clearMin = venue.clearTimeMinutes;

    for (const course of get().courses) {
      if (excludeCourseId && course.id === excludeCourseId) continue;
      for (const sess of course.sessions) {
        if (excludeSessionId && sess.id === excludeSessionId) continue;
        if (sess.venueId !== venueId || sess.date !== date) continue;
        if (course.status === 'cancelled' || course.status === 'rejected') continue;

        const sMin = timeToMinutes(sess.startTime) - clearMin;
        const eMin = timeToMinutes(sess.endTime) + clearMin;

        if (startMin < eMin && endMin > sMin) {
          return {
            hasConflict: true,
            reason: `与「${course.name}」时间冲突（含${clearMin}分钟清场时间：${sess.startTime}-${sess.endTime}）`,
            conflictingCourseId: course.id,
            conflictingCourseName: course.name,
          };
        }
      }
    }
    return { hasConflict: false };
  },

  checkEquipmentMatch: (venueId, required) => {
    const venue = get().venues.find(v => v.id === venueId);
    if (!venue) return { matched: false, missing: required };
    const missing = required.filter(e => !venue.equipment.includes(e as any));
    return { matched: missing.length === 0, missing };
  },

  getVenueUtilization: (venueId, date) => {
    const result: Array<{ start: string; end: string; courseName: string }> = [];
    for (const course of get().courses) {
      for (const sess of course.sessions) {
        if (sess.venueId === venueId && sess.date === date && course.status !== 'cancelled' && course.status !== 'rejected') {
          result.push({ start: sess.startTime, end: sess.endTime, courseName: course.name });
        }
      }
    }
    return result.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  },

  createCohort: (courseId, data) => {
    const newCohort: CourseCohort = {
      ...data,
      id: genId(),
      courseId,
      enrolledCount: 0,
      waitlistCount: 0,
      status: 'upcoming' as CohortStatus,
    };
    set((s) => ({ courseCohorts: [...s.courseCohorts, newCohort] }));
    return newCohort;
  },

  getCohortsByCourse: (courseId) => {
    return get().courseCohorts.filter(c => c.courseId === courseId)
      .sort((a, b) => a.cohortNumber - b.cohortNumber);
  },

  updateCohort: (cohortId, data) => {
    set((s) => ({
      courseCohorts: s.courseCohorts.map(c =>
        c.id === cohortId ? { ...c, ...data } : c
      ),
    }));
  },

  getCoursePackages: (courseId) => {
    return get().coursePackages.filter(p => p.courseId === courseId);
  },

  createCoursePackage: (pkg) => {
    const newPkg: CoursePackage = {
      ...pkg,
      id: genId(),
    };
    set((s) => ({ coursePackages: [...s.coursePackages, newPkg] }));
    return newPkg;
  },

  purchasePackage: (courseId, packageId, residentId, familyMemberIds) => {
    const course = get().courses.find(c => c.id === courseId);
    const pkg = get().coursePackages.find(p => p.id === packageId);
    if (!course || !pkg) return { success: false, message: '课程或套餐不存在' };

    if (pkg.isFamilyPackage && pkg.maxFamilyMembers && familyMemberIds.length > pkg.maxFamilyMembers) {
      return { success: false, message: `家庭套票最多支持${pkg.maxFamilyMembers}人` };
    }

    const regResult = get().registerCourse(courseId, residentId, familyMemberIds[0]);
    if (!regResult.success) {
      return { success: false, message: regResult.message };
    }

    const reg = get().registrations.find(
      r => r.courseId === courseId && r.residentId === residentId && r.status === regResult.status
    );

    if (reg) {
      const regPackage: RegistrationPackage = {
        id: genId(),
        registrationId: reg.id,
        packageId,
        courseId,
        residentId,
        totalSessions: pkg.sessionCount,
        usedSessions: 0,
        remainingSessions: pkg.sessionCount,
        familyMemberIds,
        purchasedAt: new Date().toISOString().split('T')[0],
        expiresAt: pkg.validDays
          ? new Date(Date.now() + pkg.validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : undefined,
      };
      set((s) => ({ registrationPackages: [...s.registrationPackages, regPackage] }));
      return { success: true, message: '套票购买成功', registrationPackage: regPackage };
    }

    return { success: false, message: '报名失败' };
  },

  getRegistrationPackages: (residentId) => {
    return get().registrationPackages.filter(p => p.residentId === residentId);
  },

  getRegistrationPackageById: (pkgId) => {
    return get().registrationPackages.find(p => p.id === pkgId);
  },

  rescheduleSingleSession: (courseId, sessionId, newDate, newStartTime, newEndTime, reason) => {
    const course = get().courses.find(c => c.id === courseId);
    const session = course?.sessions.find(s => s.id === sessionId);
    if (!course || !session) {
      return { type: 'reschedule', affectedRegistrations: 0, affectedWaitlist: 0, details: '课次不存在' };
    }

    const oldDate = session.date;
    const oldStart = session.startTime;

    set((s) => ({
      courses: s.courses.map(c =>
        c.id !== courseId ? c : {
          ...c,
          sessions: c.sessions.map(sess =>
            sess.id === sessionId
              ? {
                  ...sess,
                  originalDate: sess.originalDate || sess.date,
                  originalStartTime: sess.originalStartTime || sess.startTime,
                  originalEndTime: sess.originalEndTime || sess.endTime,
                  date: newDate,
                  startTime: newStartTime,
                  endTime: newEndTime,
                  rescheduled: true,
                  rescheduleReason: reason,
                }
              : sess
          ),
        }
      ),
    }));

    const regs = get().registrations.filter(r => r.courseId === courseId);
    const impact: ChangeImpact = {
      type: oldDate === newDate ? 'time_change' : 'reschedule',
      affectedRegistrations: regs.filter(r => r.status === 'registered').length,
      affectedWaitlist: regs.filter(r => r.status === 'waitlisted').length,
      details: `第${course.sessions.findIndex(s => s.id === sessionId) + 1}次课时间从 ${oldDate} ${oldStart} 调整为 ${newDate} ${newStartTime}，原因：${reason}`,
    };

    if (course) {
      regs.forEach(r => {
        get().addNotification({
          userId: r.residentId,
          type: 'course_rescheduled',
          title: '单次课时间调整通知',
          content: `「${course.name}」的单次课时间有调整：${impact.details}，剩余课次保留。`,
          relatedCourseId: course.id,
          relatedRegistrationId: r.id,
        });
      });
    }

    return impact;
  },

  cancelSingleSession: (courseId, sessionId, reason) => {
    const course = get().courses.find(c => c.id === courseId);
    if (!course) return { affected: 0, refundSessions: 0 };

    set((s) => ({
      courses: s.courses.map(c =>
        c.id !== courseId ? c : {
          ...c,
          sessions: c.sessions.map(sess =>
            sess.id === sessionId ? { ...sess, cancelled: true, cancelReason: reason } : sess
          ),
        }
      ),
    }));

    const regs = get().registrations.filter(r => r.courseId === courseId && r.status === 'registered');

    set((s) => ({
      registrationPackages: s.registrationPackages.map(p => {
        if (p.courseId !== courseId) return p;
        return {
          ...p,
          totalSessions: p.totalSessions - 1,
          remainingSessions: p.remainingSessions,
        };
      }),
    }));

    regs.forEach(r => {
      get().addNotification({
        userId: r.residentId,
        type: 'course_cancelled',
        title: '单次课取消通知',
        content: `「${course.name}」的某次课已取消（原因：${reason}），剩余课次保留，课次包已自动返还1次。`,
        relatedCourseId: course.id,
        relatedRegistrationId: r.id,
      });
    });

    return { affected: regs.length, refundSessions: 1 };
  },

  registerWithCohort: (courseId, cohortId, residentId, familyMemberId, packageId) => {
    const cohort = get().courseCohorts.find(c => c.id === cohortId);
    if (!cohort) return { success: false, message: '班期不存在' };

    const result = get().registerCourse(courseId, residentId, familyMemberId);
    if (!result.success) return result;

    const reg = get().registrations.find(
      r => r.courseId === courseId && r.residentId === residentId
        && r.familyMemberId === familyMemberId && r.status === result.status
    );

    if (reg) {
      set((s) => ({
        registrations: s.registrations.map(r =>
          r.id === reg.id ? { ...r, cohortId, packageId } : r
        ),
        courseCohorts: s.courseCohorts.map(c => {
          if (c.id !== cohortId) return c;
          if (result.status === 'registered') {
            return { ...c, enrolledCount: c.enrolledCount + 1 };
          } else if (result.status === 'waitlisted') {
            return { ...c, waitlistCount: c.waitlistCount + 1 };
          }
          return c;
        }),
      }));
    }

    return result;
  },

  checkWaitlistPromotable: (registration) => {
    const course = get().courses.find(c => c.id === registration.courseId);
    if (!course) return { canPromote: false, blockReason: 'manual_review' as WaitlistBlockReason, blockDetail: '课程不存在' };

    if (get().isBlacklisted(registration.residentId)) {
      return { canPromote: false, blockReason: 'blacklist' as WaitlistBlockReason, blockDetail: '该用户在黑名单中，需人工审核' };
    }

    if (registration.familyMemberId) {
      const fm = get().familyMembers[registration.residentId]?.find(f => f.id === registration.familyMemberId);
      if (fm) {
        if (course.ageMin != null && fm.age < course.ageMin) {
          return { canPromote: false, blockReason: 'age' as WaitlistBlockReason, blockDetail: `年龄${fm.age}岁，低于课程最小年龄${course.ageMin}岁` };
        }
        if (course.ageMax != null && fm.age > course.ageMax) {
          return { canPromote: false, blockReason: 'age' as WaitlistBlockReason, blockDetail: `年龄${fm.age}岁，超过课程最大年龄${course.ageMax}岁` };
        }
      }
    }

    if (course.equipmentLimitSlots != null && course.totalEquipmentStock != null) {
      const registeredCount = get().registrations.filter(
        r => r.courseId === course.id && r.status === 'registered'
      ).length;
      if (registeredCount >= course.totalEquipmentStock) {
        return { canPromote: false, blockReason: 'equipment' as WaitlistBlockReason, blockDetail: '器材库存不足，需等设备补充后才能转正' };
      }
    }

    return { canPromote: true, blockReason: 'none' as WaitlistBlockReason, blockDetail: '' };
  },

  getWaitlistWithBlockReasons: (courseId) => {
    const waitlisted = get().registrations
      .filter(r => r.courseId === courseId && r.status === 'waitlisted')
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

    return waitlisted.map(reg => {
      const { canPromote, blockReason, blockDetail } = get().checkWaitlistPromotable(reg);
      return { registration: reg, blockReason, blockDetail, canAutoPromote: canPromote };
    });
  },

  promoteFromWaitlistWithCheck: (courseId, count = 1) => {
    const course = get().courses.find(c => c.id === courseId);
    if (!course) return { promoted: [], blocked: [] };

    const promoted: Registration[] = [];
    const blocked: Array<{ registration: Registration; reason: string }> = [];

    const waitlist = get().getWaitlistWithBlockReasons(courseId);

    for (const item of waitlist) {
      if (promoted.length >= count) break;

      if (item.canAutoPromote) {
        const result = get().manuallyPromoteWaitlist(item.registration.id);
        if (result.success) {
          const reg = get().registrations.find(r => r.id === item.registration.id);
          if (reg) promoted.push(reg);
        }
      } else {
        blocked.push({ registration: item.registration, reason: item.blockDetail });
      }
    }

    return { promoted, blocked };
  },

  manuallyPromoteWaitlist: (registrationId) => {
    const reg = get().registrations.find(r => r.id === registrationId);
    if (!reg || reg.status !== 'waitlisted') {
      return { success: false, message: '候补记录不存在或状态不正确' };
    }

    set((s) => ({
      registrations: s.registrations.map(r =>
        r.id === registrationId
          ? { ...r, status: 'promoted' as RegistrationStatus, promotedAt: new Date().toISOString().split('T')[0], waitlistPosition: undefined }
          : r
      ),
    }));

    const course = get().courses.find(c => c.id === reg.courseId);
    if (course) {
      get().addNotification({
        userId: reg.residentId,
        type: 'promoted_from_waitlist',
        title: '候补转正通知',
        content: `恭喜！您已从「${course.name}」候补中转为正式学员，请及时确认。`,
        relatedCourseId: course.id,
        relatedRegistrationId: reg.id,
      });
    }

    return { success: true, message: '已成功转正' };
  },

  getEquipmentLimitedCourses: () => {
    return get().courses
      .filter(c => c.equipmentLimitSlots != null && c.totalEquipmentStock != null)
      .map(course => {
        const registeredCount = get().registrations.filter(
          r => r.courseId === course.id && r.status === 'registered'
        ).length;
        return {
          course,
          availableSlots: (course.equipmentLimitSlots || 0) - registeredCount,
          equipmentLimit: course.equipmentLimitSlots || 0,
          totalStock: course.totalEquipmentStock || 0,
        };
      });
  },

  setEquipmentLimit: (courseId, limitSlots, totalStock) => {
    set((s) => ({
      courses: s.courses.map(c =>
        c.id === courseId
          ? { ...c, equipmentLimitSlots: limitSlots, totalEquipmentStock: totalStock }
          : c
      ),
    }));
  },
}));
