import { useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SuperAdminReports() {
  const [reportType, setReportType] = useState('Placement by Faculty');
  const [facultyFilter, setFacultyFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`/api/v1/admin/reports`, {
        params: { type: reportType, faculty: facultyFilter, department: departmentFilter },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReportData({
        type: res.data.report_type,
        generatedAt: new Date().toLocaleString(),
        filters: { faculty: facultyFilter, department: departmentFilter },
        data: res.data.data
      });
      setIsGenerating(false);
    } catch (error) {
      console.error("Failed to generate report", error);
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (format === 'csv' && reportData?.data?.length > 0) {
      const headers = Object.keys(reportData.data[0]).join(',');
      const rows = reportData.data.map((row: any) => Object.values(row).join(','));
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf' && reportData?.data?.length > 0) {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text(reportData.type, 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${reportData.generatedAt} • Faculty: ${reportData.filters.faculty}`, 14, 22);

      let finalY = 30;

      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = doc.internal.pageSize.getWidth();
          const imgWidth = pdfWidth - 28;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          doc.addImage(imgData, 'PNG', 14, finalY, imgWidth, imgHeight);
          finalY += imgHeight + 10;
        } catch (error) {
          console.error("Failed to capture chart", error);
        }
      }

      const headers = Object.keys(reportData.data[0]);
      const data = reportData.data.map((row: any) => Object.values(row));

      autoTable(doc, {
        head: [headers],
        body: data,
        startY: finalY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      doc.save(`report_${Date.now()}.pdf`);
    } else {
      alert("No data available to export.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Institutional Reports</h1>
        <p className="text-neutral-500 text-sm mt-1">Generate and export platform-wide analytics.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Panel: 30% Configuration */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex flex-col h-full overflow-y-auto">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Report Configuration</h2>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Report Type</label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option>Placement by Faculty</option>
                <option>Company Participation Score</option>
                <option>Skills Gap Analysis</option>
                <option>Student Performance Overview</option>
              </select>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 mb-3">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Faculty</label>
                  <select 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                    value={facultyFilter}
                    onChange={(e) => setFacultyFilter(e.target.value)}
                  >
                    <option>All</option>
                    <option>Science</option>
                    <option>Engineering</option>
                    <option>Management Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Department</label>
                  <select 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm disabled:bg-neutral-100 disabled:text-neutral-400"
                    disabled={facultyFilter === 'All'}
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option>All Departments</option>
                    <option>Computer Science</option>
                    <option>Physics</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isGenerating ? 'Generating...' : 'Generate Report 📊'}
          </button>
        </div>

        {/* Right Panel: 70% Results */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-neutral-200 flex flex-col h-full overflow-hidden">
          {reportData ? (
            <>
              <div className="p-6 border-b border-neutral-200 flex justify-between items-start bg-neutral-50">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">{reportData.type}</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Generated: {reportData.generatedAt} • Faculty: {reportData.filters.faculty}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleExport('csv')} className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors">
                    Export CSV
                  </button>
                  <button onClick={() => handleExport('pdf')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Export PDF
                  </button>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Total Placed</p>
                    <p className="text-2xl font-black text-green-900">{reportData.data.reduce((sum: number, item: any) => sum + (item.Placed || 0), 0)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">Total Unplaced</p>
                    <p className="text-2xl font-black text-red-900">{reportData.data.reduce((sum: number, item: any) => sum + (item.Unplaced || 0), 0)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-1">Overall Placement Rate</p>
                    <p className="text-2xl font-black text-blue-900">
                      {reportData.data.length > 0 && reportData.data[0].Placed !== undefined ? 
                        ((reportData.data.reduce((sum: number, item: any) => sum + (item.Placed || 0), 0) / 
                        Math.max(1, reportData.data.reduce((sum: number, item: any) => sum + (item.Placed || 0) + (item.Unplaced || 0), 0))) * 100).toFixed(1) + '%' 
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full mb-8" ref={chartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                      {reportType === 'Placement by Faculty' ? (
                        <>
                          <Bar dataKey="Placed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="Unplaced" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </>
                      ) : (
                        <Bar dataKey="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
              <span className="text-6xl mb-4">📈</span>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">No Report Generated</h3>
              <p className="text-sm max-w-sm">Configure your parameters on the left and click Generate Report to see analytics data.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
