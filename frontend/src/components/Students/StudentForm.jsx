import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import toast from 'react-hot-toast';
import { studentAPI } from '../../services/api';

const StudentForm = ({ isOpen, onClose, student, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cfHandle: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        cfHandle: student.cfHandle || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        cfHandle: ''
      });
    }
    setErrors({});
  }, [student, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.cfHandle.trim()) {
      newErrors.cfHandle = 'Codeforces handle is required';
    } else if (formData.cfHandle.length < 3) {
      newErrors.cfHandle = 'Handle must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.cfHandle)) {
      newErrors.cfHandle = 'Handle can only contain letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (student) {
        // Update existing student
        await studentAPI.update(student._id, formData);
        toast.success('Student updated successfully');
      } else {
        // Create new student
        await studentAPI.create(formData);
        toast.success('Student added successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage);
      
      // Handle specific validation errors from backend
      if (error.response?.data?.details) {
        const backendErrors = {};
        error.response.data.details.forEach(detail => {
          backendErrors[detail.path] = detail.msg;
        });
        setErrors(backendErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {student ? 'Edit Student' : 'Add New Student'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter student name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Codeforces Handle */}
          <div className="space-y-2">
            <Label htmlFor="cfHandle">Codeforces Handle</Label>
            <Input
              id="cfHandle"
              value={formData.cfHandle}
              onChange={(e) => handleChange('cfHandle', e.target.value)}
              placeholder="Enter Codeforces handle"
              className={errors.cfHandle ? 'border-red-500' : ''}
            />
            {errors.cfHandle && (
              <p className="text-sm text-red-500">{errors.cfHandle}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (student ? 'Update' : 'Add')} Student
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentForm;