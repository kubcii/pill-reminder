import React, { useState } from 'react';
import { Pill } from '../types';

interface PillScheduleProps {
  onSave: (pill: Omit<Pill, 'id'>) => void;
  onCancel?: () => void;
  initialData?: Pill;
}

export const PillSchedule: React.FC<PillScheduleProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [times, setTimes] = useState<string[]>(initialData?.times || ['09:00']);
  const [color, setColor] = useState(initialData?.color || '#3B82F6');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleAddTime = () => {
    setTimes([...times, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || times.length === 0) {
      return;
    }
    onSave({ name, dosage, times, color, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gray-800 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {initialData ? 'Edit Pill Schedule' : 'Add New Pill'}
      </h2>

      <div className="space-y-2">
        <label htmlFor="pill-name" className="block text-lg font-semibold">
          Pill Name *
        </label>
        <input
          id="pill-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-4 text-lg rounded-lg bg-gray-700 border-2 border-gray-600 focus:border-blue-500 outline-none"
          placeholder="e.g., Vitamin D"
          required
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="pill-dosage" className="block text-lg font-semibold">
          Dosage *
        </label>
        <input
          id="pill-dosage"
          type="text"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          className="w-full p-4 text-lg rounded-lg bg-gray-700 border-2 border-gray-600 focus:border-blue-500 outline-none"
          placeholder="e.g., 1000mg"
          required
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-lg font-semibold">
          Times *
        </label>
        <div className="space-y-3">
          {times.map((time, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(index, e.target.value)}
                className="flex-1 p-4 text-lg rounded-lg bg-gray-700 border-2 border-gray-600 focus:border-blue-500 outline-none"
                required
                aria-label={`Time ${index + 1}`}
              />
              {times.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTime(index)}
                  className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg"
                  aria-label={`Remove time ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddTime}
          className="giant-button bg-blue-600 hover:bg-blue-700 w-full"
          aria-label="Add another time"
        >
          + Add Another Time
        </button>
      </div>

      <div className="space-y-2">
        <label htmlFor="pill-color" className="block text-lg font-semibold">
          Color (for visual identification)
        </label>
        <div className="flex gap-4 items-center">
          <input
            id="pill-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-16 w-24 rounded-lg cursor-pointer border-2 border-gray-600"
            aria-label="Choose pill color"
          />
          <span className="text-lg">{color}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pill-notes" className="block text-lg font-semibold">
          Notes (optional)
        </label>
        <textarea
          id="pill-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-4 text-lg rounded-lg bg-gray-700 border-2 border-gray-600 focus:border-blue-500 outline-none min-h-32"
          placeholder="e.g., Take with food"
          rows={4}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          className="giant-button bg-green-600 hover:bg-green-700 flex-1"
        >
          {initialData ? 'Update Schedule' : 'Save Schedule'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="giant-button bg-gray-600 hover:bg-gray-700 flex-1"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
