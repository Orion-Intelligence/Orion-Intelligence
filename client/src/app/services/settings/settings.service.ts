import { Injectable } from '@angular/core';

export type Settings = {
    iocExpanded?: boolean;
};

const SETTINGS_KEY = 'appSettings';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private settings: Settings = {};

    constructor() {
        this.loadSettings();
    }

    private loadSettings() {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            try {
                this.settings = JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing settings:', e);
            }
        }
    }

    private saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }

    get<T extends keyof Settings>(key: T, defaultValue: Settings[T]): Settings[T] {
        return this.settings[key] !== undefined ? this.settings[key]! : defaultValue;
    }

    set<T extends keyof Settings>(key: T, value: Settings[T]) {
        this.settings[key] = value;
        this.saveSettings();
    }
}
