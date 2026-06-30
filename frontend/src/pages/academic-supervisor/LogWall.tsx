import { useState, useEffect } from 'react';
import axios from 'axios';
import LogDetail from './LogDetail';

/**
 * LogWall — Academic Supervisor view.
 *
 * Backend returns LogWallItem (camelCase) per week per student:
 *   studentId, studentName, applicationId, weekNumber,
 *   wedPhotoUrl, satPhotoUrl, wedStatus, satStatus, quizPassed
 *
 * We expand each week-item into up to two photo cards (Wed + Sat)
 * so the masonry wall still shows per-check-in thumbnails.
 */

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
}

// A flat card for display – one per check-in type
interface WallCard {
  studentId: number;
  studentName: string;
  weekNumber: number;
  checkInType: 'wednesday' | 'saturday';
  photoUrl: string | null;
  status: 'submitted' | 'pending' | 'missed';
}

function itemsToCards(items: LogWallItem[]): WallCard[] {
  const cards: WallCard[] = [];
  for (const item of items) {
    const wedStatus = item.wedStatus === 'submitted' ? 'submitted'
      : item.wedStatus === 'missed' ? 'missed' : 'pending';
    const satStatus = item.satStatus === 'submitted' ? 'submitted'
      : item.satStatus === 'missed' ? 'missed' : 'pending';

    // Only show Wednesday card if the check-in exists in any state
    cards.push({
      studentId: item.studentId,
      studentName: item.studentName,
      weekNumber: item.weekNumber,
      checkInType: 'wednesday',
      photoUrl: item.wedPhotoUrl,
      status: wedStatus,
    });

    // Only show Saturday card if Saturday has been submitted or missed
    if (satStatus !== 'pending' || item.satPhotoUrl) {
      cards.push({
        studentId: item.studentId,
        studentName: item.studentName,
        weekNumber: item.weekNumber,
        checkInType: 'saturday',
        photoUrl: item.satPhotoUrl,
        status: satStatus,
      });
    }
  }
  return cards;
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
        const res = await axios.get('http://localhost:8000/api/v1/academic-supervisors/log-wall', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: LogWallItem[] = res.data;
        setItems(data);
        // Build unique student list for filter dropdown
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

  const cards = itemsToCards(filteredItems);

  if (loading) return <div className="p-6 text-neutral-500">Loading log wall...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Log Wall</h1>
          <p className="text-neutral-500 mt-1">Visual overview of all student check-in photos and submission status.</p>
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
          <p className="text-neutral-400 text-sm mt-1">Photo thumbnails will appear here as students submit their check-ins.</p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
          {cards.map((card, i) => (
            <div
              key={i}
              onClick={() =>
                card.status === 'submitted' &&
                setSelectedCell({ studentId: card.studentId, weekId: card.weekNumber })
              }
              className={`break-inside-avoid rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-md ${
                card.status === 'missed'
                  ? 'border-danger-base bg-danger-50 cursor-default'
                  : card.status === 'pending'
                  ? 'border-neutral-200 opacity-50 cursor-default'
                  : card.checkInType === 'wednesday'
                  ? 'border-blue-200 hover:border-blue-400 cursor-pointer'
                  : 'border-violet-200 hover:border-violet-400 cursor-pointer'
              }`}
            >
              {card.status === 'submitted' && card.photoUrl ? (
                <div className="relative">
                  <img
                    src={`http://localhost:8000${card.photoUrl}`}
                    alt={`${card.studentName} Week ${card.weekNumber} ${card.checkInType}`}
                    className="w-full object-cover"
                    style={{ minHeight: '120px' }}
                  />
                  {/* Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-semibold truncate">{card.studentName}</p>
                    <p className="text-white/70 text-[10px]">
                      W{card.weekNumber} · {card.checkInType === 'wednesday' ? 'Wed' : 'Sat'}
                    </p>
                  </div>
                  {/* Day badge */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    card.checkInType === 'wednesday' ? 'bg-blue-500 text-white' : 'bg-violet-500 text-white'
                  }`}>
                    {card.checkInType === 'wednesday' ? 'WED' : 'SAT'}
                  </div>
                </div>
              ) : card.status === 'submitted' ? (
                // Submitted but no photo (text-only check-in)
                <div className="h-28 flex flex-col items-center justify-center bg-neutral-100">
                  <span className="text-2xl mb-1">📋</span>
                  <p className="text-xs text-neutral-500 font-medium">{card.studentName}</p>
                  <p className="text-[10px] text-neutral-400">W{card.weekNumber} · {card.checkInType === 'wednesday' ? 'Wed' : 'Sat'}</p>
                </div>
              ) : card.status === 'missed' ? (
                // Missed
                <div className="h-28 flex flex-col items-center justify-center bg-danger-50">
                  <span className="text-xl mb-1">⚠️</span>
                  <p className="text-xs text-danger-dark font-semibold">Missed</p>
                  <p className="text-[10px] text-danger-dark/70 text-center px-2">{card.studentName} · W{card.weekNumber}</p>
                </div>
              ) : (
                // Pending / not yet submitted
                <div className="h-28 flex flex-col items-center justify-center bg-neutral-50">
                  <span className="text-xl mb-1">⏳</span>
                  <p className="text-xs text-neutral-400 font-medium">Pending</p>
                  <p className="text-[10px] text-neutral-400 text-center px-2">{card.studentName} · W{card.weekNumber}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
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
