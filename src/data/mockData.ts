import type {
  User, FamilyMember, Venue, Course, Registration,
  CheckInRecord, BlacklistEntry, Notification,
  CoursePackage, CourseCohort, SessionSchedule, CohortStatus
} from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: '王教练', role: 'club_leader', phone: '13800000001' },
  { id: 'u2', name: '李老师', role: 'club_leader', phone: '13800000002' },
  { id: 'a1', name: '张管理员', role: 'venue_admin', phone: '13900000001' },
  { id: 'r1', name: '陈小明', role: 'resident', phone: '13700000001' },
  { id: 'r2', name: '刘小红', role: 'resident', phone: '13700000002' },
  { id: 'r3', name: '赵大海', role: 'resident', phone: '13700000003' },
  { id: 'r4', name: '孙小美', role: 'resident', phone: '13700000004' },
  { id: 'r5', name: '周大壮', role: 'resident', phone: '13700000005' },
];

export const mockFamilyMembers: Record<string, FamilyMember[]> = {
  'r1': [
    { id: 'f1', name: '陈小华', relation: '儿子', age: 8 },
    { id: 'f2', name: '陈妻', relation: '配偶', age: 35 },
  ],
  'r2': [
    { id: 'f3', name: '刘父', relation: '父亲', age: 65 },
  ],
};

export const mockVenues: Venue[] = [
  {
    id: 'v1',
    name: '多功能舞蹈厅',
    capacity: 30,
    equipment: ['yoga_mat', 'dance_pole', 'mirror', 'speaker', 'projector'],
    clearTimeMinutes: 15,
    building: '社区活动中心A栋',
    floor: '2楼',
  },
  {
    id: 'v2',
    name: '健身房',
    capacity: 20,
    equipment: ['dumbbell', 'yoga_mat', 'mirror', 'speaker'],
    clearTimeMinutes: 10,
    building: '社区活动中心A栋',
    floor: '3楼',
  },
  {
    id: 'v3',
    name: '乒乓球室',
    capacity: 8,
    equipment: ['table_tennis'],
    clearTimeMinutes: 5,
    building: '社区活动中心B栋',
    floor: '1楼',
  },
  {
    id: 'v4',
    name: '羽毛球馆',
    capacity: 16,
    equipment: ['badminton'],
    clearTimeMinutes: 10,
    building: '社区运动馆',
    floor: '1楼',
  },
  {
    id: 'v5',
    name: '音乐教室',
    capacity: 15,
    equipment: ['piano', 'speaker', 'projector'],
    clearTimeMinutes: 10,
    building: '社区活动中心A栋',
    floor: '4楼',
  },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};
const addWeeks = (d: Date, n: number) => addDays(d, n * 7);

const genSessionId = () => Math.random().toString(36).slice(2, 11);

const buildCohortSessions = (
  firstDate: Date,
  weekCount: number,
  weekDay: number,
  startTime: string,
  endTime: string,
  venueId?: string
): SessionSchedule[] => {
  const sessions: SessionSchedule[] = [];
  const start = new Date(firstDate);
  const delta = (weekDay - start.getDay() + 7) % 7;
  start.setDate(start.getDate() + delta);
  for (let w = 0; w < weekCount; w++) {
    const d = addDays(start, w * 7);
    sessions.push({
      id: genSessionId(),
      date: fmt(d),
      startTime,
      endTime,
      venueId,
      locked: false,
    });
  }
  return sessions;
};

