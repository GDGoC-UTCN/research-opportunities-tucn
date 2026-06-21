import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, Download, FileText, Linkedin, Save, Trash2, Upload } from 'lucide-react';
import { UploadedFile, User, UserProfile } from '../../types';
import { apiFetch, downloadProtectedFile } from '../../api';

interface Props {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  setView: (view: 'list' | 'dashboard' | 'applications') => void;
}

const MAX_PDF_SIZE = 5 * 1024 * 1024;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

function formatSize(bytes?: number) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({
  label,
  file,
  onUpload,
  onDownload,
  onDelete,
}: {
  label: string;
  file?: UploadedFile;
  onUpload: (file: File) => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const chooseFile = (file?: File) => {
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      setError('PDF must be smaller than 5 MB.');
      return;
    }
    onUpload(file);
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          {file ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <FileText size={16} className="text-utcn-primary flex-shrink-0" />
              <span className="truncate">{file.name}</span>
              <span className="text-gray-400 flex-shrink-0">{formatSize(file.size)}</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-400">No saved document yet.</p>
          )}
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {file && (
            <>
              <button type="button" onClick={onDownload} className="p-2 rounded-lg bg-slate-50 text-gray-600 hover:bg-slate-100" title="Download">
                <Download size={16} />
              </button>
              <button type="button" onClick={onDelete} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Remove">
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button type="button" onClick={() => inputRef.current?.click()} className="p-2 rounded-lg bg-utcn-primary text-white hover:bg-utcn-primary-dark" title={file ? 'Replace' : 'Upload'}>
            <Upload size={16} />
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={event => {
          chooseFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}

export default function ProfilePage({
  currentUser,
  setCurrentUser,
  setView,
}: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department || '');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    if (profile?.avatar) return `/api/profile/avatar?v=${avatarVersion}`;
    return currentUser.avatar;
  }, [avatarPreview, avatarVersion, currentUser.avatar, profile?.avatar]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/profile');
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to load profile');
      setProfile(json.profile);
      setName(json.profile.user.name || '');
      setDepartment(json.profile.user.department || '');
      setLinkedinUrl(json.profile.linkedinUrl || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await apiFetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, linkedinUrl }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to save profile');
      setProfile(json.profile);
      setCurrentUser({ ...currentUser, name: json.profile.user.name, department: json.profile.user.department });
      setMessage('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file?: File) => {
    setError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Avatar must be JPEG, PNG, or WebP.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Avatar must be smaller than 2 MB.');
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiFetch('/api/profile/avatar', { method: 'POST', body: formData });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error || 'Failed to upload avatar');
      return;
    }
    setProfile(json.profile);
    setAvatarVersion(Date.now());
    setCurrentUser({ ...currentUser, avatar: `/api/profile/avatar?v=${Date.now()}` });
    setMessage('Avatar updated.');
  };

  const uploadDocument = async (kind: 'cv' | 'transcript', file: File) => {
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append(kind, file);
    const response = await apiFetch('/api/profile/documents', { method: 'POST', body: formData });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error || 'Failed to upload document');
      return;
    }
    setProfile(json.profile);
    setMessage(`${kind === 'cv' ? 'CV' : 'Transcript'} updated.`);
  };

  const deleteDocument = async (kind: 'cv' | 'transcript') => {
    if (!window.confirm(`Remove saved ${kind === 'cv' ? 'CV' : 'transcript'}?`)) return;
    const response = await apiFetch(`/api/profile/documents/${kind}`, { method: 'DELETE' });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error || 'Failed to remove document');
      return;
    }
    setProfile(json.profile);
    setMessage(`${kind === 'cv' ? 'CV' : 'Transcript'} removed.`);
  };

  const backView = currentUser.role === 'professor' || currentUser.role === 'admin' ? 'dashboard' : 'list';

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
      className="max-w-4xl mx-auto"
    >
      <button onClick={() => setView(backView)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-utcn-primary mb-5">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="relative px-6 py-7 border-b border-white/10 bg-utcn-navy text-white overflow-hidden">
          <div className="absolute inset-0 research-grid-dark research-fade opacity-60" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-utcn-red/70 to-transparent" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="signal-dot" aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Your account</span>
            </div>
            <h1 className="font-display text-2xl text-white">My Profile</h1>
            <p className="text-sm text-white/55 mt-1">Manage your profile details and default application documents.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-gray-500">Loading profile...</div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex flex-col items-center gap-3">
                <img src={avatarSrc} alt="" className="w-28 h-28 rounded-2xl object-cover border border-gray-200 bg-slate-100" />
                <button type="button" onClick={() => avatarInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-utcn-navy text-white text-sm font-semibold hover:bg-utcn-navy-light">
                  <Camera size={15} /> Change Photo
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={event => {
                    uploadAvatar(event.target.files?.[0]).catch(err => setError(err instanceof Error ? err.message : 'Failed to upload avatar'));
                    event.target.value = '';
                  }}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 flex-1">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Full name</span>
                  <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-utcn-primary" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Department</span>
                  <input value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-utcn-primary" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-700 inline-flex items-center gap-1.5"><Linkedin size={15} /> LinkedIn URL</span>
                  <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/in/your-profile" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-utcn-primary" />
                </label>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Default Documents</h2>
                <p className="text-sm text-gray-500 mt-1">Use these saved PDFs when applying, or upload a different file per application.</p>
              </div>
              <DocumentRow
                label="Default CV"
                file={profile?.cvFile}
                onUpload={file => uploadDocument('cv', file)}
                onDownload={() => downloadProtectedFile('/api/profile/documents/cv', profile?.cvFile?.name || 'cv.pdf')}
                onDelete={() => deleteDocument('cv')}
              />
              <DocumentRow
                label="Default Transcript"
                file={profile?.transcriptFile}
                onUpload={file => uploadDocument('transcript', file)}
                onDownload={() => downloadProtectedFile('/api/profile/documents/transcript', profile?.transcriptFile?.name || 'transcript.pdf')}
                onDelete={() => deleteDocument('transcript')}
              />
            </div>

            {currentUser.role === 'student' && (
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setView('applications')}
                  className="text-sm font-semibold text-utcn-primary hover:underline"
                >
                  View saved and applied opportunities in My Opportunities
                </button>
              </div>
            )}

            {(error || message) && (
              <div className={`text-sm rounded-xl px-4 py-3 ${error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {error || message}
              </div>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-utcn-primary text-white text-sm font-semibold hover:bg-utcn-primary-dark disabled:opacity-60">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
