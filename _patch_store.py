filepath = "src/store/appStore.ts"
with open(filepath, "r") as f:
    lines = f.readlines()

# Find the lockCourse closing brace followed by registerCourse
# We look for the exact line pattern
insert_at = -1
for i, line in enumerate(lines):
    if i > 235 and line.strip() == '},' and i+2 < len(lines) and 'registerCourse:' in lines[i+2]:
        insert_at = i + 1
        break

if insert_at == -1:
    print("ERROR: could not find insertion point")
    exit(1)

canRegister_impl = """
  canRegisterCourse: (courseId) => {
    const course = get().courses.find(c => c.id === courseId);
    if (!course) return { canRegister: false, reason: '课程不存在' };
    if (course.status === 'cancelled') return { canRegister: false, reason: '课程已取消' };
    if (course.status === 'completed') return { canRegister: false, reason: '课程已结束' };
    if (course.status === 'pending_approval') return { canRegister: false, reason: '课程正在审核中，暂不可报名' };
    if (course.status === 'rejected') return { canRegister: false, reason: '课程未通过审核，暂不可报名' };
    if (course.status === 'approved') return { canRegister: false, reason: '课程审核通过，等待管理员分配场馆排课' };
    const hasUnassignedVenue = course.sessions.some(s => !s.venueId);
    if (hasUnassignedVenue) return { canRegister: false, reason: '课程场馆排课未完成，等待管理员分配' };
    const firstSession = course.sessions[0];
    if (firstSession && firstSession.locked) return { canRegister: false, reason: '课程已开课，无法报名' };
    return { canRegister: true, reason: '' };
  },
"""

lines.insert(insert_at, canRegister_impl)

# Now find the old validation in registerCourse and replace
# Look for the 4 status validation lines after registerCourse
new_lines = []
skip_until = -1
for i, line in enumerate(lines):
    if i <= skip_until:
        continue
    # Find the old validation block
    if (i+5 < len(lines) and 
        "course.status === 'cancelled'" in line and
        "course.status === 'completed'" in lines[i+1] and
        "course.status === 'pending_approval'" in lines[i+2]):
        # Replace 5 lines (cancelled, completed, pending/rejected if, closing brace, blank line)
        new_lines.append("    const check = get().canRegisterCourse(courseId);\n")
        new_lines.append("    if (!check.canRegister) {\n")
        new_lines.append("      return { success: false, message: check.reason };\n")
        new_lines.append("    }\n")
        skip_until = i + 5  # skip the old 5 lines, adjust if needed
        # Actually need to check exactly how many lines to skip
        # cancelled, completed, pending_approval if statement (2 lines: if + return), } and blank
        # Let's be precise by scanning
        j = i
        while j < len(lines):
            if lines[j].strip() == '' and j > i + 3:
                break
            j += 1
        skip_until = j - 1
        continue
    new_lines.append(line)

with open(filepath, "w") as f:
    f.writelines(new_lines)

print("SUCCESS: store patched")
