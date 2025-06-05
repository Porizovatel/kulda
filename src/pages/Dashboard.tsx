import React, { useState, useEffect } from 'react';
import { setupInfluxDB } from '../lib/influxdb';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      await setupInfluxDB();
      setConnectionStatus('success');
    } catch (error) {
      console.error('InfluxDB connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to InfluxDB');
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
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
                <p className="mt-2 text-sm text-red-700">
                  Please check:
                  <ul className="list-disc list-inside mt-1">
                    <li>InfluxDB is running and accessible</li>
                    <li>Environment variables are correctly set</li>
                    <li>Network connectivity is available</li>
                  </ul>
                </p>
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
      </div>
    </div>
  );
};

export default Dashboard;