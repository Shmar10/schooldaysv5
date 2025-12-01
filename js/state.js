import {
    SCHEDULE_DEFAULT, SCHEDULE_WED, SCHEDULE_LATE_1010,
    LATE_WEDNESDAYS, LATE_ARRIVAL_1010
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
    const key = toKey(baseDate);
    const ov = getOverrides();

    // Check overrides first
    if (ov[key]) {
        const val = ov[key];
        if (val.startsWith('CUSTOM:')) {
            try { return JSON.parse(val.slice(7)); } catch { }
        }
        if (val === 'WED_LATE') return SCHEDULE_WED;
        if (val === 'LATE_ARRIVAL_1010') return SCHEDULE_LATE_1010;
        if (val === 'DEFAULT') return SCHEDULE_DEFAULT;
    }

    // Check static lists
    if (LATE_ARRIVAL_1010.includes(key)) return SCHEDULE_LATE_1010;
    if (LATE_WEDNESDAYS.includes(key)) return SCHEDULE_WED;
    if (baseDate.getDay() === 3) return SCHEDULE_WED; // Fallback for Wednesdays not in list? Or strictly follow list? v4 logic was day==3. v3 used list. Let's stick to v4 logic + list for explicit overrides.

    // Actually, v4 logic was: SPECIAL_DATES[key] || (day===3 ? WED : DEFAULT).
    // v3 logic was: overrides || late1010 || lateWeds || DEFAULT.
    // Let's combine: Overrides > Late1010 List > LateWed List > Day 3 Check > Default.

    return SCHEDULE_DEFAULT;
}
