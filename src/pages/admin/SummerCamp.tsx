import { useState, useMemo } from "react";
import { useAppStore } from "../../store/appStore";
import {
  Card,
  StatusBadge,
  Button,
  Alert,
  Select,
  Input,
} from "../../components/ui";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  Sun,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Plus,
  UserX,
  Clock8,
  Package,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  EquipmentLabels,
  EquipmentType,
  CourseCohort,
  CohortStatus,
  WaitlistBlockReason,
  Course,
  ChangeImpact,
  SessionSchedule,
} from "../../types";

const weekDayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const waitlistBlockLabels: Record<WaitlistBlockReason, string> = {
  age: "年龄不符合",
  blacklist: "黑名单",
  equipment: "器材不足",
  manual_review: "人工审核",
  none: "无",
};

const waitlistBlockColors: Record<WaitlistBlockReason, string> = {
  age: "bg-yellow-100 text-yellow-800",
  blacklist: "bg-red-100 text-red-800",
  equipment: "bg-orange-100 text-orange-800",
  manual_review: "bg-blue-100 text-blue-800",
  none: "bg-green-100 text-green-800",
};

interface RescheduleFormState {
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
}

interface CancelFormState {
  reason: string;
}

type ModalState =
  | { type: "none" }
  | {
      type: "reschedule";
      courseId: string;
      cohortId: string;
      session: SessionSchedule;
      sessionIndex: number;
    }
  | {
      type: "cancel";
      courseId: string;
      cohortId: string;
      session: SessionSchedule;
      sessionIndex: number;
    };

