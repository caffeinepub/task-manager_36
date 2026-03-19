import { Toaster } from "@/components/ui/sonner";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Settings,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type Task,
  useAddTask,
  useDeleteTask,
  useListTasks,
  useRenameTask,
  useToggleTask,
} from "./hooks/useQueries";

type ThemeColor = "cyan" | "purple" | "emerald" | "rose" | "amber";

const SWATCHES: { key: ThemeColor; color: string; ring: string }[] = [
  { key: "cyan", color: "#06b6d4", ring: "ring-cyan-500" },
  { key: "purple", color: "#a855f7", ring: "ring-purple-500" },
  { key: "emerald", color: "#10b981", ring: "ring-emerald-500" },
  { key: "rose", color: "#f43f5e", ring: "ring-rose-500" },
  { key: "amber", color: "#f59e0b", ring: "ring-amber-500" },
];

const LS_THEME = "theme";
const LS_DARK_MODE = "darkMode";
const LS_TIMESTAMPS = "taskTimestamps";
const MS_24H = 24 * 60 * 60 * 1000;

function getInitialTheme(): ThemeColor {
  try {
    const stored = localStorage.getItem(LS_THEME);
    if (stored && SWATCHES.some((s) => s.key === stored))
      return stored as ThemeColor;
  } catch {
    /* ignore */
  }
  return "cyan";
}

function getInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(LS_DARK_MODE);
    if (stored !== null) return stored === "true";
  } catch {
    /* ignore */
  }
  return true;
}

function loadTimestamps(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_TIMESTAMPS);
    if (raw) return JSON.parse(raw) as Record<string, number>;
  } catch {
    /* ignore */
  }
  return {};
}

