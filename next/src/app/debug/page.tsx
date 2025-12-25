'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    // Test fetch to schools API
    fetch('/api/schools/public')
      .then(res => res.json())
      .then(data => {
        setDebugInfo((prev: any) => ({
          ...prev,
          schoolsApi: data,
          timestamp: new Date().toISOString()
        }));
      })
      .catch(err => {
        setDebugInfo((prev: any) => ({
          ...prev,
          schoolsApiError: err.message,
          timestamp: new Date().toISOString()
        }));
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <div className="bg-gray-100 p-4 rounded">
        <pre className="bg-white p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}