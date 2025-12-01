import {
    FIRST_DAY, LAST_DAY, SPECIAL_DATES
} from './data.js';
import {
    oneDay, iso, shortMD, toKey, dateRange, buildNonAttendanceMap,
    fullDaysAfterToday, todayStatus, remainingPeriodsToday, plural
} from './helpers.js';
import { scheduleForDate } from './state.js';
import { wireSettings } from './settings.js';

// Preview state
let previewDate = null;

function buildChips(now = new Date()) {
    const chips = document.getElementById('chips');
    chips.innerHTML = "";
    const sched = scheduleForDate(now);
    for (const p of sched) {
        if (!p._count) continue;
        let cls = "chip";
        if (p.endDate.getTime() <= now.getTime()) cls += " past";
        else if (p.startDate.getTime() <= now.getTime()) cls += " now";
        const txt = `${p.label} ${p.startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}–${p.endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
        const el = document.createElement('span');
        el.className = cls; el.textContent = txt;
        chips.appendChild(el);
    }
    // Mode label (Wednesday / Special)
    // For v5 with overrides, we should check what scheduleForDate returned or check overrides explicitly.
    // Let's simplify: if sched is WED, show "Wednesday schedule". If custom/special, show that.
    // Actually, let's just show "Special schedule" if it's not default.
    // Or better, let's port the mode logic from v3 if possible, or keep it simple.
    // v3 has `modeBadgeForDate`. Let's implement a simple version here.

    const row = document.getElementById('modeRow');
    row.innerHTML = "";

    // Simple heuristic for badge
    const isWed = now.getDay() === 3;
    const key = toKey(now);
    // We don't have easy access to "what kind of schedule is this" without re-checking state.
    // But we can check if it matches WED or LATE_1010 length/start times? 
    // Let's just rely on the fact that if it's a known special date or override, we show something.

    let label = "";
    if (toKey(now) in SPECIAL_DATES) label = "Special schedule";
    else if (isWed) label = "Wednesday schedule";

    // Check for overrides (simple check)
    try {
        const ov = JSON.parse(localStorage.getItem('sdc_v5_overrides') || '{}');
        if (ov[key]) label = `Override: ${ov[key].startsWith('CUSTOM') ? 'Custom' : ov[key]}`;
    } catch { }

    if (label) row.innerHTML = `<span class="mode-pill">${label}</span>`;
}

function render() {
    const now = previewDate ? new Date(previewDate) : new Date();
    if (previewDate) {
        // If previewing, set time to morning so we see full day? Or keep current time?
        // v3 sets it to 00:00 usually for "day view" but for "now" view it uses current time.
        // Let's keep "now" time but on that date.
        const t = new Date();
        now.setHours(t.getHours(), t.getMinutes(), t.getSeconds());
    } else {
        now.setSeconds(0, 0);
    }

    const today = new Date(now); today.setHours(0, 0, 0, 0);

    // Top line: days EXCLUDING today + periods left TODAY
    // Note: fullDaysAfterToday uses "real" today. If previewing, we might want to show info for THAT day.
    // But "Days left" usually implies from REAL today.
    // Let's stick to "Real Today" for the countdown, but show the SCHEDULE for the preview date.

    const realNow = new Date();
    const realToday = new Date(realNow); realToday.setHours(0, 0, 0, 0);

    const daysExclToday = fullDaysAfterToday(realToday);
    const periodsToday = (todayStatus(realToday)[0] === "School day") ? remainingPeriodsToday(realNow) : 0;

    if (!previewDate) {
        document.getElementById('topline').textContent =
            `${plural(daysExclToday, 'day', 'days')} and ${plural(periodsToday, 'period', 'periods')} left`;
    } else {
        document.getElementById('topline').textContent = "Preview Mode";
    }

    const [status] = todayStatus(today);
    document.getElementById('today').textContent = `${previewDate ? 'Preview' : 'Today'}: ${status}  (${iso(today)})`;

    // Next break (always from real today)
    const na = buildNonAttendanceMap();
    const start = new Date(Math.max(realToday, FIRST_DAY));
    let msg = "Next break: None — approaching the end of the year";
    for (const d of dateRange(start, LAST_DAY)) {
        if (na.has(+d)) {
            const label = na.get(+d);
            let end = new Date(d);
            for (const f of dateRange(new Date(+d + oneDay), LAST_DAY)) {
                if (na.get(+f) === label) { end = f; } else { break; }
            }
            msg = (d.getTime() === end.getTime())
                ? `Next break: ${label} on ${iso(d).replace(/, \d{4}$/, '')}`
                : `Next break: ${label} (${shortMD(d)}–${shortMD(end)})`;
            break;
        }
    }
    document.getElementById('next').textContent = msg;

    buildChips(now);
    document.getElementById('range').textContent =
        `School year: ${iso(FIRST_DAY).replace(/, \d{4}$/, '')} — ${iso(LAST_DAY).replace(/^[A-Za-z]+, /, '')}`;

    // Preview info
    if (previewDate) {
        document.getElementById('previewInfo').textContent = `Showing schedule for ${shortMD(now)}`;
        document.getElementById('useTodayBtn').hidden = false;
        document.getElementById('previewDate').value = toKey(now);
    } else {
        document.getElementById('previewInfo').textContent = "";
        document.getElementById('useTodayBtn').hidden = true;
        document.getElementById('previewDate').value = toKey(realNow);
    }
}

document.getElementById('refreshBtn').addEventListener('click', render);
document.getElementById('copyBtn').addEventListener('click', () => {
    const now = new Date(); now.setSeconds(0, 0);
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const daysExclToday = fullDaysAfterToday(today);
    const periodsToday = (todayStatus(today)[0] === "School day") ? remainingPeriodsToday(now) : 0;
    const lines = [];
    lines.push(`${daysExclToday} days and ${periodsToday} periods left`);
    const [status] = todayStatus(today);
    lines.push(`Today: ${status} (${iso(today)})`);
    lines.push(document.getElementById('next').textContent);
    lines.push(document.getElementById('range').textContent);
    navigator.clipboard?.writeText(lines.join("\n"));
});

// Preview controls
document.getElementById('previewDate').addEventListener('change', e => {
    if (e.target.value) {
        // parse as local date
        const [y, m, d] = e.target.value.split('-').map(Number);
        previewDate = new Date(y, m - 1, d);
        render();
    }
});
document.getElementById('useTodayBtn').addEventListener('click', () => {
    previewDate = null;
    render();
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
}

wireSettings();
render();
