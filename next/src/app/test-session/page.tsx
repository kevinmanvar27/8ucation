'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function TestSessionPage() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    setDebugInfo({
      status,
      session,
      timestamp: new Date().toISOString(),
    });
  }, [status, session]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Session Debug Page</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Session:</strong></p>
        <pre className="bg-white p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}