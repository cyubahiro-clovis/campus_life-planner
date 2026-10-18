// Regex search, highlighting and sorting. There is no DOM code in here,
// so tests.html can test these functions directly.

const TAG_FILTER = /^@tag:(\w+)/i;

export function compileRegex(input, flags) {
    try {
        return input ? new RegExp(input, flags) : null;
    } catch (error) {
        return null;
    }
}

export function buildSearch(text, ignoreCase) {
    const flags = ignoreCase ? 'gi' : 'g';
    const tagMatch = text.match(TAG_FILTER);
    if (tagMatch) {
        return { re: compileRegex('^' + tagMatch[1], flags), tagOnly: true, error: false };
    }
    const re = compileRegex(text, flags);
    return { re: re, tagOnly: false, error: text !== '' && re == null };
}

function found(text, re) {
    return text.match(re) !== null;
}

export function filterTasks(tasks, search, keepId) {
    if (!search.re) return tasks;
    return tasks.filter(function (task) {
        if (task.id === keepId) return true;
        if (search.tagOnly) return found(task.tag, search.re);
        return found(task.title, search.re) || found(task.tag, search.re) || found(task.dueDate, search.re);
    });
}

export function escapeHTML(text) {
    return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function highlight(text, re) {
    if (!re) return escapeHTML(text);
    const marked = text.replace(re, function (match){
        // patterns like ^ match an empty string, and there is nothing to mark
        return match === '' ? '' : '\u0001' + match + '\u0002';
    });
    return escapeHTML(marked).replace(/\u0001/g, '<mark>').replace(/\u0002/g, '</mark>');
}

function compareText(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

export function sortTasks(tasks, sortBy) {
    const sorted = tasks.slice();
    sorted.sort(function (a, b) {
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
        if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
        if (sortBy === 'duration-asc') return a.duration - b.duration;
        if (sortBy === 'duration-desc') return b.duration - a.duration;
        if (sortBy === 'date-desc') return compareText(b.dueDate, a.dueDate);
        return compareText(a.dueDate, b.dueDate);
    });
    return sorted;
}