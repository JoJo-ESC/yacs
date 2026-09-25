# YACS Fall 2026 Project Proposal

**By Josiah Riggins**
*Originally authored for Fall 2025 by Maggie Trebilcock; updated to reflect the current state of the project.*

---

## Overall

At RPI, students currently use two main course scheduling platforms: QUACS and YACS. QUACS is still more widely used thanks to its familiarity and visibility, but over the past year YACS has been rebuilt from the ground up and is now a genuinely capable planning tool rather than a proof of concept.

The Fall 2025 proposal called for "a complete reimagining of YACS through a modernized front-end and several new features," and that reimagining is now largely in place. The old stack has been replaced with a React and TypeScript front-end on a FastAPI and PostgreSQL back-end, wired together with Docker for local development and continuous integration, and several of last year's headline features have shipped in a first form: real accounts with login and a guest mode, an editable profile page, a drag-and-drop four-year planner with credit tracking, a schedule builder that generates conflict-free section combinations, and a full rebrand with dark mode. What YACS still lacks is the connective tissue that makes accounts worth having: the planner does not yet understand requirements, prerequisites, or when courses are actually offered, there is no way to save multiple worksheets or record credit already earned, and the platform still needs a real deployment so it can be used off campus.

One major direction remains pivoting YACS toward a social layer for RPI students, professors, TAs, and staff. With RPI email-based registration, users could share schedules, collaborate on four-year plans, form study groups, and exchange insights about classes, and professors could advertise new or recommended courses in a more targeted way than an all-student email blast. Internally this feature has been referred to as **inter-yac-tions**. The remainder of this proposal describes what the project has established so far and what it intends to accomplish this semester.

---

## Goals

The YACS project is a student-led effort that has been rebuilt from the ground up over the past year and is still actively defining its contributor workflow, review process, and roadmap. We have currently established a working repository with a Docker-based local environment, a testing framework with continuous integration, and a fully rewritten application: a React and TypeScript front-end on a FastAPI and PostgreSQL back-end, with Redis integration underway. On top of that foundation we have shipped a first form of several core features, including real account creation and login, an editable profile page, a drag-and-drop four-year planner with credit tracking and server-side persistence, a schedule builder with automatically generated conflict-free section combinations, and a full rebrand with dark mode. This part of the project will concern itself with the YACS web application and will have as its purpose the support of the GitHub repository with the intention of readying it for new contributions and for public use, including a production deployment that is reachable off the RPI network.

At the end of this semester, we will have extended and improved the app by closing issues, opening new issues, and pursuing feature requests. We will stand up a hosted environment with scheduled course-data syncing, restrict account creation to verified RPI email addresses while keeping a guest mode for prospective students and parents, and tighten the first-run experience for users who have never seen YACS before. We will also make progress toward a requirement-aware four-year planner that pulls a student's major, minor, and cohort from their account, renders the requirements they still need, suggests when the catalog recommends taking each course, tracks cumulative credits against the degree total, warns about missing prerequisites and under- or over-loaded terms, and respects which terms a course is actually offered. Alongside this, we hope to make some progress toward the platform's longer-term social direction, "inter-yac-tions," by building the groundwork for friends, opt-in schedule sharing, and professor course notes. The project will need to coordinate with fellow contributors, project maintainers, and the wider RCOS community in creating, reviewing, and verifying these artifacts.

---

## Milestones

**Middle of September**
- Determine necessary resources (hosting for the front-end, API, database, and Redis; a method for verifying RPI email addresses; a runner for scheduled course-data syncing)
- Install the development environment and explore the codebase
- Select issues and divide up roles to address issue testing and reproduction
- Figure out the requirements for the requirement-aware four-year planner (major-plan templates, prerequisite data, term-offered history) and divide up which members will work on it

**Middle of October**
- Determine potential blockers and research possible areas of concern (SIS9 scraping limits and session handling, RPI authentication for email verification, gaps in the catalog and major-plan data)
- Have significant progress and testing on the issues chosen
- Have a hosted deployment reachable off the RPI network
- Check on progress of the planner data work and the RPI-email account restriction

**End of October**
- Have sufficient tests for critical systems (accounts and sessions, planner persistence, schedule conflict logic, the course API) to allow issues to be reproduced and solution options to be developed safely
- Open new issues as needed (for bugs or features)
- Restrict account creation to verified RPI email addresses and extend the profile page with cohort, minor, and pathway

**End of Semester**
- Combine and review the issues addressed on GitHub, polish the README and contributor documentation, and create a vision document for the future of YACS
- Make significant progress on the requirement-aware planner and have the core feature implemented: requirement rendering, suggested semesters, cumulative credit tracking, and prerequisite / term-offered warnings
- Lay the groundwork for "inter-yac-tions" (friends and opt-in schedule sharing) and prepare for the RCOS Expo
