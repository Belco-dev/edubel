import { useState, useRef, useCallback } from 'react';
import { Building2, Phone, Calendar, Upload, ImageIcon, X, FileText, GraduationCap, Plus, Trash2, GripVertical, Save, ShieldCheck, ChevronDown, Users, Send } from 'lucide-react';
import { ReportCardFormatEditor } from '@/components/ReportCardFormatEditor';
import { SchoolData, CustomDetail } from '@/types/reportCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const STORAGE_KEY = 'edubel_school_data';

const DEFAULT_FIELD_ORDER = [
  'ministryName', 'name', 'address', 'contact',
  'className', 'classTeacher', 'termName', 'numberOfStudents'
];

// Ensure fieldOrder includes all standard fields + custom_N entries
function ensureCompleteFieldOrder(fieldOrder: string[] | undefined, customDetailsCount: number): string[] {
  const base = fieldOrder || [...DEFAULT_FIELD_ORDER];
  const allIds = new Set(base);
  // Add any missing standard fields
  DEFAULT_FIELD_ORDER.forEach(id => {
    if (!allIds.has(id)) { base.push(id); allIds.add(id); }
  });
  // Add custom detail entries
  for (let i = 0; i < customDetailsCount; i++) {
    const cid = `custom_${i}`;
    if (!allIds.has(cid)) { base.push(cid); allIds.add(cid); }
  }
  return base;
}

interface FieldDef {
  id: string;
  label: string;
  icon: typeof Building2;
  placeholder: string;
  iconColor: string;
  getValue: (data: SchoolData) => string;
  setValue: (data: SchoolData, value: string) => SchoolData;
}

const FIELD_DEFS: FieldDef[] = [
  {
    id: 'ministryName',
    label: 'Ministry/Header (Optional)',
    icon: Building2,
    iconColor: 'text-accent',
    placeholder: 'e.g., Ministry of Education, Rwanda',
    getValue: d => d.ministryName || '',
    setValue: (d, v) => ({ ...d, ministryName: v }),
  },
  {
    id: 'name',
    label: 'School Name',
    icon: Building2,
    iconColor: 'text-primary',
    placeholder: 'Enter school name',
    getValue: d => d.name,
    setValue: (d, v) => ({ ...d, name: v }),
  },
  {
    id: 'address',
    label: 'Address',
    icon: Building2,
    iconColor: 'text-secondary',
    placeholder: 'School address',
    getValue: d => d.address,
    setValue: (d, v) => ({ ...d, address: v }),
  },
  {
    id: 'contact',
    label: 'Contact Number',
    icon: Phone,
    iconColor: 'text-green',
    placeholder: 'Phone number',
    getValue: d => d.contact,
    setValue: (d, v) => ({ ...d, contact: v }),
  },
  {
    id: 'className',
    label: 'Class Name',
    icon: GraduationCap,
    iconColor: 'text-blue',
    placeholder: 'e.g., P5A, S3 Science',
    getValue: d => d.className,
    setValue: (d, v) => ({ ...d, className: v }),
  },
  {
    id: 'classTeacher',
    label: 'Class Teacher Name',
    icon: GraduationCap,
    iconColor: 'text-purple',
    placeholder: 'Enter class teacher name',
    getValue: d => d.classTeacher || '',
    setValue: (d, v) => ({ ...d, classTeacher: v }),
  },
  {
    id: 'termName',
    label: 'Term Name',
    icon: Calendar,
    iconColor: 'text-purple',
    placeholder: 'e.g., First Term 2024',
    getValue: d => d.termName,
    setValue: (d, v) => ({ ...d, termName: v }),
  },
  {
    id: 'numberOfStudents',
    label: 'Number of Students',
    icon: Users,
    iconColor: 'text-primary',
    placeholder: 'e.g., 45',
    getValue: d => d.numberOfStudents?.toString() || '',
    setValue: (d, v) => ({ ...d, numberOfStudents: v ? parseInt(v, 10) || undefined : undefined }),
  },
];

interface SchoolSetupProps {
  schoolData: SchoolData;
  onSchoolDataChange: (data: SchoolData) => void;
}

