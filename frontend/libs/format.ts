export function formatNumber(value: number | string | undefined | null): string {
    if (value === undefined || value === null || value === '') return '';
    const num = typeof value === 'number' ? value : Number(value);
    if (isNaN(num)) return String(value);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatSalary(
    salaryFrom?: number | null,
    salaryTo?: number | null,
    currency: string = '$',
    customSalary?: string | null
): string {
    if (customSalary) return customSalary;
    if (salaryFrom && salaryTo) {
        return `${formatNumber(salaryFrom)} – ${formatNumber(salaryTo)} ${currency}`;
    }
    if (salaryFrom) {
        return `от ${formatNumber(salaryFrom)} ${currency}`;
    }
    if (salaryTo) {
        return `до ${formatNumber(salaryTo)} ${currency}`;
    }
    return '';
}

export function formatPostTime(dateInput: Date | string | number | undefined | null): string {
    if (!dateInput) return '';

    let date: Date;
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        let s = dateInput.trim();
        if (!s.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
            s += 'Z';
        }
        date = new Date(s);
    } else {
        date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) {
        return 'только что';
    }

    if (diffHours < 1) {
        return `${diffMin}м`;
    }

    if (diffDays < 1) {
        return `${diffHours}ч`;
    }

    if (diffDays <= 5) {
        return `${diffDays}д`;
    }

    const isSameYear = date.getFullYear() === now.getFullYear();
    const months = [
        'янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.',
        'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];

    if (isSameYear) {
        return `${day} ${month}`;
    }
    return `${day} ${month} ${date.getFullYear()} г.`;
}

export function formatFullDateTime(dateInput: Date | string | number | undefined | null): string {
    if (!dateInput) return '';
    let date: Date;
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        let s = dateInput.trim();
        if (!s.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
            s += 'Z';
        }
        date = new Date(s);
    } else {
        date = new Date(dateInput);
    }
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function isVideoUrl(url: string | undefined | null): boolean {
    if (!url) return false;
    const clean = url.split('?')[0].toLowerCase();
    return (
        clean.endsWith('.mp4') ||
        clean.endsWith('.webm') ||
        clean.endsWith('.ogg') ||
        clean.endsWith('.mov') ||
        clean.endsWith('.m4v') ||
        clean.endsWith('.mkv') ||
        clean.includes('/video/') ||
        clean.includes('video-')
    );
}

