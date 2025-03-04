import React, { useState, useEffect, useCallback } from 'react';

interface IncidentFormProps {
  incident: Record<string, any> | null;
  fields: string[];
  onSave: (updatedIncident: Record<string, any>) => Promise<void>;
  onProcess: (text: string) => Promise<void>;
  isLoading: boolean;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ 
  incident, 
  fields, 
  onSave, 
  onProcess, 
  isLoading 
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [combinedText, setCombinedText] = useState<string>('');

  // Update combined text when form values change
  const updateCombinedText = useCallback((values: Record<string, any>) => {
    const text = fields
      .map(field => {
        const value = values[field] || '';
        return `${field}: ${value}`;
      })
      .join("\n\n");
    
    setCombinedText(text);
  }, [fields]);

  // Update form values when incident changes
  useEffect(() => {
    if (incident) {
      setFormValues({ ...incident });
      updateCombinedText({ ...incident });
    } else {
      setFormValues({});
      setCombinedText('');
    }
  }, [incident, fields, updateCombinedText]);

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    const updatedValues = {
      ...formValues,
      [field]: value
    };
    
    setFormValues(updatedValues);
    updateCombinedText(updatedValues);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (incident && Object.keys(formValues).length > 0) {
      onSave(formValues);
    }
  };

  // Handle process button click
  const handleProcess = () => {
    if (combinedText.trim()) {
      onProcess(combinedText);
    }
  };

  if (!incident) {
    return null;
  }

  return (
    <div className="card">
      <h2>Incident Details</h2>
      <form onSubmit={handleSubmit} className="incident-form">
        {fields.map(field => (
          <div className="form-group" key={field}>
            <label htmlFor={`field-${field}`}>{field}</label>
            <input
              id={`field-${field}`}
              type="text"
              className="form-control"
              value={formValues[field] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              disabled={isLoading}
            />
          </div>
        ))}
        
        <div className="incident-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !incident}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleProcess}
            disabled={isLoading || !combinedText.trim()}
          >
            {isLoading ? 'Processing...' : 'Process with AI'}
          </button>
        </div>
      </form>
      
      <div className="incident-text">
        <h3>Combined Text</h3>
        <div className="result-content">
          {combinedText}
        </div>
      </div>
    </div>
  );
};

export default IncidentForm;