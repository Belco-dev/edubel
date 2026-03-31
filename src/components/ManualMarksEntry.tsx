import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Download, ClipboardPaste, FileSpreadsheet, X, Users } from 'lucide-react';
import { TermUpload, ParsedSectionData, ParsedStudent } from '@/types/reportCard';
import writeXlsxFile from 'write-excel-file/browser';

interface ManualMarksEntryProps {
  terms: TermUpload[];
  onTermsUpdate: (terms: TermUpload[]) => void;
}

interface SectionSelection {
  termId: string;
  termName: string;
  type: 'test' | 'exam';
  label: string;
}

interface SubjectColumn {
  id: string;
  name: string;
  max: number;
}

interface SectionData {
  key: string;
  label: string;
  termId: string;
  type: 'test' | 'exam';
  subjects: SubjectColumn[];
  marks: number[][]; // [studentIndex][subjectIndex]
}

const defaultSubjects = (): SubjectColumn[] => [
  { id: crypto.randomUUID(), name: 'Subject1', max: 100 },
];

export function ManualMarksEntry({ terms, onTermsUpdate }: ManualMarksEntryProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [studentNames, setStudentNames] = useState<string[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Setup dialog state
  const [setupStep, setSetupStep] = useState<'sections' | 'names'>('sections');
  const [selectedSections, setSelectedSections] = useState<SectionSelection[]>([]);
  const [pasteText, setPasteText] = useState('');

  const selectedTerms = terms.filter(t => t.selected);

  const availableSections: SectionSelection[] = selectedTerms.flatMap(t => [
    { termId: t.id, termName: t.name, type: 'test' as const, label: `${t.name} Test Marks` },
    { termId: t.id, termName: t.name, type: 'exam' as const, label: `${t.name} Exam Marks` },
  ]);

  const toggleSection = (section: SectionSelection) => {
    setSelectedSections(prev => {
      const key = `${section.termId}-${section.type}`;
      const exists = prev.find(s => `${s.termId}-${s.type}` === key);
      if (exists) return prev.filter(s => `${s.termId}-${s.type}` !== key);
      return [...prev, section];
    });
  };

  const isSectionSelected = (section: SectionSelection) => {
    return selectedSections.some(s => s.termId === section.termId && s.type === section.type);
  };

  const handleStartSetup = () => {
    if (selectedTerms.length === 0) return;
    setSetupStep('sections');
    setSelectedSections([]);
    setPasteText('');
    setShowSetup(true);
  };

  const handleProceedToNames = () => {
    if (selectedSections.length === 0) return;
    setSetupStep('names');
  };

  const handleSubmitNames = () => {
    const names = pasteText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) return;

    setStudentNames(names);

    const newSections: SectionData[] = selectedSections.map(sel => ({
      key: `${sel.termId}-${sel.type}`,
      label: sel.label,
      termId: sel.termId,
      type: sel.type,
      subjects: defaultSubjects(),
      marks: names.map(() => [0]),
    }));

    setSections(newSections);
    setIsActive(true);
    setShowSetup(false);
  };

  const updateStudentName = (index: number, name: string) => {
    setStudentNames(prev => {
      const updated = [...prev];
      updated[index] = name;
      return updated;
    });
  };

  const addSubject = (sectionKey: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.key !== sectionKey) return sec;
      const newSubject: SubjectColumn = { id: crypto.randomUUID(), name: `Subject${sec.subjects.length + 1}`, max: 100 };
      return {
        ...sec,
        subjects: [...sec.subjects, newSubject],
        marks: sec.marks.map(row => [...row, 0]),
      };
    }));
  };

  const removeSubject = (sectionKey: string, subjectIndex: number) => {
    setSections(prev => prev.map(sec => {
      if (sec.key !== sectionKey) return sec;
      if (sec.subjects.length <= 1) return sec;
      return {
        ...sec,
        subjects: sec.subjects.filter((_, i) => i !== subjectIndex),
        marks: sec.marks.map(row => row.filter((_, i) => i !== subjectIndex)),
      };
    }));
  };

  const updateSubjectHeader = (sectionKey: string, subjectIndex: number, value: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.key !== sectionKey) return sec;
      const parts = value.split('/');
      const name = parts[0] || sec.subjects[subjectIndex].name;
      const max = parts.length > 1 ? (parseInt(parts[1]) || sec.subjects[subjectIndex].max) : sec.subjects[subjectIndex].max;
      const updatedSubjects = [...sec.subjects];
      updatedSubjects[subjectIndex] = { ...updatedSubjects[subjectIndex], name, max };
      return { ...sec, subjects: updatedSubjects };
    }));
  };

  const updateMark = (sectionKey: string, studentIndex: number, subjectIndex: number, value: number) => {
    setSections(prev => prev.map(sec => {
      if (sec.key !== sectionKey) return sec;
      const newMarks = sec.marks.map(row => [...row]);
      newMarks[studentIndex][subjectIndex] = value;
      return { ...sec, marks: newMarks };
    }));
  };

  const downloadSectionExcel = async (section: SectionData) => {
    const headerRow = [
      { value: 'Full names', fontWeight: 'bold' as const },
      ...section.subjects.map(s => ({ value: `${s.name}/${s.max}`, fontWeight: 'bold' as const })),
    ];
    const dataRows = studentNames.map((name, i) => [
      { value: name },
      ...section.subjects.map((_, j) => ({ value: section.marks[i]?.[j] ?? 0, type: Number as typeof Number })),
    ]);

    const allRows = [headerRow, ...dataRows];
    const columns = [{ width: 30 }, ...section.subjects.map(() => ({ width: 18 }))];

    const output = await writeXlsxFile(allRows as any, {
      sheet: section.label.substring(0, 31),
      columns,
      buffer: true,
    } as any) as unknown as ArrayBuffer;

    const blob = new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section.label.replace(/\s+/g, '_')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateFromManual = () => {
    const updatedTerms = [...terms];

    sections.forEach(section => {
      const parsedStudents: ParsedStudent[] = studentNames.map((name, i) => {
        let totalMarks = 0;
        let maxMarks = 0;
        const marks = section.subjects.map((sub, j) => {
          const m = section.marks[i]?.[j] ?? 0;
          totalMarks += m;
          maxMarks += sub.max;
          return { subject: sub.name, marks: m, maxMarks: sub.max };
        });
        const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
        return { fullName: name, marks, conductMarks: 0, conductMax: 100, totalMarks, maxMarks, percentage };
      });

      const detectedSubjects = section.subjects.map(s => s.name);
      const parsedData: ParsedSectionData = { students: parsedStudents, detectedSubjects };

      const termIndex = updatedTerms.findIndex(t => t.id === section.termId);
      if (termIndex === -1) return;

      if (!updatedTerms[termIndex].selected) {
        updatedTerms[termIndex] = { ...updatedTerms[termIndex], selected: true };
      }

      if (section.type === 'test') {
        updatedTerms[termIndex] = { ...updatedTerms[termIndex], testParsedData: parsedData };
      } else {
        updatedTerms[termIndex] = { ...updatedTerms[termIndex], examParsedData: parsedData };
      }
    });

    onTermsUpdate(updatedTerms);
  };

  const handleReset = () => {
    setIsActive(false);
    setSections([]);
    setStudentNames([]);
    setSelectedSections([]);
    setPasteText('');
  };

  if (selectedTerms.length === 0) return null;

  const sectionColors: Record<string, string> = {
    'term1-test': 'border-blue-300 bg-blue-50/50',
    'term1-exam': 'border-blue-400 bg-blue-50/80',
    'term2-test': 'border-green-300 bg-green-50/50',
    'term2-exam': 'border-green-400 bg-green-50/80',
    'term3-test': 'border-purple-300 bg-purple-50/50',
    'term3-exam': 'border-purple-400 bg-purple-50/80',
  };

  return (
    <>
      {/* Trigger area */}
      {!isActive && (
        <div className="mt-4 pt-4 border-t border-dashed border-border">
          <button
            onClick={handleStartSetup}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">
              or paste student names to fill marks manually
            </span>
          </button>
        </div>
      )}

      {/* Active sections */}
      {isActive && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{studentNames.length} Students — Manual Entry</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            </div>
          </div>

          {/* Editable student names */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
            <span className="text-xs font-medium text-muted-foreground">Student Names (editable):</span>
            <div className="grid grid-cols-1 gap-1">
              {studentNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</span>
                  <Input
                    value={name}
                    onChange={e => updateStudentName(i, e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Marks tables per section */}
          {sections.map(section => (
            <div key={section.key} className={`rounded-lg border-2 p-3 space-y-3 ${sectionColors[section.key] || 'border-border bg-muted/20'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-semibold text-sm">{section.label}</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addSubject(section.key)} className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Column
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadSectionExcel(section)} className="h-7 text-xs">
                    <Download className="w-3 h-3 mr-1" /> Excel
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-1.5 font-semibold min-w-[120px] sticky left-0 bg-inherit">Full names</th>
                      {section.subjects.map((sub, j) => (
                        <th key={sub.id} className="p-1 min-w-[90px]">
                          <div className="flex items-center gap-1">
                            <Input
                              value={`${sub.name}/${sub.max}`}
                              onChange={e => updateSubjectHeader(section.key, j, e.target.value)}
                              className="h-6 text-xs text-center font-semibold px-1"
                            />
                            {section.subjects.length > 1 && (
                              <button
                                onClick={() => removeSubject(section.key, j)}
                                className="text-destructive hover:text-destructive/80 shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentNames.map((name, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-1.5 font-medium sticky left-0 bg-inherit">{name}</td>
                        {section.subjects.map((sub, j) => (
                          <td key={sub.id} className="p-1">
                            <Input
                              type="number"
                              min={0}
                              max={sub.max}
                              value={section.marks[i]?.[j] ?? 0}
                              onChange={e => updateMark(section.key, i, j, Math.min(Number(e.target.value) || 0, sub.max))}
                              className="h-6 text-xs text-center px-1"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Generate button */}
          <Button onClick={generateFromManual} className="w-full bg-gradient-to-r from-primary to-primary/80">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Generate Report Cards from Manual Entry
          </Button>
        </div>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupStep === 'sections' ? 'Select Report Card Sections' : 'Paste Student Names'}
            </DialogTitle>
          </DialogHeader>

          {setupStep === 'sections' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose which sections to include on the report cards:
              </p>
              <div className="space-y-2">
                {availableSections.map(section => {
                  const key = `${section.termId}-${section.type}`;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        isSectionSelected(section)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                      onClick={() => toggleSection(section)}
                    >
                      <Checkbox checked={isSectionSelected(section)} className="pointer-events-none" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button onClick={handleProceedToNames} disabled={selectedSections.length === 0}>
                  Next — Paste Names
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === 'names' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Paste student names below (one per line):
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedSections.map(s => (
                  <Badge key={`${s.termId}-${s.type}`} variant="secondary" className="text-xs">
                    {s.label}
                  </Badge>
                ))}
              </div>
              <Textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={"John Doe\nJane Smith\nAlex Johnson"}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {pasteText.split('\n').filter(n => n.trim()).length} names detected
              </p>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSetupStep('sections')}>
                  Back
                </Button>
                <Button onClick={handleSubmitNames} disabled={pasteText.split('\n').filter(n => n.trim()).length === 0}>
                  Submit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
