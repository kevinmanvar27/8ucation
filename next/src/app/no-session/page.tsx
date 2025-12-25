'use client';

import { useState, useEffect } from 'react';

export default function NoSessionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/schools/public')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>No Session Page</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}