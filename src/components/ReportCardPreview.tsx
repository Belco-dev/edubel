import React, { useState, useEffect, useRef } from 'react';
import { Download, Eye, FileDown, Users, ChevronLeft, ChevronRight, Loader2, Palette, Archive, FolderDown, Share2, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Student, SchoolData, TermUpload, ReportCardStyle, GradingRule, ReportCardTemplate } from '@/types/reportCard';
import { generateStudentPDF, downloadPDF } from '@/lib/pdfGenerator';
import { generateClassRankingPDF, classRankingFilename } from '@/lib/classRankingPdf';
import {
  isLocalFolderSaveSupported,
  pickDirectory,
  getOrCreateSubfolder,
  writeFileToDirectory,
} from '@/lib/localFolderSave';

import { triggerDownloadCelebration } from '@/components/TutorialGuide';
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
  gradingRules: GradingRule[];
  template?: ReportCardTemplate;
}




export function ReportCardPreview({ 
  students, school, selectedSubjects, terms, reportCardStyle, onStyleChange, gradingRules, template = 'classic'
}: ReportCardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [savingFolder, setSavingFolder] = useState(false);
  const [folderProgress, setFolderProgress] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [shareProgress, setShareProgress] = useState(0);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const folderSaveSupported = isLocalFolderSaveSupported();
  const shareSupported =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function';

  const currentStudent = students[currentIndex];
  const selectedTerms = terms.filter(t => t.selected && (t.testParsedData || t.examParsedData));
  const isBlackWhite = reportCardStyle === 'blackWhite';
  

  // Render the preview as the EXACT PDF that will be downloaded. Regenerate
  // whenever the inputs that affect the PDF change so the user can trust that
  // what they see is what they get.
  useEffect(() => {
    if (!currentStudent) return;
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      try {
        const doc = await generateStudentPDF({
          student: currentStudent,
          school,
          totalStudents: students.length,
          selectedSubjects,
          terms: selectedTerms,
          reportCardStyle,
          gradingRules,
          template,
        });
        if (cancelled) return;
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      } catch (err) {
        console.error('Preview render failed:', err);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, students, school, selectedSubjects, terms, reportCardStyle, gradingRules]);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);


  const handleDownloadSingle = async (student: Student) => {
    setDownloading(student.id);
    try {
      const doc = await generateStudentPDF({
        student, school, totalStudents: students.length,
        selectedSubjects, terms: selectedTerms, reportCardStyle, gradingRules, template,
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
          selectedSubjects, terms: selectedTerms, reportCardStyle, gradingRules, template,
        });
        downloadPDF(doc, `${student.fullName.replace(/\s+/g, '_')}_Report_Card.pdf`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Failed to generate PDFs:', error);
    }
    setDownloadingAll(false);
    triggerDownloadCelebration();
  };

  /**
   * Build the full report bundle as a single ZIP blob.
   * Used by both "Save to Device" download and "Smart Share" via Web Share API.
   * Reports progress via the supplied callback (0..100).
   */
  const buildReportZipBlob = async (
    onProgress: (pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> => {
    const zip = new JSZip();
    const pdfsFolder = zip.folder('PDFs');

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const doc = await generateStudentPDF({
        student, school, totalStudents: students.length,
        selectedSubjects, terms: selectedTerms, reportCardStyle, gradingRules, template,
      });
      const pdfBlob = doc.output('blob');
      pdfsFolder!.file(`${student.fullName.replace(/\s+/g, '_')}_Report_Card.pdf`, pdfBlob);
      onProgress(Math.round(((i + 1) / students.length) * 85));
    }

    const rankingDoc = await generateClassRankingPDF({ students, school, terms: selectedTerms });
    zip.file(classRankingFilename(school), rankingDoc.output('blob'));
    onProgress(92);

    const excelBlob = await generateReportCardWorkbook({
      students, school, selectedSubjects, terms: selectedTerms,
    });
    zip.file(`${school.className || 'Report_Cards'}_Summary.xlsx`, excelBlob);
    onProgress(96);

    const blob = await zip.generateAsync({ type: 'blob' });
    onProgress(100);
    const filename = `${(school.className || 'Report_Cards').replace(/\s+/g, '_')}_Report_Cards.zip`;
    return { blob, filename };
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    setZipProgress(0);
    try {
      const { blob, filename } = await buildReportZipBlob(setZipProgress);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadModalOpen(false);
      triggerDownloadCelebration();
    } catch (error) {
      console.error('Failed to generate ZIP:', error);
    }
    setDownloadingZip(false);
    setZipProgress(0);
  };

  /**
   * Smart Share — uses the Web Share API (Level 2, with files) to open the
   * device's native share sheet so the teacher can route the ZIP to WhatsApp,
   * Google Drive, OneDrive, Email, AirDrop, etc. without any OAuth setup.
   *
   * Falls back to a normal download if the browser can't share files.
   */
  const handleSmartShare = async () => {
    setSharing(true);
    setShareProgress(0);
    try {
      const { blob, filename } = await buildReportZipBlob(setShareProgress);
      const file = new File([blob], filename, { type: 'application/zip' });
      const shareData: ShareData = {
        title: `${school.className || 'Class'} Report Cards`,
        text: `${school.className || 'Class'} report cards${school.termName ? ` — ${school.termName}` : ''}`,
        files: [file],
      };

      const canShareFiles =
        typeof navigator.canShare === 'function' && navigator.canShare(shareData);

      if (canShareFiles) {
        await navigator.share(shareData);
        setDownloadModalOpen(false);
        triggerDownloadCelebration();
      } else {
        // Fallback: trigger download so the user can attach manually.
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setDownloadModalOpen(false);
        triggerDownloadCelebration();
      }
    } catch (error) {
      // AbortError fires when the user dismisses the share sheet — that's fine.
      if ((error as Error)?.name !== 'AbortError') {
        console.error('Failed to share:', error);
      }
    }
    setSharing(false);
    setShareProgress(0);
  };

  const handleSaveToFolder = async () => {
    if (!folderSaveSupported) return;
    const parent = await pickDirectory();
    if (!parent) return;

    setSavingFolder(true);
    setFolderProgress(0);
    try {
      const folderName = `${(school.className || 'Report_Cards').trim()} Report Cards`;
      const targetFolder = await getOrCreateSubfolder(parent, folderName);

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const doc = await generateStudentPDF({
          student, school, totalStudents: students.length,
          selectedSubjects, terms: selectedTerms, reportCardStyle, gradingRules, template,
        });
        await writeFileToDirectory(
          targetFolder,
          `${student.fullName.replace(/\s+/g, '_')}_Report_Card.pdf`,
          doc.output('blob')
        );
        setFolderProgress(Math.round(((i + 1) / students.length) * 85));
      }

      // Ranking PDF
      const rankingDoc = await generateClassRankingPDF({ students, school, terms: selectedTerms });
      await writeFileToDirectory(targetFolder, classRankingFilename(school), rankingDoc.output('blob'));
      setFolderProgress(93);

      // Excel summary
      const excelBlob = await generateReportCardWorkbook({
        students, school, selectedSubjects, terms: selectedTerms,
      });
      await writeFileToDirectory(
        targetFolder,
        `${school.className || 'Report_Cards'}_Summary.xlsx`,
        excelBlob
      );
      setFolderProgress(100);
      setDownloadModalOpen(false);
      triggerDownloadCelebration();
    } catch (error) {
      console.error('Failed to save to folder:', error);
    }
    setSavingFolder(false);
    setFolderProgress(0);
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



  return (
    <Card className="card-hover overflow-hidden" id="report-preview-section">
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

        {/* Single unified Download button — opens choice modal */}
        <Button
          onClick={() => setDownloadModalOpen(true)}
          disabled={downloadingAll || downloadingZip || savingFolder || sharing}
          className={`w-full ${isBlackWhite ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-gradient-primary hover:opacity-90 text-primary-foreground'} btn-bounce`}
          size="lg"
        >
          <Download className="h-5 w-5 mr-2" /> Download ({students.length} report cards)
        </Button>

        <Dialog open={downloadModalOpen} onOpenChange={(open) => {
          // Block closing while a long task is running
          if (!open && (downloadingZip || savingFolder || sharing)) return;
          setDownloadModalOpen(open);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Save or Share Report Cards</DialogTitle>
              <DialogDescription>
                Choose how to deliver the bundle (PDFs + Class Ranking + Excel summary).
                Everything is generated on this device — nothing is uploaded by EduBel.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              {/* 1. Save to Device (ZIP download) */}
              <Button
                onClick={handleDownloadZip}
                disabled={downloadingZip || savingFolder || sharing}
                className="w-full justify-start btn-bounce"
                size="lg"
                variant="default"
              >
                {downloadingZip ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Preparing… {zipProgress}%</>
                ) : (
                  <><Smartphone className="h-5 w-5 mr-2" /> Save to this device (.zip)</>
                )}
              </Button>

              {/* 2. Save to Local Folder (File System Access API, Chrome/Edge) */}
              {folderSaveSupported && (
                <Button
                  onClick={handleSaveToFolder}
                  disabled={downloadingZip || savingFolder || sharing}
                  className="w-full justify-start btn-bounce"
                  size="lg"
                  variant="secondary"
                >
                  {savingFolder ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving… {folderProgress}%</>
                  ) : (
                    <><FolderDown className="h-5 w-5 mr-2" /> Save to a chosen folder</>
                  )}
                </Button>
              )}

              {/* 3. Smart Share via native share sheet (WhatsApp, Drive, Email…) */}
              <Button
                onClick={handleSmartShare}
                disabled={downloadingZip || savingFolder || sharing}
                className="w-full justify-start btn-bounce"
                size="lg"
                variant="outline"
              >
                {sharing ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Preparing share… {shareProgress}%</>
                ) : (
                  <><Share2 className="h-5 w-5 mr-2" /> Share via… (WhatsApp, Drive, Email)</>
                )}
              </Button>

              {!shareSupported && (
                <p className="text-xs text-muted-foreground text-center">
                  Tip: "Share via…" works best on phones and on Chrome/Edge desktop.
                  On unsupported browsers it will download the .zip so you can attach it manually.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>


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

        {/* Report Card Preview — renders the EXACT PDF that will be downloaded
            so what the user sees is what they get. */}
        <div className={`border-2 rounded-2xl overflow-hidden ${isBlackWhite ? 'border-foreground' : 'border-border'} bg-muted/30`}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-background/60">
            <span className="text-xs font-medium text-muted-foreground">
              Live PDF preview — identical to the downloaded file
            </span>
            {previewLoading && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Updating…
              </span>
            )}
          </div>
          {previewUrl ? (
            <iframe
              key={previewUrl}
              src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
              title={`${currentStudent.fullName} report card preview`}
              className="w-full bg-white"
              style={{ height: '70vh', minHeight: 520, border: 0 }}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ height: '70vh', minHeight: 520 }}>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
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
