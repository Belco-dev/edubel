import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ChevronDown, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TermUpload, ParsedSectionData } from '@/types/reportCard';
import { parseExcelFile } from '@/lib/excelParser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ManualMarksEntry } from '@/components/ManualMarksEntry';

interface MultiFileUploadProps {
  terms: TermUpload[];
  onTermsUpdate: (terms: TermUpload[]) => void;
}

const termColors: Record<string, { bg: string; border: string }> = {
  'term1': { bg: 'bg-blue-50', border: 'border-blue-200' },
  'term2': { bg: 'bg-green-50', border: 'border-green-200' },
  'term3': { bg: 'bg-purple-50', border: 'border-purple-200' },
};

export function MultiFileUpload({ terms, onTermsUpdate }: MultiFileUploadProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFormat, setShowFormat] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedTerms = terms.filter(t => t.selected);

  const MAX_EXCEL_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFile = async (file: File, termId: string, type: 'test' | 'exam') => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrors(prev => ({ ...prev, [`${termId}-${type}`]: 'Please upload a valid Excel file (.xlsx or .xls)' }));
      return;
    }

    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (file.type && !validMimeTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [`${termId}-${type}`]: 'Invalid file type. Please upload a valid Excel file.' }));
      return;
    }

    if (file.size > MAX_EXCEL_SIZE) {
      setErrors(prev => ({ ...prev, [`${termId}-${type}`]: 'File too large (max 10MB).' }));
      return;
    }

    const loadingKey = `${termId}-${type}`;
    setLoading(loadingKey);
    setErrors(prev => { const n = { ...prev }; delete n[loadingKey]; return n; });

    const parseResult = await parseExcelFile(file);
    
    if (parseResult.success) {
      const parsedData: ParsedSectionData = { 
        students: parseResult.students, 
        detectedSubjects: parseResult.detectedSubjects 
      };
      
      onTermsUpdate(
        terms.map(t => 
          t.id === termId 
            ? { 
                ...t, 
                ...(type === 'test' 
                  ? { testFile: file, testParsedData: parsedData }
                  : { examFile: file, examParsedData: parsedData }
                )
              } 
            : t
        )
      );
    } else {
      setErrors(prev => ({ ...prev, [loadingKey]: parseResult.error || 'Failed to parse file' }));
    }
    
    setLoading(null);
  };

  const removeFile = (termId: string, type: 'test' | 'exam') => {
    onTermsUpdate(
      terms.map(t => 
        t.id === termId 
          ? { 
              ...t, 
              ...(type === 'test' 
                ? { testFile: null, testParsedData: null }
                : { examFile: null, examParsedData: null }
              )
            } 
          : t
      )
    );
    setErrors(prev => { const n = { ...prev }; delete n[`${termId}-${type}`]; return n; });
  };

  if (selectedTerms.length === 0) {
    return (
      <Card>
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
        {/* Format Guide */}
        <Collapsible open={showFormat} onOpenChange={setShowFormat}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline">
            <ChevronDown className={`w-4 h-4 transition-transform ${showFormat ? 'rotate-180' : ''}`} />
            View Required Excel Format
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-3 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Required Excel Column Format:</h4>
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-semibold bg-primary/10">Full names</th>
                    <th className="text-left p-2 font-semibold bg-blue-500/10">Mathematics/30</th>
                    <th className="text-left p-2 font-semibold bg-green-500/10">ENGLISH/100</th>
                    <th className="text-left p-2 font-semibold bg-purple-500/10">Science/50</th>
                    <th className="text-left p-2 font-semibold bg-yellow-500/10">Conduct/100</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-muted-foreground">
                    <td className="p-2 border-b">John Doe</td>
                    <td className="p-2 border-b">25</td>
                    <td className="p-2 border-b">85</td>
                    <td className="p-2 border-b">40</td>
                    <td className="p-2 border-b">95</td>
                  </tr>
                  <tr className="text-muted-foreground">
                    <td className="p-2">Jane Smith</td>
                    <td className="p-2">28</td>
                    <td className="p-2">92</td>
                    <td className="p-2">45</td>
                    <td className="p-2">100</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Format:</strong> <code>SubjectName/MAX</code> where MAX is the maximum marks for that subject</p>
              <p><strong>Example:</strong> Mathematics/30, ENGLISH/100, Science/50</p>
              <p><strong>Note:</strong> The system reads MAX from column titles. Subject name is displayed without /MAX.</p>
              <p><strong>Conduct:</strong> Optional column <code>Conduct/MAX</code></p>
              <p><strong>Important:</strong> All files must have students in the same order!</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Upload sections per term */}
        {selectedTerms.map(term => {
          const colors = termColors[term.id] || { bg: 'bg-gray-50', border: 'border-gray-200' };
          
          return (
            <div key={term.id} className={`p-4 rounded-lg ${colors.bg} ${colors.border} border space-y-3`}>
              <h3 className="font-semibold text-base">{term.name}</h3>
              
              {/* TEST upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">TEST Marks</span>
                  {term.testParsedData && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {term.testParsedData.students.length} students
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(term.id, 'test')}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors
                    ${term.testParsedData 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-primary hover:bg-primary/5'}`}
                  onClick={() => fileInputRefs.current[`${term.id}-test`]?.click()}
                >
                  <input
                    ref={el => fileInputRefs.current[`${term.id}-test`] = el}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file, term.id, 'test');
                    }}
                  />
                  {loading === `${term.id}-test` ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                  ) : term.testParsedData ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700">{term.testFile?.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload TEST Excel</span>
                    </div>
                  )}
                </div>
                
                {errors[`${term.id}-test`] && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{errors[`${term.id}-test`]}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* EXAM upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">EXAM Marks</span>
                  {term.examParsedData && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {term.examParsedData.students.length} students
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(term.id, 'exam')}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors
                    ${term.examParsedData 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-primary hover:bg-primary/5'}`}
                  onClick={() => fileInputRefs.current[`${term.id}-exam`]?.click()}
                >
                  <input
                    ref={el => fileInputRefs.current[`${term.id}-exam`] = el}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file, term.id, 'exam');
                    }}
                  />
                  {loading === `${term.id}-exam` ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                  ) : term.examParsedData ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700">{term.examFile?.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload EXAM Excel</span>
                    </div>
                  )}
                </div>
                
                {errors[`${term.id}-exam`] && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{errors[`${term.id}-exam`]}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          );
        })}

        {/* Manual entry option */}
        <ManualMarksEntry terms={terms} onTermsUpdate={onTermsUpdate} />
      </CardContent>
    </Card>
  );
}