export const mockCourses: Course[] = [
  {
    id: 'c1',
    name: '成人瑜伽基础班',
    description: '适合零基础学员，从呼吸和基础体式开始，循序渐进提升柔韧性和核心力量。',
    category: '瑜伽',
    clubLeaderId: 'u1',
    maxParticipants: 15,
    minParticipants: 5,
    equipmentRequired: ['yoga_mat', 'mirror', 'speaker'],
    ageMin: 18,
    ageMax: 60,
    sessions: [
      { id: 's1', date: fmt(addDays(today, 2)), startTime: '19:00', endTime: '20:30', venueId: 'v1', locked: true },
      { id: 's2', date: fmt(addDays(today, 5)), startTime: '19:00', endTime: '20:30', venueId: 'v1' },
      { id: 's3', date: fmt(addDays(today, 8)), startTime: '19:00', endTime: '20:30', venueId: 'v1' },
      { id: 's4', date: fmt(addDays(today, 11)), startTime: '19:00', endTime: '20:30', venueId: 'v1' },
    ],
    status: 'scheduled',
    createdAt: fmt(addDays(today, -5)),
  },
  {
    id: 'c2',
    name: '少儿乒乓球入门',
    description: '针对6-12岁儿童的乒乓球启蒙课程，培养兴趣和基础动作。',
    category: '乒乓球',
    clubLeaderId: 'u2',
    maxParticipants: 8,
    minParticipants: 4,
    equipmentRequired: ['table_tennis'],
    ageMin: 6,
    ageMax: 12,
    sessions: [
      { id: 's5', date: fmt(addDays(today, 3)), startTime: '16:00', endTime: '17:30', venueId: 'v3', locked: true },
      { id: 's6', date: fmt(addDays(today, 6)), startTime: '16:00', endTime: '17:30', venueId: 'v3' },
    ],
    status: 'scheduled',
    createdAt: fmt(addDays(today, -3)),
  },
  {
    id: 'c3',
    name: '中老年人广场舞',
    description: '轻松愉悦的广场舞教学，适合中老年朋友健身娱乐。',
    category: '舞蹈',
    clubLeaderId: 'u1',
    maxParticipants: 30,
    minParticipants: 10,
    equipmentRequired: ['speaker'],
    ageMin: 50,
    ageMax: 75,
    sessions: [
      { id: 's7', date: fmt(addDays(today, 1)), startTime: '09:00', endTime: '10:30' },
      { id: 's8', date: fmt(addDays(today, 4)), startTime: '09:00', endTime: '10:30' },
    ],
    status: 'approved',
    createdAt: fmt(addDays(today, -1)),
  },
  {
    id: 'c4',
    name: '青少年羽毛球训练',
    description: '专业羽毛球技术训练，涵盖步伐、手法和战术。',
    category: '羽毛球',
    clubLeaderId: 'u2',
    maxParticipants: 16,
    minParticipants: 6,
    equipmentRequired: ['badminton'],
    ageMin: 12,
    ageMax: 18,
    sessions: [
      { id: 's9', date: fmt(addDays(today, 2)), startTime: '15:00', endTime: '17:00' },
    ],
    status: 'pending_approval',
    createdAt: fmt(today),
  },
  {
    id: 'c5',
    name: '钢琴入门体验课',
    description: '零基础钢琴体验，认识琴键和基础指法。',
    category: '音乐',
    clubLeaderId: 'u2',
    maxParticipants: 5,
    minParticipants: 2,
    equipmentRequired: ['piano', 'speaker'],
    sessions: [
      { id: 's10', date: fmt(addDays(today, 5)), startTime: '10:00', endTime: '11:00' },
    ],
    status: 'pending_approval',
    createdAt: fmt(today),
  },
  {
    id: 'summer_c1',
    name: '暑期少儿游泳启蒙班',
    description: '专为6-12岁儿童设计的暑期游泳启蒙课程，连续八周滚动开班，小班教学，零基础友好。',
    category: '游泳',
    clubLeaderId: 'u1',
    maxParticipants: 20,
    minParticipants: 6,
    equipmentRequired: [],
    ageMin: 6,
    ageMax: 12,
    sessions: [],
    status: 'scheduled',
    createdAt: fmt(addDays(today, -10)),
    isSummerCamp: true,
    isRollingAdmission: true,
    equipmentLimitSlots: 8,
    totalEquipmentStock: 12,
  },
  {
    id: 'summer_c2',
    name: '暑期青少年篮球特训营',
    description: '针对12-18岁青少年的篮球技能提升课程，连续八周滚动开班，专业教练指导。',
    category: '篮球',
    clubLeaderId: 'u2',
    maxParticipants: 30,
    minParticipants: 10,
    equipmentRequired: ['basketball'],
    ageMin: 12,
    ageMax: 18,
    sessions: [],
    status: 'scheduled',
    createdAt: fmt(addDays(today, -8)),
    isSummerCamp: true,
    isRollingAdmission: true,
    equipmentLimitSlots: 20,
    totalEquipmentStock: 25,
  },
  {
    id: 'summer_c3',
    name: '暑期亲子绘画班',
    description: '亲子共同参与的绘画课程，培养孩子艺术兴趣，增进亲子关系，家庭套票更优惠。',
    category: '美术',
    clubLeaderId: 'u1',
    maxParticipants: 16,
    minParticipants: 4,
    equipmentRequired: [],
    ageMin: 4,
    ageMax: 65,
    sessions: [],
    status: 'scheduled',
    createdAt: fmt(addDays(today, -5)),
    isSummerCamp: true,
    isRollingAdmission: false,
  },
];

