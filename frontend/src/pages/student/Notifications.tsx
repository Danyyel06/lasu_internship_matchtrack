import { Link } from 'react-router-dom';

interface Notification {
  id: number;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

// Static sample notifications until a real notifications endpoint is built
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    icon: '✅',
    title: 'Application Accepted',
    body: 'Congratulations! Nexora Labs accepted your application for Frontend Developer.',
    time: '2 days ago',
    read: false,
  },
  {
    id: 2,
    icon: '📋',
    title: 'Bi-weekly Log Due',
    body: 'Your Saturday check-in is due this weekend. Don\'t forget to submit your evidence log.',
    time: '3 days ago',
    read: false,
  },
  {
    id: 3,
    icon: '🔬',
    title: 'Skill Verification Available',
    body: 'Complete skill verification to boost your Fit Score and unlock more internship matches.',
    time: '5 days ago',
    read: true,
  },
  {
    id: 4,
    icon: '💼',
    title: 'New Internship Match',
    body: 'A new internship matching your profile has been posted. Check it out in Browse.',
    time: '1 week ago',
    read: true,
  },
];

export default function StudentNotifications() {
  const unreadCount = SAMPLE_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {SAMPLE_NOTIFICATIONS.map((notif) => (
          <div
            key={notif.id}
            className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-4 transition-colors ${
              notif.read ? 'border-neutral-200' : 'border-violet-200 bg-violet-50/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
              notif.read ? 'bg-neutral-100' : 'bg-violet-100'
            }`}>
              {notif.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-bold ${notif.read ? 'text-neutral-700' : 'text-neutral-900'}`}>
                  {notif.title}
                </p>
                <span className="text-xs text-neutral-400 whitespace-nowrap flex-shrink-0">{notif.time}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">{notif.body}</p>
            </div>
            {!notif.read && (
              <div className="w-2.5 h-2.5 rounded-full bg-violet-600 flex-shrink-0 mt-1.5" />
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="bg-neutral-50 border border-neutral-200 border-dashed rounded-xl p-5 text-center">
        <p className="text-sm text-neutral-400">
          Real-time notifications (missed pulse alerts, application updates) will appear here once you are placed in an internship.
        </p>
        <Link to="/student/dashboard" className="mt-3 inline-block text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
