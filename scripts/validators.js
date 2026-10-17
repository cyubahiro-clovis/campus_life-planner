// The regex rules for a task. The add form, the edit form and the JSON import
// all use these, so they always agree on what is valid.
// Each check gives back an error message, or '' when the value is fine.

export const rules = {

    title:/^\S(?:.*\S)?$/,
    doubleSpace: /\s{2,}/,
    hasLetter: /^(?=.*[A-Za-z])/,
    repeatedWord: /\b(\w+)\s+\1\b/i,
    duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    date:/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    id: /^[\w-]+$/,
};

export function checkTitle(value) {
    if (value.trim() === '') return 'Please enter a title.';
    if (!rules.title.test(value)) return 'Remove the space at the start or the end.';
    if (rules.doubleSpace.test(value)) return 'Use one space between words.';
    if (!rules.hasLetter.test(value)) return 'The title needs at least one letter.';

    const repeated = value.match(rules.repeatedWord);
    if (repeated) return '"${repeated[1]}" is written twice in a row.';
    return '';
}

export function checkDate(value) {
    if (value === '') return 'Please enter a due date.';
    if (!rules.date.test(value)) return 'Use the format YYYY-MM-DD, for example 2026-10-20.';
    return '';
}

export function checkDuration(value) {
    if (value === '') return 'Please eneter a due date.';
    if (!rules.duration.test (value)) return 'Use a number like 45 or 52.5, with no leading zero and at most 2 decimals.';
    return '';
}

export function checkTag(value) {
    if (value === '') return 'Please enter a tag, like Study or Club.';
    if (!rules.tag.test(value)) return ' Use letters only, with single spaces or hyphens between words.';
    return '';
}

export function checkTask(task) {
    if (typeof task !== 'object' || task === null || Array.isArray(task)) {
        return ['it is not an object'];
    }

    const problems = [];
    if (typeof task.id !== 'string' || !rules.id.test(task.id)) {
        problems.push('the is must use only letters, numbers, _ or -');
    }

    const titleError = typeof task.title === 'string' ? checkTitle(task.title) : 'it is missing';
    if (titleError) problems.push('title: ' + titleError);

    const dateError = typeof task.dueDate === 'string' ? checkDate(task.dueDate) : 'it is missing';
    if (dateError) problems.push('dueDate: ' + dateError);

    const tagError = typeof task.tag === 'string' ? checkTag(task.tag) : ' it is missing';
    if (tagError) problems.push('tag: ' + tagError);

    if (typeof task.duration !== 'number' || checkDuration(String(task.duration)) !== '') {
        problems.push('createdAt or updatedAt is missing');
    }
    return problems;
}
 
export function validateImport(data) {
    if(!Array.isArray(data)) return ['The file must contain a list of tasks, like [ {...}, {...} ].'];
    if (data.length === 0) return ['The file has no tasks in it.'];

    const errors = [];
    const ids =[];
    data.forEach(function (task, index) {
        const problems = checkTask(task);
        if (problems.length === 0) {
            if (ids.includes(task.id)) problems.push('the id "${task.id}" is used twice');
            ids.push(task.id);
        }
        problems.forEach(function (problem) {
            errors.push('Task ${index + 1}: ${problem}');
        });
    });
    return errors;
}