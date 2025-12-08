
import React, { useState, useCallback } from 'react';
import { WorldState } from './types';
import { generateWorldState } from './services/geminiService';
import FileUpload from './components/FileUpload';
import LoadingState from './components/LoadingState';
import WorldStateDisplay from './components/WorldStateDisplay';

const App: React.FC = () => {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (adventureContent: string, additionalContents: { name: string, content: string }[]) => {
    setIsLoading(true);
    setError(null);
    setWorldState(null);
    try {
      const state = await generateWorldState(adventureContent, additionalContents);
      setWorldState(state);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `Failed to generate world state: ${err.message}. The Emperor protects, but sometimes the cogitators fail. Please try again.` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setWorldState(null);
    setIsLoading(false);
    setError(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
          <h2 className="text-2xl text-red-500 mb-4">A Heretical Error Occurred!</h2>
          <p className="max-w-prose mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded-md transition-colors duration-300 border border-red-600"
          >
            Purge and Retry
          </button>
        </div>
      );
    }
    if (worldState) {
      return <WorldStateDisplay worldState={worldState} onReset={handleReset} />;
    }
    return <FileUpload onGenerate={handleGenerate} />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      {renderContent()}
    </div>
  );
};

export default App;
