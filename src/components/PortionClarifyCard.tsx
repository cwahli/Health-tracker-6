import React, { useState } from 'react';

export const PortionClarifyCard = ({ onResume }: { onResume: (choices: any) => void }) => {
  const [grams, setGrams] = useState('');
  return (
    <div className="p-4 bg-white rounded-lg shadow mt-2">
      <h3 className="font-semibold text-gray-800">Please clarify your portion</h3>
      <div className="flex gap-2 mt-2">
        <button onClick={() => onResume({ preset: '1 slice' })} className="px-3 py-1 bg-gray-100 rounded">1 slice</button>
        <button onClick={() => onResume({ preset: '2 slices' })} className="px-3 py-1 bg-gray-100 rounded">2 slices</button>
        <button onClick={() => onResume({ preset: 'Whole pack' })} className="px-3 py-1 bg-gray-100 rounded">Whole pack</button>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="number"
          placeholder="Custom grams"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="border px-2 py-1 rounded w-32"
        />
        <button
          onClick={() => onResume({ grams })}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Continue with these portions
        </button>
      </div>
    </div>
  );
};
