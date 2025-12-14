'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const navigation = [
    { name: 'Scraping', href: '/scraping', icon: '🔍' },
    { name: 'Leads', href: '/leads', icon: '📋' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo et navigation principale */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl">🏢</span>
              <span className="ml-2 text-xl font-bold text-gray-900">CRM B2Dev</span>
            </div>

            {/* Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                    pathname === item.href
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Profil utilisateur et déconnexion */}
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              {/* Info utilisateur */}
              <div className="hidden md:flex md:items-center md:space-x-2">
                <img
                  className="h-8 w-8 rounded-full"
                  src={session.user?.image || '/default-avatar.png'}
                  alt={session.user?.name || 'User'}
                />
                <span className="text-sm font-medium text-gray-700">
                  {session.user?.name || session.user?.email}
                </span>
              </div>

              {/* Bouton de déconnexion */}
              <button
                onClick={handleSignOut}
                className="bg-gray-100 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                title="Se déconnecter"
              >
                <span className="sr-only">Se déconnecter</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation mobile */}
      <div className="md:hidden">
        <div className="pt-2 pb-3 space-y-1 sm:px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 text-base font-medium ${
                pathname === item.href
                  ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        {/* Profil mobile */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            <img
              className="h-10 w-10 rounded-full"
              src={session.user?.image || '/default-avatar.png'}
              alt={session.user?.name || 'User'}
            />
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">
                {session.user?.name}
              </div>
              <div className="text-sm font-medium text-gray-500">
                {session.user?.email}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}