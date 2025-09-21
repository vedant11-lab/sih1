/**
 * Public Landing Page Component
 * 
 * This is the main entry point for the Alumni Platform.
 * Users will see this page when they first visit the application.
 * 
 * Features:
 * - Simple welcome message
 * - Clean, centered design using Tailwind CSS
 * - Responsive layout that works on all devices
 */

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="text-center px-4 sm:px-6 lg:px-8">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
          Welcome to the Alumni Platform
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Connecting students, alumni, and employers in one centralized digital ecosystem.
        </p>
      </main>
    </div>
  );
}
