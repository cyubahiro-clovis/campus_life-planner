import { hasSavedTasks } from './storage.js';
import{
    getTasks, getSettingd, findTask, addTask, updateTask, deleteTask, replaceTasks, setSetting, getStats,
} from './state.js';
import { rules, validationImport } from '.validators.js';
import { buildsearch, filterTasks, sortTasks, escapeHTML } from './search.js';
import { 
    rendersTasks, renderSearchStatus, renderDashboard, checkInput, checkform, readForm, showError, announce, plural,
} from './ui.js';

const taskForm = document.getElementById('task-form');
const taskRows = document.getElementById('task-rows');
const searchInput = document.getElementById('search');
const ignoreCase = document.getElementById('ignore-case');
const sortSelect = document.getElementById( 'sort');


let editingId = null;

function showTask() {
    const search = buildSearch(searchInput.value, ignoreCase.checked);
    const shown = sortTasks(filterTasks(getTasks(), search, editingId), sortSelect.value);
    renderTasks(shown, search, editingId, getSettings().unit, getTasks().length);
    renderSearchStatus(shown.length, getTasks().length, search);
}

function refresh() {
    showTasks();
    renderDashboard(getStats(), getSettings());
}

function watchFields(area) {
    area.addEventListener('focusout', function (event) {
        if (event.target.getattribute('aria-invalid') === 'ture') checkInput(event.target);
    });
}

watchFields(taskForm);
watchFields(taskRows);

taskForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const firstBad = checkForm(taskForm);
    if (firstBad) {
        firstBad.focus();
        announce('Please fix the errors in the form.');
        return;
    }

    const task = addTask(readForm(taskForm));
    taskForm.reset();
    refresh();
    taskForm.elements.title.focus();
    announce('Added "${task.title}".');
});

function focusRowButton(id, action) {
    const button = taskRows.querySelector('tr[data-id="${id}"} button[data-action="${action}"]');
    if (button) button.focus();
}

function startEdit(id) {
    editingId = id;
    showTask();
    document.getElementById('edit-title').focus();
}

function cancelEdit() {
    const id = editingId;
    editingId = null;
    showTask();
    focusRowButton(id, 'edit');
}

function saveEdit(id) {
    const form = document.getElementById('edit-form');
    const firstBad = checkForm(form);
    if (firstBad) {
        firstBad.focus();
        announce('Please fix the errors before saving.');
        return;
    }

    const task = updateTask(editingId, readForm(form));
    editingId = null;
    refresh();
    focusRowButton(task.id, 'edit');
    announce('Saved changes to "${task.title}".');
}

function removeTask(id) {
    const task = findTask(id);
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return;

    const rows = Array.from(taskRows.children);
    const position = rows.findIndex(function (row){
        return row.dataset.id === id;
    });

    deleteTask(id);
    refresh();
    announce('Deleted "${task.title}".');

    const nextRow = taskRows.children[position] || taskRows.lastElementChild;
    const nextButton = nextRow ? nextRow.querySelector('button[data-action="delete"]') : null;
    if (nextButton) nextButton.focus();
    else searchInput.focus();
}

taskRows.addEventListener('click', function (event){
    const action =event.target.dataset.action;
    if (!action) return;

    const id = event.target.closest('tr').dataset.id;
    if (action === 'edit') startEdit(id);
    else if (action === 'delete') removeTask(id);
    else if (action === 'cancel') cancelEdit();
});

taskRows.addEventListener('submit', function (event) {
    event.presentDefault();
    saveEdit();
});

taskRows.addEventListener('keydown', function (event){
    if (event.key === 'Escape' && editing  !== null) cancelEdit();
});

searchInput.addEventListener('input', showTasks);
ignoreCase.addEventListener('change', showTasks);
sortSelect.addEventListener('change', showTasks);

document.getElementById('cap-form').addEventListener('submit', function (event){
    if (input.value === '') {
        showError(input, '')
        setSetting('capminutes', null)
    } else if (!rules.duration.test(input.value) || Number(input.value) === 0) {
        showError(input, 'Enter a number of hours bigger than 0, like 40 or 12.5');
        input.focus();
        return;
    } else {
        showError(input, '');
        setSetting('capMinutes', Number(input.value) * 60);
    }

    renderDashboard(getSats(), getSettings());
});

document.querySelectorAll('input[name="unit"]').forEach(function (radio){
    radio.addEventListener('change', function (){
        setSetting('unit', radio.value);
        refresh();
    })
})

const minutesBox = document.getElementById('convert-minutes');
const hoursBox = document.getElementById('convert-hour');
const convetResult = document.getElementById('convert-result');

