import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toaster } from "@/components/ui/sonner";
import {
  CheckCircle2,
  CheckSquare,
  Circle,
  ClipboardList,
  Loader2,
  Plus,
  Settings,
  Trash2,
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

type Theme = "default" | "dark" | "forest" | "royal";

const THEME_OPTIONS: {
  value: Theme;
  label: string;
  description: string;
  swatch: string;
}[] = [
  {
    value: "default",
    label: "Default (Light)",
    description: "Clean light interface",
    swatch: "#3B82F6",
  },
  {
    value: "dark",
    label: "Dark Mode",
    description: "Easy on the eyes",
    swatch: "#1B3350",
  },
  {
    value: "forest",
    label: "Forest Green",
    description: "Natural and calm",
    swatch: "#16a34a",
  },
  {
    value: "royal",
    label: "Royal Blue",
    description: "Bold and majestic",
    swatch: "#4338ca",
  },
];

export default function App() {
  const [theme, setTheme] = useState<Theme>("default");
  const [pendingTheme, setPendingTheme] = useState<Theme>(theme);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: tasks = [], isLoading } = useListTasks();
  const addTask = useAddTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  // Apply theme to root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "default") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskText.trim();
    if (!text) return;
    setNewTaskText("");
    try {
      await addTask.mutateAsync(text);
      toast.success("Task added!");
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
      toast.success("Task removed.");
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  const handleApplyTheme = () => {
    setTheme(pendingTheme);
    setSettingsOpen(false);
    toast.success("Theme applied!");
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="bg-nav-bg shadow-nav sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <CheckSquare className="w-4.5 h-4.5 text-nav-fg" />
            </div>
            <span className="text-nav-fg font-semibold text-lg tracking-tight">
              TaskFlow
            </span>
          </div>

          {/* Gear / Settings dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              data-ocid="nav.settings_button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-nav-fg/70 hover:text-nav-fg hover:bg-white/10 transition-colors"
              aria-label="Open settings menu"
            >
              <Settings className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  data-ocid="nav.dropdown_menu"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-44 bg-card border border-border rounded-lg shadow-card py-1 z-50"
                >
                  <button
                    type="button"
                    data-ocid="nav.open_modal_button"
                    onClick={() => {
                      setPendingTheme(theme);
                      setSettingsOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Hero header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Welcome back!
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? "Loading your tasks..."
                : totalCount === 0
                  ? "No tasks yet — add one below to get started."
                  : `${completedCount} of ${totalCount} task${totalCount !== 1 ? "s" : ""} completed`}
            </p>
          </motion.div>

          {/* Dashboard card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
          >
            {/* Add task section */}
            <div className="p-6 border-b border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Add New Task
              </h2>
              <form onSubmit={handleAddTask} className="flex gap-2">
                <Input
                  data-ocid="todo.input"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1 h-10 text-sm"
                  disabled={addTask.isPending}
                />
                <Button
                  data-ocid="todo.add_button"
                  type="submit"
                  disabled={!newTaskText.trim() || addTask.isPending}
                  className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  {addTask.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Task list section */}
            <div className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Tasks
              </h2>

              {isLoading ? (
                <div
                  data-ocid="todo.loading_state"
                  className="flex items-center justify-center py-12 gap-2 text-muted-foreground"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading tasks…</span>
                </div>
              ) : tasks.length === 0 ? (
                <motion.div
                  data-ocid="todo.empty_state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-14 gap-3 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <ClipboardList className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">No tasks yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first task above to get started.
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
                        exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <button
                          type="button"
                          data-ocid={`todo.checkbox.${idx + 1}`}
                          onClick={() => handleToggle(task.id)}
                          disabled={toggleTask.isPending}
                          className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                          aria-label={
                            task.completed ? "Mark incomplete" : "Mark complete"
                          }
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <span
                          className={`flex-1 text-sm transition-all ${
                            task.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.text}
                        </span>

                        <button
                          type="button"
                          data-ocid={`todo.delete_button.${idx + 1}`}
                          onClick={() => handleDelete(task.id)}
                          disabled={deleteTask.isPending}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
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
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>

      {/* Theme Settings Modal */}
      <Dialog
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (!open) setPendingTheme(theme);
        }}
      >
        <DialogContent data-ocid="settings.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Theme Settings
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Choose a color theme for your workspace.
            </p>
            <RadioGroup
              value={pendingTheme}
              onValueChange={(v) => setPendingTheme(v as Theme)}
              className="space-y-2"
            >
              {THEME_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`theme-${opt.value}`}
                  className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                    pendingTheme === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <RadioGroupItem
                    data-ocid={`settings.radio.${opt.value}`}
                    value={opt.value}
                    id={`theme-${opt.value}`}
                    className="sr-only"
                  />
                  <div
                    className="w-8 h-8 rounded-md flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: opt.swatch }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {opt.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  {pendingTheme === opt.value && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </label>
              ))}
            </RadioGroup>
          </div>

          <DialogFooter className="gap-2">
            <Button
              data-ocid="settings.cancel_button"
              variant="outline"
              onClick={() => {
                setSettingsOpen(false);
                setPendingTheme(theme);
              }}
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </Button>
            <Button
              data-ocid="settings.confirm_button"
              onClick={handleApplyTheme}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-right" />
    </div>
  );
}