export function AdminSummerCamp() {
  const {
    courses,
    courseCohorts,
    registrations,
    venues,
    users,
    familyMembers,
    getWaitlistWithBlockReasons,
    promoteFromWaitlistWithCheck,
    manuallyPromoteWaitlist,
    getEquipmentLimitedCourses,
    setEquipmentLimit,
    rescheduleSingleSession,
    cancelSingleSession,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    "overview" | "equipment" | "waitlist" | "reschedule"
  >("overview");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [expandedCohorts, setExpandedCohorts] = useState<string[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ type: "none" });
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleFormState>({
    newDate: "",
    newStartTime: "",
    newEndTime: "",
    reason: "",
  });
  const [cancelForm, setCancelForm] = useState<CancelFormState>({ reason: "" });
  const [impactResult, setImpactResult] = useState<ChangeImpact | null>(null);

  const summerCourses = courses.filter((c) => c.isSummerCamp);
  const equipmentLimited = getEquipmentLimitedCourses();
  const currentSummerCourse =
    summerCourses.find((c) => c.id === selectedCourse) || summerCourses[0];

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const toggleCohortExpand = (cohortId: string) => {
    setExpandedCohorts((prev) =>
      prev.includes(cohortId)
        ? prev.filter((id) => id !== cohortId)
        : [...prev, cohortId],
    );
  };

  const getCourseCohorts = (courseId: string) => {
    return courseCohorts
      .filter((c) => c.courseId === courseId)
      .sort((a, b) => a.cohortNumber - b.cohortNumber);
  };

  const waitlistData = currentSummerCourse
    ? getWaitlistWithBlockReasons(currentSummerCourse.id)
    : [];

  const blockedWaitlist = waitlistData.filter((w) => !w.canAutoPromote);
  const promotableWaitlist = waitlistData.filter((w) => w.canAutoPromote);

  const handleAutoPromote = () => {
    if (!currentSummerCourse) return;
    const result = promoteFromWaitlistWithCheck(currentSummerCourse.id, 2);
    alert(
      `成功转正 ${result.promoted.length} 人，${result.blocked.length} 人无法自动转正`,
    );
  };

  const handleManualPromote = (regId: string) => {
    const result = manuallyPromoteWaitlist(regId);
    alert(result.message);
  };

  const handleEquipmentLimitChange = (
    courseId: string,
    limitSlots: number,
    totalStock: number,
  ) => {
    setEquipmentLimit(courseId, limitSlots, totalStock);
  };

  const openRescheduleModal = (
    courseId: string,
    cohortId: string,
    session: SessionSchedule,
    sessionIndex: number,
  ) => {
    setImpactResult(null);
    setRescheduleForm({
      newDate: session.date,
      newStartTime: session.startTime,
      newEndTime: session.endTime,
      reason: "",
    });
    setModalState({
      type: "reschedule",
      courseId,
      cohortId,
      session,
      sessionIndex,
    });
  };

  const openCancelModal = (
    courseId: string,
    cohortId: string,
    session: SessionSchedule,
    sessionIndex: number,
  ) => {
    setImpactResult(null);
    setCancelForm({ reason: "" });
    setModalState({
      type: "cancel",
      courseId,
      cohortId,
      session,
      sessionIndex,
    });
  };

  const closeModal = () => {
    setModalState({ type: "none" });
    setImpactResult(null);
  };

  const handleRescheduleSubmit = () => {
    if (modalState.type !== "reschedule") return;
    const { courseId, cohortId, session, sessionIndex } = modalState;
    const result = rescheduleSingleSession(
      courseId,
      session.id,
      rescheduleForm.newDate,
      rescheduleForm.newStartTime,
      rescheduleForm.newEndTime,
      rescheduleForm.reason || "未填写原因",
      cohortId,
    );
    const finalResult: ChangeImpact = {
      ...result,
      details: `第${sessionIndex + 1}次课${result.details}`,
    };
    setImpactResult(finalResult);
  };

  const handleCancelSubmit = () => {
    if (modalState.type !== "cancel") return;
    const { courseId, cohortId, session, sessionIndex } = modalState;
    const result = cancelSingleSession(
      courseId,
      session.id,
      cancelForm.reason || "未填写原因",
      cohortId,
    );
    setImpactResult({
      type: "reschedule",
      affectedRegistrations: result.affected,
      affectedWaitlist: 0,
      details: `第${sessionIndex + 1}次课已取消，原因：${cancelForm.reason || "未填写原因"}，已自动返还 ${result.refundSessions} 次课次。**同一报名的剩余 ${cohortSessionCount(cohortId) - 1} 次课保留不变**，候补和通知记录保留。`,
    });
  };

  const cohortSessionCount = (cohortId: string) => {
    return courseCohorts.find((c) => c.id === cohortId)?.sessions.length ?? 0;
  };

  const rescheduleTabContent = useMemo(() => {
    return (
      <div className="space-y-4">
        <Alert type="warning">
          <AlertTriangle size={18} className="inline mr-2" />
          <strong>课改期说明：</strong>
          单次课改期/取消<strong>不会整单作废</strong>。仅修改被选中的那一次课，同一报名下的<strong>剩余课次、候补、通知记录全部保留</strong>。系统会自动向该班期所有已报名学员推送通知。
        </Alert>

        <Card title="暑期班滚动班期 & 每期课次">
          <p className="text-sm text-gray-600 mb-4">
            以下课次直接基于 <code className="bg-gray-100 px-1 rounded">courseCohorts[i].sessions</code> 展示。点击「改期」弹出日期/时间/原因表单，调用 store 的 <code className="bg-gray-100 px-1 rounded">rescheduleSingleSession(cohortId)</code> 只调整单次课。
          </p>

          <div className="space-y-4">
            {summerCourses.map((course) => {
              const cohorts = getCourseCohorts(course.id);
              const isCourseExpanded = expandedCourses.includes(course.id);

              return (
                <div
                  key={course.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCourseExpand(course.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Sun className="text-orange-500" size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {course.name}
                        </h4>
                        <div className="text-sm text-gray-500">
                          {cohorts.length} 个滚动班期 · 共{" "}
                          {cohorts.reduce((sum, c) => sum + c.sessions.length, 0)} 节课次
                        </div>
                      </div>
                    </div>
                    {isCourseExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>

                  {isCourseExpanded && (
                    <div className="p-4 space-y-3 border-t border-gray-100">
                      {cohorts.map((cohort) => {
                        const isCohortExpanded = expandedCohorts.includes(
                          cohort.id,
                        );
                        const venue = cohort.venueId
                          ? venues.find((v) => v.id === cohort.venueId)
                          : null;
                        const sessions = cohort.sessions;

                        return (
                          <div
                            key={cohort.id}
                            className="border rounded-lg overflow-hidden"
                          >
                            <div
                              className="flex items-center justify-between p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => toggleCohortExpand(cohort.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center">
                                  <Calendar className="text-blue-500" size={14} />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {cohort.name}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    {weekDayLabels[cohort.weekDay]}{" "}
                                    {cohort.startTime}-{cohort.endTime}
                                    {venue && ` · ${venue.name}`}
                                    <span className="ml-2">
                                      {cohort.enrolledCount}/
                                      {cohort.maxParticipants}人 · 候
                                      {cohort.waitlistCount} · 共{" "}
                                      {sessions.length} 节课
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={cohort.status} />
                                {isCohortExpanded ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </div>
                            </div>

                            {isCohortExpanded && (
                              <div className="p-3 border-t border-blue-100">
                                <div className="space-y-2">
                                  {sessions.map((session, idx) => (
                                    <div
                                      key={session.id}
                                      className={`flex items-center justify-between p-3 rounded-lg ${
                                        session.cancelled
                                          ? "bg-gray-100 opacity-70"
                                          : session.rescheduled
                                            ? "bg-yellow-50 border border-yellow-200"
                                            : "bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-gray-500 w-16 flex-shrink-0">
                                          第{idx + 1}次
                                        </span>
                                        <div className="min-w-0">
                                          <div className="text-sm">
                                            <Calendar
                                              size={12}
                                              className="inline mr-1 text-gray-500"
                                            />
                                            <span className="font-medium">
                                              {session.date}
                                            </span>
                                            <Clock
                                              size={12}
                                              className="inline mx-2 text-gray-500"
                                            />
                                            <span>
                                              {session.startTime}-
                                              {session.endTime}
                                            </span>
                                            {session.venueId && venues.find(
                                              (v) =>
                                                v.id === session.venueId,
                                            ) && (
                                              <span className="text-gray-500 ml-2">
                                                <MapPin
                                                  size={12}
                                                  className="inline mr-1"
                                                />
                                                {
                                                  venues.find(
                                                    (v) =>
                                                      v.id === session.venueId,
                                                  )!.name
                                                }
                                              </span>
                                            )}
                                          </div>
                                          {session.rescheduled &&
                                            session.originalDate && (
                                              <div className="text-xs text-yellow-700 mt-1">
                                                <Clock8
                                                  size={12}
                                                  className="inline mr-1"
                                                />
                                                原时间：{session.originalDate}{" "}
                                                {session.originalStartTime}-
                                                {session.originalEndTime}
                                                {session.rescheduleReason &&
                                                  ` · 原因：${session.rescheduleReason}`}
                                              </div>
                                            )}
                                          {session.cancelled && (
                                            <div className="text-xs text-red-600 mt-1">
                                              ✕ 已取消 · 原因：
                                              {session.cancelReason}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {!session.cancelled && (
                                        <div className="flex gap-2 flex-shrink-0">
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                              openRescheduleModal(
                                                course.id,
                                                cohort.id,
                                                session,
                                                idx,
                                              )
                                            }
                                          >
                                            <Clock8
                                              size={12}
                                              className="mr-1"
                                            />
                                            改期
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() =>
                                              openCancelModal(
                                                course.id,
                                                cohort.id,
                                                session,
                                                idx,
                                              )
                                            }
                                          >
                                            取消
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}

                                  {sessions.length === 0 && (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                      该班期暂无课次
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {cohorts.length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">
                          暂无滚动班期
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {summerCourses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto mb-2 opacity-50" size={32} />
                暂无暑期课程
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }, [summerCourses, expandedCourses, expandedCohorts, courseCohorts, venues]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sun className="w-8 h-8" />
          <h1 className="text-2xl font-bold">暑期班管理中心</h1>
        </div>
        <p className="text-white/90">滚动开班、器材放号、候补递补一站式管理</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "overview", label: "班期总览", icon: Calendar },
          { key: "equipment", label: "器材放号", icon: Package },
          { key: "waitlist", label: "候补管理", icon: Users },
          { key: "reschedule", label: "课改期", icon: Clock8 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {summerCourses.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">暑期课程</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {courseCohorts.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">滚动班期</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {
                  registrations.filter(
                    (r) =>
                      r.status === "waitlisted" &&
                      summerCourses.some((c) => c.id === r.courseId),
                  ).length
                }
              </div>
              <div className="text-sm text-gray-500 mt-1">候补人数</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {equipmentLimited.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">器材限制课程</div>
            </Card>
          </div>

          {summerCourses.map((course) => {
            const cohorts = getCourseCohorts(course.id);
            const isExpanded = expandedCourses.includes(course.id);

            return (
              <Card key={course.id}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCourseExpand(course.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Sun className="text-orange-500" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {course.name}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {cohorts.length} 个班期 ·{" "}
                        {course.equipmentLimitSlots != null
                          ? "器材限制"
                          : "无器材限制"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {
                          registrations.filter(
                            (r) =>
                              r.courseId === course.id &&
                              r.status === "registered",
                          ).length
                        }
                        <span className="text-gray-400 font-normal">
                          {" "}
                          / {course.maxParticipants * cohorts.length}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        候补{" "}
                        {
                          registrations.filter(
                            (r) =>
                              r.courseId === course.id &&
                              r.status === "waitlisted",
                          ).length
                        }{" "}
                        人
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        班期列表（每期末尾显示课次数）
                      </h4>
                      <Button size="sm" variant="secondary">
                        <Plus size={14} className="mr-1" />
                        新增班期
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {cohorts.map((cohort) => {
                        const venue = cohort.venueId
                          ? venues.find((v) => v.id === cohort.venueId)
                          : null;
                        return (
                          <div
                            key={cohort.id}
                            className="border rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {cohort.name}
                              </span>
                              <StatusBadge status={cohort.status} />
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                {cohort.startDate} ~ {cohort.endDate}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                {weekDayLabels[cohort.weekDay]}{" "}
                                {cohort.startTime}-{cohort.endTime}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users size={12} />
                                {cohort.enrolledCount}/{cohort.maxParticipants}
                                人
                                {cohort.waitlistCount > 0 && (
                                  <span className="text-orange-600">
                                    （候{cohort.waitlistCount}）
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Package size={12} />
                                共 {cohort.sessions.length} 节课次
                              </div>
                              {venue && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  {venue.name}
                                </div>
                              )}
                              {cohort.equipmentLimitSlots != null && (
                                <div className="text-yellow-600 text-xs">
                                  🎯 器材限制 {cohort.equipmentLimitSlots}{" "}
                                  个名额
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "equipment" && (
        <div className="space-y-4">
          <Card title="器材限制放号管理">
            <p className="text-sm text-gray-600 mb-4">
              因器材库存有限，部分课程只能放出<strong>器材保障名额</strong>（超出部分需候补或自备器材）。
            </p>

            <div className="space-y-4">
              {equipmentLimited.map((item) => (
                <div key={item.course.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.course.name}
                      </h4>
                      <div className="text-sm text-gray-500">
                        所需器材：
                        {item.course.equipmentRequired
                          .map((e) => EquipmentLabels[e as EquipmentType])
                          .join("、")}
                      </div>
                    </div>
                    <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      器材限制
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        器材保障名额
                      </div>
                      <Input
                        type="number"
                        value={item.equipmentLimit}
                        onChange={(e) =>
                          handleEquipmentLimitChange(
                            item.course.id,
                            parseInt(e.target.value) || 0,
                            item.totalStock,
                          )
                        }
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        总器材库存
                      </div>
                      <Input
                        type="number"
                        value={item.totalStock}
                        onChange={(e) =>
                          handleEquipmentLimitChange(
                            item.course.id,
                            item.equipmentLimit,
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        已报名/剩余
                      </div>
                      <div className="text-lg font-semibold">
                        {item.equipmentLimit - item.availableSlots}
                        <span className="text-gray-400 font-normal">
                          {" "}
                          / {item.equipmentLimit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${((item.equipmentLimit - item.availableSlots) / item.equipmentLimit) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {equipmentLimited.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto mb-2 opacity-50" size={32} />
                  暂无器材限制的课程
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "waitlist" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Select
              label="选择课程"
              value={selectedCourse || summerCourses[0]?.id || ""}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={summerCourses.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              className="w-64"
            />
            <Button
              onClick={handleAutoPromote}
              disabled={promotableWaitlist.length === 0}
            >
              <Zap size={14} className="mr-1" />
              自动转正 ({promotableWaitlist.length})
            </Button>
          </div>

          <Card title={`需人工审核的候补 (${blockedWaitlist.length})`}>
            <p className="text-sm text-gray-600 mb-4">
              以下候补人员因<strong>年龄不符 / 黑名单 / 器材不足</strong>等原因无法自动转正，请人工审核后操作。
            </p>

            <div className="space-y-2">
              {blockedWaitlist.map((item) => {
                const user = users.find(
                  (u) => u.id === item.registration.residentId,
                );
                const familyMember = item.registration.familyMemberId
                  ? familyMembers[item.registration.residentId]?.find(
                      (f) => f.id === item.registration.familyMemberId,
                    )
                  : null;

                return (
                  <div
                    key={item.registration.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <UserX className="text-red-500" size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {familyMember?.name || user?.name || "未知用户"}
                          {familyMember && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({familyMember.relation})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          候补第 {item.registration.waitlistPosition} 位 ·{" "}
                          {item.registration.registeredAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${waitlistBlockColors[item.blockReason]}`}
                      >
                        {waitlistBlockLabels[item.blockReason]}
                      </span>
                      <span className="text-xs text-gray-500 max-w-48">
                        {item.blockDetail}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleManualPromote(item.registration.id)
                        }
                      >
                        人工转正
                      </Button>
                    </div>
                  </div>
                );
              })}

              {blockedWaitlist.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle
                    className="mx-auto mb-2 text-green-400"
                    size={32}
                  />
                  所有候补均可自动转正
                </div>
              )}
            </div>
          </Card>

          <Card title={`可自动转正的候补 (${promotableWaitlist.length})`}>
            <div className="space-y-2">
              {promotableWaitlist.map((item) => {
                const user = users.find(
                  (u) => u.id === item.registration.residentId,
                );
                const familyMember = item.registration.familyMemberId
                  ? familyMembers[item.registration.residentId]?.find(
                      (f) => f.id === item.registration.familyMemberId,
                    )
                  : null;

                return (
                  <div
                    key={item.registration.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-500" size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {familyMember?.name || user?.name || "未知用户"}
                          {familyMember && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({familyMember.relation})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          候补第 {item.registration.waitlistPosition} 位 ·{" "}
                          {item.registration.registeredAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        可自动转正
                      </span>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleManualPromote(item.registration.id)
                        }
                      >
                        立即转正
                      </Button>
                    </div>
                  </div>
                );
              })}

              {promotableWaitlist.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无可自动转正的候补人员
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "reschedule" && rescheduleTabContent}

      {modalState.type !== "none" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalState.type === "reschedule"
                  ? `改期：第${modalState.sessionIndex + 1}次课`
                  : `取消：第${modalState.sessionIndex + 1}次课`}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              {modalState.type === "reschedule" && (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                      当前课次
                    </div>
                    <div className="font-semibold text-gray-900 text-base mb-1">
                      第{modalState.sessionIndex + 1}次课
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <div>
                        <Calendar
                          size={12}
                          className="inline mr-1 text-gray-400"
                        />
                        {modalState.session.date}
                      </div>
                      <div>
                        <Clock
                          size={12}
                          className="inline mr-1 text-gray-400"
                        />
                        {modalState.session.startTime} -{" "}
                        {modalState.session.endTime}
                      </div>
                      {modalState.session.venueId && (
                        <div>
                          <MapPin
                            size={12}
                            className="inline mr-1 text-gray-400"
                          />
                          {venues.find(
                            (v) => v.id === modalState.session!.venueId,
                          )?.name || "未指定场地"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        新日期 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        value={rescheduleForm.newDate}
                        onChange={(e) =>
                          setRescheduleForm((prev) => ({
                            ...prev,
                            newDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          新开始时间 <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="time"
                          value={rescheduleForm.newStartTime}
                          onChange={(e) =>
                            setRescheduleForm((prev) => ({
                              ...prev,
                              newStartTime: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          新结束时间 <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="time"
                          value={rescheduleForm.newEndTime}
                          onChange={(e) =>
                            setRescheduleForm((prev) => ({
                              ...prev,
                              newEndTime: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        改期原因 <span className="text-red-500">*</span>
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          （例：负责人临时调课、教室设备检修）
                        </span>
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        value={rescheduleForm.reason}
                        onChange={(e) =>
                          setRescheduleForm((prev) => ({
                            ...prev,
                            reason: e.target.value,
                          }))
                        }
                        placeholder="请填写改期原因（必填）..."
                      />
                    </div>
                  </div>
                </>
              )}

              {modalState.type === "cancel" && (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                      待取消课次
                    </div>
                    <div className="font-semibold text-gray-900 text-base mb-1">
                      第{modalState.sessionIndex + 1}次课
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <div>
                        <Calendar
                          size={12}
                          className="inline mr-1 text-gray-400"
                        />
                        {modalState.session.date}
                      </div>
                      <div>
                        <Clock
                          size={12}
                          className="inline mr-1 text-gray-400"
                        />
                        {modalState.session.startTime} -{" "}
                        {modalState.session.endTime}
                      </div>
                    </div>
                  </div>

                  <Alert type="warning" className="mb-4">
                    <AlertTriangle size={16} className="inline mr-2 flex-shrink-0" />
                    <div className="text-sm">
                      <div>
                        <strong>操作说明：</strong>
                      </div>
                      <ul className="list-disc ml-5 mt-1 space-y-0.5">
                        <li>
                          <strong>只取消这一次</strong>
                          ，同一报名下的剩余 {cohortSessionCount(modalState.cohortId) - 1} 节课次
                          <strong className="text-green-700"> 全部保留</strong>
                        </li>
                        <li>学员课次包自动返还 1 次</li>
                        <li>候补队列、历史通知记录保留不变</li>
                        <li>系统会自动向该班期已报名学员推送通知</li>
                      </ul>
                    </div>
                  </Alert>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      取消原因 <span className="text-red-500">*</span>
                      <span className="text-xs font-normal text-gray-500 ml-2">
                        （例：教室设备检修、恶劣天气）
                      </span>
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      value={cancelForm.reason}
                      onChange={(e) => setCancelForm({ reason: e.target.value })}
                      placeholder="请填写取消原因（必填）..."
                    />
                  </div>
                </>
              )}

              {impactResult && (
                <div className="mt-5 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-500" size={18} />
                    <span className="font-semibold text-green-800">
                      操作成功 · 变更影响分析
                    </span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div>受影响报名：<strong>{impactResult.affectedRegistrations}</strong> 人</div>
                      <div>受影响候补：<strong>{impactResult.affectedWaitlist}</strong> 人</div>
                    </div>
                    <div className="pt-1 border-t border-green-200 text-green-800">
                      {impactResult.details}
                    </div>
                    <div className="pt-1 text-green-600 text-xs">
                      ✓ 剩余课次已保留
                      {" · "}✓ 候补队列不变
                      {" · "}✓ 通知记录已追加
                      {" · "}✓ 课次包已处理
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50 sticky bottom-0">
              {impactResult ? (
                <Button onClick={closeModal}>完成</Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={closeModal}>
                    取消
                  </Button>
                  <Button
                    onClick={
                      modalState.type === "reschedule"
                        ? handleRescheduleSubmit
                        : handleCancelSubmit
                    }
                    disabled={
                      modalState.type === "reschedule"
                        ? !rescheduleForm.newDate ||
                          !rescheduleForm.newStartTime ||
                          !rescheduleForm.newEndTime ||
                          !rescheduleForm.reason.trim()
                        : !cancelForm.reason.trim()
                    }
                  >
                    确认{modalState.type === "reschedule" ? "改期" : "取消本次课"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
