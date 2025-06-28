import React from 'react';
import { Clock, Mail, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const PendingApprovalPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Account Pending Approval
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your registration has been submitted successfully
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Under Review</h3>
                <p className="text-sm text-gray-500">
                  Our administrators are reviewing your application and verifying your student credentials.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notification</h3>
                <p className="text-sm text-gray-500">
                  You'll receive an email notification once your account has been approved.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800">What happens next?</h4>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Administrators will verify your student ID and submitted information</li>
              <li>The verification process typically takes 1-2 business days</li>
              <li>Once approved, you can log in and access all platform features</li>
            </ul>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Questions about your application?{' '}
            <a
              href="mailto:admin@metrouni.edu.bd"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact support
            </a>
          </p>
          
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
