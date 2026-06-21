import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, GraduationCap, Users as UsersIcon, FileText, Clock, Check, Trash2 } from 'lucide-react';
import { User, Opportunity } from '../../types';

interface Props {
  users: User[];
  opportunities?: Opportunity[];
  approveProfessor: (id: string) => void;
  fetchAllUsers: () => Promise<void>;
  deleteUser: (key: string) => Promise<void>;
  deletePost: (postId: string) => void;
}

function StatCard({ icon: Icon, value, label, accent }: { icon: any; value: number; label: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-amber-50 text-amber-600' : 'bg-zinc-900 text-white'}`}>
          <Icon size={16} />
        </div>
        {accent && value > 0 && <span className="signal-dot" aria-hidden="true" />}
      </div>
      <div className="font-display text-3xl text-zinc-900 leading-none tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-zinc-400 mt-1.5">{label}</div>
    </div>
  );
}

function DangerButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors"
    >
      <Trash2 size={12} /> {label}
    </button>
  );
}

function SectionCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</h2>
        <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 rounded-full px-2.5 py-0.5 tabular-nums">{count}</span>
      </div>
      {children}
    </section>
  );
}

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors">
      {children}
    </div>
  );
};

export default function AdminDashboard({ users, opportunities = [], approveProfessor, fetchAllUsers, deleteUser, deletePost }: Props) {
  const [localUsers, setLocalUsers] = useState<User[]>(users || []);

  useEffect(() => { setLocalUsers(users || []); }, [users]);
  useEffect(() => { fetchAllUsers().catch(() => {}); }, []);

  const pending = localUsers.filter(u => u.role === 'professor' && !u.approved);
  const professors = localUsers.filter(u => u.role === 'professor');
  const students = localUsers.filter(u => u.role === 'student');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="signal-dot" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Administration</span>
        </div>
        <h1 className="font-display text-[2rem] leading-tight text-zinc-900">Admin Dashboard</h1>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} value={pending.length} label="Pending approvals" accent />
        <StatCard icon={GraduationCap} value={professors.length} label="Professors" />
        <StatCard icon={UsersIcon} value={students.length} label="Students" />
        <StatCard icon={FileText} value={opportunities.length} label="Opportunities" />
      </div>

      {/* Pending approvals */}
      <SectionCard title="Pending professor approvals" count={pending.length}>
        {pending.length === 0 ? (
          <div className="text-sm text-zinc-400 py-2">No pending professor accounts.</div>
        ) : (
          <div className="space-y-2">
            {pending.map(p => (
              <Row key={p.id}>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-zinc-900 truncate">{p.name} <span className="text-xs font-normal text-zinc-400">{p.email}</span></div>
                  <div className="text-xs text-zinc-500">{p.department || '—'}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approveProfessor(p.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-black transition-colors">
                    <Check size={12} /> Approve
                  </button>
                  <DangerButton onClick={() => deleteUser(p.id)} label="Delete" />
                </div>
              </Row>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Professors */}
      <SectionCard title="Professors" count={professors.length}>
        {professors.length === 0 ? <div className="text-sm text-zinc-400 py-2">No professors.</div> : (
          <div className="grid gap-2">
            {professors.map(p => (
              <Row key={p.id}>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
                    {p.name}
                    {p.approved
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"><ShieldCheck size={10} /> Approved</span>
                      : <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Pending</span>}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{p.email} · {p.department || '—'}</div>
                </div>
                <DangerButton onClick={() => deleteUser(p.id)} label="Delete" />
              </Row>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Students */}
      <SectionCard title="Students" count={students.length}>
        {students.length === 0 ? <div className="text-sm text-zinc-400 py-2">No students.</div> : (
          <div className="grid gap-2">
            {students.map(s => (
              <Row key={s.id}>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-zinc-900 truncate">{s.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{s.email}</div>
                </div>
                <DangerButton onClick={() => deleteUser(s.id)} label="Delete" />
              </Row>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Posts */}
      <SectionCard title="All opportunities" count={opportunities.length}>
        {opportunities.length === 0 ? <div className="text-sm text-zinc-400 py-2">No posts.</div> : (
          <div className="grid gap-2">
            {opportunities.map(o => (
              <Row key={o.id}>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-zinc-900 truncate">{o.title}</div>
                  <div className="text-xs text-zinc-500 truncate">{o.author?.name} · {o.author?.department || ''}</div>
                </div>
                <DangerButton onClick={() => deletePost(o.id)} label="Delete Post" />
              </Row>
            ))}
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}
