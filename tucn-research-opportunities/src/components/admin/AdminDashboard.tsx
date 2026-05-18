import React, { useEffect, useState } from 'react';
import { User, Opportunity } from '../../types';

interface Props {
  users: User[];
  opportunities?: Opportunity[];
  approveProfessor: (id: string) => void;
  fetchAllUsers: () => Promise<void>;
  deleteUser: (key: string) => Promise<void>;
  deletePost: (postId: string) => void;
}

export default function AdminDashboard({ users, opportunities = [], approveProfessor, fetchAllUsers, deleteUser, deletePost }: Props) {
  const [localUsers, setLocalUsers] = useState<User[]>(users || []);

  useEffect(() => { setLocalUsers(users || []); }, [users]);

  useEffect(() => { fetchAllUsers().catch(()=>{}); }, []);

  const pending = localUsers.filter(u => u.role === 'professor' && !u.approved);
  const professors = localUsers.filter(u => u.role === 'professor');
  const students = localUsers.filter(u => u.role === 'student');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <section className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Pending professor approvals</h2>
        {pending.length === 0 ? (
          <div className="text-sm text-gray-500">No pending professor accounts.</div>
        ) : (
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{p.name} <span className="text-xs text-gray-400">{p.email}</span></div>
                  <div className="text-xs text-gray-500">{p.department || '—'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveProfessor(p.id)} className="px-3 py-1 bg-utcn-primary text-white rounded">Approve</button>
                  <button onClick={() => deleteUser(p.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Professors</h2>
        {professors.length === 0 ? <div className="text-sm text-gray-500">No professors.</div> : (
          <div className="grid gap-2">
            {professors.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.email} · {p.department || '—'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteUser(p.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Students</h2>
        {students.length === 0 ? <div className="text-sm text-gray-500">No students.</div> : (
          <div className="grid gap-2">
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteUser(s.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">All posts</h2>
        {opportunities.length === 0 ? <div className="text-sm text-gray-500">No posts.</div> : (
          <div className="grid gap-2">
            {opportunities.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-gray-500">{o.author?.name} · {o.author?.department || ''}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deletePost(o.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete Post</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
