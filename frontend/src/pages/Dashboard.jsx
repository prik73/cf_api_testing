import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Eye, Edit, Trash2, RefreshCw, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';
import StudentForm from '../components/Students/StudentForm';
import DeleteConfirm from '../components/Students/DeleteConfirm';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);
  const [syncingIds, setSyncingIds] = useState(new Set());

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll();
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to load students');
      console.error('Load students error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDeleteStudent = (student) => {
    setDeleteStudent(student);
  };

  const handleViewProfile = (student) => {
    navigate(`/student/${student._id}`);
  };

  const handleSync = async (studentId) => {
    try {
      setSyncingIds(prev => new Set(prev).add(studentId));
      await studentAPI.sync(studentId);
      await loadStudents(); // Refresh to get updated sync time
      toast.success('Student data synced successfully');
    } catch (error) {
      toast.error('Failed to sync student data');
      console.error('Sync error:', error);
    } finally {
      setSyncingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await studentAPI.exportCSV();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('Export error:', error);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 2100) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (rating >= 1900) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    if (rating >= 1600) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (rating >= 1400) return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
    if (rating >= 1200) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cfHandle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-muted-foreground">Manage and track student progress</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAddStudent} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Phone Number</th>
                <th className="text-left p-4 font-medium">CF Handle</th>
                <th className="text-left p-4 font-medium">Current Rating</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Max Rating</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Last Sync</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} className="border-b hover:bg-muted/25">
                  <td className="p-4 font-medium">{student.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{student.email}</td>
                  <td className="p-4 text-sm hidden sm:table-cell">{student.phone}</td>
                  <td className="p-4">
                    <Badge variant="outline">{student.cfHandle}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={getRatingColor(student.currentRating || 0)}>
                      {student.currentRating || 'Unrated'}
                    </Badge>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <Badge variant="secondary">
                      {student.maxRating || 'Unrated'}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                    {student.lastSync 
                      ? formatDistanceToNow(new Date(student.lastSync), { addSuffix: true })
                      : 'Never'
                    }
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProfile(student)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(student._id)}
                        disabled={syncingIds.has(student._id)}
                      >
                        <RefreshCw className={`h-4 w-4 ${syncingIds.has(student._id) ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No students found matching your search.' : 'No students added yet.'}
          </div>
        )}
      </div>

      {/* Modals */}
      <StudentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        student={editingStudent}
        onSuccess={loadStudents}
      />

      <DeleteConfirm
        student={deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onSuccess={loadStudents}
      />
    </div>
  );
};

export default Dashboard;