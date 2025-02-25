import React, { useState } from 'react';
import regImage from '../assets/reset.png';
import axios from 'axios';
import { server } from '../constant';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const ResetPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token] = useState(new URLSearchParams(window.location.search).get('token'));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validatePassword = (password) => {
    return password.length >= 8 && password[0] === password[0].toUpperCase();
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match, choose different');
      setSuccess('');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters and start with an uppercase letter');
      return;
    }

    try {
      const response = await axios.post(`${server}/resetPassword`, { token, newPassword: password });
      setSuccess('Password reset successfully');
      setError('');
      setTimeout(() => (window.location.href = '/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
      setSuccess('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col w-full md:w-3/5 items-center h-4/5 bg-white shadow-md rounded-3xl p-8 md:flex-row">
        <div className="md:w-1/2 md:pr-8">
          <h1 className="text-4xl font-semibold mb-6 text-gray-700 text-center">Create Your Password</h1>
          {error && <div className="text-red-500 px-4 py-3 rounded mb-6"><p>{error}</p></div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6"><p>{success}</p></div>}
          <form onSubmit={handleReset}>
            <div className="mb-6 relative">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={togglePasswordVisibility}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-gray-500 h-5 w-5" />
              </div>
            </div>
            <div className="mb-6 relative">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Confirm Password</label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={toggleConfirmPasswordVisibility}>
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="text-gray-500 h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center justify-left">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-700 focus:outline-none focus:bg-blue-700" type="submit">
                Create
              </button>
            </div>
          </form>
        </div>
        <div className="hidden md:block md:w-1/2 bg-blue-100 flex items-center justify-center" style={{ backgroundImage: `url(${regImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <img src={regImage} alt="Registration" className="w-4/5 h-auto" />
        </div>
      </div>
    </div>
  );
};

export default ResetPage;
