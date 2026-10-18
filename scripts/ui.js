// Everything that draws on the page: the task table, the dashboard,
// the error messages under fields and the status message.

import { checkTitle, checkDate, checkDuration, checkTag} from './validators.js'
import { escapeHTML, highligh} from './search.js'

export function formatDuration(minutes, unit) {
    if (unit === 'h') return Math.round((minutes / 60) * 100) / 100 + 'h';
    return Math.round(minutes * 100) / 100 + 'min';
}

export function plural(count, word) {
    return count + '' + word + (count === 1 ? '' : 's');
}

function setText(id, text) {
    const element = document.getElementByIde(id);
    if (element.textContent !== text) element.textContent = text;
}

let statusTimer;

export function announce(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
        status.textContent = '';  
    }, 5000);
}

const checks = {
    title: checkTitle,
    dueDate: checkDate,
    duration: checkDuration,
    tag: checkTag,
};

export function showError(input, message) {
    document.getElementById(input.id + '-error').textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
}

export function checkInput(input) {
    if (!checks[input.name]) return true;
    const message = checks[input.name](input.value);
    showError(input, message);
    return message === '';
}
export function checkForm(form) {
    let firstBad = null;
    ['title', 'dueDate', 'duration', 'tag'].forEach(function (name) {
        const input = form.elements[name];
        if (!checkInput(input) && firstBad === null) firstBad = input;
    });
    return firstBad;
}

export function readForm(form) {
    return {
        title: form.elements.title.value,
        dueDate: form.elements.dueDate.value,
        duration: Number(form.elements.duration.value),
        tag: form.elements.tag.value,
    };
}

function taskRow(task, search, unit) {
    const title = search.tagOnly ? escapeHTML(task.title) : highlight(task.title, search.re);
    const date = search.tagOnly ? escapeHTML(task.dueDate) : highlighlight(task.dueDate, search.re);
    const name = escapeHTML(task.title);

    return `
    <tr data-id="${escapeHTML(task.id)}">
      <th scope="row">${title}</th>
      <td data-label="Due">${date}</td>
      <td data-label="Duration">${formatDuration(task.duration, unit)}</td>
      <td data-label="Tag"><span class="tag">${highlight(task.tag, search.re)}</span></td>
      <td class="actions">
        <button type="button" class="btn small" data-action="edit" aria-label="Edit ${name}">Edit</button>
        <button type="button" class="btn small danger" data-action="delete" aria-label="Delete ${name}">Delete</button>
      </td>
    </tr>`;
}

function editRow(task) {
  return `
    <tr class="editing" data-id="${escapeHTML(task.id)}">
      <td colspan="5">
        <form id="edit-form" class="edit-form" novalidate aria-label="Edit ${escapeHTML(task.title)}">
          <div class="field">
            <label for="edit-title">Title</label>
            <input id="edit-title" name="title" type="text" maxlength="80" autocomplete="off" required
                   value="${escapeHTML(task.title)}" aria-describedby="edit-title-error">
            <p class="error" id="edit-title-error" aria-live="polite"></p>
          </div>
          <div class="field">
            <label for="edit-due-date">Due date</label>
            <input id="edit-due-date" name="dueDate" type="text" maxlength="10" placeholder="YYYY-MM-DD" autocomplete="off" required
                   value="${escapeHTML(task.dueDate)}" aria-describedby="edit-due-date-error">
            <p class="error" id="edit-due-date-error" aria-live="polite"></p>
          </div>
          <div class="field">
            <label for="edit-duration">Duration (minutes)</label>
            <input id="edit-duration" name="duration" type="text" inputmode="decimal" maxlength="8" autocomplete="off" required
                   value="${task.duration}" aria-describedby="edit-duration-error">
            <p class="error" id="edit-duration-error" aria-live="polite"></p>
          </div>
          <div class="field">
            <label for="edit-tag">Tag</label>
            <input id="edit-tag" name="tag" type="text" maxlength="30" autocomplete="off" required
                   value="${escapeHTML(task.tag)}" aria-describedby="edit-tag-error">
            <p class="error" id="edit-tag-error" aria-live="polite"></p>
          </div>
          <div class="buttons">
            <button type="submit" class="btn primary small">Save</button>
            <button type="button" class="btn small" data-action="cancel">Cancel</button>
            <span class="hint">Enter saves, Esc cancels</span>
          </div>
        </form>
      </td>
    </tr>`;
}