export function SchoolSetup({ schoolData, onSchoolDataChange }: SchoolSetupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragFieldIndex, setDragFieldIndex] = useState<number | null>(null);
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(null);
  const [customDragIndex, setCustomDragIndex] = useState<number | null>(null);
  const [customDragOverIndex, setCustomDragOverIndex] = useState<number | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(true);
  const [showFormatEditor, setShowFormatEditor] = useState(false);

  const customDetails = schoolData.customDetails || [];
  const fieldOrder = ensureCompleteFieldOrder(schoolData.fieldOrder, customDetails.length);

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schoolData));
      toast.success('School information saved to this browser!');
    } catch {
      toast.error('Failed to save. Browser storage may be full.');
    }
  }, [schoolData]);

  const handleFieldFocus = useCallback(() => {
    if (hasCheckedStorage) return;
    setHasCheckedStorage(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setShowRestoreDialog(true);
    } catch { /* ignore */ }
  }, [hasCheckedStorage]);

  const handleRestore = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SchoolData;
        // Preserve current logo if saved data has no logo
        if (!parsed.logo && schoolData.logo) {
          parsed.logo = schoolData.logo;
        }
        onSchoolDataChange(parsed);
        toast.success('School information restored! You can still upload/change the logo.');
      }
    } catch {
      toast.error('Failed to restore saved data.');
    }
    setShowRestoreDialog(false);
  }, [onSchoolDataChange, schoolData.logo]);

  // Drag handlers for standard fields
  const handleFieldDragStart = (index: number) => setDragFieldIndex(index);
  const handleFieldDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverFieldIndex(index);
  };
  const handleFieldDrop = (index: number) => {
    if (dragFieldIndex === null || dragFieldIndex === index) {
      setDragFieldIndex(null);
      setDragOverFieldIndex(null);
      return;
    }
    const items = [...fieldOrder];
    const [moved] = items.splice(dragFieldIndex, 1);
    items.splice(index, 0, moved);
    onSchoolDataChange({ ...schoolData, fieldOrder: items });
    setDragFieldIndex(null);
    setDragOverFieldIndex(null);
  };

  // Drag handlers for custom detail fields
  const handleCustomDragStart = (index: number) => setCustomDragIndex(index);
  const handleCustomDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setCustomDragOverIndex(index);
  };
  const handleCustomDrop = (index: number) => {
    if (customDragIndex === null || customDragIndex === index) {
      setCustomDragIndex(null);
      setCustomDragOverIndex(null);
      return;
    }
    const items = [...(schoolData.customDetails || [])];
    const [moved] = items.splice(customDragIndex, 1);
    items.splice(index, 0, moved);
    onSchoolDataChange({ ...schoolData, customDetails: items });
    setCustomDragIndex(null);
    setCustomDragOverIndex(null);
  };

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  const validateImageFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) return 'Please upload a valid image file.';
    if (file.size > MAX_IMAGE_SIZE) return 'Image too large (max 5MB).';
    return null;
  };

  const handleLogoUpload = (file: File) => {
    const error = validateImageFile(file);
    if (error) { console.warn('Logo upload rejected:', error); return; }
    const reader = new FileReader();
    reader.onload = e => {
      onSchoolDataChange({ ...schoolData, logo: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoUpload(file);
  };

  const handleCustomDetailChange = (field: 'text' | 'position', value: string) => {
    const current = schoolData.customDetail || { text: '', position: 'topLeft' as const };
    onSchoolDataChange({
      ...schoolData,
      customDetail: { ...current, [field]: value } as CustomDetail,
    });
  };

  // Build unified ordered items: standard fields + custom_N entries
  type UnifiedItem = { type: 'standard'; field: FieldDef } | { type: 'custom'; index: number; detail: CustomDetail };
  const orderedItems: UnifiedItem[] = fieldOrder
    .map(id => {
      const stdField = FIELD_DEFS.find(f => f.id === id);
      if (stdField) return { type: 'standard' as const, field: stdField };
      if (id.startsWith('custom_')) {
        const idx = parseInt(id.replace('custom_', ''), 10);
        if (!isNaN(idx) && idx < customDetails.length) {
          return { type: 'custom' as const, index: idx, detail: customDetails[idx] };
        }
      }
      return null;
    })
    .filter((item): item is UnifiedItem => item !== null);

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader
        className="bg-gradient-primary text-primary-foreground cursor-pointer select-none"
        onClick={() => setSectionOpen(!sectionOpen)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <Building2 className="h-5 w-5" />
              School Information
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Enter your school details — drag fields to reorder
            </CardDescription>
          </div>
          <ChevronDown className={`h-5 w-5 text-primary-foreground transition-transform duration-200 ${sectionOpen ? 'rotate-180' : ''}`} />
        </div>
      </CardHeader>
      {sectionOpen && (
        <CardContent className="p-6 space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              School Logo
            </Label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${dragOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {schoolData.logo ? (
                <div className="flex items-center gap-4">
                  <img src={schoolData.logo} alt="School Logo" className="h-20 w-20 object-contain rounded-lg bg-muted p-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Logo uploaded</p>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80 mt-1"
                      onClick={() => onSchoolDataChange({ ...schoolData, logo: null })}>
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 cursor-pointer py-4 bg-primary-foreground"
                  onClick={() => fileInputRef.current?.click()}>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Drag & drop logo here or <span className="text-primary font-medium">browse</span>
                  </p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file); }} />
            </div>
          </div>

          {/* Unified Draggable Fields (standard + custom) */}
          <div className="space-y-3" onFocus={handleFieldFocus}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> Drag to reorder all fields
              </p>
              <Button variant="outline" size="sm" onClick={() => {
                const newDetails = [...(schoolData.customDetails || []), { text: '', position: 'topLeft' as const }];
                const newFieldOrder = ensureCompleteFieldOrder(schoolData.fieldOrder, newDetails.length);
                onSchoolDataChange({ ...schoolData, customDetails: newDetails, fieldOrder: newFieldOrder });
              }}>
                <Plus className="h-4 w-4 mr-1" /> Add Custom Field
              </Button>
            </div>
            {orderedItems.map((item, index) => {
              if (item.type === 'standard') {
                const field = item.field;
                const Icon = field.icon;
                return (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleFieldDragStart(index)}
                    onDragOver={e => handleFieldDragOver(e, index)}
                    onDrop={() => handleFieldDrop(index)}
                    onDragEnd={() => { setDragFieldIndex(null); setDragOverFieldIndex(null); }}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                      dragOverFieldIndex === index ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
                    } ${dragFieldIndex === index ? 'opacity-50' : ''}`}
                  >
                    <div className="cursor-grab active:cursor-grabbing flex-shrink-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="flex items-center gap-2 text-sm">
                        <Icon className={`h-3.5 w-3.5 ${field.iconColor}`} />
                        {field.label}
                      </Label>
                      <Input
                        placeholder={field.placeholder}
                        value={field.getValue(schoolData)}
                        onChange={e => onSchoolDataChange(field.setValue(schoolData, e.target.value))}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                        type={field.id === 'numberOfStudents' ? 'number' : 'text'}
                      />
                    </div>
                  </div>
                );
              } else {
                const { index: cIdx, detail } = item;
                return (
                  <div
                    key={`custom_${cIdx}`}
                    draggable
                    onDragStart={() => handleFieldDragStart(index)}
                    onDragOver={e => handleFieldDragOver(e, index)}
                    onDrop={() => handleFieldDrop(index)}
                    onDragEnd={() => { setDragFieldIndex(null); setDragOverFieldIndex(null); }}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-all bg-accent/5 ${
                      dragOverFieldIndex === index ? 'border-primary bg-primary/5' : 'border-accent/30 hover:bg-accent/10'
                    } ${dragFieldIndex === index ? 'opacity-50' : ''}`}
                  >
                    <div className="cursor-grab active:cursor-grabbing flex-shrink-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="flex items-center gap-2 text-sm">
                        <FileText className="h-3.5 w-3.5 text-accent" />
                        Custom Field {cIdx + 1}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., P.O. Box 123, Kigali"
                          value={detail.text}
                          className="flex-1"
                          onChange={e => {
                            const updated = [...(schoolData.customDetails || [])];
                            updated[cIdx] = { ...updated[cIdx], text: e.target.value };
                            onSchoolDataChange({ ...schoolData, customDetails: updated });
                          }}
                        />
                        <Select value={detail.position} onValueChange={v => {
                          const updated = [...(schoolData.customDetails || [])];
                          updated[cIdx] = { ...updated[cIdx], position: v as CustomDetail['position'] };
                          onSchoolDataChange({ ...schoolData, customDetails: updated });
                        }}>
                          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="topLeft">Top Left</SelectItem>
                            <SelectItem value="topRight">Top Right</SelectItem>
                            <SelectItem value="bottomLeft">Bottom Left</SelectItem>
                            <SelectItem value="bottomRight">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 flex-shrink-0"
                          onClick={() => {
                            const updated = (schoolData.customDetails || []).filter((_, i) => i !== cIdx);
                            // Remove custom_N from fieldOrder and re-index
                            const newOrder = fieldOrder.filter(id => id !== `custom_${cIdx}`).map(id => {
                              if (id.startsWith('custom_')) {
                                const n = parseInt(id.replace('custom_', ''), 10);
                                if (n > cIdx) return `custom_${n - 1}`;
                              }
                              return id;
                            });
                            onSchoolDataChange({ ...schoolData, customDetails: updated, fieldOrder: newOrder });
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {(!schoolData.customDetails || schoolData.customDetails.length === 0) && !schoolData.customDetail?.text && orderedItems.filter(i => i.type === 'custom').length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Click "Add Custom Field" to add custom information to your report cards
            </p>
          )}

          {/* Save & Submit Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave} className="bg-gradient-primary text-primary-foreground">
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
            <Button onClick={() => setShowFormatEditor(true)} variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Send className="h-4 w-4 mr-2" /> Submit & Preview Format
            </Button>
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Stored only on this browser. Your info is safe.
            </span>
          </div>

          {/* Report Card Format Editor */}
          <ReportCardFormatEditor
            open={showFormatEditor}
            onClose={() => setShowFormatEditor(false)}
            schoolData={schoolData}
            onApply={onSchoolDataChange}
          />

          {/* Restore Dialog */}
          <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Saved School Info Found</DialogTitle>
                <DialogDescription>
                  We found saved school information from your last visit. Would you like to use it?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                  No, start fresh
                </Button>
                <Button onClick={handleRestore} className="bg-gradient-primary text-primary-foreground">
                  Yes, use saved info
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      )}
    </Card>
  );
}
