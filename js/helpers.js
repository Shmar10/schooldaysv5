import {
    FIRST_DAY, LAST_DAY, NON_ATTENDANCE,
    SCHEDULE_DEFAULT, SCHEDULE_WED, SCHEDULE_LATE_1010,
    SCHEDULE_EXAM_DEC17, SCHEDULE_EXAM_DEC18, SCHEDULE_EXAM_DEC19,
    SCHEDULE_PM_ASSEMBLY,
    INCLUDE_ONLY, SPECIAL_DATES
} from './data.js';

export const oneDay = 24 * 60 * 60 * 1000;
export const iso = d => d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' });
export const shortMD = d => d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
export const toKey = d => d.toISOString().slice(0, 10);

/* ===== Helpers ===== */
export function* dateRange(start, end) {
    const s = new Date(start); s.setHours(0, 0, 0, 0);
    const e = new Date(end); e.setHours(0, 0, 0, 0);
    for (let t = s.getTime(); t <= e.getTime(); t += oneDay) {
        const d = new Date(t);
        d.setHours(0, 0, 0, 0);
        yield d;
    }
}

export function isWeekday(d) { return d.getDay() >= 1 && d.getDay() <= 5; }

export function buildNonAttendanceMap() {
    const m = new Map();
    for (const [label, sy, sm, sd, ey, em, ed] of NON_ATTENDANCE) {
        const s = new Date(sy, sm, sd), e = new Date(ey, em, ed);
        for (const d of dateRange(s, e)) m.set(+d, label);
    }
    return m;
}

export function allSchoolDays() {
    const na = buildNonAttendanceMap();
    const days = [];
    for (const d of dateRange(FIRST_DAY, LAST_DAY)) {
        if (isWeekday(d) && !na.has(+d)) days.push(new Date(d));
    }
    return days;
}

export function fullDaysAfterToday(today = new Date()) {
    today.setHours(0, 0, 0, 0);
    return allSchoolDays().filter(d => d.getTime() > today.getTime()).length;
}

export function todayStatus(today = new Date()) {
    today.setHours(0, 0, 0, 0);
    const na = buildNonAttendanceMap();
    if (today < FIRST_DAY) return ["Not started", null];
    if (today > LAST_DAY) return ["Completed", null];
    const key = +today;
    if (na.has(key)) return [`No school: ${na.get(key)}`, na.get(key)];
    if (!isWeekday(today)) return ["No school: Weekend", "Weekend"];
    return ["School day", null];
}

/* ===== Period helpers ===== */
export function scheduleForDate(baseDate) {
    const y = baseDate.getFullYear(), m = baseDate.getMonth(), d = baseDate.getDate();
    const key = toKey(baseDate);
    let base = SCHEDULE_DEFAULT;
    
    // Check special dates first
    if (SPECIAL_DATES[key]) {
        const schedType = SPECIAL_DATES[key];
        if (schedType === 'EXAM_DEC17') base = SCHEDULE_EXAM_DEC17;
        else if (schedType === 'EXAM_DEC18') base = SCHEDULE_EXAM_DEC18;
        else if (schedType === 'EXAM_DEC19') base = SCHEDULE_EXAM_DEC19;
        else if (schedType === 'PM_ASSEMBLY') base = SCHEDULE_PM_ASSEMBLY;
    } else if (baseDate.getDay() === 3) {
        base = SCHEDULE_WED;
    }
    
    const useOnly = Array.isArray(INCLUDE_ONLY) ? new Set(INCLUDE_ONLY) : null;
    return base.map(p => ({
        ...p,
        startDate: new Date(y, m, d, p.start[0], p.start[1]),
        endDate: new Date(y, m, d, p.end[0], p.end[1]),
        _count: useOnly ? useOnly.has(p.id) : !!p.include
    }));
}

export function remainingPeriodsToday(now = new Date()) {
    const sched = scheduleForDate(now);
    return sched.filter(p => p._count && p.endDate.getTime() > now.getTime()).length;
}

export function plural(n, s, p) { return `${n} ${n === 1 ? s : p}`; }
