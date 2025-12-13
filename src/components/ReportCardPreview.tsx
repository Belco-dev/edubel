import { useState } from 'react';
import { Download, Eye, FileDown, Users, ChevronLeft, ChevronRight, Loader2, Palette } from 'lucide-react';
import { Student, SchoolData, TermSection, MarkSettings, ReportCardStyle } from '@/types/reportCard';
import { generateStudentPDF, downloadPDF } from '@/lib/pdfGenerator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ReportCardPreviewProps {
  students: Student[];
  school: SchoolData;
  selectedSubjects: string[];
  sections: TermSection[];
  markSettings: MarkSettings;
  hasMidterm: boolean;
  reportCardStyle: ReportCardStyle;
  onStyleChange: (style: ReportCardStyle) => void;
}

function getGradeColor(percentage: number, isBlackWhite: boolean): string {
  if (isBlackWhite) return 'text-foreground';
  if (percentage >= 80) return 'text-green';
  if (percentage >= 60) return 'text-blue';
  if (percentage >= 40) return 'text-yellow';
  return 'text-destructive';
}

export function ReportCardPreview({ 
  students, 
  school, 
  selectedSubjects, 
  sections, 
  markSettings, 
  hasMidterm,
  reportCardStyle,
  onStyleChange 
}: ReportCardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classTeacher, setClassTeacher] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const currentStudent = students[currentIndex];
  const selectedSections = sections.filter(s => s.selected && s.parsedData);
  const isBlackWhite = reportCardStyle === 'blackWhite';

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
        hasMidterm,
        reportCardStyle,
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
          hasMidterm,
          reportCardStyle,
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
      <CardHeader className={isBlackWhite ? "bg-muted text-foreground" : "bg-gradient-hero text-primary-foreground"}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-display text-lg sm:text-xl">
              <Eye className="h-5 w-5" />
              Report Card Preview
            </CardTitle>
            <CardDescription className={isBlackWhite ? "text-muted-foreground" : "text-primary-foreground/80"}>
              Preview and download report cards
            </CardDescription>
          </div>
          <Badge className={isBlackWhite ? "bg-foreground/10 text-foreground" : "bg-background/20 text-primary-foreground text-base sm:text-lg px-3 sm:px-4 py-1"}>
            {students.length} Students
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Style Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <Label htmlFor="style-toggle" className="text-sm font-medium">
              {isBlackWhite ? 'Black & White' : 'Colorful'}
            </Label>
          </div>
          <Switch
            id="style-toggle"
            checked={reportCardStyle === 'colorful'}
            onCheckedChange={(checked) => onStyleChange(checked ? 'colorful' : 'blackWhite')}
          />
        </div>

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
          className={`w-full ${isBlackWhite ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-gradient-primary hover:opacity-90 text-primary-foreground'} btn-bounce`}
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
        <div className={`border-2 rounded-2xl overflow-hidden ${isBlackWhite ? 'border-foreground bg-background' : 'border-border bg-card'} report-card`}>
          {/* Custom Detail - Top positions */}
          {school.customDetail?.text && (school.customDetail.position === 'topLeft' || school.customDetail.position === 'topRight') && (
            <div className={`px-3 py-1 text-xs ${school.customDetail.position === 'topRight' ? 'text-right' : 'text-left'} ${isBlackWhite ? 'bg-muted' : 'bg-primary/5'}`}>
              {school.customDetail.text}
            </div>
          )}

          {/* Header */}
          <div className={`p-3 sm:p-4 ${isBlackWhite ? 'bg-muted border-b-2 border-foreground' : 'bg-gradient-primary text-primary-foreground'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className={`text-lg sm:text-xl font-display font-bold truncate ${isBlackWhite ? 'text-foreground' : ''}`}>{school.name || 'School Name'}</h2>
                <p className={`text-xs sm:text-sm truncate ${isBlackWhite ? 'text-muted-foreground' : 'opacity-80'}`}>{school.address || 'School Address'}</p>
                <p className={`text-xs sm:text-sm ${isBlackWhite ? 'text-muted-foreground' : 'opacity-80'}`}>Contact: {school.contact || 'N/A'}</p>
              </div>
              {school.logo && (
                <img 
                  src={school.logo} 
                  alt="School Logo" 
                  className={`h-12 w-12 sm:h-16 sm:w-16 object-contain rounded-lg p-1 flex-shrink-0 ${isBlackWhite ? 'bg-muted' : 'bg-background/20'}`}
                />
              )}
            </div>
            <div className="text-center mt-2">
              <span className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium ${isBlackWhite ? 'bg-foreground text-background' : 'bg-background/20'}`}>
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
            <div className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg ${isBlackWhite ? 'bg-muted border border-foreground' : 'bg-accent/20'}`}>
              <span className="font-medium text-sm">Conduct:</span>
              <span className={`font-bold ${isBlackWhite ? '' : 'text-primary'}`}>
                {currentStudent.conductMarks} / {markSettings.conductMax}
              </span>
            </div>
          </div>

          {/* Marks Table - Dynamic columns based on whether midterm is included */}
          <div className="p-2 sm:p-4 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[400px]">
              <thead>
                <tr className={isBlackWhite ? 'bg-muted' : 'bg-muted'}>
                  <th className="text-left p-1 sm:p-2 font-semibold border border-border w-[120px]">SUBJECTS</th>
                  {selectedSections.map((section) => (
                    <th key={section.id} className="text-center p-1 font-semibold border border-border" colSpan={hasMidterm ? 3 : 2}>
                      {section.shortName}
                    </th>
                  ))}
                  <th className="text-center p-1 font-semibold border border-border">Rank</th>
                  <th className="text-center p-1 font-semibold border border-border w-[80px]">Comments</th>
                </tr>
                <tr className="bg-muted/50">
                  <th className="border border-border"></th>
                  {selectedSections.map((section) => (
                    <React.Fragment key={section.id}>
                      {hasMidterm && <th className="text-center p-1 font-medium border border-border text-xs">TEST</th>}
                      <th className="text-center p-1 font-medium border border-border text-xs">EX</th>
                      <th className="text-center p-1 font-medium border border-border text-xs">TOT</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-border"></th>
                  <th className="border border-border"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subjectData) => {
                  return (
                    <tr key={subjectData.subject} className="hover:bg-muted/30 transition-colors">
                      <td className="p-1 sm:p-2 font-medium border border-border">{subjectData.subject}</td>
                      {currentStudent.terms.map((term) => {
                        const mark = term.subjects.find(s => s.subject === subjectData.subject);
                        const hasMtt = mark && mark.mtt > 0;
                        const hasExam = mark && mark.exam > 0;
                        return (
                          <React.Fragment key={term.termId}>
                            {hasMidterm && (
                              <td className="p-1 text-center border border-border">
                                {hasMtt ? mark.mtt : '-'}
                              </td>
                            )}
                            <td className="p-1 text-center border border-border">
                              {hasExam ? mark.exam : '-'}
                            </td>
                            <td className="p-1 text-center border border-border font-medium">
                              {mark?.total || '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="p-1 text-center border border-border font-medium">{subjectData.rank || '-'}</td>
                      <td className="p-1 text-center border border-border"></td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="bg-muted font-semibold">
                  <td className="p-1 sm:p-2 border border-border">Total</td>
                  {currentStudent.terms.map((term) => {
                    const termMttTotal = term.subjects.reduce((sum, s) => sum + s.mtt, 0);
                    const termExamTotal = term.subjects.reduce((sum, s) => sum + s.exam, 0);
                    return (
                      <React.Fragment key={term.termId}>
                        {hasMidterm && <td className="p-1 text-center border border-border">{termMttTotal || '-'}</td>}
                        <td className="p-1 text-center border border-border">{termExamTotal || '-'}</td>
                        <td className="p-1 text-center border border-border">{term.totalMarks}</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="p-1 text-center border border-border"></td>
                  <td className="p-1 text-center border border-border"></td>
                </tr>
                {/* Average Row */}
                <tr className="bg-muted/50">
                  <td className="p-1 sm:p-2 border border-border font-medium">Average</td>
                  <td className={`p-1 text-center border border-border font-bold ${getGradeColor(currentStudent.overallPercentage, isBlackWhite)}`} colSpan={hasMidterm ? 2 : 1}>
                    {currentStudent.overallPercentage.toFixed(1)}%
                  </td>
                  <td className="p-1 text-center border border-border font-medium">Rank</td>
                  <td className={`p-1 text-center border border-border font-bold ${getGradeColor(currentStudent.overallPercentage, isBlackWhite)}`} colSpan={selectedSections.length > 1 ? selectedSections.length : 1}>
                    {currentStudent.position}
                  </td>
                  <td className="p-1 text-center border border-border" colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Observations - Blank for teacher handwriting */}
          <div className="mx-2 sm:mx-4 mb-3">
            <div className={`border ${isBlackWhite ? 'border-foreground' : 'border-border'}`}>
              <div className="grid grid-cols-2">
                <div className={`border-r p-2 ${isBlackWhite ? 'border-foreground' : 'border-border'}`}>
                  <span className="text-xs font-semibold block mb-1">Observations</span>
                  <div className="h-12 sm:h-16" />
                </div>
                <div className="p-2">
                  <div className={`border-b pb-2 mb-2 ${isBlackWhite ? 'border-foreground' : 'border-border'}`}>
                    <span className="text-xs font-semibold">Teacher Signature</span>
                    <div className="h-6 sm:h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold">Parent Signature</span>
                    <div className="h-6 sm:h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Detail - Bottom positions */}
          {school.customDetail?.text && (school.customDetail.position === 'bottomLeft' || school.customDetail.position === 'bottomRight') && (
            <div className={`px-3 py-1 text-xs ${school.customDetail.position === 'bottomRight' ? 'text-right' : 'text-left'} ${isBlackWhite ? 'bg-muted' : 'bg-primary/5'}`}>
              {school.customDetail.text}
            </div>
          )}
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
                  <Badge variant="secondary" className={`text-xs ${getGradeColor(student.overallPercentage, isBlackWhite)}`}>
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

// Add React import at the top
import React from 'react';
