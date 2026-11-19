import React, { useState } from 'react';
import { Card, Button } from '../components/ui/Cards';
import Input from '../components/ui/Input';
import { Page, SectionLabel, CardHeader, Field, Select, Toggle, Avatar, cx } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import mascot1 from '../assets/mascot_1.png';
import mascot3 from '../assets/mascot_3.png';
import mascot4 from '../assets/mascot_4.png';
import mascot5 from '../assets/mascot_5.png';
import {
  User,
  KeyRound,
  Save,
  Check,
  Lock,
  Building2,
  Mail,
  Phone,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuth();

  // Mascot Avatar presets
  const presetAvatars = [
    mascot1,
    mascot3,
    mascot4,
    mascot5
  ];

  // State
  const [avatar, setAvatar] = useState(user?.avatar || mascot1);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [agencyName, setAgencyName] = useState(user?.agency || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [defaultVibePlatform, setDefaultVibePlatform] = useState('Pucho Code');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [buildAlerts, setBuildAlerts] = useState(true);

  // Handlers
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }
    updateProfile({ name, agency: agencyName, email, avatar });
    toast.success('Profile details updated successfully!');
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      toast.error('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    const res = changePassword(currentPassword, newPassword);
    if (res.success) {
      toast.success('Password updated successfully! Use your new password on next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.message || 'Password update failed.');
    }
  };

  const handleAvatarSelect = (url) => {
    setAvatar(url);
    toast.success('Avatar icon updated!');
  };

  const handleCustomAvatarApply = () => {
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim());
      toast.success('Custom avatar loaded!');
    }
  };

  return (
    <Page width="max-w-[880px]" className="pb-12">
      {/* Who is signed in */}
      <div className="flex items-center gap-4 min-w-0">
        <Avatar name={name || user?.name} src={avatar} size={56} />
        <div className="min-w-0">
          <p className="text-[17px] leading-6 font-semibold text-ink truncate">{user?.name || name || 'Your profile'}</p>
          <p className="text-[13px] text-ink-3 truncate">
            {[user?.agency, user?.email].filter(Boolean).join(' · ') || 'Channel partner account'}
          </p>
        </div>
      </div>

      {/* 1. Profile */}
      <section className="space-y-3">
        <SectionLabel>Profile</SectionLabel>
        <Card className="space-y-6">
          <CardHeader icon={User} title="Personal & agency profile" description="Your contact details, agency name and avatar." />

          {/* Avatar (saved with the profile) */}
          <div className="space-y-3">
            <p className="text-[13px] font-medium text-ink-3">Avatar</p>
            <div className="flex flex-wrap items-center gap-3">
              {presetAvatars.map((url, idx) => {
                const sel = avatar === url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAvatarSelect(url)}
                    aria-pressed={sel}
                    aria-label={`Preset avatar ${idx + 1}`}
                    title={`Preset avatar ${idx + 1}`}
                    className={cx(
                      'relative w-14 h-14 rounded-xl overflow-hidden p-0.5 border-2 transition-colors duration-150 shrink-0',
                      sel ? 'border-accent' : 'border-transparent hover:border-line-strong'
                    )}
                  >
                    <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
                    {sel && (
                      <span className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-accent text-surface flex items-center justify-center" aria-hidden>
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <Input
                label="Custom image URL"
                type="url"
                icon={Link2}
                placeholder="https://example.com/photo.jpg"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
              />
              <Button variant="secondary" size="lg" onClick={handleCustomAvatarApply}>
                Apply
              </Button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 pt-5 border-t border-line-soft">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full name"
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                autoComplete="name"
              />
              <Input
                label="Agency / business name"
                icon={Building2}
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Enter agency name"
                autoComplete="organization"
              />
              <Input
                label="Email address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
              />
              <Input
                label="Mobile number"
                icon={Phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </div>

            <div className="flex justify-end">
              <Button icon={Save} type="submit">
                Save profile
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* 2. Password */}
      <section className="space-y-3">
        <SectionLabel>Security</SectionLabel>
        <Card>
          <CardHeader icon={KeyRound} title="Password" description="Change the password you sign in with." className="mb-5" />
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current password"
                type="password"
                icon={Lock}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="sm:col-span-2"
              />
              <Input
                label="New password"
                type="password"
                icon={Lock}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 4 characters"
                autoComplete="new-password"
              />
              <Input
                label="Confirm new password"
                type="password"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end">
              <Button icon={Save} type="submit">
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* 3. Preferences */}
      <section className="space-y-3">
        <SectionLabel>Preferences</SectionLabel>
        <Card className="space-y-5">
          <Field label="Default vibe-coding platform" htmlFor="default-platform" className="sm:max-w-sm">
            <Select
              id="default-platform"
              value={defaultVibePlatform}
              onChange={(e) => {
                setDefaultVibePlatform(e.target.value);
                toast.success(`Default platform set to ${e.target.value}`);
              }}
            >
              <option value="Pucho Code">Pucho Code (Recommended)</option>
              <option value="Cursor AI">Cursor AI</option>
              <option value="Windsurf">Windsurf Editor</option>
              <option value="v0.dev">v0.dev by Vercel</option>
              <option value="Bolt.new">Bolt.new</option>
            </Select>
          </Field>

          <div className="pt-4 border-t border-line-soft">
            <p className="text-[13px] font-medium text-ink-3 mb-1">Notifications</p>
            <div className="divide-y divide-line-soft">
              <div className="flex items-center justify-between gap-4 py-3">
                <p className="text-sm text-ink min-w-0">Email notifications</p>
                <Toggle checked={emailNotifications} onChange={(v) => setEmailNotifications(v)} label="Email notifications" />
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <p className="text-sm text-ink min-w-0">AI build status alerts</p>
                <Toggle checked={buildAlerts} onChange={(v) => setBuildAlerts(v)} label="AI build status alerts" />
              </div>
            </div>
          </div>
        </Card>
      </section>
    </Page>
  );
}
