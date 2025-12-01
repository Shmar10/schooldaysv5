import {
    SCHEDULE_DEFAULT, SCHEDULE_WED, SCHEDULE_LATE_1010,
    LATE_WEDNESDAYS, LATE_ARRIVAL_1010, INCLUDE_ONLY
} from './data.js';
import { toKey } from './helpers.js';

const OVERRIDES_KEY = 'sdc_v5_overrides';

export function getOverrides() {
    try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}'); }
    catch { return {}; }
}

function saveOverrides(obj) { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(obj)); }
export const setOverride = (dateKey, value) => { const o = getOverrides(); o[dateKey] = value; saveOverrides(o); };
export const removeOverride = (dateKey) => { const o = getOverrides(); delete o[dateKey]; saveOverrides(o); };
export const clearOverrides = () => saveOverrides({});

export function scheduleForDate(baseDate) {
    const y = baseDate.getFullYear(), m = baseDate.getMonth(), d = baseDate.getDate();
    const key = toKey(baseDate);
    const ov = getOverrides();

    let base = SCHEDULE_DEFAULT;

    // Check overrides first
    if (ov[key]) {
        const val = ov[key];
        if (val.startsWith('CUSTOM:')) {
            try {
                const custom = JSON.parse(val.slice(7));
                // Custom schedules from JSON might have string times, convert them
                base = custom.map(p => ({
                    ...p,
                    start: typeof p.start === 'string' ? p.start.split(':').map(Number) : p.start,
                    end: typeof p.end === 'string' ? p.end.split(':').map(Number) : p.end
                }));
            } catch { base = SCHEDULE_DEFAULT; }
        } else if (val === 'WED_LATE') {
            base = SCHEDULE_WED;
        } else if (val === 'LATE_ARRIVAL_1010') {
            base = SCHEDULE_LATE_1010;
        } else if (val === 'DEFAULT') {
            base = SCHEDULE_DEFAULT;
        }
    } else {
        // Check static lists
        if (LATE_ARRIVAL_1010.includes(key)) {
            base = SCHEDULE_LATE_1010;
        } else if (LATE_WEDNESDAYS.includes(key)) {
            base = SCHEDULE_WED;
        } else if (baseDate.getDay() === 3) {
            base = SCHEDULE_WED;
        }
    }

    // Process the schedule to add dates and count flags
    const useOnly = Array.isArray(INCLUDE_ONLY) ? new Set(INCLUDE_ONLY) : null;
    return base.map(p => ({
        ...p,
        startDate: new Date(y, m, d, p.start[0], p.start[1]),
        endDate: new Date(y, m, d, p.end[0], p.end[1]),
        _count: useOnly ? useOnly.has(p.id) : !!p.include
    }));
}
