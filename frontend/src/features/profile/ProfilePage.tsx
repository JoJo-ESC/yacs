import React from "react";

export default function ProfilePage() {
  const user = {
    name: "Maggie Trebilcock",
    email: "trebim2@rpi.edu",
    cohort: "2023",
    majors: ["Computer Science"],
    minors: "N/A",
    pathway: "Philosophy & Logic",
    semesters: ["SPRING 2025"],
    degreePlans: ["Plan A", "Plan B"],
  };

  return (
    <div className="flex-grow p-6 bg-background text-foreground min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: avatar, edit button, friends column */}
        <aside className="col-span-4 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full bg-muted mb-4 shadow-inner" />
          <button className="px-4 py-2 rounded-md bg-surface text-foreground font-medium border border-border mb-6 shadow-sm hover:brightness-110">
            Edit Profile
          </button>

          <div className="w-full mt-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="uppercase text-sm tracking-wider text-foreground/60 w-24 text-left">
                my friends
              </span>
            </div>
            <div className="ml-6 mt-4 h-48 border-l border-border" />
          </div>
        </aside>

        {/* RIGHT COLUMN: user info, majors, semesters, degree plans */}
        <main className="col-span-8">
          <h1 className="text-4xl font-semibold mb-2 text-foreground">{user.name}</h1>
          <div className="text-sm text-foreground/70 mb-4">
            <div>{user.email}</div>
            <div className="mt-2">
              Cohort: <span className="font-medium text-foreground">{user.cohort}</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-md p-4 mb-6 max-w-xl shadow-sm">
            <h3 className="text-sm text-foreground font-semibold mb-2">Major(s):</h3>
            <div className="text-base text-foreground">{user.majors.join(", ")}</div>
            <div className="text-xs text-foreground/60 mt-1">Systems and Software</div>
          </div>

          <div className="text-sm mb-6 max-w-xl text-foreground/80">
            <div>
              Minor(s): <span className="font-medium text-foreground">{user.minors}</span>
            </div>
            <div className="mt-2">
              HASS Pathway: <span className="font-medium text-foreground">{user.pathway}</span>
            </div>
          </div>

          <section className="mb-6 max-w-2xl">
            <h4 className="text-sm uppercase tracking-wider text-foreground font-medium mb-2">My Semesters:</h4>
            <div className="text-xs text-foreground/60 mb-3">{user.semesters[0]}</div>
            <div className="flex items-center gap-3">
              <div className="w-28 h-12 bg-surface rounded-md border border-border shadow-sm" />
              <div className="w-28 h-12 bg-surface rounded-md border border-border shadow-sm" />
              <div className="w-28 h-12 bg-surface rounded-md border border-border shadow-sm" />
              <div className="w-10 h-12 bg-surface rounded-md border border-border shadow-sm" />
            </div>
          </section>

          <section className="max-w-2xl">
            <h4 className="text-sm uppercase tracking-wider text-foreground font-medium mb-2">My Degree Plans:</h4>
            <div className="flex gap-4">
              <div className="w-36 h-12 bg-surface rounded-md border border-border shadow-sm" />
              <div className="w-36 h-12 bg-surface rounded-md border border-border shadow-sm" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}