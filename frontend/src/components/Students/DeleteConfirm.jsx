import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import toast from 'react-hot-toast';
import { studentAPI } from '../../services/api';

const DeleteConfirm = ({ student, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!student) return;

    setLoading(true);
    try {
      await studentAPI.delete(student._id);
      toast.success('Student deleted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete student';
      toast.error(errorMessage);
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={!!student} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Delete Student</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              Are you sure you want to delete <strong>{student.name}</strong>?
            </p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              This will permanently remove:
            </p>
            <ul className="text-sm text-red-600 dark:text-red-300 mt-2 ml-4 list-disc">
              <li>Student profile and information</li>
              <li>All contest participation data</li>
              <li>All submission records</li>
              <li>Historical progress data</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirm;