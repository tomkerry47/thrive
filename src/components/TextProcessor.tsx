import React from 'react';

interface TextProcessorProps {
  isProcessing: boolean;
  result: string | null;
  error: string | null;
}

const TextProcessor: React.FC<TextProcessorProps> = ({ isProcessing, result, error }) => {
  if (isProcessing) {
    return (
      <div className="card">
        <div className="processing-indicator">
          <div className="spinner"></div>
          <p>Processing your text...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Processing Error</h2>
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="card">
      <h2>Processed Text</h2>
      <div className="result-container">
        <div className="result-content">
          {result}
        </div>
      </div>
    </div>
  );
};

export default TextProcessor;