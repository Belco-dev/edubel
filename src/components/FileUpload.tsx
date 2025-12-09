import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { parseExcelFile, ParseResult } from '@/lib/excelParser';
import { Student } from '@/types/reportCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onStudentsLoaded: (students: Student[], detectedSubjects: string[]) => void;
}

export function FileUpload({ onStudentsLoaded }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setResult({
        success: false,
        students: [],
        detectedSubjects: [],
        error: 'Please upload a valid Excel file (.xlsx or .xls)',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const parseResult = await parseExcelFile(file);
    setResult(parseResult);
    
    if (parseResult.success) {
      onStudentsLoaded(parseResult.students, parseResult.detectedSubjects);
    }
    
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="bg-gradient-accent text-accent-foreground">
        <CardTitle className="flex items-center gap-2 font-display">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Student Data
        </CardTitle>
        <CardDescription className="text-accent-foreground/80">
          Upload an Excel file with student marks
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer ${
            dragOver 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            {loading ? (
              <>
                <div className="p-4 bg-primary/10 rounded-full">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <p className="text-lg font-medium">Processing file...</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-accent/20 rounded-full floating">
                  <Upload className="h-10 w-10 text-accent-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">
                    Drag & drop your Excel file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or <span className="text-primary font-medium cursor-pointer hover:underline">browse</span> to select
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <FileSpreadsheet className="h-3 w-3" />
                  Supports .xlsx and .xls files
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {result && (
          <div className="mt-4 animate-fade-up">
            {result.success ? (
              <Alert className="border-green/30 bg-green/10">
                <CheckCircle className="h-4 w-4 text-green" />
                <AlertDescription className="text-green">
                  Successfully loaded <strong>{result.students.length}</strong> students with{' '}
                  <strong>{result.detectedSubjects.length}</strong> subjects detected!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-xl">
          <h4 className="font-medium text-sm mb-2">Expected Excel Format:</h4>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Student Name</th>
                  <th className="text-left p-2 font-medium">Mathematics</th>
                  <th className="text-left p-2 font-medium">Math Max</th>
                  <th className="text-left p-2 font-medium">English</th>
                  <th className="text-left p-2 font-medium">Eng Max</th>
                  <th className="text-left p-2 font-medium">...</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-muted-foreground">
                  <td className="p-2">John Doe</td>
                  <td className="p-2">85</td>
                  <td className="p-2">100</td>
                  <td className="p-2">78</td>
                  <td className="p-2">100</td>
                  <td className="p-2">...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
