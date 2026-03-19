import { Toaster } from "@/components/ui/sonner";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  Moon,
  Plus,
  Settings,
  Sun,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAddTask,
  useDeleteTask,
  useListTasks,
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

export default function App() {
  const [theme, setTheme] = useState<ThemeColor>(getInitialTheme);
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: tasks = [], isLoading } = useListTasks();
  const addTask = useAddTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const accentColor = SWATCHES.find((s) => s.key === theme)?.color ?? "#06b6d4";

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

  // Online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online!");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Running from cache.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Close modal on outside click
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

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = settingsOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [settingsOpen]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskText.trim();
    if (!text) return;
    setNewTaskText("");
    try {
      await addTask.mutateAsync(text);
    } catch {
      toast.error("Failed to add task.");
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
    } catch {
      toast.error("Failed to delete task.");
    }
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

  return (
    <div
      className={`min-h-screen ${bg} flex flex-col transition-colors duration-300`}
    >
      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-amber-500 text-white text-sm font-medium overflow-hidden z-50"
          >
            <div className="px-4 py-2 flex items-center gap-2">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>You're offline — the app is running from cache.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex-1 flex flex-col sm:items-center sm:justify-center sm:py-10 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full flex flex-col flex-1 sm:flex-none sm:w-full sm:max-w-md sm:rounded-3xl sm:border sm:backdrop-blur-xl sm:shadow-2xl overflow-hidden transition-colors duration-300 ${cardBg}`}
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-4 flex flex-col items-center relative">
            {/* Settings + online dot — top right */}
            <div className="absolute top-8 right-6 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-500 ${
                  isOnline ? "bg-green-400" : "bg-amber-400"
                }`}
                title={isOnline ? "Online" : "Offline"}
              />
              <button
                type="button"
                data-ocid="settings.open_modal_button"
                onClick={() => setSettingsOpen(true)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${settingsBtnColor}`}
                aria-label="Open settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Centered title */}
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`text-3xl font-bold tracking-tight text-center transition-colors duration-300 ${titleColor}`}
            >
              Daily Focus
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`text-sm mt-1 text-center transition-colors duration-300 ${subtitleColor}`}
            >
              Keep track of your most important tasks today.
            </motion.p>
          </div>

          {/* Add task form */}
          <form onSubmit={handleAddTask} className="px-6 pb-4 flex gap-2">
            <input
              data-ocid="todo.input"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add a new task…"
              className={`flex-1 h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all duration-200 ${inputBg}`}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "";
              }}
              disabled={addTask.isPending}
            />
            <button
              type="submit"
              data-ocid="todo.add_button"
              disabled={!newTaskText.trim() || addTask.isPending}
              className="h-11 px-4 rounded-xl text-white font-semibold text-sm flex items-center gap-1.5 transition-all duration-200 disabled:opacity-40 hover:brightness-110 active:scale-95"
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
            </button>
          </form>

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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
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
                  {tasks.map((task, idx) => (
                    <motion.li
                      key={task.id.toString()}
                      data-ocid={`todo.item.${idx + 1}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-150 ${taskHover}`}
                    >
                      <button
                        type="button"
                        data-ocid={`todo.checkbox.${idx + 1}`}
                        onClick={() => handleToggle(task.id)}
                        disabled={toggleTask.isPending}
                        className="flex-shrink-0 transition-all duration-200 disabled:opacity-50 active:scale-90"
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
                            className={`w-5 h-5 ${darkMode ? "text-slate-600" : "text-gray-300"}`}
                          />
                        )}
                      </button>

                      <span
                        className={`flex-1 text-sm transition-all duration-300 ${
                          task.completed ? `line-through ${taskDone}` : taskText
                        }`}
                      >
                        {task.text}
                      </span>

                      <button
                        type="button"
                        data-ocid={`todo.delete_button.${idx + 1}`}
                        onClick={() => handleDelete(task.id)}
                        disabled={deleteTask.isPending}
                        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all duration-200 disabled:opacity-30 active:scale-90 ${darkMode ? "text-slate-600" : "text-gray-300"}`}
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          {/* Footer */}
          <div
            className={`px-6 py-4 border-t text-center transition-colors duration-300 ${footerBorder}`}
          >
            <p className={`text-xs ${footerText}`}>
              © {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-400 transition-colors duration-200"
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              ref={modalRef}
              data-ocid="settings.dialog"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full max-w-sm border rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300 ${modalBg}`}
            >
              {/* Modal header */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h2 className={`text-lg font-bold ${modalTitle}`}>Settings</h2>
                <button
                  type="button"
                  data-ocid="settings.close_button"
                  onClick={() => setSettingsOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${modalClose}`}
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
                  className={`flex items-center justify-between p-1 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-100"}`}
                >
                  <button
                    type="button"
                    onClick={() => setDarkMode(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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
              <div className="px-6 pb-8">
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
                      data-ocid={"settings.toggle"}
                      onClick={() => setTheme(swatch.key)}
                      whileTap={{ scale: 0.88 }}
                      whileHover={{ scale: 1.1 }}
                      aria-label={`Set ${swatch.key} theme`}
                      className={`w-10 h-10 rounded-full transition-all duration-200 ${
                        theme === swatch.key
                          ? `opacity-100 ring-2 ring-offset-2 ${darkMode ? "ring-offset-slate-900" : "ring-offset-white"}`
                          : "opacity-60 hover:opacity-80"
                      } ${swatch.ring}`}
                      style={{ backgroundColor: swatch.color }}
                    />
                  ))}
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
