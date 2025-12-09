import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { parseExcelFile, ParsedStudent } from '@/lib/excelParser';
import { TermSection, StudentTermMarks } from '@/types/reportCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MultiFileUploadProps {
  sections: TermSection[];
  onSectionsUpdate: (sections: TermSection[], studentNames?: string[]) => void;
}

const sectionColors: Record<string, string> = {
  'midterm': 'bg-yellow/20 border-yellow/30',
  'term1': 'bg-green/20 border-green/30',
  'term2': 'bg-blue/20 border-blue/30',
  'term3': 'bg-purple/20 border-purple/30',
};

export function MultiFileUpload({ sections, onSectionsUpdate }: MultiFileUploadProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedSections = sections.filter(s => s.selected);

  const handleFile = async (file: File, sectionId: string) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrors(prev => ({ ...prev, [sectionId]: 'Please upload a valid Excel file' }));
      return;
    }

    setLoading(sectionId);
    setErrors(prev => { const n = { ...prev }; delete n[sectionId]; return n; });

    const parseResult = await parseExcelFile(file);
    
    if (parseResult.success) {
      const termMarks: StudentTermMarks[] = parseResult.students.map((s: ParsedStudent) => ({
        termId: sectionId,
        marks: s.marks,
        totalMarks: s.totalMarks,
        maxTotalMarks: s.maxTotalMarks,
        percentage: s.percentage,
        studentName: s.fullName,
      }));

      const studentNames = parseResult.students.map((s: ParsedStudent) => s.fullName);

      onSectionsUpdate(
        sections.map(s => 
          s.id === sectionId ? { ...s, file, students: termMarks, detectedSubjects: parseResult.detectedSubjects } : s
        ),
        studentNames
      );
    } else {
      setErrors(prev => ({ ...prev, [sectionId]: parseResult.error || 'Failed to parse file' }));
    }
    
    setLoading(null);
  };

  const removeFile = (sectionId: string) => {
    onSectionsUpdate(sections.map(s => s.id === sectionId ? { ...s, file: null, students: [], detectedSubjects: [] } : s));
  };

  if (selectedSections.length === 0) {
    return (
      <Card className="card-hover">
        <CardContent className="p-8 text-center">
          <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Select report card sections first</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="bg-gradient-accent text-accent-foreground">
        <CardTitle className="flex items-center gap-2 font-display">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Student Marks
        </CardTitle>
        <CardDescription className="text-accent-foreground/80">Upload Excel for each section</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {selectedSections.map((section) => (
          <div key={section.id} className={`rounded-xl border-2 overflow-hidden ${sectionColors[section.id]}`}>
            <div className="p-3 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{section.name}</span>
                {section.file && <Badge variant="secondary" className="text-xs"><CheckCircle className="h-3 w-3 mr-1 text-green" />{section.students.length} students</Badge>}
              </div>
              {section.file && <Button variant="ghost" size="sm" onClick={() => removeFile(section.id)} className="h-7 text-destructive"><X className="h-4 w-4" /></Button>}
            </div>
            
            <div className="p-4 bg-background/50">
              {section.file ? (
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{section.file.name}</p>
                    <p className="text-xs text-muted-foreground">{section.detectedSubjects.length} subjects</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[section.id]?.click()}>Replace</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 cursor-pointer py-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50" onClick={() => fileInputRefs.current[section.id]?.click()}>
                  {loading === section.id ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <><Upload className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Upload {section.shortName} marks</p></>}
                </div>
              )}
              
              <input ref={el => fileInputRefs.current[section.id] = el} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, section.id); }} />
              {errors[section.id] && <Alert variant="destructive" className="mt-3"><AlertCircle className="h-4 w-4" /><AlertDescription>{errors[section.id]}</AlertDescription></Alert>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
