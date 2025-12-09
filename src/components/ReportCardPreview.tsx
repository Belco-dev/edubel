import { useState } from 'react';
import { Download, Eye, FileDown, Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Student, SchoolData } from '@/types/reportCard';
import { generateStudentPDF, downloadPDF } from '@/lib/pdfGenerator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReportCardPreviewProps {
  students: Student[];
  school: SchoolData;
  selectedSubjects: string[];
}

function getGradeColor(percentage: number): string {
  if (percentage >= 80) return 'text-green';
  if (percentage >= 60) return 'text-blue';
  if (percentage >= 40) return 'text-yellow';
  return 'text-destructive';
}

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'E';
}

export function ReportCardPreview({ students, school, selectedSubjects }: ReportCardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classTeacher, setClassTeacher] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const currentStudent = students[currentIndex];

  const handleDownloadSingle = async (student: Student) => {
    setDownloading(student.id);
    try {
      const doc = await generateStudentPDF({
        student,
        school,
        totalStudents: students.length,
        classTeacher,
        selectedSubjects,
      });
      downloadPDF(doc, `${student.fullName.replace(/\s+/g, '_')}_Report_Card.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
    setDownloading(null);
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (const student of students) {
        const doc = await generateStudentPDF({
          student,
          school,
          totalStudents: students.length,
          classTeacher,
          selectedSubjects,
        });
        downloadPDF(doc, `${student.fullName.replace(/\s+/g, '_')}_Report_Card.pdf`);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Failed to generate PDFs:', error);
    }
    setDownloadingAll(false);
  };

  if (students.length === 0) {
    return (
      <Card className="card-hover">
        <CardContent className="p-12 text-center">
          <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-display font-semibold mb-2">No Students Yet</h3>
          <p className="text-muted-foreground">
            Upload an Excel file with student data to generate report cards
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredMarks = currentStudent.marks.filter(m => 
    selectedSubjects.length === 0 || selectedSubjects.includes(m.subject)
  );

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="bg-gradient-hero text-primary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <Eye className="h-5 w-5" />
              Report Card Preview
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Preview and download student report cards
            </CardDescription>
          </div>
          <Badge className="bg-background/20 text-primary-foreground text-lg px-4 py-1">
            {students.length} Students
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Class Teacher Input */}
        <div className="space-y-2">
          <Label htmlFor="classTeacher">Class Teacher Name</Label>
          <Input
            id="classTeacher"
            placeholder="Enter class teacher's name"
            value={classTeacher}
            onChange={(e) => setClassTeacher(e.target.value)}
          />
        </div>

        {/* Download All Button */}
        <Button 
          onClick={handleDownloadAll} 
          disabled={downloadingAll}
          className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground btn-bounce"
          size="lg"
        >
          {downloadingAll ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Downloading All...
            </>
          ) : (
            <>
              <FileDown className="h-5 w-5 mr-2" />
              Download All Report Cards ({students.length})
            </>
          )}
        </Button>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="btn-bounce"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-medium">
            Student {currentIndex + 1} of {students.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex(Math.min(students.length - 1, currentIndex + 1))}
            disabled={currentIndex === students.length - 1}
            className="btn-bounce"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Report Card Preview */}
        <div className="border-2 border-border rounded-2xl overflow-hidden bg-card report-card">
          {/* Header */}
          <div className="bg-gradient-primary p-4 text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-display font-bold">{school.name || 'School Name'}</h2>
                <p className="text-sm opacity-80">{school.address || 'School Address'}</p>
                <p className="text-sm opacity-80">Contact: {school.contact || 'N/A'}</p>
              </div>
              {school.logo && (
                <img 
                  src={school.logo} 
                  alt="School Logo" 
                  className="h-16 w-16 object-contain bg-background/20 rounded-lg p-1"
                />
              )}
            </div>
            <div className="text-center mt-2">
              <span className="bg-background/20 px-4 py-1 rounded-full text-sm font-medium">
                {school.termName || 'Term Report Card'}
              </span>
            </div>
          </div>

          {/* Student Info */}
          <div className="p-4 bg-muted/30">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Student Name</span>
                <p className="font-semibold text-lg">{currentStudent.fullName}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Position</span>
                <p className={`font-bold text-lg ${getGradeColor(currentStudent.percentage)}`}>
                  {currentStudent.position} / {students.length}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Overall</span>
                <p className={`font-bold text-lg ${getGradeColor(currentStudent.percentage)}`}>
                  {currentStudent.percentage.toFixed(1)}% ({getGrade(currentStudent.percentage)})
                </p>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 rounded-l-lg">#</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-center p-2">Max</th>
                  <th className="text-center p-2">Obtained</th>
                  <th className="text-center p-2">%</th>
                  <th className="text-center p-2 rounded-r-lg">Grade</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarks.map((mark, index) => {
                  const pct = (mark.obtainedMarks / mark.maxMarks) * 100;
                  return (
                    <tr key={mark.subject} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-2 text-muted-foreground">{index + 1}</td>
                      <td className="p-2 font-medium">{mark.subject}</td>
                      <td className="p-2 text-center">{mark.maxMarks}</td>
                      <td className="p-2 text-center">{mark.obtainedMarks}</td>
                      <td className={`p-2 text-center font-medium ${getGradeColor(pct)}`}>
                        {pct.toFixed(1)}%
                      </td>
                      <td className={`p-2 text-center font-bold ${getGradeColor(pct)}`}>
                        {getGrade(pct)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-muted font-semibold">
                  <td className="p-2" colSpan={2}>TOTAL</td>
                  <td className="p-2 text-center">{currentStudent.maxTotalMarks}</td>
                  <td className="p-2 text-center">{currentStudent.totalMarks}</td>
                  <td className={`p-2 text-center ${getGradeColor(currentStudent.percentage)}`}>
                    {currentStudent.percentage.toFixed(1)}%
                  </td>
                  <td className={`p-2 text-center ${getGradeColor(currentStudent.percentage)}`}>
                    {getGrade(currentStudent.percentage)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remark */}
          <div className="mx-4 p-3 bg-accent/20 rounded-xl mb-4">
            <span className="text-sm font-medium">Teacher's Remark:</span>
            <p className="text-sm mt-1">{currentStudent.remark}</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 p-4 border-t border-border">
            <div className="text-center">
              <div className="h-8 border-b border-dashed border-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Class Teacher</span>
            </div>
            <div className="text-center">
              <div className="h-8 border-b border-dashed border-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Head Teacher</span>
            </div>
            <div className="text-center">
              <div className="h-8 border-b border-dashed border-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Parent/Guardian</span>
            </div>
          </div>
        </div>

        {/* Download Single Button */}
        <Button 
          onClick={() => handleDownloadSingle(currentStudent)} 
          disabled={downloading === currentStudent.id}
          variant="outline"
          className="w-full btn-bounce"
        >
          {downloading === currentStudent.id ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download This Report Card
            </>
          )}
        </Button>

        {/* All Students List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">All Students</h4>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {students.map((student, index) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                  index === currentIndex 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-6">{student.position}</span>
                  <span className="font-medium">{student.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getGradeColor(student.percentage)}>
                    {student.percentage.toFixed(1)}%
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSingle(student);
                    }}
                    disabled={downloading === student.id}
                    className="h-7 w-7 p-0"
                  >
                    {downloading === student.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
