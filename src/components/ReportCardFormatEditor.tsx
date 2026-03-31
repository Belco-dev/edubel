import { useState, useCallback } from 'react';
import { X, GripVertical, Trash2, Plus, Check } from 'lucide-react';
import { SchoolData, CustomDetail } from '@/types/reportCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportCardFormatEditorProps {
  open: boolean;
  onClose: () => void;
  schoolData: SchoolData;
  onApply: (data: SchoolData) => void;
}

const DEFAULT_FIELD_ORDER = [
  'ministryName', 'name', 'address', 'contact',
  'className', 'classTeacher', 'termName', 'numberOfStudents'
];

const FIELD_LABELS: Record<string, string> = {
  ministryName: 'Ministry/Header',
  name: 'School Name',
  address: 'Address',
  contact: 'Contact',
  className: 'Class Name',
  classTeacher: 'Class Teacher',
  termName: 'Term Name',
  numberOfStudents: 'Number of Students',
};

function getFieldValue(data: SchoolData, id: string): string {
  switch (id) {
    case 'ministryName': return data.ministryName || '';
    case 'name': return data.name;
    case 'address': return data.address;
    case 'contact': return data.contact;
    case 'className': return data.className;
    case 'classTeacher': return data.classTeacher || '';
    case 'termName': return data.termName;
    case 'numberOfStudents': return data.numberOfStudents?.toString() || '';
    default: return '';
  }
}

// Column titles for the table header that user can edit
const DEFAULT_TABLE_COLUMNS = ['SUBJECTS', 'MAX', 'TEST', 'EX', 'TOT', 'Rank', 'Comments'];

