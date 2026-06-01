import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ChevronDown, X, Loader2, Files, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TermUpload, ParsedSectionData } from '@/types/reportCard';
import { parseExcelFile, parseCombinedExcelFile } from '@/lib/excelParser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ManualMarksEntry } from '@/components/ManualMarksEntry';

interface MultiFileUploadProps {
  terms: TermUpload[];
  onTermsUpdate: (terms: TermUpload[]) => void;
}

type UploadMode = 'single' | 'multi';

const termColors: Record<string, { bg: string; border: string }> = {
  'term1': { bg: 'bg-blue-50', border: 'border-blue-200' },
  'term2': { bg: 'bg-green-50', border: 'border-green-200' },
  'term3': { bg: 'bg-purple-50', border: 'border-purple-200' },
};

const MAX_EXCEL_SIZE = 10 * 1024 * 1024; // 10MB

function validateExcel(file: File): string | null {
  if (!file.name.match(/\.(xlsx|xls)$/i)) return 'Please upload a valid Excel file (.xlsx or .xls)';
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (file.type && !validMimeTypes.includes(file.type)) return 'Invalid file type. Please upload a valid Excel file.';
  if (file.size > MAX_EXCEL_SIZE) return 'File too large (max 10MB).';
  return null;
}

export function MultiFileUpload({ terms, onTermsUpdate }: MultiFileUploadProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFormat, setShowFormat] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedTerms = terms.filter(t => t.selected);

  const handleFile = async (file: File, termId: string, type: 'test' | 'exam') => {
    const validationError = validateExcel(file);
    if (validationError) {
      setErrors(prev => ({ ...prev, [`${termId}-${type}`]: validationError }));
      return;
    }
    const loadingKey = `${termId}-${type}`;
    setLoading(loadingKey);
    setErrors(prev => { const n = { ...prev }; delete n[loadingKey]; return n; });

    const parseResult = await parseExcelFile(file);
    if (parseResult.success) {
      const parsedData: ParsedSectionData = {
        students: parseResult.students,
        detectedSubjects: parseResult.detectedSubjects,
      };
      onTermsUpdate(
        terms.map(t =>
          t.id === termId
            ? { ...t, ...(type === 'test'
                ? { testFile: file, testParsedData: parsedData }
                : { examFile: file, examParsedData: parsedData }) }
            : t
        )
      );
    } else {
      setErrors(prev => ({ ...prev, [loadingKey]: parseResult.error || 'Failed to parse file' }));
    }
    setLoading(null);
  };

  // Single-file (combined TEST/EXAM) upload — fills both test & exam sections.
  const handleCombinedFile = async (file: File, termId: string) => {
    const validationError = validateExcel(file);
    if (validationError) {
      setErrors(prev => ({ ...prev, [`${termId}-combined`]: validationError }));
      return;
    }
    const loadingKey = `${termId}-combined`;
    setLoading(loadingKey);
    setErrors(prev => { const n = { ...prev }; delete n[loadingKey]; return n; });

    const result = await parseCombinedExcelFile(file);
    if (result.success) {
      onTermsUpdate(
        terms.map(t =>
          t.id === termId
            ? {
                ...t,
                testFile: file,
                examFile: file,
                testParsedData: result.testSection,
                examParsedData: result.examSection,
              }
            : t
        )
      );
    } else {
      setErrors(prev => ({ ...prev, [loadingKey]: result.error || 'Failed to parse file' }));
    }
    setLoading(null);
  };

  const removeFile = (termId: string, type: 'test' | 'exam' | 'combined') => {
    onTermsUpdate(
      terms.map(t =>
        t.id === termId
          ? {
              ...t,
              ...(type === 'combined'
                ? { testFile: null, examFile: null, testParsedData: null, examParsedData: null }
                : type === 'test'
                ? { testFile: null, testParsedData: null }
                : { examFile: null, examParsedData: null }),
            }
          : t
      )
    );
    setErrors(prev => { const n = { ...prev }; delete n[`${termId}-${type}`]; return n; });
  };

  if (selectedTerms.length === 0) {
    return (
      <Card id="file-upload-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5" />
            Upload Marks Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Please select at least one term above to upload marks files.
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderUploadBox = (
    key: string,
    label: string,
    parsed: ParsedSectionData | null | undefined,
    file: File | null | undefined,
    placeholder: string,
    onPick: (file: File) => void,
    onRemove: () => void,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {parsed && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{parsed.students.length} students</Badge>
            <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 w-6 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <div
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors
          ${parsed ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-primary/5'}`}
        onClick={() => fileInputRefs.current[key]?.click()}
      >
        <input
          ref={el => (fileInputRefs.current[key] = el)}
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); }}
        />
        {loading === key ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
        ) : parsed ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700">{file?.name}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{placeholder}</span>
          </div>
        )}
      </div>
      {errors[key] && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{errors[key]}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="w-5 h-5" />
          Upload Marks Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Privacy badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
          <span className="text-base">🔒</span>
          <span>Data stays on this device — files are processed locally and never uploaded.</span>
        </div>

        {/* Upload mode toggle */}
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-medium">How are your marks organised?</span>
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
              <Button
                variant={uploadMode === 'single' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setUploadMode('single')}
              >
                <FileText className="w-4 h-4" /> One Excel (Test + Exam)
              </Button>
              <Button
                variant={uploadMode === 'multi' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setUploadMode('multi')}
              >
                <Files className="w-4 h-4" /> Separate Test & Exam
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {uploadMode === 'single'
              ? 'Upload a single Excel per term containing both TEST and EXAM columns. Best option — student order can never mismatch.'
              : 'Upload two separate Excel files per term (one for TEST, one for EXAM). Both must list students in the same order.'}
          </p>
        </div>

        {/* Format Guide */}
        <Collapsible open={showFormat} onOpenChange={setShowFormat}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline">
            <ChevronDown className={`w-4 h-4 transition-transform ${showFormat ? 'rotate-180' : ''}`} />
            View accepted Excel formats &amp; sample tables
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-3 bg-muted rounded-lg space-y-5 text-xs">

            {/* Combined format */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-1"><FileText className="w-4 h-4" /> Format A — One Excel per term (Test + Exam)</h4>
              <p className="text-muted-foreground">
                Column titles use <code>TEST/Subject/Max</code> or <code>EXAM/Subject/Max</code> (TEST/EXAM are not case-sensitive).
                Marks under <code>TEST/…</code> fill the Test column, <code>EXAM/…</code> fill the Exam column.
              </p>
              <div className="overflow-x-auto rounded border border-border bg-background">
                <table className="text-[11px] w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-1.5 font-semibold bg-primary/10">Full names</th>
                      <th className="text-left p-1.5 font-semibold bg-amber-500/10">Index Number</th>
                      <th className="text-left p-1.5 font-semibold bg-blue-500/10">TEST/Maths/30</th>
                      <th className="text-left p-1.5 font-semibold bg-blue-500/10">EXAM/Maths/70</th>
                      <th className="text-left p-1.5 font-semibold bg-green-500/10">TEST/English/40</th>
                      <th className="text-left p-1.5 font-semibold bg-green-500/10">EXAM/English/60</th>
                      <th className="text-left p-1.5 font-semibold bg-yellow-500/10">Conduct/100</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['John Doe', 'RW-001', 25, 60, 35, 52, 95],
                      ['Jane Smith', 'RW-002', 28, 65, 38, 55, 100],
                      ['Alice Uwase', 'RW-003', 22, 58, 30, 49, 90],
                      ['Eric Mugisha', 'RW-004', 26, 61, 33, 50, 88],
                      ['Aline Keza', 'RW-005', 29, 68, 39, 57, 98],
                    ].map((r, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        {r.map((c, j) => <td key={j} className="p-1.5">{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Separate format */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-1"><Files className="w-4 h-4" /> Format B — Separate Test &amp; Exam files</h4>
              <p className="text-muted-foreground">
                Each file uses <code>Subject/Max</code> column titles. Upload one for TEST and one for EXAM.
              </p>
              <div className="overflow-x-auto rounded border border-border bg-background">
                <table className="text-[11px] w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-1.5 font-semibold bg-primary/10">Full names</th>
                      <th className="text-left p-1.5 font-semibold bg-amber-500/10">SDMS Code</th>
                      <th className="text-left p-1.5 font-semibold bg-blue-500/10">Mathematics/30</th>
                      <th className="text-left p-1.5 font-semibold bg-green-500/10">ENGLISH/100</th>
                      <th className="text-left p-1.5 font-semibold bg-purple-500/10">Science/50</th>
                      <th className="text-left p-1.5 font-semibold bg-yellow-500/10">Conduct/100</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['John Doe', '1001', 25, 85, 40, 95],
                      ['Jane Smith', '1002', 28, 92, 45, 100],
                      ['Alice Uwase', '1003', 22, 78, 38, 90],
                      ['Eric Mugisha', '1004', 26, 81, 41, 88],
                      ['Aline Keza', '1005', 29, 95, 47, 98],
                    ].map((r, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        {r.map((c, j) => <td key={j} className="p-1.5">{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-muted-foreground space-y-1 border-t border-border pt-2">
              <p><strong>Repeated subjects add up:</strong> two columns like <code>Maths/50</code> and <code>Maths/30</code> become one subject out of 80 (marks summed). Spelling must match (case ignored).</p>
              <p><strong>Index / SDMS code:</strong> add a column named <em>Index Number</em>, <em>SDMS Code</em> or similar — it appears under the REPORT CARD title.</p>
              <p><strong>Conduct:</strong> optional <code>Conduct/Max</code> column.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Upload sections per term */}
        {selectedTerms.map(term => {
          const colors = termColors[term.id] || { bg: 'bg-gray-50', border: 'border-gray-200' };
          return (
            <div key={term.id} className={`p-4 rounded-lg ${colors.bg} ${colors.border} border space-y-3`}>
              <h3 className="font-semibold text-base">{term.name}</h3>

              {uploadMode === 'single' ? (
                renderUploadBox(
                  `${term.id}-combined`,
                  'Test + Exam Marks (single Excel)',
                  term.testParsedData || term.examParsedData,
                  term.testFile,
                  'Upload one Excel with TEST/ and EXAM/ columns',
                  (f) => handleCombinedFile(f, term.id),
                  () => removeFile(term.id, 'combined'),
                )
              ) : (
                <>
                  {renderUploadBox(
                    `${term.id}-test`,
                    'TEST Marks',
                    term.testParsedData,
                    term.testFile,
                    'Upload TEST Excel',
                    (f) => handleFile(f, term.id, 'test'),
                    () => removeFile(term.id, 'test'),
                  )}
                  {renderUploadBox(
                    `${term.id}-exam`,
                    'EXAM Marks',
                    term.examParsedData,
                    term.examFile,
                    'Upload EXAM Excel',
                    (f) => handleFile(f, term.id, 'exam'),
                    () => removeFile(term.id, 'exam'),
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Manual entry option */}
        <ManualMarksEntry terms={terms} onTermsUpdate={onTermsUpdate} />
      </CardContent>
    </Card>
  );
}
