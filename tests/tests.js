// Small assertions for the regex rules, the search helpers and the import check.
// Open tests.html through Live Server (or on the live site) to run them.

import { rules, checkTitle, checkDate, checkDuration, checkTag, validateImport } from '../scripts/validators.js';
import { compileRegex, buildSearch, filterTasks, sortTasks, escapeHTML, highlight } from '../scripts/search.js';

const results = document.getElementById('results');
let list = null;
let passed = 0;
let failed = 0;

function group(name) {
    const heading = document.createElement('h2');
    heading.textContent = name;
    list = document.createElement('ul');
    results.appendChild(heading);
    results.appendChild(list);
}

// compares what a function gave back with what it should give back 
function check(description, actual, expected) {
    const item = document.createElement('li');
    if (actual === expected) {
        passed++;
        item.className = 'pass';
        item.textContent = 'PASS: ' + description;
    } else {
        failed++;
        item.className = 'fail';
        item.textContent = `FAIL: ${description} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`;
    }
    list.appendChild(item);
}

//the check give back an empty string when a value is fine
const fine = '';

group('Title');
check('a normal title passes', checkTitle('CHEM 201 lab report'), fine);
check('a title with a time passes', checkTitle('Study group 14:30'), fine);
check('an empty title fails', checkTitle('') !== fine, true);
check('a space at the start fails', checkTitle(' lab report ') !== fine, true);
check('a space at the end fails', checkTitle(' lab report ') !== fine, true);
check('two spaces in a row fail', checkTitle(' lab report ') !== fine, true);
check('lookahead: "1234" has no letter, so it fails', checkTitle('1234') !== fine, true);
check('back-reference: "the the" fails', checkTitle('Read the the notes') !== fine, true);
check('back-reference ignore case: "The the" fails', checkTitle('The the end') !== fine, true);
check('"the theory" is not a repeated word', checkTitle('Read the theory notes'), fine);
check('the repeated word is captured as group 1', 'go to to class'.match(rules.repeatedWord)[1], 'to');

group('Due date');
check('2026-10-20 passes', checkDate('2026-10-20'), fine);
check('the leap day 2024-02-29 passes', checkDate('2024-02-29'), fine);
check('month 13 fails', checkDate('2026-13-01') !==fine, true);
check('day 32 fails', checkDate('2026-01-32') !== fine, true);
check('missing zeros fail (2026-1-5)', checkDate('2026-1-5') !== fine, true);
check('20/10/2026 fails', checkDate('20/10/2026') !== fine, true);

group('Duration');
check('0 passes', checkDuration('0'), fine);
check('45 passes', checkDuration('45'), fine);
check('52.25 passes', checkDuration('52.25'), fine);
check('a leading zero fails (045)', checkDuration('045') !== fine, true);
check('".5" fails', checkDuration('.5') !== fine, true);
check('a negative number fails', checkDuration('-5') !== fine, true);
check(' a word fails', checkDuration('ten') !== fine, true);

group('Tag');
check('Study passes', checkTag('study'), fine);
check('Group Project passes', checkTag('Group Project'), fine);
check('Self-care passes', checkTag('Self-care'), fine);
check('digits fails (Study2)', checkTag('Study2') !== fine, true);
check('a hyphen at the start fails', checkTag('-care') !== fine, true);
check('two space fail', checkTag('Group  Project') !== fine, true);

const tasks =[
    { id: 'a', title: 'Lab report 14:30', dueDate: '2026-10-14', duration: 90, tag: 'Lab' },
    { id: 'b', title: 'lecture notes', dueDate: '2026-10-12', duration: 45, tag: 'Lecture' },
    { id: 'c', title: 'Group meeting', dueDate: '2026-10-20', duration: 30, tag: 'Group Project' },
];

// "a,b,c" style text, so two lists are easy to compare
function idsOf(found) {
    return found.map(function (task) {
        return task.id;
    }).join(',');
}

