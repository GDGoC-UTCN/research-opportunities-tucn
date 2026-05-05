import React from 'react';
import Logo from './Logo';
import { User } from '../../types';

interface Props {
  handleLogin: (role: 'student' | 'professor') => void;
}

export default function LoginView({ handleLogin }: Props) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
        <Logo />
        <h1 className="text-2xl font-bold mt-6 mb-2">Welcome to UTCN Research</h1>
        <p className="text-gray-500 mb-8">Please login to continue</p>
        <div className="space-y-4">
          <button 
            onClick={() => handleLogin('student')}
            className="w-full py-3 px-4 bg-utcn-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Continue as Student
          </button>
          <button 
            onClick={() => handleLogin('professor')}
            className="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            Continue as Professor
          </button>
        </div>
      </div>
    </div>
  );
}
