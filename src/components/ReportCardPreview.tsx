import React, { useState } from 'react';
import { Download, Eye, FileDown, Users, ChevronLeft, ChevronRight, Loader2, Palette, Archive } from 'lucide-react';
import { Student, SchoolData, TermUpload, ReportCardStyle } from '@/types/reportCard';
import { generateStudentPDF, downloadPDF } from '@/lib/pdfGenerator';
import JSZip from 'jszip';
import { generateReportCardWorkbook } from '@/lib/excelExporter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ReportCardPreviewProps {
  students: Student[];
  school: SchoolData;
  selectedSubjects: string[];
  terms: TermUpload[];
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
  students, school, selectedSubjects, terms, reportCardStyle, onStyleChange 
}: ReportCardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const currentStudent = students[currentIndex];
  const selectedTerms = terms.filter(t => t.selected && (t.testParsedData || t.examParsedData));
  const isBlackWhite = reportCardStyle === 'blackWhite';
  const hasThreeTerms = selectedTerms.length === 3;

  const handleDownloadSingle = async (student: Student) => {
    setDownloading(student.id);
    try {
      const doc = await generateStudentPDF({
        student, school, totalStudents: students.length,
        selectedSubjects, terms: selectedTerms, reportCardStyle,
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
          student, school, totalStudents: students.length,
          selectedSubjects, terms: selectedTerms, reportCardStyle,
        });
        downloadPDF(doc, `${student.fullName.replace(/\s+/g, '_')}_Report_Card.pdf`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Failed to generate PDFs:', error);
    }
    setDownloadingAll(false);
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    setZipProgress(0);
    try {
      const zip = new JSZip();
      const pdfsFolder = zip.folder('PDFs');

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const doc = await generateStudentPDF({
          student, school, totalStudents: students.length,
          selectedSubjects, terms: selectedTerms, reportCardStyle,
        });
        const pdfBlob = doc.output('blob');
        pdfsFolder!.file(`${student.fullName.replace(/\s+/g, '_')}_Report_Card.pdf`, pdfBlob);
        setZipProgress(Math.round(((i + 1) / students.length) * 90));
      }

      const excelBlob = await generateReportCardWorkbook({
        students, school, selectedSubjects, terms: selectedTerms,
      });
      zip.file(`${school.className || 'Report_Cards'}_Summary.xlsx`, excelBlob);
      setZipProgress(95);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setZipProgress(100);

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(school.className || 'Report_Cards').replace(/\s+/g, '_')}_Report_Cards.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate ZIP:', error);
    }
    setDownloadingZip(false);
    setZipProgress(0);
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

  const allSubjects = currentStudent.terms[0]?.subjects || [];
  const filteredSubjects = allSubjects.filter(s => 
    selectedSubjects.length === 0 || selectedSubjects.includes(s.subject)
  );

  const numStudents = school.numberOfStudents || students.length;

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

        {/* Download All Button */}
        <Button 
          onClick={handleDownloadAll} 
          disabled={downloadingAll}
          className={`w-full ${isBlackWhite ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-gradient-primary hover:opacity-90 text-primary-foreground'} btn-bounce`}
          size="lg"
        >
          {downloadingAll ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Downloading All...</>
          ) : (
            <><FileDown className="h-5 w-5 mr-2" /> Download All ({students.length})</>
          )}
        </Button>

        {/* Download ZIP Button */}
        <Button 
          onClick={handleDownloadZip} 
          disabled={downloadingZip || downloadingAll}
          variant="outline" className="w-full btn-bounce" size="lg"
        >
          {downloadingZip ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating ZIP... {zipProgress}%</>
          ) : (
            <><Archive className="h-5 w-5 mr-2" /> Download ZIP (PDFs + Excel)</>
          )}
        </Button>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-muted/50 p-2 sm:p-3 rounded-xl">
          <Button variant="ghost" size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0} className="btn-bounce">
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-xs sm:text-sm font-medium">{currentIndex + 1} / {students.length}</span>
          <Button variant="ghost" size="sm"
            onClick={() => setCurrentIndex(Math.min(students.length - 1, currentIndex + 1))}
            disabled={currentIndex === students.length - 1} className="btn-bounce">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>

        {/* Report Card Preview */}
        <div className={`border-2 rounded-2xl overflow-hidden ${isBlackWhite ? 'border-foreground bg-background' : 'border-border bg-card'} report-card`}>
          {/* Number of students - only if filled */}
          {(school.numberOfStudents || students.length > 0) && (
            <div className="px-3 py-1 text-xs text-muted-foreground">
              Number of students {numStudents}
            </div>
          )}

          {/* Ministry/Header - only if filled */}
          {school.ministryName?.trim() && (
            <div className={`px-3 py-1 text-center text-xs font-semibold ${isBlackWhite ? 'bg-muted' : 'bg-primary/10'}`}>
              {school.ministryName}
            </div>
          )}
          
          {/* Custom Details - Top positions */}
          {[...(school.customDetail?.text ? [school.customDetail] : []), ...(school.customDetails || [])].filter(d => d.text && (d.position === 'topLeft' || d.position === 'topRight')).map((detail, i) => (
            <div key={i} className={`px-3 py-1 text-xs ${detail.position === 'topRight' ? 'text-right' : 'text-left'} ${isBlackWhite ? 'bg-muted' : 'bg-primary/5'}`}>
              {detail.text}
            </div>
          ))}

          {/* Header */}
          <div className={`p-3 sm:p-4 ${isBlackWhite ? 'bg-muted border-b-2 border-foreground' : 'bg-gradient-primary text-primary-foreground'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {school.name?.trim() && <h2 className={`text-lg sm:text-xl font-display font-bold truncate ${isBlackWhite ? 'text-foreground' : ''}`}>{school.name}</h2>}
                {school.address?.trim() && <p className={`text-xs sm:text-sm truncate ${isBlackWhite ? 'text-muted-foreground' : 'opacity-80'}`}>{school.address}</p>}
                {school.contact?.trim() && <p className={`text-xs sm:text-sm ${isBlackWhite ? 'text-muted-foreground' : 'opacity-80'}`}>Contact: {school.contact}</p>}
              </div>
              {school.logo && (
                <img src={school.logo} alt="School Logo" 
                  className={`h-12 w-12 sm:h-16 sm:w-16 object-contain rounded-lg p-1 flex-shrink-0 ${isBlackWhite ? 'bg-muted' : 'bg-background/20'}`} />
              )}
            </div>
            <div className="text-center mt-2">
              <span className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium ${isBlackWhite ? 'bg-foreground text-background' : 'bg-background/20'}`}>
                {school.className && `${school.className} - `}{school.termName || 'Term Report Card'}
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
              <div>
                <span className="text-xs sm:text-sm text-muted-foreground">Class Teacher</span>
                <p className="font-semibold text-sm">{school.classTeacher || '—'}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg ${isBlackWhite ? 'bg-muted border border-foreground' : 'bg-accent/20'}`}>
              <span className="font-medium text-sm">Conduct:</span>
              <span className={`font-bold ${isBlackWhite ? '' : 'text-primary'}`}>
                {currentStudent.conductMarks} / {currentStudent.conductMax}
              </span>
            </div>
          </div>

          {/* Marks Table with Rank column per term */}
          <div className="p-2 sm:p-4 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-1 sm:p-2 font-semibold border border-border" rowSpan={2}>SUBJECTS</th>
                  <th className="text-center p-1 font-semibold border border-border" colSpan={3}>MAX</th>
                  {selectedTerms.map(term => (
                    <th key={term.id} className="text-center p-1 font-semibold border border-border" colSpan={4}>
                      {term.shortName}
                    </th>
                  ))}
                  {hasThreeTerms && (
                    <th className="text-center p-1 font-semibold border border-border" colSpan={3}>AVERAGE</th>
                  )}
                  <th className="text-center p-1 font-semibold border border-border" rowSpan={2}>Comments</th>
                </tr>
                <tr className="bg-muted/50">
                  <th className="text-center p-1 font-medium border border-border text-xs">TEST</th>
                  <th className="text-center p-1 font-medium border border-border text-xs">EX</th>
                  <th className="text-center p-1 font-medium border border-border text-xs">TOT</th>
                  {selectedTerms.map(term => (
                    <React.Fragment key={term.id}>
                      <th className="text-center p-1 font-medium border border-border text-xs">TEST</th>
                      <th className="text-center p-1 font-medium border border-border text-xs">EX</th>
                      <th className="text-center p-1 font-medium border border-border text-xs">TOT</th>
                      <th className="text-center p-1 font-medium border border-border text-xs">Rank</th>
                    </React.Fragment>
                  ))}
                  {hasThreeTerms && (
                    <>
                      <th className="text-center p-1 font-medium border border-border text-xs">TEST</th>
                      <th className="text-center p-1 font-medium border border-border text-xs">EX</th>
                      <th className="text-center p-1 font-medium border border-border text-xs">TOT</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map(subjectData => {
                  const avgData = hasThreeTerms ? currentStudent.subjectAverages?.find(a => a.subject === subjectData.subject) : null;
                  return (
                    <tr key={subjectData.subject} className="hover:bg-muted/30 transition-colors">
                      <td className="p-1 sm:p-2 font-medium border border-border">{subjectData.subject}</td>
                      <td className="p-1 text-center border border-border">{subjectData.maxMtt || '-'}</td>
                      <td className="p-1 text-center border border-border">{subjectData.maxExam || '-'}</td>
                      <td className="p-1 text-center border border-border font-medium">{subjectData.maxTotal || '-'}</td>
                      {currentStudent.terms.map(term => {
                        const mark = term.subjects.find(s => s.subject === subjectData.subject);
                        return (
                          <React.Fragment key={term.termId}>
                            <td className="p-1 text-center border border-border">{mark && mark.mtt > 0 ? mark.mtt : '-'}</td>
                            <td className="p-1 text-center border border-border">{mark && mark.exam > 0 ? mark.exam : '-'}</td>
                            <td className="p-1 text-center border border-border font-medium">{mark?.total || '-'}</td>
                            <td className="p-1 text-center border border-border text-xs">{mark?.rank || '-'}</td>
                          </React.Fragment>
                        );
                      })}
                      {hasThreeTerms && (
                        <>
                          <td className="p-1 text-center border border-border">{avgData?.avgTest || '-'}</td>
                          <td className="p-1 text-center border border-border">{avgData?.avgExam || '-'}</td>
                          <td className="p-1 text-center border border-border font-medium">{avgData?.avgTotal || '-'}</td>
                        </>
                      )}
                      <td className="p-1 text-center border border-border"></td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="bg-muted font-semibold">
                  <td className="p-1 sm:p-2 border border-border">Total</td>
                  <td className="p-1 text-center border border-border">
                    {filteredSubjects.reduce((sum, s) => sum + (s.maxMtt || 0), 0) || '-'}
                  </td>
                  <td className="p-1 text-center border border-border">
                    {filteredSubjects.reduce((sum, s) => sum + (s.maxExam || 0), 0) || '-'}
                  </td>
                  <td className="p-1 text-center border border-border">
                    {filteredSubjects.reduce((sum, s) => sum + (s.maxTotal || 0), 0) || '-'}
                  </td>
                  {currentStudent.terms.map(term => {
                    const termMttTotal = term.subjects.reduce((sum, s) => sum + s.mtt, 0);
                    const termExamTotal = term.subjects.reduce((sum, s) => sum + s.exam, 0);
                    return (
                      <React.Fragment key={term.termId}>
                        <td className="p-1 text-center border border-border">{termMttTotal || '-'}</td>
                        <td className="p-1 text-center border border-border">{termExamTotal || '-'}</td>
                        <td className="p-1 text-center border border-border">{term.totalMarks}</td>
                        <td className="p-1 text-center border border-border"></td>
                      </React.Fragment>
                    );
                  })}
                  {hasThreeTerms && currentStudent.subjectAverages && (
                    <>
                      <td className="p-1 text-center border border-border">
                        {Math.round(currentStudent.subjectAverages.reduce((sum, s) => sum + s.avgTest, 0) * 10) / 10 || '-'}
                      </td>
                      <td className="p-1 text-center border border-border">
                        {Math.round(currentStudent.subjectAverages.reduce((sum, s) => sum + s.avgExam, 0) * 10) / 10 || '-'}
                      </td>
                      <td className="p-1 text-center border border-border">
                        {Math.round(currentStudent.subjectAverages.reduce((sum, s) => sum + s.avgTotal, 0) * 10) / 10 || '-'}
                      </td>
                    </>
                  )}
                  <td className="p-1 text-center border border-border"></td>
                </tr>
                {/* Percentage Row */}
                <tr className="bg-muted/50">
                  <td className="p-1 sm:p-2 border border-border font-medium">Percentage</td>
                  <td className="p-1 text-center border border-border" colSpan={3}></td>
                  {currentStudent.terms.map(term => (
                    <React.Fragment key={term.termId}>
                      <td className="p-1 text-center border border-border" colSpan={2}></td>
                      <td className={`p-1 text-center border border-border font-bold ${getGradeColor(term.percentage, isBlackWhite)}`}>
                        {term.percentage.toFixed(1)}%
                      </td>
                      <td className="p-1 text-center border border-border"></td>
                    </React.Fragment>
                  ))}
                  {hasThreeTerms && currentStudent.subjectAverages && (
                    <>
                      {(() => {
                        const avgTotalSum = currentStudent.subjectAverages.reduce((sum, s) => sum + s.avgTotal, 0);
                        const avgMaxSum = filteredSubjects.reduce((sum, s) => sum + (s.maxTotal || 0), 0);
                        const annualPct = avgMaxSum > 0 ? (avgTotalSum / avgMaxSum) * 100 : 0;
                        return (
                          <>
                            <td className="p-1 text-center border border-border" colSpan={2}></td>
                            <td className={`p-1 text-center border border-border font-bold ${getGradeColor(annualPct, isBlackWhite)}`}>
                              {annualPct.toFixed(1)}%
                            </td>
                          </>
                        );
                      })()}
                    </>
                  )}
                  <td className="p-1 text-center border border-border"></td>
                </tr>
                {/* Rank Row */}
                <tr className="bg-muted/70 font-semibold">
                  <td className="p-1 sm:p-2 border border-border font-medium">Rank</td>
                  <td className="p-1 text-center border border-border" colSpan={3}></td>
                  {currentStudent.terms.map(term => (
                    <React.Fragment key={term.termId}>
                      <td className="p-1 text-center border border-border" colSpan={3}></td>
                      <td className="p-1 text-center border border-border font-bold">
                        {term.termRank || '-'}
                      </td>
                    </React.Fragment>
                  ))}
                  {hasThreeTerms && (
                    <>
                      <td className="p-1 text-center border border-border" colSpan={2}></td>
                      <td className="p-1 text-center border border-border font-bold">
                        {currentStudent.annualRank || currentStudent.position}
                      </td>
                    </>
                  )}
                  <td className="p-1 text-center border border-border"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Observations box - same width as table */}
          <div className="px-2 sm:px-4 mb-3">
            <div className={`border ${isBlackWhite ? 'border-foreground' : 'border-border'} w-full`}>
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

          {/* Custom Details - Bottom positions */}
          {[...(school.customDetail?.text ? [school.customDetail] : []), ...(school.customDetails || [])].filter(d => d.text && (d.position === 'bottomLeft' || d.position === 'bottomRight')).map((detail, i) => (
            <div key={i} className={`px-3 py-1 text-xs ${detail.position === 'bottomRight' ? 'text-right' : 'text-left'} ${isBlackWhite ? 'bg-muted' : 'bg-primary/5'}`}>
              {detail.text}
            </div>
          ))}
        </div>

        {/* Download Single Button */}
        <Button 
          onClick={() => handleDownloadSingle(currentStudent)} 
          disabled={downloading === currentStudent.id}
          variant="outline" className="w-full btn-bounce"
        >
          {downloading === currentStudent.id ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating PDF...</>
          ) : (
            <><Download className="h-4 w-4 mr-2" /> Download {currentStudent.fullName}'s Report Card</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
