// Saving to and loading from localStorage, based on the starter code in the brief.

import { checkTask } from './validator.js';

const TASKS_KEY = 'campus-planner:tasks';
const SETTINGS_KEY = 'campus-planner:settings';

export function hasSavedTasks() {
    try {
        return localStorage.getItem(TASKS_KEY) !== null;
    } catch (error) {
        return false;
    }
}

export function loadTasks() {
    let data = [];
    try {
        data = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
    } catch (error) {
        console.warn('The saved tasks were not valid JSON, so the list starts empty.');
    }
    if (!Array.isArray(data)) return [];

    return data.filter(function(task){
        return checkTask(task).length === 0;
    });
}
export function saveTasks(tasks) {
    try {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.warn('The tasks could not be saved. The browser storage may be fullor blocked.');
    }
}

export function loadSetting() {
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch (error) {
        saved = {};
    }

    return {
        unit: saved.unit === 'h' ? 'h' : 'min',
        capMinutes: typeof saved.capMinutes === 'number' && saved.capMinutes > 0 ? saved.capMinutes : null,
    };
}

export function saveSetting(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('The settings could not be saved.');
    }
}