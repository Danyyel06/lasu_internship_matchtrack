import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdminNotifications() {
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState<any[]>([]);

  const tabs = ['All', 'System Alerts', 'Verifications', 'Reports', 'Security', 'General'];

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/v1/notifications/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data.map((n: any) => ({
          ...n,
          time: new Date(n.created_at).toLocaleString(),
          isUnread: !n.is_read
        })));
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isUnread: false } : n));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const filtered = activeTab === 'All' ? notifications : notifications.filter(n => n.notification_type === activeTab || n.type === activeTab);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-500 text-sm mt-1">Platform alerts and updates.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {filtered.length > 0 ? filtered.map(notif => (
          <div key={notif.id} onClick={() => notif.isUnread && markAsRead(notif.id)} className={`p-4 rounded-xl border transition-colors ${notif.isUnread ? 'bg-blue-50/50 border-blue-200 cursor-pointer hover:bg-blue-100/50' : 'bg-white border-neutral-200'}`}>
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                {notif.isUnread && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>}
                <span className="text-xs font-bold uppercase text-neutral-500">{notif.notification_type || notif.type}</span>
              </div>
              <span className="text-xs text-neutral-400">{notif.time}</span>
            </div>
            <h3 className={`text-base ${notif.isUnread ? 'font-bold text-neutral-900' : 'font-medium text-neutral-800'}`}>{notif.title}</h3>
            <p className="text-sm text-neutral-600 mt-1">{notif.message}</p>
          </div>
        )) : (
          <div className="text-center py-12 text-neutral-500">
            <span className="text-4xl block mb-3">📭</span>
            <p>No notifications in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
