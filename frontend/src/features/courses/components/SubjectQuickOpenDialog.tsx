import * as React from "react";
import { GraduationCap, Hash, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { Subject } from "@/types/courses";
import { getCategoryMeta } from "@/lib/courses/subjects";

interface SubjectQuickOpenDialogProps {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  subjects: Subject[];
}

export function SubjectQuickOpenDialog({
  open,
  onOpenChange,
  subjects,
}: SubjectQuickOpenDialogProps) {
  const navigate = useNavigate();
  const featuredSubjects = React.useMemo(
    () => subjects.filter((subject) => subject.featured).slice(0, 8),
    [subjects],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Quick subject finder"
      description="Search department codes and subject names."
      className="max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.92))] px-6 py-4 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_36%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(3,7,18,0.92))]">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Sparkles className="h-4 w-4" />
          Quick open a subject
        </div>
        <CommandInput placeholder="Type CSCI, ECSE, Math, Psychology..." className="text-base" />
      </div>

      <CommandList className="max-h-[420px] px-3 py-3">
        <CommandEmpty className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          No subjects matched. Try a code like <span className="font-semibold text-slate-900 dark:text-white">MATH</span> or a name like <span className="font-semibold text-slate-900 dark:text-white">Computer Science</span>.
        </CommandEmpty>
        <CommandGroup heading="Popular picks">
          {featuredSubjects.map((subject) => {
            const category = getCategoryMeta(subject.category);
            return (
              <CommandItem
                key={subject.id}
                value={`${subject.code} ${subject.name} ${subject.aliases?.join(" ") ?? ""}`}
                onSelect={() => {
                  navigate(`/courses/${subject.code}`);
                  onOpenChange(false);
                }}
                className="rounded-2xl px-3 py-3 text-slate-800 data-[selected=true]:bg-sky-50 data-[selected=true]:text-sky-950 dark:text-slate-100 dark:data-[selected=true]:bg-sky-950/60 dark:data-[selected=true]:text-sky-100"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                    <Hash className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      {subject.code} <span className="text-slate-400">·</span> {subject.name}
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {category?.label}
                    </div>
                  </div>
                </div>
                <CommandShortcut>Open</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="All subjects">
          {subjects.map((subject) => {
            const category = getCategoryMeta(subject.category);
            return (
              <CommandItem
                key={subject.code}
                value={`${subject.code} ${subject.name} ${subject.school} ${subject.aliases?.join(" ") ?? ""}`}
                onSelect={() => {
                  navigate(`/courses/${subject.code}`);
                  onOpenChange(false);
                }}
                className="rounded-2xl px-3 py-3 text-slate-800 data-[selected=true]:bg-sky-50 data-[selected=true]:text-sky-950 dark:text-slate-100 dark:data-[selected=true]:bg-sky-950/60 dark:data-[selected=true]:text-sky-100"
              >
                <GraduationCap className="h-4 w-4 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {subject.code} <span className="text-slate-400">·</span> {subject.name}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {category?.shortLabel} · {subject.school}
                  </div>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
