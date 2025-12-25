'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function SessionTestPage() {
  const { data: session, status } = useSession();
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const newLogEntry = `Status: ${status} - ${new Date().toISOString()}`;
    setLog(prev => [...prev, newLogEntry]);
    
    if (session) {
      const sessionLog = `Session: ${JSON.stringify(session, null, 2)}`;
      setLog(prev => [...prev, sessionLog]);
    }
  }, [status, session]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Session Test</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p><strong>Current Status:</strong> {status}</p>
        <p><strong>Current Session:</strong></p>
        <pre className="bg-white p-2 rounded overflow-auto max-h-40">
          {session ? JSON.stringify(session, null, 2) : 'No session'}
        </pre>
      </div>
      <div className="bg-blue-100 p-4 rounded">
        <p><strong>Log:</strong></p>
        <pre className="bg-white p-2 rounded overflow-auto max-h-96">
          {log.join('\n')}
        </pre>
      </div>
    </div>
  );
}