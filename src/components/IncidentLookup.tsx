import React, { useState } from 'react';

interface IncidentLookupProps {
  onLookup: (incidentNumber: string) => Promise<void>;
  isLoading: boolean;
}

const IncidentLookup: React.FC<IncidentLookupProps> = ({ onLookup, isLoading }) => {
  const [incidentNumber, setIncidentNumber] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (incidentNumber.trim()) {
      onLookup(incidentNumber.trim());
    }
  };

  return (
    <div className="card">
      <h2>Incident Lookup</h2>
      <p>Enter an incident number to retrieve and process the details.</p>
      
      <form onSubmit={handleSubmit} className="incident-lookup">
        <div className="form-group">
          <label htmlFor="incident-number">Incident Number</label>
          <input
            id="incident-number"
            type="text"
            className="form-control"
            value={incidentNumber}
            onChange={(e) => setIncidentNumber(e.target.value)}
            placeholder="Enter incident number..."
            disabled={isLoading}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading || !incidentNumber.trim()}
        >
          {isLoading ? 'Loading...' : 'Lookup'}
        </button>
      </form>
    </div>
  );
};

export default IncidentLookup;