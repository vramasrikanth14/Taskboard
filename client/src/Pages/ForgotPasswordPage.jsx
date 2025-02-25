import React, { useState } from "react";
import regImage from '../assets/reset.png';
import { server } from "../constant";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      const response = await fetch(`${server}/api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Reset password link sent! Please check your email.");
      } else {
        setError(data.message || "Failed to send reset password link.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col w-full md:w-3/5 items-center h-4/5 bg-white shadow-md rounded-3xl p-8 md:flex-row">
        <div className="md:w-1/2 md:pr-8">
          <div className="flex justify-left items-left">
            <h1 className="text-4xl font-semibold mb-6 text-gray-700 text-center">
              Forgot Password
            </h1>
          </div>
          {error && (
            <div className="text-red-500 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <p>{successMessage}</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-semibold mb-2"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-left">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
                type="submit"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        </div>
        <div
          className="hidden md:block md:w-1/2 bg-blue-100 flex items-center justify-center"
          style={{
            backgroundImage: `url(${regImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <img src={regImage} alt="Forgot Password" className="w-4/5 h-auto" />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;