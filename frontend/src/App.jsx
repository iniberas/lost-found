import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://127.0.0.1:8000'; 

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          System Status
        </h1>

        {loading && (
          <p className="text-gray-600 text-center animate-pulse">
            ⏳ Connecting to backend... ⏳
          </p>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="font-bold text-red-700">Failed</p>
            <p className="text-sm text-red-800 mt-2 bg-red-100 p-2 rounded">
              🤡 Error hihi 🤡
            </p>
          </div>
        )}

        {data && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="font-bold text-green-700">Success!</p>
            <pre className="text-sm text-green-800 mt-2 bg-green-100 p-2 rounded">
              🎉👯 Wooohooo hore hore horee!! 👯🎉
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;