import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/academic-supervisor/Pulse.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the dummy data and component declaration to add useEffect and state
search_top = """import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AcademicSupervisorPulse() {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState('Week 8');

  // Dummy data
  const students = [
    {
      id: 'stud_1',
      name: 'Adekunle, Fatima',
      role: 'Frontend Intern',
      company: 'TechCorp Nigeria',
      status: 'On Track',
      goalsSet: 3,
      completion: 100,
      reflectionStatus: 'submitted',
    },
    {
      id: 'stud_2',
      name: 'Okafor, Emeka',
      role: 'Data Analyst Intern',
      company: 'DataSys',
      status: 'Needs Attention',
      goalsSet: 2,
      completion: 50,
      reflectionStatus: 'overdue',
    },
    {
      id: 'stud_3',
      name: 'Doe, John',
      role: 'Backend Intern',
      company: 'Sterling Bank',
      status: 'On Track',
      goalsSet: 3,
      completion: 100,
      reflectionStatus: 'submitted',
    }
  ];"""

replace_top = """import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AcademicSupervisorPulse() {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState('Week 8');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/academic-supervisors/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const mappedData = res.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          company: s.company,
          status: s.pulseStatus === 'overdue' ? 'Needs Attention' : 'On Track',
          goalsSet: 3, // Could be fetched from pulse history if needed
          completion: s.pulseStatus === 'submitted' ? 100 : 0,
          reflectionStatus: s.pulseStatus || 'submitted'
        }));
        
        setStudents(mappedData);
      } catch (err) {
        console.error("Failed to fetch students", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) return <div className="p-6">Loading pulse overview...</div>;"""

content = content.replace(search_top, replace_top)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten Academic Supervisor Pulse.tsx")
