import { useState, useEffect } from 'react';
import axios from 'axios';
import LogDetail from './LogDetail';

interface CheckInContent {
  focus_area: string;
  core_action: string;
  the_blocker: string;
  the_takeaway: string;
}

interface LogWallItem {
  studentId: number;
  studentName: string;
  applicationId: number;
  weekNumber: number;
  wedPhotoUrl: string | null;
  satPhotoUrl: string | null;
  wedStatus: string;  // submitted | pending | missed
  satStatus: string;
  quizPassed: boolean | null;
  wedContent: CheckInContent | null;
  satContent: CheckInContent | null;
}

interface WallCard {
  studentId: number;
  studentName: string;
  weekNumber: number;
  checkInType: 'wednesday' | 'saturday';
  photoUrl: string | null;
  status: string;
  content: CheckInContent | null;
}

function statusBadgeClass(status: string) {
  if (status === 'submitted') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'missed') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function statusLabel(status: string) {
  if (status === 'submitted') return '✓ Submitted';
  if (status === 'missed') return '✗ Missed';
  return '⏳ Pending';
}

export default function LogWall() {
  const [items, setItems] = useState<LogWallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ studentId: number; weekId: number } | null>(null);
  const [studentFilter, setStudentFilter] = useState('');
  const [students, setStudents] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/v1/academic-supervisors/log-wall', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: LogWallItem[] = res.data;
        setItems(data);
        const names = Array.from(new Set<string>(data.map((c) => c.studentName)));
        setStudents(names);
      } catch {
        console.error('Failed to load log wall');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = studentFilter
    ? items.filter(c => c.studentName === studentFilter)
    : items;

  // Flatten the items into individual Wed/Sat cards
  const cards: WallCard[] = [];
  filteredItems.forEach(item => {
    // We only create cards for weeks that have started. The backend returns rows for all active weeks.
    cards.push({
      studentId: item.studentId,
      studentName: item.studentName,
      weekNumber: item.weekNumber,
      checkInType: 'wednesday',
      photoUrl: item.wedPhotoUrl,
      status: item.wedStatus,
      content: item.wedContent,
    });
    cards.push({
      studentId: item.studentId,
      studentName: item.studentName,
      weekNumber: item.weekNumber,
      checkInType: 'saturday',
      photoUrl: item.satPhotoUrl,
      status: item.satStatus,
      content: item.satContent,
    });
  });

  if (loading) return <div className="p-6 text-neutral-500">Loading log wall...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Log Wall</h1>
          <p className="text-neutral-500 mt-1">Visual overview of all student check-in submissions by week.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Students</option>
            {students.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-neutral-600 font-medium">No log submissions found.</p>
          <p className="text-neutral-400 text-sm mt-1">Cards will appear here as students submit their check-ins.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cards.map((card, i) => {
            const isSubmitted = card.status === 'submitted';
            const isMissed = card.status === 'missed';
            const isPending = card.status === 'pending';
            
            return (
              <div
                key={i}
                onClick={() => isSubmitted && setSelectedCell({ studentId: card.studentId, weekId: card.weekNumber })}
                className={`flex flex-col bg-white rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isSubmitted 
                    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-blue-200 border-neutral-200' 
                    : 'cursor-default border-neutral-100'
                } ${isPending ? 'opacity-60' : ''}`}
              >
                {/* Image at the top (like the Udemy course image) */}
                {card.photoUrl && isSubmitted ? (
                  <div className="w-full h-44 bg-neutral-100 shrink-0 relative">
                    <img
                      src={card.photoUrl}
                      alt={`Week ${card.weekNumber} ${card.checkInType}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-b border-black/5 mix-blend-multiply" />
                  </div>
                ) : (
                  <div className={`w-full h-32 flex flex-col items-center justify-center shrink-0 border-b border-neutral-100 ${isMissed ? 'bg-red-50/50' : 'bg-neutral-50/50'}`}>
                    <span className="text-3xl mb-2 grayscale opacity-50">📷</span>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                      {isMissed ? 'Missed Upload' : 'Awaiting Upload'}
                    </span>
                  </div>
                )}
                
                {/* Text body below image */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-neutral-900 text-sm mb-0.5 leading-tight">{card.studentName}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${card.checkInType === 'wednesday' ? 'text-blue-600' : 'text-violet-600'}`}>
                    Week {card.weekNumber} · {card.checkInType}
                  </p>
                  
                  {/* Detailed text snippets (put back, as requested) */}
                  {card.content ? (
                    <div className="mb-4 space-y-2.5 flex-1">
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-400 mb-0.5">Focus Area</p>
                        <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed">{card.content.focus_area}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-400 mb-0.5">Core Action</p>
                        <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed">{card.content.core_action}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 flex-1 flex items-center">
                      <p className="text-xs text-neutral-400 italic">
                        {isMissed ? 'No report was submitted.' : 'Awaiting student submission...'}
                      </p>
                    </div>
                  )}
                  
                  {/* Footer with status badge */}
                  <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-neutral-400">Status</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-md border ${statusBadgeClass(card.status)}`}>
                      {statusLabel(card.status)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal (Unchanged) */}
      {selectedCell && (
        <LogDetail
          studentId={selectedCell.studentId}
          weekId={selectedCell.weekId}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
}
