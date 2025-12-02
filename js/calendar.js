import { FIRST_DAY, LAST_DAY, LATE_WEDNESDAYS, LATE_ARRIVAL_1010 } from './data.js';
import { toKey, buildNonAttendanceMap } from './helpers.js';

const $ = s => document.querySelector(s);
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export function openCalendar() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    $('#calBackdrop').hidden = false;
    $('#calBackdrop').style.display = 'flex';
    renderMonth();
}

export function closeCalendar() {
    $('#calBackdrop').hidden = true;
    $('#calBackdrop').style.display = '';
}

function isSchoolDay(date) {
    if (date < FIRST_DAY || date > LAST_DAY) return false;
    const day = date.getDay();
    if (day === 0 || day === 6) return false; // weekends

    const na = buildNonAttendanceMap();
    if (na.has(+date)) return false;

    return true;
}

function isLateStart(date) {
    const key = toKey(date);
    // Check if date is in late start arrays
    if (LATE_ARRIVAL_1010.includes(key)) return true;
    if (LATE_WEDNESDAYS.includes(key)) return true;
    return false;
}

function isHoliday(date) {
    const na = buildNonAttendanceMap();
    return na.has(+date);
}

function renderMonth() {
    const monthName = MONTH_NAMES[currentMonth];
    $('#calMonth').textContent = `${monthName} ${currentYear}`;

    const grid = $('#calGrid');
    grid.innerHTML = '';

    // Add day labels
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const label = document.createElement('div');
        label.className = 'cal-day-label';
        label.textContent = day;
        grid.appendChild(label);
    });

    //Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day disabled';
        grid.appendChild(empty);
    }

    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        date.setHours(0, 0, 0, 0);

        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = day;

        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            cell.classList.add('weekend');
        } else if (isHoliday(date)) {
            cell.classList.add('holiday');
        } else if (isSchoolDay(date)) {
            cell.classList.add('school');
            if (isLateStart(date)) {
                cell.classList.add('late-start');
            }
        }

        if (date.getTime() === today.getTime()) {
            cell.classList.add('today');
        }

        cell.addEventListener('click', () => {
            // TODO: Open schedule preview for this date
            alert(`Preview schedule for ${monthName} ${day}, ${currentYear}`);
        });

        grid.appendChild(cell);
    }
}

export function wireCalendar() {
    $('#calBtn').addEventListener('click', openCalendar);
    $('#calClose').addEventListener('click', closeCalendar);
    $('#calBackdrop').addEventListener('click', e => {
        if (e.target.id === 'calBackdrop') closeCalendar();
    });

    $('#calPrev').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderMonth();
    });

    $('#calNext').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderMonth();
    });
}
