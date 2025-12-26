'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';

/**
 * Redirect page for /classes to /academics/classes
 * This handles the case where users navigate to /classes directly
 */
export default function ClassesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/academics/classes');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" />
    </div>
  );
}