export const mockCoursePackages: CoursePackage[] = [
  {
    id: 'pkg_s1',
    courseId: 'summer_c1',
    name: '单次体验课',
    type: 'single',
    sessionCount: 1,
    price: 99,
    isFamilyPackage: false,
    description: '单次体验，适合初次尝试',
  },
  {
    id: 'pkg_s2',
    courseId: 'summer_c1',
    name: '4次课包',
    type: 'package_4',
    sessionCount: 4,
    price: 349,
    isFamilyPackage: false,
    validDays: 60,
    description: '4次课程，60天有效',
  },
  {
    id: 'pkg_s3',
    courseId: 'summer_c1',
    name: '8周完整课程',
    type: 'package_8',
    sessionCount: 8,
    price: 599,
    isFamilyPackage: false,
    validDays: 90,
    description: '8周完整课程，90天有效',
  },
  {
    id: 'pkg_s4',
    courseId: 'summer_c1',
    name: '家庭欢乐套票',
    type: 'family',
    sessionCount: 16,
    price: 999,
    isFamilyPackage: true,
    maxFamilyMembers: 4,
    validDays: 120,
    description: '最多4人共享，120天有效',
  },
  {
    id: 'pkg_b1',
    courseId: 'summer_c2',
    name: '8周篮球营',
    type: 'package_8',
    sessionCount: 8,
    price: 799,
    isFamilyPackage: false,
    validDays: 90,
    description: '8周完整篮球训练',
  },
  {
    id: 'pkg_f1',
    courseId: 'summer_c3',
    name: '亲子绘画套票',
    type: 'family',
    sessionCount: 8,
    price: 499,
    isFamilyPackage: true,
    maxFamilyMembers: 3,
    validDays: 90,
    description: '最多3人共享，亲子共同参与',
  },
];

export const mockCourseCohorts: CourseCohort[] = [
  (() => {
    const start = addDays(today, 3);
    return {
      id: 'coh_s1_1',
      courseId: 'summer_c1',
      name: '游泳班第1期',
      cohortNumber: 1,
      startDate: fmt(start),
      endDate: fmt(addWeeks(today, 8)),
      weekCount: 8,
      maxParticipants: 20,
      equipmentLimitSlots: 8,
      enrolledCount: 7,
      waitlistCount: 2,
      status: 'enrolling' as CohortStatus,
      weekDay: 6,
      startTime: '09:00',
      endTime: '10:30',
      venueId: 'v4',
      sessions: buildCohortSessions(start, 8, 6, '09:00', '10:30', 'v4'),
    };
  })(),
  (() => {
    const start = addWeeks(today, 1);
    return {
      id: 'coh_s1_2',
      courseId: 'summer_c1',
      name: '游泳班第2期',
      cohortNumber: 2,
      startDate: fmt(start),
      endDate: fmt(addWeeks(today, 9)),
      weekCount: 8,
      maxParticipants: 20,
      equipmentLimitSlots: 8,
      enrolledCount: 5,
      waitlistCount: 1,
      status: 'enrolling' as CohortStatus,
      weekDay: 0,
      startTime: '14:00',
      endTime: '15:30',
      venueId: 'v4',
      sessions: buildCohortSessions(start, 8, 0, '14:00', '15:30', 'v4'),
    };
  })(),
  (() => {
    const start = addWeeks(today, 2);
    return {
      id: 'coh_s1_3',
      courseId: 'summer_c1',
      name: '游泳班第3期',
      cohortNumber: 3,
      startDate: fmt(start),
      endDate: fmt(addWeeks(today, 10)),
      weekCount: 8,
      maxParticipants: 20,
      equipmentLimitSlots: 8,
      enrolledCount: 3,
      waitlistCount: 0,
      status: 'upcoming' as CohortStatus,
      weekDay: 3,
      startTime: '10:00',
      endTime: '11:30',
      venueId: 'v4',
      sessions: buildCohortSessions(start, 8, 3, '10:00', '11:30', 'v4'),
    };
  })(),
  (() => {
    const start = addDays(today, 5);
    return {
      id: 'coh_b1_1',
      courseId: 'summer_c2',
      name: '篮球营第1期',
      cohortNumber: 1,
      startDate: fmt(start),
      endDate: fmt(addWeeks(today, 8)),
      weekCount: 8,
      maxParticipants: 30,
      equipmentLimitSlots: 20,
      enrolledCount: 18,
      waitlistCount: 5,
      status: 'enrolling' as CohortStatus,
      weekDay: 1,
      startTime: '16:00',
      endTime: '18:00',
      sessions: buildCohortSessions(start, 8, 1, '16:00', '18:00'),
    };
  })(),
  (() => {
    const start = addWeeks(today, 1);
    return {
      id: 'coh_b1_2',
      courseId: 'summer_c2',
      name: '篮球营第2期',
      cohortNumber: 2,
      startDate: fmt(start),
      endDate: fmt(addWeeks(today, 9)),
      weekCount: 8,
      maxParticipants: 30,
      equipmentLimitSlots: 20,
      enrolledCount: 12,
      waitlistCount: 3,
      status: 'enrolling' as CohortStatus,
      weekDay: 4,
      startTime: '16:00',
      endTime: '18:00',
      sessions: buildCohortSessions(start, 8, 4, '16:00', '18:00'),
    };
  })(),
  (() => {
    const start = addDays(today, 7);
    return {
      id: 'coh_f1_1',
      courseId: 'summer_c3',
      name: '亲子绘画班',
      cohortNumber: 1,
      startDate: fmt(start),
      endDate: fmt(addWeeks(today, 8)),
      weekCount: 8,
      maxParticipants: 16,
      enrolledCount: 8,
      waitlistCount: 2,
      status: 'enrolling' as CohortStatus,
      weekDay: 6,
      startTime: '10:00',
      endTime: '11:30',
      venueId: 'v5',
      sessions: buildCohortSessions(start, 8, 6, '10:00', '11:30', 'v5'),
    };
  })(),
];

