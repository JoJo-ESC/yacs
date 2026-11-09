import React, { type JSX } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSchedule } from "@/context/schedule/schedule-context";
import { MAX_SCHEDULE_NAME_LENGTH } from "@/lib/schedule/savedSchedules";

const iconButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-400";

// Picks, creates, renames and deletes the selected semester's schedules.
export default function ScheduleSwitcher(): JSX.Element {
  const { schedules, activeScheduleId, selectSchedule, createSchedule, renameSchedule, deleteSchedule } =
    useSchedule();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState("");

  const active = schedules.find((s) => s.id === activeScheduleId) ?? schedules[0];
  const canDelete = schedules.length > 1;

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setDraftName(name);
  };

  // An empty name keeps the old one (see renameSchedule)
  const commitRename = () => {
    if (editingId) renameSchedule(editingId, draftName);
    setEditingId(null);
  };

  const handleCreate = () => {
    const schedule = createSchedule();
    startRename(schedule.id, schedule.name);
  };

  const handleDelete = (id: string, name: string, courseCount: number) => {
    if (
      courseCount > 0 &&
      !window.confirm(`Delete "${name}"? Its ${courseCount} course${courseCount === 1 ? "" : "s"} will be removed.`)
    ) {
      return;
    }
    deleteSchedule(id);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) commitRename();
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-[#dfc9ae] bg-[#f8f2ea] px-4 text-sm font-semibold text-[#7a5230] transition-colors hover:bg-[#efe3d2] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:bg-[#4a3223]"
          aria-label={`Schedule: ${active.name}. Change schedule`}
        >
          <span className="truncate">{active.name}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900"
        onEscapeKeyDown={(event) => {
          // Escape cancels a rename instead of closing the menu
          if (editingId) {
            event.preventDefault();
            setEditingId(null);
          }
        }}
      >
        <ul className="max-h-72 overflow-y-auto">
          {schedules.map((schedule) => {
            const isActive = schedule.id === active.id;
            return (
              <li key={schedule.id} className="flex items-center gap-1">
                {editingId === schedule.id ? (
                  <input
                    autoFocus
                    value={draftName}
                    maxLength={MAX_SCHEDULE_NAME_LENGTH}
                    onChange={(event) => setDraftName(event.target.value)}
                    onFocus={(event) => event.target.select()}
                    onBlur={commitRename}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitRename();
                    }}
                    aria-label="Schedule name"
                    className="h-9 min-w-0 flex-1 rounded-md border border-[#dfc9ae] bg-transparent px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#dfc9ae] dark:border-[#6d4f36] dark:text-white dark:focus:ring-[#6d4f36]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      selectSchedule(schedule.id);
                      setOpen(false);
                    }}
                    className={`flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive
                        ? "font-semibold text-[#7a5230] dark:text-[#f4e6d6]"
                        : "text-slate-700 dark:text-neutral-200"
                    }`}
                  >
                    <Check className={`h-4 w-4 shrink-0 ${isActive ? "" : "invisible"}`} />
                    <span className="truncate">{schedule.name}</span>
                    <span className="ml-auto shrink-0 text-xs font-normal text-slate-400 dark:text-neutral-500">
                      {schedule.courses.length}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className={iconButtonClass}
                  onClick={() => startRename(schedule.id, schedule.name)}
                  aria-label={`Rename ${schedule.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={iconButtonClass}
                  disabled={!canDelete}
                  onClick={() => handleDelete(schedule.id, schedule.name, schedule.courses.length)}
                  aria-label={`Delete ${schedule.name}`}
                  title={canDelete ? undefined : "A semester needs at least one schedule"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 border-t border-neutral-200 pt-1 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleCreate}
            className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-accent hover:text-accent-foreground dark:text-neutral-200"
          >
            <Plus className="h-4 w-4" />
            New schedule
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
