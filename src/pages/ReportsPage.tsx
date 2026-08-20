import { useState } from 'react';
import { FileText, Download, Users, DoorOpen, IndianRupee, MessageSquareWarning, CalendarCheck, UserCheck, Package, Wrench, UtensilsCrossed } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const REPORTS = [
  { id: 'students', title: 'Student Report', description: 'Complete list of all students with room and fee details', icon: Users, color: 'primary' },
  { id: 'rooms', title: 'Room Report', description: 'Room occupancy, availability, and allocation summary', icon: DoorOpen, color: 'success' },
  { id: 'fees', title: 'Fee Report', description: 'Fee collection, pending dues, and payment history', icon: IndianRupee, color: 'accent' },
  { id: 'complaints', title: 'Complaint Report', description: 'All complaints with status and resolution time', icon: MessageSquareWarning, color: 'error' },
  { id: 'attendance', title: 'Attendance Report', description: 'Monthly attendance summary for all students', icon: CalendarCheck, color: 'primary' },
  { id: 'visitors', title: 'Visitor Report', description: 'Visitor entries, exits, and duration analysis', icon: UserCheck, color: 'success' },
  { id: 'inventory', title: 'Inventory Report', description: 'Asset status, stock levels, and condition report', icon: Package, color: 'accent' },
  { id: 'maintenance', title: 'Maintenance Report', description: 'Work orders, completion rate, and costs', icon: Wrench, color: 'warning' },
  { id: 'mess', title: 'Mess Report', description: 'Meal feedback, ratings, and attendance trends', icon: UtensilsCrossed, color: 'primary' },
];

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  success: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
  accent: 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400',
  error: 'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400',
  warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
};

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = (format: 'pdf' | 'excel' | 'csv', reportId: string) => {
    setExporting(`${reportId}-${format}`);
    setTimeout(() => setExporting(null), 1500);
  };

  return (
    <div>
      <PageHeader title="Reports" description="Generate and export reports for all hostel modules" icon={FileText} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map(r => (
          <div key={r.id} className="card p-5 animate-fade-in-up hover:shadow-card-hover transition-all">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${COLOR_MAP[r.color]}`}>
                <r.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">{r.title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{r.description}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf', r.id)}
                disabled={exporting === `${r.id}-pdf`}
                className="btn-secondary flex-1 text-xs"
              >
                {exporting === `${r.id}-pdf` ? 'Generating...' : <><Download className="w-3.5 h-3.5" /> PDF</>}
              </button>
              <button
                onClick={() => handleExport('excel', r.id)}
                disabled={exporting === `${r.id}-excel`}
                className="btn-secondary flex-1 text-xs"
              >
                {exporting === `${r.id}-excel` ? 'Generating...' : <><Download className="w-3.5 h-3.5" /> Excel</>}
              </button>
              <button
                onClick={() => handleExport('csv', r.id)}
                disabled={exporting === `${r.id}-csv`}
                className="btn-secondary flex-1 text-xs"
              >
                {exporting === `${r.id}-csv` ? 'Generating...' : <><Download className="w-3.5 h-3.5" /> CSV</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Export Options</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Reports can be exported in PDF, Excel, or CSV format. PDF reports include headers, charts, and summaries.
          Excel and CSV exports contain raw data for further analysis. Print-friendly versions are also available.
        </p>
      </div>
    </div>
  );
}
