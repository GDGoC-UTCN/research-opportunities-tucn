import React from 'react';
import { User } from '../../types';

interface Props {
  users: User[];
  approveProfessor: (id: string) => void;
}

export default function AdminDashboard({ users, approveProfessor }: Props) {
  const pending = users.filter(u => u.role === 'professor' && !u.approved);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin — Account approvals</h1>
      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100">No pending professor accounts.</div>
      ) : (
        <div className="space-y-3">
          {pending.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-gray-500">{p.department || '—'}</div>
              </div>
              <div>
                <button onClick={() => approveProfessor(p.id)} className="px-3 py-2 bg-utcn-primary text-white rounded-lg">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
