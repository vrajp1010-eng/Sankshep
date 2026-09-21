import { X } from "lucide-react";
import { useEffect } from "react";

export default function SettingsDrawer({
  open,
  onClose,
  brandProfiles,
  selectedProfileIndex,
  setSelectedProfileIndex,
  profileNameInput,
  setProfileNameInput,
  profileNotesInput,
  setProfileNotesInput,
  onSaveProfile,
  onDeleteProfile,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button type="button" className="absolute inset-0 bg-slate-900/30" aria-label="Close settings" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="settings-title" className="font-display text-lg font-semibold text-slate-900">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <h3 className="text-sm font-semibold text-slate-900">Brand voice</h3>
          <p className="mt-1 text-sm text-slate-500">
            Saved locally in this browser. Provider credentials stay on the server and are never shown here.
          </p>

          <label htmlFor="active-profile" className="mt-4 mb-1 block text-xs font-medium text-slate-600">
            Active profile
          </label>
          <select
            id="active-profile"
            value={selectedProfileIndex}
            onChange={(event) => setSelectedProfileIndex(Number(event.target.value))}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
          >
            {brandProfiles.map((profile, index) => (
              <option key={`${profile.name}-${index}`} value={index}>
                {profile.name}
              </option>
            ))}
          </select>

          <label htmlFor="profile-name" className="mt-5 mb-1 block text-xs font-medium text-slate-600">
            New profile name
          </label>
          <input
            id="profile-name"
            type="text"
            value={profileNameInput}
            onChange={(event) => setProfileNameInput(event.target.value)}
            placeholder="Product marketing voice"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
          />

          <label htmlFor="profile-notes" className="mt-4 mb-1 block text-xs font-medium text-slate-600">
            Style notes
          </label>
          <textarea
            id="profile-notes"
            rows={5}
            value={profileNotesInput}
            onChange={(event) => setProfileNotesInput(event.target.value)}
            placeholder="Preferred phrasing, words to avoid, audience details..."
            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            {selectedProfileIndex > 0 ? (
              <button type="button" onClick={() => onDeleteProfile(selectedProfileIndex)} className="text-sm text-rose-600 hover:underline">
                Delete current
              </button>
            ) : (
              <span />
            )}
            <button type="button" onClick={onSaveProfile} disabled={!profileNameInput.trim()} className="btn-primary h-10 px-4 text-sm">
              Save profile
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
