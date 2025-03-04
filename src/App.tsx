// Main application component
import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { httpApiConfig } from './authConfig';
import AuthProvider, { useAuth } from './components/AuthProvider';
import IncidentLookup from './components/IncidentLookup';
import IncidentForm from './components/IncidentForm';
import TextProcessor from './components/TextProcessor';
import './App.css';

const AppContent: React.FC = () => {
  // Incident state
  const [incidentNumber, setIncidentNumber] = useState<string>('');
  const [incident, setIncident] = useState<Record<string, any> | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  
  // Processing state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get fields from environment variable
  React.useEffect(() => {
    const fieldsString = process.env.REACT_APP_INCIDENT_FIELDS || '';
    const fieldsList = fieldsString.split(',').filter(field => field.trim());
    setFields(fieldsList);
  }, []);

  // Handle incident lookup
  const handleLookup = async (incidentNumber: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setIncident(null);
      setIncidentNumber(incidentNumber);
      
      // Call the API to get incident details
      const response = await fetch(`/api/incidents/${incidentNumber}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Incident ${incidentNumber} not found`);
        }
        throw new Error(`Failed to fetch incident: ${response.statusText}`);
      }
      
      const data = await response.json();
      setIncident(data);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving incident changes
  const handleSave = async (updatedIncident: Record<string, any>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the API to update incident details
      const response = await fetch(`/api/incidents/${incidentNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedIncident)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update incident: ${response.statusText}`);
      }
      
      const data = await response.json();
      setIncident(data);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle processing text with Azure AI
  const handleProcess = async (text: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      // Prepare the request body according to the specified format
      const requestBody = {
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: `${httpApiConfig.preconfiguredStatement} ${text}`
              }
            ]
          }
        ],
        temperature: httpApiConfig.temperature,
        top_p: httpApiConfig.topP,
        max_tokens: httpApiConfig.maxTokens
      };
      
      // Set up headers with the API key
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add the API key header
      if (httpApiConfig.key) {
        headers[httpApiConfig.headerName] = httpApiConfig.key;
      }
      
      // Make the HTTP POST request
      const response = await fetch(httpApiConfig.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Parse the response
      const responseData = await response.json();
      
      // Extract the processed text from the response
      let processedText = '';
      
      if (responseData.choices && responseData.choices.length > 0) {
        // Format for OpenAI/Azure OpenAI API
        const choice = responseData.choices[0];
        if (choice.message && choice.message.content) {
          processedText = choice.message.content;
        } else if (choice.text) {
          processedText = choice.text;
        }
      } else if (responseData.content) {
        // Direct content field
        processedText = responseData.content;
      } else if (responseData.result) {
        // Result field
        processedText = responseData.result;
      } else {
        // Fallback to stringifying the entire response
        processedText = JSON.stringify(responseData, null, 2);
      }
      
      // Set the result with the extracted processed text
      setResult(processedText);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>Incident Processor</h2>
        <p>Look up an incident, edit fields, and process with Azure AI.</p>
        
        <IncidentLookup 
          onLookup={handleLookup} 
          isLoading={isLoading} 
        />
      </div>
      
      {incident && (
        <IncidentForm 
          incident={incident} 
          fields={fields} 
          onSave={handleSave} 
          onProcess={handleProcess} 
          isLoading={isLoading} 
        />
      )}
      
      {(isLoading || result || error) && (
        <TextProcessor 
          isProcessing={isLoading && !incident} 
          result={result} 
          error={error} 
        />
      )}
    </>
  );
};

// Main application with authentication
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
};

// Component that uses authentication context
const AppWithAuth: React.FC = () => {
  const { isAuthenticated, userInfo } = useAuth();
  const { instance } = useMsal();
  
  const handleSignOut = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  };
  
  return (
    <div className="app">
      <header className="header">
        <div className="container header-content">
          <h1>Thrive Incident Processor</h1>
          {isAuthenticated && userInfo && (
            <div className="user-info">
              <span>Signed in as: {userInfo.name || userInfo.username || 'Authenticated User'}</span>
              <button 
                className="btn btn-outline-light btn-sm" 
                onClick={handleSignOut}
                style={{ marginLeft: '10px' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="container">
        <AppContent />
      </main>
      
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Thrive Incident Processor</p>
        </div>
      </footer>
    </div>
  );
};

export default App;