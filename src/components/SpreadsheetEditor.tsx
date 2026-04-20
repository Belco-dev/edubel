import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FileSpreadsheet, X, Download, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import writeXlsxFile from 'write-excel-file/browser';
import { toast } from 'sonner';

/**
 * Floating "Create File" spreadsheet-like editor.
 * Produces an .xlsx file in the exact format expected by the system:
 *   Header row: Full names | Subject/MAX | Subject/MAX | ...
 *   Data rows: name, numeric marks (<= subject MAX)
 */

interface ColumnDef {
  /** Header label as shown / saved. For mark columns this is "Subject/MAX". */
  header: string;
  /** Internal kind: 'name' is the immutable Full names column; 'mark' is a subject column. */
  kind: 'name' | 'mark';
}

const INITIAL_ROWS = 25;
const MAX_ROWS = 101;
const MAX_EXTRA_COLS = 24; // gives Subject/MAX columns up to letter Z when combined with Full names (col A)

/** Excel-style column letters: A, B, ... Z. */
function colLetter(index: number): string {
  // Only A-Z required by spec
  return String.fromCharCode(65 + index);
}

/** Parse "Subject/Max" into { name, max }. Returns null if invalid. */
function parseSubjectHeader(header: string): { name: string; max: number } | null {
  if (!header || !header.includes('/')) return null;
  const parts = header.split('/');
  const name = parts[0].trim();
  const max = parseInt(parts.slice(1).join('/').trim(), 10);
  if (!name || isNaN(max) || max <= 0) return null;
  return { name, max };
}

/**
 * Validate an attempted cell entry for a numeric (mark) cell.
 * Allowed: empty string, positive whole numbers, decimals with one decimal place.
 */
function isAllowedMarkInput(value: string): boolean {
  if (value === '') return true;
  // Allow user to type "12." mid-typing — treat trailing dot as in-progress, accept it.
  // Final validation against MAX happens on download.
  return /^\d+(\.\d?)?$/.test(value);
}

