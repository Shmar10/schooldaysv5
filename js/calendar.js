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
    setPreviewDate(date);
    closeCalendar();
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
