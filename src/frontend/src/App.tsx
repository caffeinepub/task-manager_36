import { Toaster } from "@/components/ui/sonner";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  Plus,
  Settings,
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

export default function App() {
  const [theme, setTheme] = useState<ThemeColor>(getInitialTheme);
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-amber-500 text-white text-sm font-medium overflow-hidden z-50"
          >
            <div className="px-4 py-2 flex items-center gap-2">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>You're offline — the app is running from cache.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout: full-screen mobile, centered card desktop */}
      <div className="flex-1 flex flex-col sm:items-center sm:justify-center sm:py-10 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full flex flex-col flex-1 sm:flex-none sm:w-full sm:max-w-md sm:rounded-3xl sm:border sm:border-white/10 sm:bg-white/5 sm:backdrop-blur-xl sm:shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-4 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Task Manager
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Keep track of your most important tasks today.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {/* Online dot */}
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400" : "bg-amber-400"}`}
                title={isOnline ? "Online" : "Offline"}
              />
              {/* Settings gear */}
              <button
                type="button"
                data-ocid="settings.open_modal_button"
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Open settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Add task form */}
          <form onSubmit={handleAddTask} className="px-6 pb-4 flex gap-2">
            <input
              data-ocid="todo.input"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add a new task…"
              className="flex-1 h-11 px-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ focusRingColor: accentColor } as React.CSSProperties}
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
              className="h-11 px-4 rounded-xl text-white font-semibold text-sm flex items-center gap-1.5 transition-opacity disabled:opacity-40"
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
                className="flex items-center justify-center py-16 gap-2 text-slate-400"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : tasks.length === 0 ? (
              <motion.div
                data-ocid="todo.empty_state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 gap-3 text-center"
              >
                <ClipboardList className="w-10 h-10 text-slate-600" />
                <p className="text-slate-400 text-sm">
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
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <button
                        type="button"
                        data-ocid={`todo.checkbox.${idx + 1}`}
                        onClick={() => handleToggle(task.id)}
                        disabled={toggleTask.isPending}
                        className="flex-shrink-0 transition-opacity disabled:opacity-50"
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
                          <Circle className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <span
                        className={`flex-1 text-sm transition-all ${
                          task.completed
                            ? "line-through text-slate-600"
                            : "text-slate-100"
                        }`}
                      >
                        {task.text}
                      </span>

                      <button
                        type="button"
                        data-ocid={`todo.delete_button.${idx + 1}`}
                        onClick={() => handleDelete(task.id)}
                        disabled={deleteTask.isPending}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all disabled:opacity-30"
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
          <div className="px-6 py-4 border-t border-white/5 text-center">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-400 transition-colors"
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              ref={modalRef}
              data-ocid="settings.dialog"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <button
                  type="button"
                  data-ocid="settings.close_button"
                  onClick={() => setSettingsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme color picker */}
              <div className="px-6 pb-8">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Theme Color
                </p>
                <div className="flex items-center gap-3">
                  {SWATCHES.map((swatch) => (
                    <button
                      key={swatch.key}
                      type="button"
                      data-ocid={"settings.toggle"}
                      onClick={() => {
                        setTheme(swatch.key);
                      }}
                      aria-label={`Set ${swatch.key} theme`}
                      className={`w-10 h-10 rounded-full transition-all ${
                        theme === swatch.key
                          ? "opacity-100 ring-2 ring-offset-2 ring-offset-slate-900"
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