export function SpreadsheetEditor() {
  const [open, setOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('Class Marks');
  const [columns, setColumns] = useState<ColumnDef[]>([
    { header: 'Full names', kind: 'name' },
    { header: 'Mathematics/100', kind: 'mark' },
  ]);
  /** rows[r][c] — string values. */
  const [rows, setRows] = useState<string[][]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => ['', '']),
  );
  const [errorDialog, setErrorDialog] = useState<{
    studentName: string;
    subjectName: string;
    cellRef: string;
    value: string;
    max: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  /** Keep rows array in sync with column count whenever columns change. */
  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.length === columns.length) return r;
        if (r.length < columns.length) return [...r, ...Array(columns.length - r.length).fill('')];
        return r.slice(0, columns.length);
      }),
    );
  }, [columns.length]);

  const addRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= MAX_ROWS) return prev;
      return [...prev, Array(columns.length).fill('')];
    });
  }, [columns.length]);

  const addColumn = useCallback(() => {
    setColumns((prev) => {
      if (prev.length >= MAX_EXTRA_COLS + 1) return prev;
      return [...prev, { header: 'Subject/100', kind: 'mark' }];
    });
  }, []);

  const removeColumn = useCallback((index: number) => {
    if (index === 0) return; // never remove Full names
    setColumns((prev) => prev.filter((_, i) => i !== index));
    setRows((prev) => prev.map((r) => r.filter((_, i) => i !== index)));
  }, []);

  const updateHeader = useCallback((index: number, value: string) => {
    setColumns((prev) => prev.map((c, i) => (i === index ? { ...c, header: value } : c)));
  }, []);

  const updateCell = useCallback(
    (rowIndex: number, colIndex: number, raw: string) => {
      const col = columns[colIndex];
      let next = raw;
      if (col?.kind === 'mark') {
        if (!isAllowedMarkInput(next)) {
          // Reject — keep previous value (do nothing).
          return;
        }
      }
      setRows((prev) => {
        const copy = prev.map((r) => r.slice());
        copy[rowIndex][colIndex] = next;
        return copy;
      });
    },
    [columns],
  );

  /** Build an auto-fit width (in characters) for an input based on its content. */
  const fitWidth = (value: string, min = 8, max = 40) => {
    const len = Math.max(value.length, min);
    return `${Math.min(len, max) + 1}ch`;
  };

  /** Validate marks vs MAX, name presence per row, returns first error or null. */
  const validateBeforeDownload = useCallback(() => {
    // Filter only rows that have any data
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const hasAny = row.some((v) => v.trim() !== '');
      if (!hasAny) continue;
      const studentName = (row[0] || '').trim() || `(row ${r + 1})`;
      for (let c = 1; c < columns.length; c++) {
        const col = columns[c];
        if (col.kind !== 'mark') continue;
        const raw = (row[c] || '').trim();
        if (raw === '') continue;
        const num = parseFloat(raw);
        const parsed = parseSubjectHeader(col.header);
        if (!parsed) {
          toast.error(`Column ${colLetter(c)} header "${col.header}" must be in format "Subject/MAX" (e.g. Mathematics/100)`);
          return false;
        }
        if (!isFinite(num) || num < 0) {
          toast.error(`Cell ${colLetter(c)}${r + 2} has an invalid number`);
          return false;
        }
        if (num > parsed.max) {
          setErrorDialog({
            studentName,
            subjectName: parsed.name,
            cellRef: `${colLetter(c)}${r + 2}`,
            value: raw,
            max: parsed.max,
          });
          return false;
        }
      }
    }
    return true;
  }, [rows, columns]);

  const handleDownload = useCallback(async () => {
    // Header sanity: every non-name column must be Subject/MAX
    for (let c = 1; c < columns.length; c++) {
      const parsed = parseSubjectHeader(columns[c].header);
      if (!parsed) {
        toast.error(`Column ${colLetter(c)} header must be in format "Subject/MAX"`);
        return;
      }
    }
    if (!validateBeforeDownload()) return;

    // Build sheet data: keep only rows with a name
    const dataRows = rows.filter((r) => (r[0] || '').trim() !== '');
    if (dataRows.length === 0) {
      toast.error('Add at least one student name before downloading');
      return;
    }

    const headerRow = columns.map((c) => ({
      value: c.header,
      fontWeight: 'bold' as const,
      backgroundColor: '#E0E7FF',
    }));
    const sheetRows = [
      headerRow,
      ...dataRows.map((r) =>
        r.map((cell, idx) => {
          if (idx === 0) return { value: cell };
          const num = cell.trim() === '' ? null : parseFloat(cell);
          return num == null || isNaN(num) ? { value: '' } : { type: Number, value: num };
        }),
      ),
    ];

    try {
      await writeXlsxFile(sheetRows as any, {
        fileName: `${docTitle.trim() || 'marks'}.xlsx`,
        columns: columns.map((_, i) => ({ width: i === 0 ? 28 : 18 })),
      });
      toast.success('Excel file downloaded — you can now upload it back into the system');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Excel file');
    }
  }, [columns, rows, docTitle, validateBeforeDownload]);

  const visibleRows = useMemo(() => rows, [rows]);

  return (
    <>
      {/* Floating launcher button — sits ABOVE the Guide button (which is bottom-20). */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open spreadsheet editor"
        className="fixed bottom-36 right-4 z-50 bg-secondary text-secondary-foreground rounded-full px-4 py-2 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 tutorial-bounce"
        style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--secondary)))' }}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Create a File
      </button>

      {!open ? null : (
        <div className="fixed inset-0 z-[9998] bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
          {/* Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 border-b bg-card">
            <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
            <input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="bg-transparent text-base sm:text-lg font-semibold outline-none border-b border-transparent focus:border-primary px-1 min-w-0 flex-1 max-w-xs"
              placeholder="Document title"
            />
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={addColumn} disabled={columns.length >= MAX_EXTRA_COLS + 1}>
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Subject</span>
            </Button>
            <Button size="sm" variant="outline" onClick={addRow} disabled={rows.length >= MAX_ROWS}>
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Row</span>
            </Button>
            <Button size="sm" onClick={handleDownload} className="bg-primary text-primary-foreground">
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sheet area */}
          <div ref={containerRef} className="flex-1 overflow-auto p-2 sm:p-4">
            <table className="border-collapse text-sm" style={{ tableLayout: 'auto' }}>
              <thead>
                {/* Excel-style column letter row */}
                <tr>
                  <th className="sticky top-0 left-0 z-30 bg-muted border border-border w-12 text-xs text-muted-foreground" />
                  {columns.map((_, i) => (
                    <th
                      key={`letter-${i}`}
                      className="sticky top-0 z-20 bg-muted border border-border text-xs text-muted-foreground font-medium px-2 py-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{colLetter(i)}</span>
                        {i > 0 && (
                          <button
                            onClick={() => removeColumn(i)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove column ${colLetter(i)}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
                {/* Editable header row (titles) */}
                <tr>
                  <th className="sticky left-0 z-20 bg-muted border border-border text-xs text-muted-foreground w-12">
                    1
                  </th>
                  {columns.map((col, i) => (
                    <th key={`hdr-${i}`} className="border border-border bg-primary/5 p-0">
                      <input
                        value={col.header}
                        onChange={(e) => updateHeader(i, e.target.value)}
                        readOnly={col.kind === 'name'}
                        placeholder={col.kind === 'name' ? 'Full names' : 'Subject/MAX'}
                        className="w-full px-2 py-1.5 bg-transparent outline-none font-semibold text-foreground"
                        style={{ width: fitWidth(col.header, col.kind === 'name' ? 14 : 12, 50) }}
                        title={col.kind === 'mark' ? 'Format: Subject/MAX e.g. Mathematics/100' : 'Full names column'}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, r) => (
                  <tr key={`row-${r}`}>
                    <td className="sticky left-0 z-10 bg-muted border border-border text-xs text-muted-foreground text-center w-12">
                      {r + 2}
                    </td>
                    {columns.map((col, c) => {
                      const value = row[c] ?? '';
                      const isName = col.kind === 'name';
                      return (
                        <td key={`cell-${r}-${c}`} className="border border-border p-0 bg-background">
                          <input
                            value={value}
                            onChange={(e) => updateCell(r, c, e.target.value)}
                            inputMode={isName ? 'text' : 'decimal'}
                            placeholder={isName ? '' : ''}
                            className="px-2 py-1.5 bg-transparent outline-none focus:bg-primary/10"
                            style={{ width: fitWidth(value, isName ? 18 : 6, isName ? 60 : 14) }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 text-xs text-muted-foreground max-w-2xl">
              <p className="mb-1"><strong>Tips:</strong></p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Subject columns must follow the format <code className="bg-muted px-1 rounded">Subject/MAX</code> e.g. <code className="bg-muted px-1 rounded">Mathematics/100</code>.</li>
                <li>Mark cells accept positive whole numbers or decimals with one decimal place only.</li>
                <li>Cells widen automatically as you type.</li>
                <li>After downloading, upload the file back via the <em>Upload Marks</em> section.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Validation error dialog */}
      {errorDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fade-in p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 border border-destructive/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Marks above maximum</h3>
                <p className="text-sm text-muted-foreground">
                  Marks for <strong className="text-foreground">{errorDialog.studentName}</strong> is above maximum
                  {' '}in <strong className="text-foreground">{errorDialog.subjectName}</strong>
                  {' '}(cell <code className="bg-muted px-1 rounded">{errorDialog.cellRef}</code>).
                  <br />
                  Entered <strong>{errorDialog.value}</strong>, max is <strong>{errorDialog.max}</strong>.
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => setErrorDialog(null)}
            >
              Go back to change
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
