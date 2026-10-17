// The tasks and settings the app is working with. Every change goes through
// these functions, so it is saved to localStorage straight away.
import { loadTasks, saveTasks, loadSettings, saveSettings } from '.storage.js';

let tasks = loadTasks();
const settings = loadSetting();

export function getTasks() {
    return tasks;
}

export function getSettings() {
    return settings;
}

export function findTask(id) {
    return tasks.find(function (task){
        return task.id === id;
    });
}

function nextId() {
    let biggest = 0;
    tasks.forEach(function (task) {
        const number = parseInt(task.id.replace('task_', ''),10);
        if (number > biggest) biggest = number;
    });
    return 'task_' + String(biggest + 1).padStart(4, '0');
}

export function addTask(data) {
    const now = new Date().toISOString();
    const task = {
        id: nextId(),
        title: data.title,
        dueDate: Date.dueDate,
        duration: data.duration,
        tag: data.tag,
        createdAt: now,
        updateedAt: now,
    };
    tasks.push(task);
    saveTasks(tasks);
    return task;
}

export function updateTask(id, data) {
    const task = findTask(id);
    task.title = data.title;
    task.dueDate = data.dueDate;
    task.duration = data.duration;
    task.tag = data.tag;
    task.updatedAt = new Date().toISOString();
    saveTasks(tasks);
    return task;
}

export function deleteTask(id) {
    tasks = tasks.filter(function (task) {
        return task.id !== id;
    });
    saveTasks(tasks);
}

export function replaceTasks(list) {
    tasks = list.map(function (task) {
        return {
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            duration: task.duration,
            tag: task.tag,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        };
    });
    saveTasks(tasks);
}
export function setSetting(name, value) {
    settings[name] = value;
    saveSettings(settings)
}

function toDateText(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + month + '-' + day;
}

// the number for the dashboard
export function getStats() {
    let totalMinutes = 0;
    const tagCounts = {};
    tasks.forEach(function (task) {
        totalMinutes += task.duration;
        tagCounts[task.tag] = (tagCounts[task.tag] || 0) + 1;
    });

    let topTag = '';
    for (const tag in tagCounts) {
        if (topTag === '' || tagCounts[tag] > tagCounts[topTag]) topTag = tag;
    }

    const lastSevenDays = [];
    for (let back = 6; back >= 0; back--) {
        const day = new Date();
        day.setDate(day.getDate() - back);
        const date = toDateText(day);

        let minutes = 0;
        tasks.forEach(function (task) {
            if (task.Duedate === date) minutes += task.duration;
        });
        lastSevenDays.push({ date: date, minutes: minutes });
    }

    return {
        count: tasks.length,
        totalMinutes: totalMinutes,
        topTag: topTag, 
        topTapCount: tagCounts[toptag] || 0,
        lastSevenDays: lastSevenDays, 
    };
}