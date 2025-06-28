import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validateMUStudentId } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    muStudentId: '',
    department: '',
    batch: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    idCardPhoto: null as File | null,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const departments = [
    'Computer Science & Engineering',
    'Electrical & Electronic Engineering',
    'Business Administration',
    'English',
    'Economics',
    'Law & Justice',
  ];

  const currentYear = new Date().getFullYear();
  const batches = Array.from({ length: 8 }, (_, i) => (currentYear - i).toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0] || null;
      
      // Clear any existing errors for this field first
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      
      // Validate file size for ID card photo (100KB limit)
      if (file && name === 'idCardPhoto') {
        const maxSize = 100 * 1024; // 100KB in bytes
        if (file.size > maxSize) {
          setErrors(prev => ({ ...prev, [name]: 'File size must be less than 100KB' }));
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setErrors(prev => ({ ...prev, [name]: 'Please select a valid image file' }));
          return;
        }
      }
      
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.muStudentId) {
      newErrors.muStudentId = 'Student ID is required';
    } else if (!validateMUStudentId(formData.muStudentId)) {
      newErrors.muStudentId = 'Student ID must be in format 232-115-304';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.batch) {
      newErrors.batch = 'Batch year is required';
    }

    // Phone number validation (optional)
    if (formData.phoneNumber && !/^[+]?[\d\s\-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // ID card photo validation (required)
    if (!formData.idCardPhoto) {
      newErrors.idCardPhoto = 'Student ID card photo is required for verification';
    } else {
      const maxSize = 100 * 1024; // 100KB
      if (formData.idCardPhoto.size > maxSize) {
        newErrors.idCardPhoto = 'File size must be less than 100KB';
      } else if (!formData.idCardPhoto.type.startsWith('image/')) {
        newErrors.idCardPhoto = 'Please select a valid image file';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const phoneNumber = formData.phoneNumber?.trim();
      if (phoneNumber && !/^[+]?\d[\d\s\-\(\)]*$/.test(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const dateOfBirth = formData.dateOfBirth;
      if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }

      // Convert file to base64 and send as JSON instead of FormData
      let idCardPhotoBase64 = undefined;
      if (formData.idCardPhoto) {
        try {
          idCardPhotoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(formData.idCardPhoto!);
          });
        } catch (error) {
          throw new Error('Failed to process ID card photo');
        }
      }

      const registrationData = {
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        muStudentId: formData.muStudentId,
        department: formData.department,
        batch: formData.batch,
        ...(phoneNumber && { phoneNumber }),
        ...(formData.address?.trim() && { address: formData.address.trim() }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(idCardPhotoBase64 && { idCardPhotoUrl: idCardPhotoBase64 })
      };

      console.log('Registration data being sent (JSON):', {
        ...registrationData,
        idCardPhotoUrl: idCardPhotoBase64 ? `base64 data (${(idCardPhotoBase64.length / 1024).toFixed(2)}KB)` : 'not provided'
      });

      // Use register function with JSON data
      await register(registrationData);

      alert('Registration submitted successfully! Please wait for admin approval before you can log in.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      if ((error as any).response && (error as any).response.data) {
        const responseData = (error as any).response.data;
        console.error('Backend response:', responseData);
        
        if (responseData.details && Array.isArray(responseData.details)) {
          console.error('Validation details:', JSON.stringify(responseData.details, null, 2));
          
          // Convert backend validation errors to form field errors
          const fieldErrors: { [key: string]: string } = {};
          responseData.details.forEach((detail: any) => {
            // Handle both old format (path array) and new format (field string)
            const fieldName = detail.field || (detail.path && detail.path[0]) || detail.context?.key;
            if (fieldName) {
              fieldErrors[fieldName] = detail.message;
            }
          });
          
          // If we have field-specific errors, show them
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            // Fallback to general error if we can't parse field errors
            setErrors({ general: responseData.error || 'Registration failed. Please check your information and try again.' });
          }
        } else {
          // No detailed validation errors, show general error
          setErrors({ general: responseData.error || 'Registration failed. Please check your information and try again.' });
        }
      } else {
        // Network or other error
        setErrors({ general: 'Registration failed. Please check your connection and try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-600">
            <span className="text-white font-bold text-xl">MU</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Apply to Join MetroUni
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Submit your application to connect with the university community. 
            <br />
            <span className="text-blue-600 font-medium">Admin approval required for new accounts.</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="text-sm">{errors.general}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`input ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="muStudentId" className="block text-sm font-medium text-gray-700">
                MU Student ID
              </label>
              <input
                id="muStudentId"
                name="muStudentId"
                type="text"
                required
                className={`input ${errors.muStudentId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="232-115-304"
                value={formData.muStudentId}
                onChange={handleChange}
              />
              {errors.muStudentId && (
                <p className="mt-1 text-sm text-red-600">{errors.muStudentId}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number (Optional)
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                className={`input ${errors.phoneNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="+880 1234 567890"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address (Optional)
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                className={`input ${errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Your current address"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth (Optional)
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className={`input ${errors.dateOfBirth ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label htmlFor="idCardPhoto" className="block text-sm font-medium text-gray-700">
                Student ID Card Photo <span className="text-red-500">*</span>
              </label>
              <input
                id="idCardPhoto"
                name="idCardPhoto"
                type="file"
                accept="image/*"
                required
                className={`input ${errors.idCardPhoto ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                onChange={handleChange}
              />
              {errors.idCardPhoto && (
                <p className="mt-1 text-sm text-red-600">{errors.idCardPhoto}</p>
              )}
              {formData.idCardPhoto && (
                <p className="mt-1 text-sm text-green-600">
                  File selected: {formData.idCardPhoto.name} ({(formData.idCardPhoto.size / 1024).toFixed(2)}KB)
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Upload a clear photo of your student ID card. Maximum file size: 100KB. Accepted formats: JPG, PNG, GIF.
              </p>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                id="department"
                name="department"
                required
                className={`input ${errors.department ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                value={formData.department}
                onChange={handleChange}
              >
                <option value="">Select your department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
            </div>

            <div>
              <label htmlFor="batch" className="block text-sm font-medium text-gray-700">
                Batch Year
              </label>
              <select
                id="batch"
                name="batch"
                required
                className={`input ${errors.batch ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                value={formData.batch}
                onChange={handleChange}
              >
                <option value="">Select your batch year</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
              {errors.batch && (
                <p className="mt-1 text-sm text-red-600">{errors.batch}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`input ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`input ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Submit Application'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Your application will be reviewed by administrators before account activation.
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