function searchFor(text, ignoreCase, keepId) {
    filterTasks(tasks, buildSearch(text, ignoreCase, keepId));
}

group('Regex search');
check('a broken pattern gives null instead of an error', compileRegex('(lab', 'g'), null);
check('an empty pattern gives null', compileRegex('', 'g'), null);
check('a broken pattern is reported', buildSearch('[abc', true).error, true);
check('a broken pattern still shows every task', searchFor('[abc', true, null), 'a,b,c');
check('"lab" with Ignore case on', searchFor('lab', true, null), 'a');
check('"lab" with Ignore case off finds nothing', searchFor('lab', false, null), '');
check('time tokens with \\b\\d{2}:\\d{2}\\b', searchFor('\\b\\d{2}:\\d{2}\\b', true, null), 'a');
check('@tag:lec only looks at tags', searchFor('@tag:lec', true, null), 'b');
check('@tag:group finds a two-word tag', searchFor('@tag:group', true, null), 'c');
check('the date is searched too', searchFor('-20$', true, null), 'c');
check('the task being edited stays in the list', searchFor('zzz', true, 'c'), 'c');

group('Highlighting');
check('every match is wrapped in <mark>', highlight('Lab lab', /lab/gi),'<mark>Lab</mark> <mark>lab</mark>');
check('HTML in a title is escaped', highlight('Read <Ch. 5> & notes', null), 'Read &lt;Ch. 5&gt; &amp; notes');
check('searching for "t" does not break "&lt;"', highlight('<t>', /t/g), '&lt;<mark>t</mark>&gt;');
check('a pattern that only matches empty text marks nothing', highlight('abc', /x*/g), 'abc');
check('quotes are escaped', escapeHTML('say "hi"'), 'say &quot;hi&quot;');

group('Sorting');
check('due date, soonest first', idsOf(sortTasks(tasks, 'date-asc')), 'b,a,c');
check('due date, lastestfirst', idsOf(sortTasks(tasks, 'date-desc')), 'c,a,b');
check('title, A to Z', idsOf(sortTasks(tasks, 'title-asc')), 'c,a,b');
check('title, Z to A', idsOf(sortTasks(tasks, 'title-desc')), 'b,a,c');
check('duration, shortest first', idsOf(sortTasks(tasks, 'duration-asc')), 'c,b,a');
check('duration, longest first', idsOf(sortTasks(tasks, 'duration-desc')), 'a,b,c');
check('sorting leaves the original list alone', idsOf(tasks), 'a,b,c');

const good = {
    id: 'task_0001',
    title: 'peer learning circle 16:00',
    dueDate: '2026-10-12',
    duration: 90,
    tag: 'Study',
    createdAt: '2026-10-05T07:42:10.000Z',
    updatedAt: '2026-10-05T07:42:10.000Z',
};

// a copy of the good task with one field chenged
function goodWith(field, value) {
    const task = JSON.parse(JSON.stringify(good));
    task[field] = value;
    return task;
}

group('JSON import check');
check('a list of valid tasks passes', validateImport([good]).length, 0);
check('something that is not a list fails', validateImport({ title: 'Lab' }).length, 1);
check('an empty list fails', validateImport([]).length, 1);
check('a bad date names the task number', validateImport([good, goodWith('dueDate', '2026-13-01')])[0].startsWith('Task 2'), true);
check('a duration written as text fails', validateImport([goodWith('duration', '90')]).length, 1);
check('a missing written as text fails', validateImport([goodWith('title', undefined)]).length, 1);
check('the same id twice fails', validateImport([good, good]).length, 1);
check('null in the list fails', validateImport([null]).length, 1);
check('tricky text survives a JSON round trip', validateImport(JSON.parse(JSON.stringify([goodWith('title', 'Read <Ch. 5> & take "notes"')]))).length, 0);

const summary = document.getElementById('summary');
summary.textContent = failed === 0 ? 'All ${passed} tests passed.' : '${failed} of ${passed + failed} tests failed.';
summary.className = failed === 0 ? 'pass' : 'fail';
