import type { Habit } from './habit';

export interface AppData {
    version: number;
    habits: Habit[];
}
