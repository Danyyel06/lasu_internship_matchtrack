import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AcademicSupervisorAlerts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Critical' | 'All' | 'System'>('Critical');

  const criticalAlerts: any[] = [];
  const generalAlerts: any[] = [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
            {criticalAlerts.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200 flex items-center gap-1">
                <span>⚠</span> {criticalAlerts.length} High Priority Alerts
              </span>
            )}
          </div>
          <p className="text-neutral-500">Students requiring immediate intervention and general system updates.</p>
        </div>
      </div>

      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('Critical')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'Critical'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Critical Alerts
          </button>
          <button
            onClick={() => setActiveTab('All')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'All'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            All Alerts
          </button>
          <button
            onClick={() => setActiveTab('System')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'System'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            System Updates
          </button>
        </nav>
      </div>

      {activeTab === 'Critical' && (
        <div className="space-y-4">
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="bg-white rounded-2xl p-6 shadow-sm border border-red-200 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-700 font-bold shrink-0 border border-red-100">
                    {alert.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-red-700 uppercase tracking-wider">PRIMARY ALERT</span>
                      <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <span>🚩</span> Critical
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">{alert.type}</h3>
                    <p className="text-sm text-neutral-600 mt-1">{alert.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-neutral-500">
                      <span className="font-medium text-neutral-700">{alert.name}</span>
                      <span>•</span>
                      <span>{alert.dept}</span>
                      <span>•</span>
                      <span className="text-red-600 font-medium">Weeks Missed: {alert.weeksMissed}</span>
                      <span>•</span>
                      <span>Last Submission: {alert.lastSubmission}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 shrink-0">
                  <button 
                    onClick={() => navigate(`/academic-supervisor/log-wall`)}
                    className="py-2 px-4 rounded-lg border border-neutral-300 font-medium text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    View Student
                  </button>
                  <button 
                    onClick={() => navigate(`/academic-supervisor/alerts/${alert.studentId}/log`)}
                    className="py-2 px-4 rounded-lg bg-black text-white font-medium text-sm hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    Log Contact
                  </button>
                </div>
              </div>
            </div>
          ))}
          {criticalAlerts.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center text-neutral-500">
              No critical alerts at this time. All students are on track.
            </div>
          )}
        </div>
      )}

      {activeTab === 'All' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {generalAlerts.map(alert => (
              <div key={alert.id} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {alert.urgent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-neutral-500">{alert.date}</span>
                    <span className="text-xs font-bold text-neutral-700">• {alert.type}</span>
                  </div>
                  <p className="text-sm text-neutral-800">{alert.message}</p>
                </div>
                {alert.actionable && (
                  <button className="py-2 px-4 rounded-lg border border-neutral-300 font-medium text-sm text-neutral-700 hover:bg-neutral-50 transition-colors shrink-0 whitespace-nowrap">
                    {alert.urgent ? 'Review Students' : 'Review Now'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'System' && (
        <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center text-neutral-500">
          No system updates.
        </div>
      )}

    </div>
  );
}
