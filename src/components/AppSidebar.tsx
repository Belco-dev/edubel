import { Sun, Moon, Palette, BookOpen, ClipboardList, FileSpreadsheet, Download, Sparkles, Info, HelpCircle, RotateCcw, PlayCircle, Shield, Trash2, ScanLine, Home, LayoutTemplate, Check } from 'lucide-react';
import edubelLogo from '@/assets/edubel-logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeMode, ReportCardTemplate } from '@/types/reportCard';
import { Link } from 'react-router-dom';
import { restartTutorial } from '@/components/TutorialGuide';
import { usePWA } from '@/hooks/usePWA';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export type WizardStep = 'school' | 'terms' | 'upload' | 'grading' | 'preview';

interface AppSidebarProps {
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  currentStep: WizardStep;
  onStepChange: (s: WizardStep) => void;
  onCreateNew: () => void;
  template: ReportCardTemplate;
  onTemplateChange: (t: ReportCardTemplate) => void;
}

const STEPS: { id: WizardStep; title: string; icon: typeof BookOpen }[] = [
  { id: 'school', title: 'School Setup', icon: BookOpen },
  { id: 'terms', title: 'Select Terms', icon: ClipboardList },
  { id: 'upload', title: 'Upload Marks', icon: FileSpreadsheet },
  { id: 'grading', title: 'Grading', icon: Sparkles },
  { id: 'preview', title: 'Preview & Download', icon: Download },
];

const THEMES: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'colorful', icon: Palette, label: 'Colorful' },
];

const TEMPLATES: { id: ReportCardTemplate; label: string; desc: string }[] = [
  { id: 'classic', label: 'Classic Teal', desc: 'Original EduBel look' },
  { id: 'modern', label: 'Modern Indigo', desc: 'Bold & contemporary' },
  { id: 'elegant', label: 'Elegant Burgundy', desc: 'Formal & traditional' },
  { id: 'minimal', label: 'Minimal Slate', desc: 'Clean & understated' },
];

export function AppSidebar({ theme, onThemeChange, currentStep, onStepChange, onCreateNew, template, onTemplateChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isOfflineReady, canInstall, install, clearStoredData } = usePWA();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/40">
        <div className="flex items-center gap-3 px-2 py-3">
          <img
            src={edubelLogo}
            alt="EduBel logo"
            className="h-16 w-16 shrink-0 object-contain rounded-lg bg-white p-1 shadow-sm"
          />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-xl font-display font-bold gradient-text leading-none">EDUBEL</h1>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">A Division of Belcom</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Wizard steps */}
        <SidebarGroup>
          <SidebarGroupLabel>Create Report Cards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {STEPS.map((step, i) => {
                const isActive = currentStep === step.id;
                return (
                  <SidebarMenuItem key={step.id}>
                    <SidebarMenuButton
                      onClick={() => onStepChange(step.id)}
                      className={`hover:bg-muted/50 ${isActive ? 'bg-muted text-primary font-medium' : ''}`}
                      tooltip={step.title}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {i + 1}
                      </span>
                      {!collapsed && <span>{step.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Home">
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    {!collapsed && <span>Home</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onCreateNew} tooltip="Create New">
                  <RotateCcw className="h-4 w-4" />
                  {!collapsed && <span>Create New</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Scan Report Card">
                  <Link to="/scan">
                    <ScanLine className="h-4 w-4" />
                    {!collapsed && <span>Scan Report Card</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => window.dispatchEvent(new Event('edubel:open-spreadsheet'))}
                  tooltip="Create Marks File"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {!collapsed && <span>Create Marks File</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => restartTutorial()} tooltip="Tutorial">
                  <PlayCircle className="h-4 w-4" />
                  {!collapsed && <span>Tutorial</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="About">
                  <Link to="/about">
                    <Info className="h-4 w-4" />
                    {!collapsed && <span>About / Privacy</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="FAQ">
                  <a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}>
                    <HelpCircle className="h-4 w-4" />
                    {!collapsed && <span>FAQ</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {canInstall && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={install} tooltip="Install App">
                    <Download className="h-4 w-4" />
                    {!collapsed && <span>Install Edubel</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Theme */}
        <SidebarGroup>
          <SidebarGroupLabel>Theme</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {THEMES.map(({ mode, icon: Icon, label }) => (
                <SidebarMenuItem key={mode}>
                  <SidebarMenuButton
                    onClick={() => onThemeChange(mode)}
                    className={theme === mode ? 'bg-muted text-primary font-medium' : ''}
                    tooltip={label}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        {!collapsed && (
          <div className="px-2 py-2 space-y-2">
            {isOfflineReady && (
              <Badge variant="outline" className="w-full justify-center gap-1 border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 text-[10px]">
                <Shield className="h-3 w-3" />
                Offline Ready
              </Badge>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-xs text-destructive hover:text-destructive gap-1 h-7 justify-start">
                  <Trash2 className="h-3 w-3" />
                  Clear Stored Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all stored data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes saved school info and preferences from this browser. Cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearStoredData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
