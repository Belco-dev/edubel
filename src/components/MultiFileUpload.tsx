import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, X, Info } from 'lucide-react';
import { parseExcelFile } from '@/lib/excelParser';
import { TermSection } from '@/types/reportCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MultiFileUploadProps {
  sections: TermSection[];
  onSectionsUpdate: (sections: TermSection[]) => void;
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
  const [showFormat, setShowFormat] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedSections = sections.filter(s => s.selected);

  const handleFile = async (file: File, sectionId: string) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrors(prev => ({ ...prev, [sectionId]: 'Please upload a valid Excel file' }));
      return;
    }

    setLoading(sectionId);
    setErrors(prev => { const n = { ...prev }; delete n[sectionId]; return n; });

    const section = sections.find(s => s.id === sectionId);
    const isMidterm = section?.isMidterm || false;

    const parseResult = await parseExcelFile(file, isMidterm);
    
    if (parseResult.success) {
      onSectionsUpdate(
        sections.map(s => 
          s.id === sectionId 
            ? { ...s, file, parsedData: { students: parseResult.students, detectedSubjects: parseResult.detectedSubjects } } 
            : s
        )
      );
    } else {
      setErrors(prev => ({ ...prev, [sectionId]: parseResult.error || 'Failed to parse file' }));
    }
    
    setLoading(null);
  };

  const removeFile = (sectionId: string) => {
    onSectionsUpdate(sections.map(s => s.id === sectionId ? { ...s, file: null, parsedData: null } : s));
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
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Excel Format Guide */}
        <Collapsible open={showFormat} onOpenChange={setShowFormat}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Excel Format Guide
              </span>
              <span className="text-xs text-muted-foreground">{showFormat ? 'Hide' : 'Show'}</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-3">
              <h4 className="font-medium text-sm">Required Excel Column Format:</h4>
              <div className="overflow-x-auto">
                <table className="text-xs w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-semibold bg-primary/10">Full names</th>
                      <th className="text-left p-2 font-semibold bg-blue/10">Mathematics/30</th>
                      <th className="text-left p-2 font-semibold bg-green/10">ENGLISH/100</th>
                      <th className="text-left p-2 font-semibold bg-purple/10">Science/50</th>
                      <th className="text-left p-2 font-semibold bg-yellow/10">Conduct/100</th>
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
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* File Upload Areas */}
        {selectedSections.map((section) => (
          <div key={section.id} className={`rounded-xl border-2 overflow-hidden ${sectionColors[section.id]}`}>
            <div className="p-3 border-b border-border/30 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm sm:text-base">{section.name}</span>
                {section.isMidterm && <Badge variant="outline" className="text-xs">TEST</Badge>}
                {!section.isMidterm && <Badge variant="outline" className="text-xs">EXAM</Badge>}
                {section.parsedData && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1 text-green" />
                    {section.parsedData.students.length} students
                  </Badge>
                )}
              </div>
              {section.file && (
                <Button variant="ghost" size="sm" onClick={() => removeFile(section.id)} className="h-7 text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="p-4 bg-background/50">
              {section.file && section.parsedData ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <FileSpreadsheet className="h-8 w-8 text-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{section.file.name}</p>
                    <p className="text-xs text-muted-foreground">{section.parsedData.detectedSubjects.length} subjects detected</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[section.id]?.click()}>
                    Replace
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center gap-2 cursor-pointer py-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors" 
                  onClick={() => fileInputRefs.current[section.id]?.click()}
                >
                  {loading === section.id ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        Upload {section.shortName} marks (.xlsx)
                      </p>
                    </>
                  )}
                </div>
              )}
              
              <input 
                ref={el => fileInputRefs.current[section.id] = el} 
                type="file" 
                accept=".xlsx,.xls" 
                className="hidden" 
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, section.id); }} 
              />
              {errors[section.id] && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors[section.id]}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
