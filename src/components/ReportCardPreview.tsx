import { useState } from 'react';
import { Download, Eye, FileDown, Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Student, SchoolData, TermSection, MarkSettings } from '@/types/reportCard';
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
  sections: TermSection[];
  markSettings: MarkSettings;
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

export function ReportCardPreview({ students, school, selectedSubjects, sections, markSettings }: ReportCardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classTeacher, setClassTeacher] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const currentStudent = students[currentIndex];
  const selectedSections = sections.filter(s => s.selected && s.parsedData);

  const handleDownloadSingle = async (student: Student) => {
    setDownloading(student.id);
    try {
      const doc = await generateStudentPDF({
        student,
        school,
        totalStudents: students.length,
        classTeacher,
        selectedSubjects,
        sections: selectedSections,
        markSettings,
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
          sections: selectedSections,
          markSettings,
        });
        downloadPDF(doc, `${student.fullName.replace(/\s+/g, '_')}_Report_Card.pdf`);
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
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-display font-semibold mb-2">No Students Yet</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Upload Excel files with student data to generate report cards
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get all subjects from first term
  const allSubjects = currentStudent.terms[0]?.subjects || [];
  const filteredSubjects = allSubjects.filter(s => 
    selectedSubjects.length === 0 || selectedSubjects.includes(s.subject)
  );

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="bg-gradient-hero text-primary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-display text-lg sm:text-xl">
              <Eye className="h-5 w-5" />
              Report Card Preview
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Preview and download report cards
            </CardDescription>
          </div>
          <Badge className="bg-background/20 text-primary-foreground text-base sm:text-lg px-3 sm:px-4 py-1">
            {students.length} Students
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
              Download All ({students.length})
            </>
          )}
        </Button>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-muted/50 p-2 sm:p-3 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="btn-bounce"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-xs sm:text-sm font-medium">
            {currentIndex + 1} / {students.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex(Math.min(students.length - 1, currentIndex + 1))}
            disabled={currentIndex === students.length - 1}
            className="btn-bounce"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>

        {/* Report Card Preview */}
        <div className="border-2 border-border rounded-2xl overflow-hidden bg-card report-card">
          {/* Header */}
          <div className="bg-gradient-primary p-3 sm:p-4 text-primary-foreground">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-display font-bold truncate">{school.name || 'School Name'}</h2>
                <p className="text-xs sm:text-sm opacity-80 truncate">{school.address || 'School Address'}</p>
                <p className="text-xs sm:text-sm opacity-80">Contact: {school.contact || 'N/A'}</p>
              </div>
              {school.logo && (
                <img 
                  src={school.logo} 
                  alt="School Logo" 
                  className="h-12 w-12 sm:h-16 sm:w-16 object-contain bg-background/20 rounded-lg p-1 flex-shrink-0"
                />
              )}
            </div>
            <div className="text-center mt-2">
              <span className="bg-background/20 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
                {school.termName || 'Term Report Card'}
              </span>
            </div>
          </div>

          {/* Student Name & Conduct */}
          <div className="p-3 sm:p-4 bg-muted/30 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 sm:gap-4">
              <div>
                <span className="text-xs sm:text-sm text-muted-foreground">Student Name</span>
                <p className="font-semibold text-base sm:text-lg">{currentStudent.fullName}</p>
              </div>
            </div>
            
            {/* Conduct Marks - Above Table */}
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-accent/20 rounded-lg">
              <span className="font-medium text-sm">Conduct:</span>
              <span className="font-bold text-primary">
                {currentStudent.conductMarks} / {markSettings.conductMax}
              </span>
            </div>
          </div>

          {/* Marks Table - Multi-term with MTT, EXAM, TOTAL columns */}
          <div className="p-2 sm:p-4 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-1 sm:p-2 font-semibold border border-border" rowSpan={2}>#</th>
                  <th className="text-left p-1 sm:p-2 font-semibold border border-border" rowSpan={2}>Subject</th>
                  {selectedSections.map((section) => (
                    <th key={section.id} className="text-center p-1 sm:p-2 font-semibold border border-border bg-primary/10" colSpan={3}>
                      {section.shortName}
                    </th>
                  ))}
                  <th className="text-center p-1 sm:p-2 font-semibold border border-border bg-green/10" rowSpan={2}>Total</th>
                </tr>
                <tr className="bg-muted/50">
                  {selectedSections.map((section) => (
                    <>
                      <th key={`${section.id}-mtt`} className="text-center p-1 font-medium border border-border text-xs">MTT</th>
                      <th key={`${section.id}-exam`} className="text-center p-1 font-medium border border-border text-xs">EXAM</th>
                      <th key={`${section.id}-total`} className="text-center p-1 font-medium border border-border text-xs bg-muted/80">TOT</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subjectData, index) => {
                  let rowTotal = 0;
                  return (
                    <tr key={subjectData.subject} className="hover:bg-muted/30 transition-colors">
                      <td className="p-1 sm:p-2 text-muted-foreground border border-border text-center">{index + 1}</td>
                      <td className="p-1 sm:p-2 font-medium border border-border">{subjectData.subject}</td>
                      {currentStudent.terms.map((term) => {
                        const mark = term.subjects.find(s => s.subject === subjectData.subject);
                        if (mark) rowTotal += mark.total;
                        return (
                          <>
                            <td key={`${term.termId}-mtt`} className="p-1 sm:p-2 text-center border border-border">{mark?.mtt || 0}</td>
                            <td key={`${term.termId}-exam`} className="p-1 sm:p-2 text-center border border-border">{mark?.exam || 0}</td>
                            <td key={`${term.termId}-total`} className="p-1 sm:p-2 text-center border border-border bg-muted/30 font-medium">{mark?.total || 0}</td>
                          </>
                        );
                      })}
                      <td className="p-1 sm:p-2 text-center border border-border bg-green/10 font-semibold">{rowTotal}</td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="bg-muted font-semibold">
                  <td className="p-1 sm:p-2 border border-border" colSpan={2}>TOTAL</td>
                  {currentStudent.terms.map((term) => {
                    const termMttTotal = term.subjects.reduce((sum, s) => sum + s.mtt, 0);
                    const termExamTotal = term.subjects.reduce((sum, s) => sum + s.exam, 0);
                    return (
                      <>
                        <td key={`${term.termId}-mtt-total`} className="p-1 sm:p-2 text-center border border-border">{termMttTotal}</td>
                        <td key={`${term.termId}-exam-total`} className="p-1 sm:p-2 text-center border border-border">{termExamTotal}</td>
                        <td key={`${term.termId}-total-total`} className="p-1 sm:p-2 text-center border border-border bg-muted/80">{term.totalMarks}</td>
                      </>
                    );
                  })}
                  <td className="p-1 sm:p-2 text-center border border-border bg-green/20">{currentStudent.grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Position - Below Table */}
          <div className="mx-2 sm:mx-4 p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl mb-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs sm:text-sm text-muted-foreground">Position</span>
                <p className={`font-bold text-xl sm:text-2xl ${getGradeColor(currentStudent.overallPercentage)}`}>
                  {currentStudent.position}<span className="text-sm">/{students.length}</span>
                </p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-xs sm:text-sm text-muted-foreground">Percentage</span>
                <p className={`font-bold text-lg sm:text-xl ${getGradeColor(currentStudent.overallPercentage)}`}>
                  {currentStudent.overallPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-xs sm:text-sm text-muted-foreground">Grade</span>
                <p className={`font-bold text-lg sm:text-xl ${getGradeColor(currentStudent.overallPercentage)}`}>
                  {getGrade(currentStudent.overallPercentage)}
                </p>
              </div>
            </div>
          </div>

          {/* Teacher's Remark - Blank for handwriting */}
          <div className="mx-2 sm:mx-4 p-3 bg-accent/10 rounded-xl mb-4 border-2 border-dashed border-accent/30">
            <span className="text-sm font-medium">Teacher's Remark:</span>
            <div className="h-12 sm:h-16 border-b border-dashed border-muted-foreground mt-2" />
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 border-t border-border">
            <div className="text-center">
              <div className="h-6 sm:h-8 border-b border-dashed border-muted-foreground mb-1" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Class Teacher</span>
            </div>
            <div className="text-center">
              <div className="h-6 sm:h-8 border-b border-dashed border-muted-foreground mb-1" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Head Teacher</span>
            </div>
            <div className="text-center">
              <div className="h-6 sm:h-8 border-b border-dashed border-muted-foreground mb-1" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Parent/Guardian</span>
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
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-xs sm:text-sm text-muted-foreground w-5 sm:w-6 flex-shrink-0">{student.position}</span>
                  <span className="font-medium text-sm truncate">{student.fullName}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Badge variant="secondary" className={`text-xs ${getGradeColor(student.overallPercentage)}`}>
                    {student.overallPercentage.toFixed(1)}%
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSingle(student);
                    }}
                    disabled={downloading === student.id}
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
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