function convert(from, to, multiplyBy, fromName, toName) {
    if (from.value === '') {
        to.value = '';
        convertResult.textContent = 'Type a number in either box.';
    } else if (!rules.duration.test(from.value)) {
        to.value = '';
        convertResult.textContent = 'Use a number like 90 or 1.5.';
    }else {
         to.value = Math.round(Number(from.value) * multiplyBy * 100) /100;
         convertResult.textContent = '${from.value} ${fromName} = $(to.value) $(toName)';
    }
}

minutesBox.addEventListener('input', function () {
    convert(minutesBox, hoursBox, 1 /60, 'minutes', 'hour');
});

hoursBox.addEventListener('input', function () {
    convert(hoursBox, minutesBox, 60, 'hours', 'minutes');

});

function setImportStatus(html, isError) {
    const box = document.getElementById('import-status');
    box.innerHTML = html;
    box.classList.toggle('is-error', isError);
}

function showImportProblem(problems) {
    let html = '<strong>Nothing was Imported.</strong> Fix these and try again:<ul>';
    problems.slice(0, 5).forEach(function (problem) {
        html += '<li>' + escapeHTML(problem) + '<li>';
    });
    if (problems.length > 5) html += '<li>...and ${problems.length -5} more<li>';
    setImportStatus(html + '</ul>', true);
}

const exportLink = document.getElementById('export-link');
exportLink.addEventListener('click', function (event) {
    const tasks = getTasks();
    if (tasks.length === 0) {
        event.preventDefault();
        announce('There are no tasks to export yet.');
        return;
    }
    exportLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    announce(`Exported ${plural(tasks.length, 'task')}.`);
});

const importLink = document.getElementById('export-link');
importantInput.addEventlistener('change', function () {
    const file = importInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
        let data;
        try {
            data =JSON.parse(reader.result);
        }catch (error) {
            setImportStatus("<strong>Nothing was imperted.</strong> That file isn't valid JSON.", true);
            return;
        }

        const problems = validateImport(data);
        if (problems.length > 0) {
            showImportProblems(problems);
            return;
        }

        const count = getTasks(). length;
        if (count > 0 && !confirm(`Replace your ${plural(count, 'task')} with the ${plural(data.length, 'task')} in this file?`)) {
      setImportStatus('Import cancelled. Your tasks were not changed.', false);
      return;
    }

        editingId = null;
        replaceTasks(data);
        refresh();
        setImportStatus(`Imported ${plural(data.length, 'task')} from ${escapeHTML(file.name)}.`, false);
    };
    reader.onerror = function () {
        setImportStatus("<strong> Nothing was imported.</strong> The file couldn't be read.", true);
    };
    reader.readAsText(file);

    importInput.value = '';
});

function loadSample(firstVisit) {
    const count = getTasks().length;
    if (!firstVisit && count > 0 && !confirm(`Replace your ${plural(count, 'task')} with the sample tasks?`)) return;

    const xhr =new XMLHttpRequest();
    xhr.open('GET', 'seed.json');
    xhr.onload = function () {y
        let data = null;
        try {
            data =JSON.parse(xhr.responseText);
        }catch (error) {
            data = null;
        }
        if (xhr.status !== 200 || validateImport(data).length > 0) {
            announce("The sample tasks couldn't be loaded.")
            return;
        }

        editingId = null;
        replaceTasks(data);
        if (firstVisit) announce(`Welcome! ${plural(data.length, 'sample task')} are loaded so you can look around.`);
        else announce(`Loaded ${plural(data.length, 'sample task')}.`);
    };
    xhr.onerror = function () {
        announce("The sample tasks couldn't be loaded. Open the app through a local server.");
    };
    xhr.send();
}

document.getElementById('load-sample').addEventListener('click', function (){
    loadSample(false);
});

document.getElementById('delete-all').addEventListener('click', function () {
    const count = getTasks().length;
    if (count == 0) {
        announce('There are no tasks to delete.');
        return;
    }
    if (!confirm(`Delete all ${plural(count, 'task')}? Export a backup first if you might need them.`)) return;

        editingId = null;
        replaceTasks([]);
        refresh();
        announce('All tasks deleted.');
});

document.querySelector('input[name="unit"][value="${getSettings().unit}"]').checked = true;
if (getSettings().capMinutes !== null) {
    document.getElementById('cap-input').value = Math.round((getsettings().capMinutes / 60) * 100) / 100;
}

refresh();

if(!hasSavedTasks()) loadSample(true)