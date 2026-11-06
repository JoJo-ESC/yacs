# 🎓 YACS (Yet Another Course Scheduler)
### Rebuilding the RPI course experience for Fall 2025.

YACS is a student-led project to make course scheduling at RPI fast and easy. We are currently rebuilding the entire platform from the ground up to replace the old system with a faster, modern version.

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Languages** | TypeScript, JavaScript, SQL |
| **Frontend** | React, Figma (Design) |
| **Backend** | Python (FastAPI) |
| **Database** | PostgreSQL |
| **Tools** | Docker, GitHub Actions |

## 🏛️ Architecture Overview
| Layer | Primary Files | Notes |
| :--- | :--- | :--- |
| Frontend | `frontend/src/index.tsx`, `frontend/src/app/App.tsx`, `frontend/src/context/schedule-context.tsx`, `frontend/src/lib/parseSchedule.ts` | React routes, app shell, schedule state, CSV parsing |
| Backend | `backend/main.py`, `backend/controllers/*`, `backend/db/course_corequisite.py`, `backend/tables/*` | FastAPI routes, controllers, SQL helpers, ORM tables |
| Data/Tools | `backend/scraper/main.py`, `backend/scraper/sync.py`, `frontend/public/*.csv`, `rpi_data/major_plans/*` | SIS9 scraping and weekly course sync, course catalogs, major plan templates |
| Dev Infra | `docker-compose.yml` | Local dev wiring for FE/BE/DB |

## 🤝 Join the Team

We are looking for **Frontend developers, Backend developers, and Designers** to help us for the new semester of Spring 2026. 

### How to get started:
1.  **Review Contribution Guidelines:** Review the guidelines and best practices for contributing to YACS in [CONTRIBUTING.md](./CONTRIBUTING.md)
2.  **Setup the project:** Follow the steps in [DEVELOPMENT.md](./DEVELOPMENT.md) to get YACS running locally on your machine.
3.  **Pick a task:** Look for "Good First Issue" tags in our [GitHub Issues](https://github.com/JoJo-ESC/yacs/issues).
4.  **Chat with us:** Join our [GitHub Discussions](https://github.com/JoJo-ESC/yacs/discussions) to chat and ask questions with the team.

---

**Project Lead:** Josiah Riggins (riggij@rpi.edu)

**Maintained by the YACS Team.** *Built with ❤️ at Rensselaer Polytechnic Institute.*
