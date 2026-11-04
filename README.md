<div align="center">
  <img src="src/assets/edubel-logo.png" alt="EduBel logo" width="96" />

  # EduBel

  **Report cards for Rwandan classrooms, without the repetitive paperwork.**

  EduBel turns Excel mark sheets into polished student report cards, class rankings, and summary workbooks. Everything runs in the browser, so student records stay on the teacher's device.

  [Getting started](#getting-started) · [Excel format](#preparing-your-excel-files) · [Privacy](#privacy-and-offline-use) · [Contributing](#contributing)

  ![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
  ![PWA](https://img.shields.io/badge/Offline-ready-PWA-5a0fc8)
</div>

## About the project

Report cards should not require hours of copying marks and formatting documents by hand. EduBel gives teachers a straightforward five-step workflow: add school details, choose the terms, import marks, adjust grading, and download the finished reports.

The app is designed around the Rwandan curriculum, from Nursery 1 through Senior 6. It requires no account and has no backend database. Once the app has loaded, it can continue working without an internet connection.

## What you can do with EduBel

- **Import existing mark sheets.** Upload `.xlsx` or `.xls` files with test and exam columns together or in separate files.
- **Enter marks manually.** Use the built-in spreadsheet editor when starting from scratch.
- **Combine up to three terms.** Calculate totals, percentages, subject averages, class positions, and annual rankings.
- **Make reports your own.** Add a school logo, contact details, teacher names, custom student fields, and header information.
- **Choose a suitable layout.** Pick from five report templates, including a two-student layout, with colour or black-and-white styling.
- **Set your own grading scale.** Configure score ranges and the comments assigned to each range.
- **Export the whole class.** Download individual PDFs, a class ranking PDF, an Excel summary, or everything together in a ZIP file.
- **Pick up where you left off.** School details, parsed marks, and preferences are restored after a page refresh using local browser storage.
- **Work offline.** Install EduBel as a Progressive Web App and keep working after the initial load, even when connectivity is unreliable.

## How it works

1. **Set up the school** — enter school, class, teacher, and academic-year details.
2. **Select terms** — include one, two, or all three terms.
3. **Add student marks** — upload Excel files or use manual entry.
4. **Review grading** — adjust grade boundaries and automatic comments.
5. **Preview and export** — check each report before downloading or sharing the results.

## Preparing your Excel files

The first row must contain column headings, and each following row should represent one student. A heading containing `Name` or `Student` is required. Files can be up to 10 MB each.

### One file per term

Use `TEST/Subject/Max` and `EXAM/Subject/Max` for assessment columns:

| Full names | Index Number | TEST/Mathematics/30 | EXAM/Mathematics/70 | TEST/English/40 | EXAM/English/60 | Conduct/100 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Aline Uwase | RW-001 | 25 | 60 | 35 | 52 | 95 |
| Eric Mugisha | RW-002 | 28 | 65 | 38 | 55 | 100 |

### Separate test and exam files

Use `Subject/Max` headings in each file:

| Full names | SDMS Code | Mathematics/30 | English/100 | Science/50 | Conduct/100 |
| --- | --- | ---: | ---: | ---: | ---: |
| Aline Uwase | 1001 | 25 | 85 | 40 | 95 |
| Eric Mugisha | 1002 | 28 | 92 | 45 | 100 |

When using separate files, keep students in the same order in both files. Repeating a subject heading combines its marks and maximum scores, which is useful for subjects assessed in multiple parts. Date of birth, index/SDMS number, and conduct columns are optional.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (a current LTS release is recommended)
- npm, which is included with Node.js

### Run locally

```bash
git clone https://github.com/Belco-dev/edubel.git
cd edubel
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:8080`.

No environment variables, API keys, or backend services are required.

### Production build

```bash
npm run build
npm run preview
```

The production files are written to `dist/`.

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 8080 |
| `npm run build` | Create an optimized production build |
| `npm run build:dev` | Create a build using development mode |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the project with ESLint |

## Project structure

```text
src/
├── components/       # Setup wizard, uploads, previews, and UI components
├── data/             # Rwandan subject catalogue
├── hooks/            # PWA and local session persistence
├── lib/              # Excel parsing/export, PDF generation, and student merging
├── pages/            # Landing page, report generator, and privacy page
├── types/            # Shared TypeScript models
├── App.tsx           # Application routes and providers
└── main.tsx          # Browser entry point
public/               # App icons, web manifest, and static assets
```

## Built with

- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for development and production builds
- [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) for the interface
- [jsPDF](https://github.com/parallax/jsPDF) for report generation
- [Read Excel File](https://github.com/catamphetamine/read-excel-file) and [Write Excel File](https://github.com/catamphetamine/write-excel-file) for spreadsheet handling
- [Vite PWA](https://vite-pwa-org.netlify.app/) for installability and offline caching

## Privacy and offline use

EduBel processes spreadsheets and generates reports on the device. Student names, marks, and school information are not sent to an application server. Work in progress is stored in the browser's local storage and can be removed with **Clear Stored Data** in the app footer.

Offline support becomes available after the app has loaded successfully. For the best experience, install the app from a browser that supports Progressive Web Apps. Direct folder saving and native file sharing depend on browser support; when unavailable, EduBel falls back to regular downloads.

> **Using a shared computer?** Clear stored data when you finish. Local browser storage keeps information on that device until it is removed.

## Deployment

EduBel is a static single-page application. Deploy the contents of `dist/` to a static host such as Netlify, Cloudflare Pages, GitHub Pages, or a standard web server.

Configure the host to serve `index.html` as the fallback for application routes. HTTPS is recommended because install prompts, service workers, and native sharing features require a secure context outside localhost.

## Contributing

Bug reports, classroom feedback, and pull requests are welcome. Please use the [issue tracker](https://github.com/Belco-dev/edubel/issues) to describe a problem or discuss a larger change before starting work.

For code contributions:

1. Fork the repository and create a focused branch.
2. Keep changes small and avoid committing real student records.
3. Run `npm run lint` and `npm run build` before opening a pull request.
4. Include screenshots for visible interface changes and sample input steps for bug fixes.

## License

A license has not yet been added. The source code is publicly visible, but reuse and redistribution rights are not granted until the maintainers add a license file.

---

<div align="center">
  EduBel is maintained by <strong>Belco</strong> and is a division of <a href="https://belcom.carrd.co/">BELCOM Ltd</a>.<br />
  <a href="https://github.com/Belco-dev/edubel/issues">Questions or feedback? Open an issue.</a>
</div>
