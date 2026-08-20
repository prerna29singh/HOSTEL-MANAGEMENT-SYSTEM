import { Brain, TrendingUp, AlertTriangle, Lightbulb, Sparkles, Zap } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';

const AI_FEATURES = [
  {
    id: 'complaint-categorization',
    title: 'AI Complaint Categorization',
    description: 'Automatically categorizes incoming complaints by type and priority using NLP analysis of the complaint text.',
    status: 'Active',
    icon: Brain,
    color: 'primary' as const,
    insight: '92% categorization accuracy across 1,240+ complaints analyzed',
  },
  {
    id: 'chatbot',
    title: 'AI Hostel Chatbot',
    description: '24/7 virtual assistant that answers student queries about fees, room availability, mess menu, and leave policies.',
    status: 'Active',
    icon: Sparkles,
    color: 'accent' as const,
    insight: 'Handles 78% of student queries without human intervention',
  },
  {
    id: 'room-recommendation',
    title: 'AI Room Recommendation',
    description: 'Suggests optimal room allocations based on department, year, preferences, and compatibility scoring.',
    status: 'Active',
    icon: Lightbulb,
    color: 'success' as const,
    insight: '85% of recommended allocations accepted by students',
  },
  {
    id: 'maintenance-prediction',
    title: 'AI Maintenance Prediction',
    description: 'Predicts which rooms and equipment are likely to need maintenance based on age, usage patterns, and history.',
    status: 'Beta',
    icon: TrendingUp,
    color: 'warning' as const,
    insight: 'Identifies 15 at-risk items requiring preventive maintenance',
  },
  {
    id: 'risk-analysis',
    title: 'AI Student Risk Analysis',
    description: 'Flags students who may be at risk based on attendance patterns, fee delays, and complaint frequency.',
    status: 'Active',
    icon: AlertTriangle,
    color: 'error' as const,
    insight: '8 students flagged for low attendance this month',
  },
  {
    id: 'visitor-verification',
    title: 'AI Visitor Verification',
    description: 'Analyzes visitor patterns and suggests verification levels based on visit frequency and background.',
    status: 'Beta',
    icon: Zap,
    color: 'primary' as const,
    insight: '3 visitors recommended for enhanced verification',
  },
  {
    id: 'notice-summarization',
    title: 'AI Notice Summarization',
    description: 'Automatically generates concise summaries of long notices for quick scanning and mobile notifications.',
    status: 'Active',
    icon: Sparkles,
    color: 'accent' as const,
    insight: 'Reduces average notice reading time by 60%',
  },
  {
    id: 'dashboard-insights',
    title: 'AI Dashboard Insights',
    description: 'Generates natural language insights from dashboard data, highlighting trends and anomalies automatically.',
    status: 'Active',
    icon: Brain,
    color: 'success' as const,
    insight: 'Fee collection rate improved 12% this quarter',
  },
];

const COLOR_MAP = {
  primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  accent: 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400',
  success: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
  warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
  error: 'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400',
};

export default function AIInsightsPage() {
  return (
    <div>
      <PageHeader
        title="AI Insights"
        description="AI-powered analytics and intelligent features for hostel management"
        icon={Brain}
      />

      <div className="card p-6 mb-6 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-gray-900 dark:text-white text-lg mb-1">
              AI-Powered Hostel Intelligence
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              HostelHub integrates modular AI features that analyze hostel data to provide actionable insights,
              automate categorization, predict maintenance needs, and enhance the student experience.
              Each feature is designed to connect to external AI APIs when configured.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Active AI Features" value={AI_FEATURES.filter(f => f.status === 'Active').length} icon={Brain} color="success" />
        <StatCard title="Beta Features" value={AI_FEATURES.filter(f => f.status === 'Beta').length} icon={Brain} color="warning" />
        <StatCard title="Avg Accuracy" value="89%" icon={TrendingUp} color="primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AI_FEATURES.map(f => (
          <div key={f.id} className="card p-5 animate-fade-in-up hover:shadow-card-hover transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${COLOR_MAP[f.color]}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                  <span className={`badge ${f.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{f.status}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{f.description}</p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 dark:text-slate-300">{f.insight}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
