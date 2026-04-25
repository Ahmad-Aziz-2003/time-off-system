'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

const links = [
  { href: '/dashboard', label: 'Dashboard', role: UserRole.EMPLOYEE },
  { href: '/request', label: 'Request', role: UserRole.EMPLOYEE },
  { href: '/manager', label: 'Manager', role: UserRole.MANAGER },
];

export function Navbar() {
  const pathname = usePathname();
  const employee = useAuthStore((state) => state.employee);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[#0f0f0f]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-white">Time-Off System</span>
          <nav className="flex items-center gap-3">
            {links
              .filter((link) => !employee || link.role === employee.role)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white',
                    pathname === link.href && 'bg-zinc-800 text-white',
                  )}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {employee && <span className="text-sm text-zinc-300">{employee.name}</span>}
          <Button variant="secondary" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