export const mockRegistrations: Registration[] = [
  { id: 'reg1', courseId: 'c1', residentId: 'r1', status: 'registered', registeredAt: fmt(addDays(today, -4)) },
  { id: 'reg2', courseId: 'c1', residentId: 'r2', status: 'registered', registeredAt: fmt(addDays(today, -4)) },
  { id: 'reg3', courseId: 'c1', residentId: 'r3', status: 'registered', registeredAt: fmt(addDays(today, -3)) },
  { id: 'reg4', courseId: 'c1', residentId: 'r4', status: 'waitlisted', waitlistPosition: 1, registeredAt: fmt(addDays(today, -2)) },
  { id: 'reg5', courseId: 'c1', residentId: 'r5', status: 'waitlisted', waitlistPosition: 2, registeredAt: fmt(addDays(today, -2)) },
  { id: 'reg6', courseId: 'c1', residentId: 'r1', familyMemberId: 'f2', status: 'registered', registeredAt: fmt(addDays(today, -3)) },
  { id: 'reg7', courseId: 'c2', residentId: 'r1', familyMemberId: 'f1', status: 'registered', registeredAt: fmt(addDays(today, -2)) },
  { id: 'reg_s1_1', courseId: 'summer_c1', residentId: 'r1', familyMemberId: 'f1', status: 'registered', cohortId: 'coh_s1_1', packageId: 'pkg_s3', registeredAt: fmt(addDays(today, -6)) },
  { id: 'reg_s1_2', courseId: 'summer_c1', residentId: 'r2', status: 'registered', cohortId: 'coh_s1_1', packageId: 'pkg_s2', registeredAt: fmt(addDays(today, -5)) },
  { id: 'reg_s1_3', courseId: 'summer_c1', residentId: 'r3', status: 'registered', cohortId: 'coh_s1_1', registeredAt: fmt(addDays(today, -4)) },
  { id: 'reg_s1_4', courseId: 'summer_c1', residentId: 'r4', status: 'waitlisted', waitlistPosition: 1, cohortId: 'coh_s1_1', registeredAt: fmt(addDays(today, -3)) },
  { id: 'reg_s1_5', courseId: 'summer_c1', residentId: 'r5', status: 'waitlisted', waitlistPosition: 2, cohortId: 'coh_s1_1', registeredAt: fmt(addDays(today, -2)) },
  { id: 'reg_s1_6', courseId: 'summer_c1', residentId: 'r1', familyMemberId: 'f2', status: 'registered', cohortId: 'coh_s1_2', packageId: 'pkg_s4', registeredAt: fmt(addDays(today, -3)) },
  { id: 'reg_s1_7', courseId: 'summer_c1', residentId: 'r3', status: 'registered', cohortId: 'coh_s1_2', registeredAt: fmt(addDays(today, -1)) },
  { id: 'reg_s2_1', courseId: 'summer_c2', residentId: 'r1', familyMemberId: 'f1', status: 'registered', cohortId: 'coh_b1_1', packageId: 'pkg_b1', registeredAt: fmt(addDays(today, -7)) },
  { id: 'reg_s2_2', courseId: 'summer_c2', residentId: 'r2', status: 'registered', cohortId: 'coh_b1_1', registeredAt: fmt(addDays(today, -6)) },
  { id: 'reg_s2_3', courseId: 'summer_c2', residentId: 'r3', status: 'registered', cohortId: 'coh_b1_1', registeredAt: fmt(addDays(today, -5)) },
  { id: 'reg_s2_4', courseId: 'summer_c2', residentId: 'r4', status: 'registered', cohortId: 'coh_b1_1', registeredAt: fmt(addDays(today, -4)) },
  { id: 'reg_s2_5', courseId: 'summer_c2', residentId: 'r5', status: 'waitlisted', waitlistPosition: 1, cohortId: 'coh_b1_1', registeredAt: fmt(addDays(today, -3)) },
  { id: 'reg_s2_6', courseId: 'summer_c2', residentId: 'r1', status: 'waitlisted', waitlistPosition: 2, cohortId: 'coh_b1_1', registeredAt: fmt(addDays(today, -2)) },
  { id: 'reg_s2_7', courseId: 'summer_c2', residentId: 'r2', familyMemberId: 'f3', status: 'waitlisted', waitlistPosition: 3, cohortId: 'coh_b1_1', registeredAt: fmt(addDays(today, -1)) },
  { id: 'reg_f1_1', courseId: 'summer_c3', residentId: 'r1', familyMemberId: 'f1', status: 'registered', cohortId: 'coh_f1_1', packageId: 'pkg_f1', registeredAt: fmt(addDays(today, -4)) },
  { id: 'reg_f1_2', courseId: 'summer_c3', residentId: 'r1', familyMemberId: 'f2', status: 'registered', cohortId: 'coh_f1_1', packageId: 'pkg_f1', registeredAt: fmt(addDays(today, -4)) },
  { id: 'reg_f1_3', courseId: 'summer_c3', residentId: 'r2', status: 'waitlisted', waitlistPosition: 1, cohortId: 'coh_f1_1', registeredAt: fmt(addDays(today, -2)) },
];

