import React, { useState, useEffect } from 'react';
import { setupInfluxDB } from '../lib/influxdb';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      await setupInfluxDB();
      setConnectionStatus('success');
      setErrorMessage(null);
      setErrorDetails(null);
    } catch (error) {
      console.error('InfluxDB connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to InfluxDB');
      setErrorDetails(error instanceof Error ? error.stack : null);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">InfluxDB Connection Status</h2>
        
        {connectionStatus === 'checking' && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current mr-2" />
            Checking connection...
          </div>
        )}
        
        {connectionStatus === 'success' && (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            Successfully connected to InfluxDB
          </div>
        )}
        
        {connectionStatus === 'error' && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
                {errorDetails && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-700 cursor-pointer">Show Error Details</summary>
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                      {errorDetails}
                    </pre>
                  </details>
                )}
                <div className="mt-3">
                  <p className="text-sm text-red-700 font-medium">Troubleshooting Steps:</p>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>Open browser developer tools (F12) and check Console tab for detailed errors</li>
                    <li>Verify InfluxDB is running on your NAS</li>
                    <li>Check environment variables in .env file</li>
                    <li>Ensure network connectivity to {import.meta.env.VITE_INFLUXDB_URL}</li>
                    <li>Verify your firewall allows connections to port 8086</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>Connection Details:</p>
          <ul className="list-disc list-inside mt-1">
            <li>URL: {import.meta.env.VITE_INFLUXDB_URL || 'Not configured'}</li>
            <li>Organization: kulich</li>
            <li>Bucket: bowling_league</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Press F12 or right-click and select "Inspect" to open developer tools.
            Select the "Console" tab to view detailed error messages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;