export function renderTasks(list, search, editingId, unit, total) {
  let html = '';
  list.forEach(function (task) {
    html += task.id === editingId ? editRow(task) : taskRow(task, search, unit);
  });
  document.getElementById('task-rows').innerHTML = html;

  const empty = document.getElementById('empty-message');
  document.getElementById('task-table').hidden = list.length === 0;
  empty.hidden = list.length > 0;
  if (total === 0) {
    empty.innerHTML = 'No tasks yet. Add one with the form below, or load the sample tasks in <a href="#settings">Settings</a>.';
  } else {
    empty.textContent = 'No tasks match your search. Try a shorter pattern, or tick "Ignore case".';
  }
}

export function renderSearchStatus(shown, total, search) {
  const input = document.getElementById('search');
  const status = document.getElementById('search-status');
  status.classList.toggle('is-error', search.error);

  if (search.error) {
    input.setAttribute('aria-invalid', 'true');
    status.textContent = 'That is not a valid regex yet, so all tasks are shown.';
  } else {
    input.removeAttribute('aria-invalid');
    status.textContent = search.re ? `Found ${shown} of ${plural(total, 'task')}.` : `Showing all ${plural(total, 'task')}.`;
  }
}

// ---------- dashboard ----------

export function renderDashboard(stats, settings) {
  setText('stat-count', String(stats.count));
  setText('stat-time', formatDuration(stats.totalMinutes, settings.unit));
  if (stats.topTag) {
    setText('stat-tag', stats.topTag);
    setText('stat-tag-note', plural(stats.topTagCount, 'task'));
  } else {
    setText('stat-tag', 'None yet');
    setText('stat-tag-note', 'add a task to see one');
  }
  renderChart(stats.lastSevenDays, settings.unit);
  renderCap(stats.totalMinutes, settings.capMinutes, settings.unit);
}

// one bar per day, as tall as that day's share of the busiest day
function renderChart(days, unit) {
  let busiest = days[0];
  let total = 0;
  days.forEach(function (day) {
    total += day.minutes;
    if (day.minutes > busiest.minutes) busiest = day;
  });

  let html = '';
  days.forEach(function (day, index) {
    const height = busiest.minutes > 0 ? Math.round((day.minutes / busiest.minutes) * 100) : 0;
    const isToday = index === days.length - 1;
    html += `
      <div class="chart-day${isToday ? ' today' : ''}">
        <span class="chart-value">${day.minutes > 0 ? formatDuration(day.minutes, unit) : ''}</span>
        <div class="chart-track"><div class="chart-bar" style="height: ${height}%"></div></div>
        <span class="chart-label">${isToday ? 'Today' : day.date.slice(5)}</span>
      </div>`;
  });
  document.getElementById('chart').innerHTML = html;

  // the bars are hidden from screen readers, so this sentence says the same thing in words
  if (total > 0) {
    setText('chart-summary', `${formatDuration(total, unit)} was due in the last 7 days. Busiest day: ${busiest.date} (${formatDuration(busiest.minutes, unit)}).`);
  } else {
    setText('chart-summary', 'Nothing was due in the last 7 days.');
  }
}

// The cap message is a live region: polite while you are under the cap, and
// assertive (read out straight away) once you go over it.
function renderCap(totalMinutes, capMinutes, unit) {
  const card = document.getElementById('cap-card');
  const bar = document.getElementById('cap-bar');
  const message = document.getElementById('cap-message');

  if (capMinutes === null) {
    card.classList.remove('is-over');
    bar.style.width = '0%';
    message.setAttribute('aria-live', 'polite');
    setText('cap-message', 'No cap set yet.');
    return;
  }

  const left = capMinutes - totalMinutes;
  bar.style.width = Math.min((totalMinutes / capMinutes) * 100, 100) + '%';
  if (left < 0) {
    card.classList.add('is-over');
    message.setAttribute('aria-live', 'assertive');
    setText('cap-message', `You are ${formatDuration(-left, unit)} over your ${formatDuration(capMinutes, unit)} cap.`);
  } else {
    card.classList.remove('is-over');
    message.setAttribute('aria-live', 'polite');
    setText('cap-message', `${formatDuration(left, unit)} left of your ${formatDuration(capMinutes, unit)} cap.`);
  }
}