function saveTimestamps(map: Record<string, number>) {
  try {
    localStorage.setItem(LS_TIMESTAMPS, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function formatDueDate(dueDate: string): string {
  // Parse as local date to avoid timezone shift
  const [year, month, day] = dueDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function App() {
  const [theme, setTheme] = useState<ThemeColor>(getInitialTheme);
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [tick, setTick] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calendar/schedule state
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleText, setScheduleText] = useState("");

  // Rename state
  const [renamingTask, setRenamingTask] = useState<{
    id: bigint;
    text: string;
  } | null>(null);
  const [renameText, setRenameText] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const renameModalRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: tasks = [], isLoading } = useListTasks();
  const addTask = useAddTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const renameTask = useRenameTask();

  const accentColor = SWATCHES.find((s) => s.key === theme)?.color ?? "#06b6d4";

  // Sync timestamps when tasks load
  useEffect(() => {
    if (!tasks.length) return;
    const map = loadTimestamps();
    let changed = false;
    for (const task of tasks) {
      const key = task.id.toString();
      if (!(key in map)) {
        map[key] = Date.now();
        changed = true;
      }
    }
    if (changed) saveTimestamps(map);
  }, [tasks]);

  // Re-check every minute
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Persist theme
  useEffect(() => {
    try {
      localStorage.setItem(LS_THEME, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Persist dark mode
  useEffect(() => {
    try {
      localStorage.setItem(LS_DARK_MODE, String(darkMode));
    } catch {
      /* ignore */
    }
  }, [darkMode]);

  // Close settings modal on outside click
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [settingsOpen]);

  // Lock body scroll when any modal open
  useEffect(() => {
    document.body.style.overflow =
      settingsOpen || !!renamingTask ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [settingsOpen, renamingTask]);

  // Auto-focus rename input when dialog opens
  useEffect(() => {
    if (renamingTask) {
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [renamingTask]);

  // Long press handlers
  const startLongPress = (task: Task) => {
    longPressTimerRef.current = setTimeout(() => {
      setRenamingTask({ id: task.id, text: task.text });
      setRenameText(task.text);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const closeRenameDialog = () => {
    setRenamingTask(null);
    setRenameText("");
  };

  const handleRename = async () => {
    if (!renamingTask) return;
    const trimmed = renameText.trim();
    if (!trimmed) return;
    try {
      await renameTask.mutateAsync({ id: renamingTask.id, newText: trimmed });
      closeRenameDialog();
    } catch {
      toast.error("Failed to rename task.");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskText.trim();
    if (!text) return;
    setNewTaskText("");
    try {
      await addTask.mutateAsync({ text });
    } catch {
      toast.error("Failed to add task.");
    }
  };

  const handleScheduleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = scheduleText.trim();
    if (!text || !scheduleDate) return;
    try {
      await addTask.mutateAsync({ text, dueDate: scheduleDate });
      setScheduleText("");
      setScheduleDate("");
      setSettingsOpen(false);
      toast.success(`Task scheduled for ${formatDueDate(scheduleDate)}`);
    } catch {
      toast.error("Failed to schedule task.");
    }
  };

  const handleToggle = async (id: bigint) => {
    try {
      await toggleTask.mutateAsync(id);
    } catch {
      toast.error("Failed to update task.");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteTask.mutateAsync(id);
      // Remove timestamp entry
      const map = loadTimestamps();
      delete map[id.toString()];
      saveTimestamps(map);
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  // Compute dot state for a task (depends on tick so interval triggers re-render)
  const getDotState = (
    id: bigint,
    completed: boolean,
  ): "done" | "overdue" | "active" => {
    void tick; // reactive dependency
    if (completed) return "done";
    const map = loadTimestamps();
    const ts = map[id.toString()];
    if (ts && Date.now() - ts > MS_24H) return "overdue";
    return "active";
  };

  // Dynamic color classes based on dark/light mode
  const bg = darkMode ? "bg-slate-950" : "bg-gray-50";
  const cardBg = darkMode
    ? "sm:bg-white/5 sm:border-white/10"
    : "sm:bg-white sm:border-gray-200 sm:shadow-lg";
  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const subtitleColor = darkMode ? "text-slate-400" : "text-gray-500";
  const inputBg = darkMode
    ? "bg-black/20 border-white/10 text-white placeholder-slate-500"
    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400";
  const taskHover = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const taskText = darkMode ? "text-slate-100" : "text-gray-800";
  const taskDone = darkMode ? "text-slate-600" : "text-gray-400";
  const emptyIcon = darkMode ? "text-slate-600" : "text-gray-300";
  const emptyText = darkMode ? "text-slate-400" : "text-gray-400";
  const footerBorder = darkMode ? "border-white/5" : "border-gray-100";
  const footerText = darkMode ? "text-slate-600" : "text-gray-400";
  const settingsBtnColor = darkMode
    ? "text-slate-400 hover:text-white hover:bg-white/10"
    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100";
  const modalBg = darkMode
    ? "bg-slate-900 border-white/10"
    : "bg-white border-gray-200";
  const modalTitle = darkMode ? "text-white" : "text-gray-900";
  const modalLabel = darkMode ? "text-slate-400" : "text-gray-500";
  const modalClose = darkMode
    ? "text-slate-400 hover:text-white hover:bg-white/10"
    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100";
  const renameInputBg = darkMode
    ? "bg-black/30 border-white/10 text-white placeholder-slate-500"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400";
  const dueDateBadge = darkMode
    ? "bg-white/8 text-slate-400"
    : "bg-gray-100 text-gray-400";

  return (
    <div
      className={`min-h-screen ${bg} flex flex-col transition-colors duration-500`}
    >
      {/* Main layout */}
      <div className="flex-1 flex flex-col sm:items-center sm:justify-center sm:py-10 sm:px-4">
        {/* Card — spring entrance */}
        <motion.div
          initial={{ opacity: 0, y: 54 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className={`w-full flex flex-col flex-1 sm:flex-none sm:w-full sm:max-w-md sm:rounded-3xl sm:border sm:backdrop-blur-xl sm:shadow-2xl overflow-hidden transition-colors duration-500 ${cardBg}`}
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-4 flex flex-col items-center relative">
            {/* Settings — top right */}
            <div className="absolute top-8 right-6 flex items-center gap-2">
              <button
                type="button"
                data-ocid="settings.open_modal_button"
                onClick={() => setSettingsOpen(true)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${settingsBtnColor}`}
                aria-label="Open settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Centered title */}
            <motion.h1
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.75,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`text-3xl font-bold tracking-tight text-center transition-colors duration-500 ${titleColor}`}
            >
              Daily Focus
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.75, delay: 0.3 }}
              className={`text-sm mt-1 text-center transition-colors duration-500 ${subtitleColor}`}
            >
              Keep track of your most important tasks today.
            </motion.p>
          </div>

          {/* Add task form — staggered entrance */}
          <motion.form
            onSubmit={handleAddTask}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="px-6 pb-4 flex gap-2"
          >
            <input
              data-ocid="todo.input"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add a new task…"
              className={`flex-1 h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all duration-300 ${inputBg}`}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "";
              }}
              disabled={addTask.isPending}
            />
            {/* Submit button with press feel */}
            <motion.button
              type="submit"
              data-ocid="todo.add_button"
              disabled={!newTaskText.trim() || addTask.isPending}
              whileTap={{ scale: 0.925 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="h-11 px-4 rounded-xl text-white font-semibold text-sm flex items-center gap-1.5 transition-all duration-300 disabled:opacity-40 hover:brightness-110"
              style={{ backgroundColor: accentColor }}
            >
              {addTask.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Task list */}
          <div className="flex-1 px-4 pb-6">
            {isLoading ? (
              <div
                data-ocid="todo.loading_state"
                className={`flex items-center justify-center py-16 gap-2 ${subtitleColor}`}
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : tasks.length === 0 ? (
              <motion.div
                data-ocid="todo.empty_state"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center justify-center py-16 gap-3 text-center"
              >
                <ClipboardList className={`w-10 h-10 ${emptyIcon}`} />
                <p className={`text-sm ${emptyText}`}>
                  You're all caught up! Enjoy your day.
                </p>
              </motion.div>
            ) : (
              <ul className="space-y-1">
                <AnimatePresence initial={false}>
                  {tasks.map((task, idx) => {
                    const dotState = getDotState(task.id, task.completed);
                    const dotClass =
                      dotState === "done"
                        ? darkMode
                          ? "bg-slate-600"
                          : "bg-gray-300"
                        : dotState === "overdue"
                          ? "bg-red-500"
                          : darkMode
                            ? "bg-slate-500"
                            : "bg-gray-400";
                    const dotTitle =
                      dotState === "done"
                        ? "Completed"
                        : dotState === "overdue"
                          ? "Overdue – added more than 24 hours ago"
                          : "In progress";

                    return (
                      <motion.li
                        key={task.id.toString()}
                        data-ocid={`todo.item.${idx + 1}`}
                        initial={{ opacity: 0, x: -27 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                          opacity: 0,
                          scale: 0.94,
                          height: 0,
                          marginBottom: 0,
                        }}
                        transition={{
                          duration: 0.38,
                          ease: "easeOut",
                          delay: idx * 0.065,
                        }}
                        onMouseDown={() => startLongPress(task)}
                        onMouseUp={cancelLongPress}
                        onMouseLeave={cancelLongPress}
                        onTouchStart={() => startLongPress(task)}
                        onTouchEnd={cancelLongPress}
                        className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200 select-none ${taskHover}`}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Checkbox with micro-interaction */}
                        <motion.button
                          type="button"
                          data-ocid={`todo.checkbox.${idx + 1}`}
                          onClick={() => handleToggle(task.id)}
                          disabled={toggleTask.isPending}
                          whileTap={{ scale: 0.73 }}
                          transition={{
                            type: "spring",
                            stiffness: 240,
                            damping: 18,
                          }}
                          className="flex-shrink-0 transition-all duration-300 disabled:opacity-50"
                          aria-label={
                            task.completed ? "Mark incomplete" : "Mark complete"
                          }
                        >
                          {task.completed ? (
                            <CheckCircle2
                              className="w-5 h-5"
                              style={{ color: accentColor }}
                            />
                          ) : (
                            <Circle
                              className={`w-5 h-5 ${
                                darkMode ? "text-slate-600" : "text-gray-300"
                              }`}
                            />
                          )}
                        </motion.button>

                        {/* Task text with fade on completion */}
                        <motion.span
                          animate={{ opacity: task.completed ? 0.5 : 1 }}
                          transition={{ duration: 0.4 }}
                          className={`flex-1 text-sm transition-all duration-400 ${
                            task.completed
                              ? `line-through ${taskDone}`
                              : taskText
                          }`}
                        >
                          {task.text}
                        </motion.span>

                        {/* Due date badge */}
                        {task.dueDate && (
                          <span
                            className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors duration-300 ${dueDateBadge}`}
                          >
                            <CalendarDays className="w-3 h-3" />
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}

                        {/* Rename hint icon — visible on hover */}
                        <Pencil
                          className={`flex-shrink-0 w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-all duration-300 ${
                            darkMode ? "text-slate-400" : "text-gray-400"
                          }`}
                        />

                        <button
                          type="button"
                          data-ocid={`todo.delete_button.${idx + 1}`}
                          onClick={() => handleDelete(task.id)}
                          disabled={deleteTask.isPending}
                          className={`flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all duration-300 disabled:opacity-30 active:scale-90 ${
                            darkMode ? "text-slate-600" : "text-gray-300"
                          }`}
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Status dot */}
                        <motion.span
                          key={dotState}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          title={dotTitle}
                          className={`flex-shrink-0 w-2.5 h-2.5 rounded-full transition-colors duration-700 ${dotClass}`}
                        />
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>

          {/* Footer */}
          <div
            className={`px-6 py-4 border-t text-center transition-colors duration-500 ${footerBorder}`}
          >
            <p className={`text-xs ${footerText}`}>
              © {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-400 transition-colors duration-300"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              ref={modalRef}
              data-ocid="settings.dialog"
              initial={{ opacity: 0, y: 63, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 63, scale: 0.94 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full max-w-sm border rounded-3xl shadow-2xl overflow-hidden transition-colors duration-500 ${modalBg}`}
            >
              {/* Modal header */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h2 className={`text-lg font-bold ${modalTitle}`}>Settings</h2>
                <button
                  type="button"
                  data-ocid="settings.close_button"
                  onClick={() => setSettingsOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${modalClose}`}
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dark / Light mode toggle */}
              <div className="px-6 pb-6">
                <p
                  className={`text-xs font-semibold uppercase tracking-wider mb-3 ${modalLabel}`}
                >
                  Appearance
                </p>
                <div
                  className={`flex items-center justify-between p-1 rounded-xl ${
                    darkMode ? "bg-white/5" : "bg-gray-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setDarkMode(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      darkMode
                        ? "bg-slate-700 text-white shadow"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setDarkMode(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      !darkMode
                        ? "bg-white text-gray-900 shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                </div>
              </div>

              {/* Theme color picker */}
              <div className="px-6 pb-6">
                <p
                  className={`text-xs font-semibold uppercase tracking-wider mb-4 ${modalLabel}`}
                >
                  Theme Color
                </p>
                <div className="flex items-center gap-3">
                  {SWATCHES.map((swatch) => (
                    <motion.button
                      key={swatch.key}
                      type="button"
                      data-ocid="settings.toggle"
                      onClick={() => setTheme(swatch.key)}
                      whileTap={{ scale: 0.82 }}
                      whileHover={{ scale: 1.18 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                      aria-label={`Set ${swatch.key} theme`}
                      className={`w-10 h-10 rounded-full transition-all duration-300 ${
                        theme === swatch.key
                          ? `opacity-100 ring-2 ring-offset-2 ${
                              darkMode
                                ? "ring-offset-slate-900"
                                : "ring-offset-white"
                            }`
                          : "opacity-60 hover:opacity-80"
                      } ${swatch.ring}`}
                      style={{ backgroundColor: swatch.color }}
                    />
                  ))}
                </div>
              </div>

              {/* Schedule a Task — Calendar section */}
              <div
                className={`px-6 pb-8 border-t pt-6 transition-colors duration-500 ${
                  darkMode ? "border-white/5" : "border-gray-100"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5 ${modalLabel}`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Schedule a Task
                </p>
                <form
                  onSubmit={handleScheduleTask}
                  className="flex flex-col gap-3"
                >
                  {/* Date picker */}
                  <input
                    type="date"
                    data-ocid="settings.input"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl border text-sm focus:outline-none transition-all duration-300 ${renameInputBg}`}
                    style={{
                      colorScheme: darkMode ? "dark" : "light",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "";
                    }}
                  />
                  {/* Task name */}
                  <input
                    type="text"
                    data-ocid="settings.textarea"
                    value={scheduleText}
                    onChange={(e) => setScheduleText(e.target.value)}
                    placeholder="Task name…"
                    className={`w-full h-10 px-3 rounded-xl border text-sm focus:outline-none transition-all duration-300 ${renameInputBg}`}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "";
                    }}
                  />
                  {/* Add button */}
                  <motion.button
                    type="submit"
                    data-ocid="settings.submit_button"
                    disabled={
                      !scheduleText.trim() || !scheduleDate || addTask.isPending
                    }
                    whileTap={{ scale: 0.925 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-full h-10 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40 hover:brightness-110"
                    style={{ backgroundColor: accentColor }}
                  >
                    {addTask.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add to Calendar
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Dialog */}
      <AnimatePresence>
        {renamingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (
                renameModalRef.current &&
                !renameModalRef.current.contains(e.target as Node)
              ) {
                closeRenameDialog();
              }
            }}
          >
            <motion.div
              ref={renameModalRef}
              data-ocid="todo.dialog"
              initial={{ opacity: 0, y: 36, scale: 0.925 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.925 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              className={`w-full max-w-xs border rounded-2xl shadow-2xl overflow-hidden transition-colors duration-500 ${modalBg}`}
            >
              {/* Dialog header */}
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" style={{ color: accentColor }} />
                  <h2 className={`text-base font-bold ${modalTitle}`}>
                    Rename Task
                  </h2>
                </div>
                <button
                  type="button"
                  data-ocid="todo.close_button"
                  onClick={closeRenameDialog}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${modalClose}`}
                  aria-label="Close rename dialog"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Input */}
              <div className="px-5 pb-5">
                <input
                  ref={renameInputRef}
                  data-ocid="todo.input"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") closeRenameDialog();
                  }}
                  placeholder="Task name…"
                  className={`w-full h-10 px-3 rounded-xl border text-sm focus:outline-none transition-all duration-300 mb-4 ${renameInputBg}`}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-ocid="todo.cancel_button"
                    onClick={closeRenameDialog}
                    className={`flex-1 h-9 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 ${
                      darkMode
                        ? "bg-white/8 text-slate-300 hover:bg-white/12"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="button"
                    data-ocid="todo.save_button"
                    onClick={handleRename}
                    disabled={!renameText.trim() || renameTask.isPending}
                    whileTap={{ scale: 0.925 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="flex-1 h-9 rounded-xl text-white text-sm font-semibold transition-all duration-300 disabled:opacity-40 hover:brightness-110"
                    style={{ backgroundColor: accentColor }}
                  >
                    {renameTask.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Save"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="bottom-center" />
    </div>
  );
}
