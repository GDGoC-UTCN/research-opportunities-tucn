import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { AppNotification } from '../../types';
import { apiFetch } from '../../api';

interface Props {
  onNavigate: (path: string) => void;
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

export default function NotificationsPage({ onNavigate }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiFetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        setNotifications(Array.isArray(json.notifications) ? json.notifications : []);
      }
    } catch { /* keep */ }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, []);

  const markRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
  };

  const markAll = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'PATCH' }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const open = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.link_url) onNavigate(n.link_url);
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="signal-dot" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Activity</span>
          </div>
          <h1 className="font-display text-[2rem] leading-tight text-zinc-900">Notifications</h1>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900">
            <Check size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
          <Bell className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-base font-semibold text-zinc-800">No notifications yet</h3>
          <p className="mt-1 text-sm text-zinc-400">Updates about your questions and applications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`group flex items-start gap-3 rounded-xl border p-4 transition-colors ${n.read ? 'border-zinc-200 bg-white' : 'border-zinc-300 bg-zinc-50'}`}>
              <button onClick={() => open(n)} className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-utcn-red flex-shrink-0" />}
                  <h3 className={`text-sm ${n.read ? 'font-semibold text-zinc-700' : 'font-bold text-zinc-900'}`}>{n.title}</h3>
                </div>
                {n.message && <p className="text-sm text-zinc-500 mt-1">{n.message}</p>}
                <p className="text-[11px] text-zinc-400 mt-1">{formatDate(n.created_at)}</p>
              </button>
              <button onClick={() => remove(n.id)} aria-label="Delete notification" className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