export const mockCheckIns: CheckInRecord[] = [
  { id: 'ci1', courseId: 'c1', sessionId: 's1', registrationId: 'reg1', residentId: 'r1', status: 'checked_in', checkedInAt: '2026-06-16 18:55:00' },
  { id: 'ci2', courseId: 'c1', sessionId: 's1', registrationId: 'reg2', residentId: 'r2', status: 'late', checkedInAt: '2026-06-16 19:10:00', lateMinutes: 10 },
  { id: 'ci3', courseId: 'c1', sessionId: 's1', registrationId: 'reg3', residentId: 'r3', status: 'absent' },
];

export const mockBlacklist: BlacklistEntry[] = [
  { id: 'bl1', residentId: 'r5', reason: '多次报名后无故缺席且未提前取消', createdAt: fmt(addDays(today, -10)), createdBy: 'a1' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'r1', type: 'course_approved', title: '课程已通过审核', content: '您报名的「成人瑜伽基础班」已通过审核，期待您的参与！', relatedCourseId: 'c1', read: false, createdAt: fmt(addDays(today, -4)) },
  { id: 'n2', userId: 'r4', type: 'promoted_from_waitlist', title: '候补转正通知', content: '恭喜！您已从「成人瑜伽基础班」的候补中转为正式学员，请及时确认。', relatedCourseId: 'c1', relatedRegistrationId: 'reg4', read: false, createdAt: fmt(addDays(today, -1)) },
  { id: 'n3', userId: 'u1', type: 'course_approved', title: '课程排课完成', content: '您提交的「成人瑜伽基础班」已完成排课，可前往查看。', relatedCourseId: 'c1', read: true, createdAt: fmt(addDays(today, -3)) },
];