export function ReportCardFormatEditor({ open, onClose, schoolData, onApply }: ReportCardFormatEditorProps) {
  const [localData, setLocalData] = useState<SchoolData>(schoolData);
  const [tableColumns, setTableColumns] = useState<string[]>(DEFAULT_TABLE_COLUMNS);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [customDragIdx, setCustomDragIdx] = useState<number | null>(null);
  const [customDragOverIdx, setCustomDragOverIdx] = useState<number | null>(null);

  // Sync when dialog opens
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setLocalData(schoolData);
    } else {
      onClose();
    }
  }, [schoolData, onClose]);

  const fieldOrder = localData.fieldOrder || DEFAULT_FIELD_ORDER;

  // Only show fields that have values
  const filledFields = fieldOrder.filter(id => {
    const val = getFieldValue(localData, id);
    return val.trim() !== '';
  });

  const allDetails = [
    ...(localData.customDetail?.text ? [localData.customDetail] : []),
    ...(localData.customDetails || [])
  ].filter(d => d.text.trim() !== '');

  const topDetails = allDetails.filter(d => d.position === 'topLeft' || d.position === 'topRight');
  const bottomDetails = allDetails.filter(d => d.position === 'bottomLeft' || d.position === 'bottomRight');

  // Drag handlers for header fields
  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i); };
  const handleDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const items = [...filledFields];
    const [moved] = items.splice(dragIdx, 1);
    items.splice(i, 0, moved);
    // Rebuild full fieldOrder: filled in new order + unfilled in original order
    const unfilled = fieldOrder.filter(id => !filledFields.includes(id));
    setLocalData({ ...localData, fieldOrder: [...items, ...unfilled] });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // Custom detail drag
  const handleCustomDragStart = (i: number) => setCustomDragIdx(i);
  const handleCustomDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setCustomDragOverIdx(i); };
  const handleCustomDrop = (i: number) => {
    if (customDragIdx === null || customDragIdx === i) { setCustomDragIdx(null); setCustomDragOverIdx(null); return; }
    const items = [...(localData.customDetails || [])];
    const [moved] = items.splice(customDragIdx, 1);
    items.splice(i, 0, moved);
    setLocalData({ ...localData, customDetails: items });
    setCustomDragIdx(null);
    setCustomDragOverIdx(null);
  };

  const handleApply = () => {
    onApply({ ...localData, reportCardColumns: tableColumns } as SchoolData & { reportCardColumns: string[] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Report Card Format Editor</DialogTitle>
          <DialogDescription>
            Drag to rearrange header fields, edit table columns, then click "Use as Report Card"
          </DialogDescription>
        </DialogHeader>

        {/* Live Preview */}
        <div className="border-2 border-border rounded-2xl overflow-hidden bg-card text-sm">
          {/* Top custom details */}
          {topDetails.map((d, i) => (
            <div key={`top-${i}`} className={`px-3 py-1 text-xs ${d.position === 'topRight' ? 'text-right' : 'text-left'} bg-primary/5`}>
              {d.text}
            </div>
          ))}

          {/* Draggable Header Fields */}
          <div className="bg-gradient-primary text-primary-foreground p-4 space-y-1">
            <p className="text-[10px] opacity-70 mb-2 flex items-center gap-1">
              <GripVertical className="h-3 w-3" /> Drag fields to reorder on report card
            </p>
            {filledFields.map((id, index) => (
              <div
                key={id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                  dragOverIdx === index ? 'bg-white/20 ring-1 ring-white/40' : 'hover:bg-white/10'
                } ${dragIdx === index ? 'opacity-40' : ''}`}
              >
                <GripVertical className="h-3 w-3 flex-shrink-0 opacity-60" />
                <span className="text-[10px] opacity-60 w-24 truncate">{FIELD_LABELS[id] || id}:</span>
                <span className="font-medium text-sm truncate">{getFieldValue(localData, id)}</span>
              </div>
            ))}

            {localData.logo && (
              <div className="flex justify-end mt-1">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <img src={localData.logo} alt="Logo" className="w-10 h-10 object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* Student info placeholder */}
          <div className="p-3 bg-muted/30 space-y-1">
            <div className="flex justify-between text-xs">
              <span><strong>Student Name:</strong> John Doe</span>
              <span><strong>Class Teacher:</strong> {localData.classTeacher || '—'}</span>
            </div>
            <div className="bg-accent/20 rounded px-2 py-1 text-xs">
              <strong>Conduct:</strong> 18 / 20
            </div>
          </div>

          {/* Editable Table Columns */}
          <div className="p-3 space-y-2">
            <Label className="text-xs text-muted-foreground">Edit table column titles (click to rename)</Label>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted">
                    {tableColumns.map((col, i) => (
                      <th key={i} className="border border-border p-1 min-w-[50px]">
                        <Input
                          value={col}
                          onChange={e => {
                            const updated = [...tableColumns];
                            updated[i] = e.target.value;
                            setTableColumns(updated);
                          }}
                          className="h-6 text-xs text-center p-0 border-0 bg-transparent font-semibold"
                        />
                      </th>
                    ))}
                    <th className="border border-border p-1 w-8">
                      <Button variant="ghost" size="icon" className="h-5 w-5"
                        onClick={() => setTableColumns([...tableColumns, `Col ${tableColumns.length + 1}`])}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {['Mathematics', 'English', 'Science'].map(subj => (
                    <tr key={subj} className="hover:bg-muted/30">
                      <td className="border border-border p-1">{subj}</td>
                      {tableColumns.slice(1).map((_, i) => (
                        <td key={i} className="border border-border p-1 text-center text-muted-foreground">—</td>
                      ))}
                      <td className="border border-border p-1"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableColumns.length > 2 && (
              <div className="flex gap-1 flex-wrap">
                {tableColumns.map((col, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    {col}
                    {i > 0 && (
                      <button onClick={() => setTableColumns(tableColumns.filter((_, idx) => idx !== i))}
                        className="text-destructive hover:text-destructive/80">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Observations box */}
          <div className="px-3 pb-2">
            <div className="border border-border rounded-lg w-full">
              <div className="grid grid-cols-2">
                <div className="border-r border-border p-2">
                  <span className="text-[10px] font-semibold">Observations</span>
                  <div className="h-8" />
                </div>
                <div className="p-2">
                  <div className="border-b border-border pb-1 mb-1">
                    <span className="text-[10px] font-semibold">Teacher Signature</span>
                  </div>
                  <span className="text-[10px] font-semibold">Parent Signature</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom details - draggable bottom */}
          {bottomDetails.length > 0 && (
            <div className="px-3 pb-2 space-y-1">
              {(localData.customDetails || []).filter(d => d.text && (d.position === 'bottomLeft' || d.position === 'bottomRight')).map((d, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => handleCustomDragStart(i)}
                  onDragOver={e => handleCustomDragOver(e, i)}
                  onDrop={() => handleCustomDrop(i)}
                  onDragEnd={() => { setCustomDragIdx(null); setCustomDragOverIdx(null); }}
                  className={`flex items-center gap-1 text-xs cursor-grab ${
                    d.position === 'bottomRight' ? 'justify-end' : ''
                  } ${customDragOverIdx === i ? 'bg-primary/10 rounded' : ''} ${customDragIdx === i ? 'opacity-40' : ''}`}
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="bg-primary/5 px-2 py-0.5 rounded">{d.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply Button */}
        <Button onClick={handleApply} className="w-full bg-gradient-primary text-primary-foreground btn-bounce" size="lg">
          <Check className="h-5 w-5 mr-2" /> Use as Report Card
        </Button>
      </DialogContent>
    </Dialog>
  );
}
