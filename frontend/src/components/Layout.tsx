import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { schoolYearApi } from '../api/schoolYears';
import { useSchoolYearStore } from '../store/useSchoolYearStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { currentSchoolYear, setCurrentSchoolYear } = useSchoolYearStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: schoolYears } = useQuery({
    queryKey: ['schoolYears'],
    queryFn: () => schoolYearApi.getAll(),
  });

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Today', icon: '📅' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/calendar', label: 'Calendar', icon: '🗓️' },
    { path: '/special-days', label: 'Special Days', icon: '⭐' },
  ];

  const adminLinks = [
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/quick-setup', label: 'Quick Setup', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                  School Year Calendar
                </Link>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                      isActive(link.path)
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="ml-2 pl-2 border-l border-gray-300">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                        isActive(link.path)
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: School Year Selector and Mobile Menu Button */}
            <div className="flex items-center gap-2">
              {schoolYears && schoolYears.length > 0 && (
                <select
                  value={currentSchoolYear?.id || ''}
                  onChange={(e) => {
                    const selected = schoolYears.find((sy) => sy.id === e.target.value);
                    setCurrentSchoolYear(selected || null);
                  }}
                  className="hidden sm:block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm max-w-[200px]"
                >
                  {schoolYears.map((sy) => (
                    <option key={sy.id} value={sy.id}>
                      {sy.name}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* School Year Selector for Mobile */}
              {schoolYears && schoolYears.length > 0 && (
                <div className="px-3 py-2 mb-2">
                  <select
                    value={currentSchoolYear?.id || ''}
                    onChange={(e) => {
                      const selected = schoolYears.find((sy) => sy.id === e.target.value);
                      setCurrentSchoolYear(selected || null);
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    {schoolYears.map((sy) => (
                      <option key={sy.id} value={sy.id}>
                        {sy.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              
              {/* Admin Links Separator */}
              <div className="border-t border-gray-200 my-2"></div>
              
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

