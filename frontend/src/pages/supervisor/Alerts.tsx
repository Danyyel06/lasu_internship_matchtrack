import { useState, useEffect } from 'react';
import axios from 'axios';

interface Alert {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function SupervisorAlerts() {
  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.post(`http://localhost:8000/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error('Failed to mark alert as read', err);
    }
  };

  const filteredAlerts = activeTab === 'All' ? alerts : alerts.filter(a => !a.is_read);

  const getIcon = (type: string) => {
    switch(type) {
      case 'assignment': return '👤';
      case 'pulse': return '📓';
      case 'missing': return '⚠️';
      case 'framework_feedback': return '💬';
      case 'framework_approved': return '✅';
      default: return '🔔';
    }
  };

  const getIconColor = (type: string) => {
    switch(type) {
      case 'missing': return 'text-red-500 bg-red-50';
      case 'framework_approved': return 'text-teal-600 bg-teal-50';
      case 'framework_feedback': return 'text-amber-500 bg-amber-50';
      case 'assignment': return 'text-blue-600 bg-blue-50';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-500 mt-1">Updates on your assigned interns and framework approvals.</p>
        </div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">⚙️ Settings</button>
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
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading notifications...</div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {filteredAlerts.length === 0 ? (
              <li className="p-8 text-center text-neutral-500">
                No notifications to display.
              </li>
            ) : (
              filteredAlerts.map(alert => (
                <li 
                  key={alert.id} 
                  onClick={() => !alert.is_read && markAsRead(alert.id)}
                  className={`p-5 transition-colors hover:bg-neutral-50 ${!alert.is_read ? 'cursor-pointer' : ''} ${alert.is_read ? 'opacity-70' : 'bg-blue-50/30'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getIconColor(alert.type)}`}>
                      {getIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${alert.is_read ? 'font-medium text-neutral-800' : 'font-bold text-neutral-900'}`}>
                          {alert.title}
                          {!alert.is_read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-600"></span>}
                        </p>
                        <span className="text-xs text-neutral-500 whitespace-nowrap">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">{alert.message}</p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
