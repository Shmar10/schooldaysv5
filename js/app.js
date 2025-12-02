import {
    FIRST_DAY, LAST_DAY, SPECIAL_DATES
} from './data.js';
import {
    oneDay, iso, shortMD, toKey, dateRange, buildNonAttendanceMap,
    fullDaysAfterToday, todayStatus, remainingPeriodsToday, plural
} from './helpers.js';
import { scheduleForDate } from './state.js';
import { wireSettings } from './settings.js';
import { wireCalendar } from './calendar.js';

// Preview state
let previewDate = null;

export function setPreviewDate(date) {
    previewDate = date;
    render();
}

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
        el.className = cls;
        el.textContent = txt;
        chips.appendChild(el);
    }
    const row = document.getElementById('modeRow');
    row.innerHTML = "";

    const isWed = now.getDay() === 3;
    const key = toKey(now);
    let label = "";
    if (toKey(now) in SPECIAL_DATES) label = "Special schedule";
    else if (isWed) label = "Wednesday schedule";

    try {
        const ov = JSON.parse(localStorage.getItem('sdc_v5_overrides') || '{}');
        if (ov[key]) label = `Override: ${ov[key].startsWith('CUSTOM') ? 'Custom' : ov[key]}`;
    } catch { }

    if (label) row.innerHTML = `<span class="mode-pill">${label}</span>`;
}

function render() {
    const now = previewDate ? new Date(previewDate) : new Date();
    if (previewDate) {
        const t = new Date();
        now.setHours(t.getHours(), t.getMinutes(), t.getSeconds());
    } else {
        now.setSeconds(0, 0);
    }

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const realNow = new Date();
    const realToday = new Date(realNow);
    realToday.setHours(0, 0, 0, 0);

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

    const na = buildNonAttendanceMap();
    const start = new Date(Math.max(realToday, FIRST_DAY));
    let msg = "Next break: None — approaching the end of the year";
    for (const d of dateRange(start, LAST_DAY)) {
        if (na.has(+d)) {
            const label = na.get(+d);
            let end = new Date(d);
            for (const f of dateRange(new Date(+d + oneDay), LAST_DAY)) {
                if (na.get(+f) === label) {
                    end = f;
                } else {
                    break;
                }
            }
            msg = (d.getTime() === end.getTime())
                ? `Next break: ${label} on ${iso(d).replace(/, \d{4}$/, '')}`
                : `Next break: ${label} (${shortMD(d)}–${shortMD(end)})`;
            break;
        }
    }
    document.getElementById('next').textContent = msg;

    // Calculate and display stats
    const totalSchoolDays = fullDaysAfterToday(FIRST_DAY) + 1;
    const schoolDaysLeft = fullDaysAfterToday(realToday);
    const calDaysLeft = Math.ceil((LAST_DAY - realToday) / oneDay);
    const pctComplete = Math.round(((totalSchoolDays - schoolDaysLeft) / totalSchoolDays) * 100);

    document.getElementById('schoolDays').textContent = schoolDaysLeft;
    document.getElementById('calDays').textContent = calDaysLeft;
    document.getElementById('pctComplete').textContent = pctComplete + '%';

    buildChips(now);
    document.getElementById('range').textContent =
        `School year: ${iso(FIRST_DAY).replace(/, \d{4}$/, '')} — ${iso(LAST_DAY).replace(/^[A-Za-z]+, /, '')}`;

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
    const now = new Date();
    now.setSeconds(0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
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

document.getElementById('previewDate').addEventListener('change', e => {
    if (e.target.value) {
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
wireCalendar();
render();
