import React, { useState } from 'react';
import { Phrase } from '../types';

interface MaintenancePanelProps {
  isOpen: boolean;
  onClose: () => void;
  phrases: Phrase[];
  onAddPhrase: (phrase: string) => void;
  onDeletePhrase: (phrase: string) => void;
}

const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ isOpen, onClose, phrases, onAddPhrase, onDeletePhrase }) => {
  const [newPhrase, setNewPhrase] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhrase.trim()) {
      onAddPhrase(newPhrase.trim());
      setNewPhrase('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-secondary rounded-xl shadow-2xl w-full max-w-md m-4 p-6 flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-highlight">Manage Phrases & Report</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-main transition-colors text-3xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Add a new phrase..."
            className="flex-grow bg-accent border border-gray-600 text-text-main text-sm rounded-lg focus:ring-highlight focus:border-highlight p-2.5"
          />
          <button type="submit" className="bg-highlight text-primary font-bold py-2 px-4 rounded-lg hover:bg-teal-300 transition-colors">Add</button>
        </form>

        <div className="flex-grow overflow-y-auto pr-2">
          {phrases.length === 0 ? (
            <p className="text-text-dim text-center py-4">No phrases added yet.</p>
          ) : (
            <ul className="space-y-2">
              {phrases.map((phrase, index) => (
                <li key={index} className="bg-accent p-3 rounded-lg flex justify-between items-center">
                  <span className="text-text-main">{phrase.text}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-highlight text-lg">{phrase.count}</span>
                    <button 
                      onClick={() => onDeletePhrase(phrase.text)} 
                      className="text-red-400 hover:text-red-300 font-bold transition-colors"
                      aria-label={`Delete phrase ${phrase.text}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenancePanel;
