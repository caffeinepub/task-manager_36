import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    id: bigint;
    text: string;
    completed: boolean;
}
export interface backendInterface {
    addTask(text: string): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    getTask(id: bigint): Promise<Task>;
    listTasks(): Promise<Array<Task>>;
    toggleTask(id: bigint): Promise<void>;
}
