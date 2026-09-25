import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

export default function Interns() {
  const navigate = useNavigate();
  const [interns, setInterns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const response = await api.get('/supervisors/interns/growth');
      setInterns(response.data.items || response.data);
    } catch (error) {
      console.error("Failed to fetch interns", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <div className="text-xs font-bold tracking-wider text-neutral-500 mb-1">INDUSTRY SUPERVISOR</div>
        <h1 className="text-2xl font-bold text-neutral-900">Students Growth</h1>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search interns by name or ID..." 
          className="w-full md:max-w-md border border-neutral-200 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {(() => {
        const filteredInterns = interns.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (filteredInterns.length === 0) {
          return (
            <div className="text-center p-8 bg-white border border-neutral-200 rounded-xl">
              <p className="text-neutral-500">No interns found.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInterns.map(intern => {
            const [current, total] = intern.progress.split(' / ').map(Number);
            const percent = total > 0 ? (current / total) * 100 : 0;
            return (
              <div key={intern.id} onClick={() => navigate(`/supervisor/interns/${intern.id}`)} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                    {intern.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900">{intern.name}</h3>
                    <p className="text-sm text-neutral-600">{intern.department} • {intern.level}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${intern.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}`}>
                    {intern.status}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-neutral-600 mb-1.5">
                    <span>Logbook Progress</span>
                    <span>Wk {intern.progress}</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        );
      })()}
    </div>
  );
}
