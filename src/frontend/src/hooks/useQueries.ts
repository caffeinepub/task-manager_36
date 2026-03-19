import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const LS_TASKS = "tasks";

export type Task = {
  id: bigint;
  text: string;
  completed: boolean;
  dueDate?: string; // ISO date string YYYY-MM-DD
};

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LS_TASKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      id: string;
      text: string;
      completed: boolean;
      dueDate?: string;
    }[];
    return parsed.map((t) => ({ ...t, id: BigInt(t.id) }));
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(
      LS_TASKS,
      JSON.stringify(tasks.map((t) => ({ ...t, id: t.id.toString() }))),
    );
  } catch {
    /* ignore */
  }
}

function nextId(tasks: Task[]): bigint {
  if (tasks.length === 0) return 1n;
  return tasks.reduce((max, t) => (t.id > max ? t.id : max), 0n) + 1n;
}

export function useListTasks() {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => loadTasks(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useAddTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: { text: string; dueDate?: string } | string,
    ) => {
      const tasks = loadTasks();
      const text = typeof payload === "string" ? payload : payload.text;
      const dueDate = typeof payload === "string" ? undefined : payload.dueDate;
      const newTask: Task = {
        id: nextId(tasks),
        text,
        completed: false,
        ...(dueDate ? { dueDate } : {}),
      };
      saveTasks([...tasks, newTask]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const tasks = loadTasks().map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      );
      saveTasks(tasks);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      saveTasks(loadTasks().filter((t) => t.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useRenameTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newText }: { id: bigint; newText: string }) => {
      const tasks = loadTasks().map((t) =>
        t.id === id ? { ...t, text: newText } : t,
      );
      saveTasks(tasks);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
