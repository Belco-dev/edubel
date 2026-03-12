

## Plan: Add "Download ZIP" Button for Report Cards

### What
Add a button that generates and downloads a ZIP file containing:
1. A folder of individual PDF report cards (one per student)
2. An Excel workbook with all student marks/grades

### Dependencies
- Install `jszip` — lightweight client-side ZIP generation library (no server needed)

### Changes

**1. `src/lib/excelExporter.ts` (new file)**
- Create a function that takes students, school data, selected subjects, and terms
- Uses the existing `xlsx`-style approach but with `read-excel-file`'s write capabilities — actually, since `read-excel-file` is read-only, we'll use the already-installed `xlsx` package (it's still in dependencies) or build a simple CSV/Excel blob manually
- Better approach: use `xlsx` write functionality since it's still installed, or generate a simple workbook using the SheetJS write API
- Export function: `generateReportCardWorkbook(students, school, subjects, terms) → Blob`

**2. `src/components/ReportCardPreview.tsx`**
- Add a "Download ZIP" button below the existing "Download All" button
- Handler: `handleDownloadZip`
  - Creates a JSZip instance
  - Adds a `PDFs/` folder with each student's PDF (using `doc.output('blob')`)
  - Adds an Excel workbook at the root
  - Generates the ZIP and triggers download

**3. Install `jszip`**

### Implementation Details
- PDF generation reuses existing `generateStudentPDF` 
- Excel workbook: create using `xlsx` (already a dependency) with columns for student name, subjects (test/exam/total per term), percentage, rank
- ZIP filename: `{ClassName}_Report_Cards.zip`
- Show loading state with progress indication

