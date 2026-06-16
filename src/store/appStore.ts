import { create } from 'zustand';
import type {
  User, FamilyMember, Venue, Course, Registration,
  CheckInRecord, BlacklistEntry, Notification, CourseStatus,
  RegistrationStatus, SessionSchedule, ConflictInfo, ChangeImpact
} from '../types';
import {
  mockUsers, mockFamilyMembers, mockVenues, mockCourses,
  mockRegistrations, mockCheckIns, mockBlacklist, mockNotifications
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
}));
