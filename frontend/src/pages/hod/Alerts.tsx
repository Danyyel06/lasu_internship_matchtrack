import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function HODAlerts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/hod/alerts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const filteredNotifs = activeTab === 'All' ? notifications : notifications.filter(n => !n.read);

  const getIcon = (type: string) => {
    switch(type) {
      case 'placement': return '💼';
      case 'missed_pulse': return '⚠️';
      case 'system': return 'ℹ️';
      case 'task_completed': return '✅';
      default: return '🔔';
    }
  };

  const getIconStyle = (type: string, urgent: boolean) => {
    if (urgent) return 'bg-red-50 text-red-600 border-red-100';
    switch(type) {
      case 'placement': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'system': return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      case 'task_completed': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-500 mt-1">Updates on placements, alerts, and system activities.</p>
        </div>
        <button className="text-sm font-medium text-neutral-600 hover:text-neutral-900 py-2 px-4 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors">
          Mark all as read
        </button>
      </div>

      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('All')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'All'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('Unread')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'Unread'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Unread
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <ul className="divide-y divide-neutral-100">
          {loading ? (
             <li className="p-8 text-center text-neutral-500">Loading alerts...</li>
          ) : filteredNotifs.length === 0 ? (
            <li className="p-8 text-center text-neutral-500">
              No notifications to display.
            </li>
          ) : (
            filteredNotifs.map(notif => (
              <li key={notif.id} className={`p-5 relative transition-colors hover:bg-neutral-50 ${notif.read ? 'opacity-70' : ''}`}>
                {notif.urgent && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${notif.urgent ? 'pl-2' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${getIconStyle(notif.type, notif.urgent)}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <p className={`text-sm ${notif.read ? 'text-neutral-700' : 'font-bold text-neutral-900'}`}>
                        {notif.message}
                        {!notif.read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-600"></span>}
                      </p>
                      <span className="text-xs text-neutral-500 mt-1 block">{notif.time}</span>
                    </div>
                  </div>
                  
                  {notif.urgent && (
                    <button 
                      onClick={() => navigate('/hod/students')}
                      className="shrink-0 py-2 px-4 rounded-lg border border-neutral-300 font-medium text-sm text-neutral-700 hover:bg-neutral-50 transition-colors whitespace-nowrap self-start sm:self-center ml-14 sm:ml-0"
                    >
                      Review Students
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
