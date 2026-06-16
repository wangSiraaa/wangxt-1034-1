export type UserRole = 'club_leader' | 'venue_admin' | 'resident';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  phone?: string;
}

export type EquipmentType = 'yoga_mat' | 'dumbbell' | 'basketball' | 'badminton' | 'table_tennis' | 'dance_pole' | 'piano' | 'projector' | 'speaker' | 'mirror';

export const EquipmentLabels: Record<EquipmentType, string> = {
  yoga_mat: '瑜伽垫',
  dumbbell: '哑铃',
  basketball: '篮球',
  badminton: '羽毛球拍',
  table_tennis: '乒乓球桌',
  dance_pole: '舞蹈把杆',
  piano: '钢琴',
  projector: '投影仪',
  speaker: '音响',
  mirror: '全身镜',
};

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  equipment: EquipmentType[];
  clearTimeMinutes: number;
  building: string;
  floor: string;
}

export type CourseStatus = 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface SessionSchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId?: string;
  locked?: boolean;
  originalDate?: string;
  originalStartTime?: string;
  originalEndTime?: string;
  rescheduled?: boolean;
  rescheduleReason?: string;
  cancelled?: boolean;
  cancelReason?: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  category: string;
  clubLeaderId: string;
  maxParticipants: number;
  minParticipants: number;
  equipmentRequired: EquipmentType[];
  ageMin?: number;
  ageMax?: number;
  sessions: SessionSchedule[];
  status: CourseStatus;
  rejectionReason?: string;
  createdAt: string;
  coverImage?: string;
  isSummerCamp?: boolean;
  isRollingAdmission?: boolean;
  equipmentLimitSlots?: number;
  totalEquipmentStock?: number;
}

export type PackageType = 'single' | 'package_4' | 'package_8' | 'family';

export interface CoursePackage {
  id: string;
  courseId: string;
  name: string;
  type: PackageType;
  sessionCount: number;
  price: number;
  isFamilyPackage: boolean;
  maxFamilyMembers?: number;
  validDays?: number;
  description?: string;
}

export interface RegistrationPackage {
  id: string;
  registrationId: string;
  packageId: string;
  courseId: string;
  residentId: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  familyMemberIds: string[];
  purchasedAt: string;
  expiresAt?: string;
}

export type CohortStatus = 'upcoming' | 'enrolling' | 'ongoing' | 'completed' | 'full';

export interface CourseCohort {
  id: string;
  courseId: string;
  name: string;
  cohortNumber: number;
  startDate: string;
  endDate: string;
  weekCount: number;
  maxParticipants: number;
  equipmentLimitSlots?: number;
  enrolledCount: number;
  waitlistCount: number;
  status: CohortStatus;
  weekDay: number;
  startTime: string;
  endTime: string;
  venueId?: string;
}

export type RegistrationStatus = 'registered' | 'waitlisted' | 'cancelled' | 'promoted' | 'blacklisted';

export type WaitlistBlockReason = 'age' | 'blacklist' | 'equipment' | 'manual_review' | 'none';

export interface Registration {
  id: string;
  courseId: string;
  residentId: string;
  familyMemberId?: string;
  status: RegistrationStatus;
  waitlistPosition?: number;
  registeredAt: string;
  promotedAt?: string;
  cancelledAt?: string;
  cohortId?: string;
  packageId?: string;
  waitlistBlockReason?: WaitlistBlockReason;
  waitlistBlockDetail?: string;
}

export type CheckInStatus = 'checked_in' | 'late' | 'absent' | 'not_started';

export interface CheckInRecord {
  id: string;
  courseId: string;
  sessionId: string;
  registrationId: string;
  residentId: string;
  status: CheckInStatus;
  checkedInAt?: string;
  lateMinutes?: number;
}

export interface BlacklistEntry {
  id: string;
  residentId: string;
  reason: string;
  createdAt: string;
  expiresAt?: string;
  createdBy: string;
}

export type NotificationType = 'course_approved' | 'course_rejected' | 'venue_assigned' | 'venue_changed' | 'course_rescheduled' | 'promoted_from_waitlist' | 'registration_cancelled' | 'course_cancelled' | 'checkin_reminder';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedCourseId?: string;
  relatedRegistrationId?: string;
  read: boolean;
  createdAt: string;
}

export interface ChangeImpact {
  type: 'venue_change' | 'reschedule' | 'time_change';
  affectedRegistrations: number;
  affectedWaitlist: number;
  details: string;
}

export interface ConflictInfo {
  hasConflict: boolean;
  reason?: string;
  conflictingCourseId?: string;
  conflictingCourseName?: string;
}
