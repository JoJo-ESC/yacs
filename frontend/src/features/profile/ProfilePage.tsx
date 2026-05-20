import React, { useEffect, useState } from "react";
import { Edit, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";

type ProfileResponse = {
  id: number;
  name: string;
  email: string;
  major: string;
  degree: string;
  profile_image_url: string | null;
};

type FormData = {
  name: string;
  email: string;
  major: string;
  degree: string;
};

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<{
    name: string;
    email: string;
    major: string;
    degree: string;
    profileImage: string | null;
  }>({
    name: "",
    email: "",
    major: "",
    degree: "",
    profileImage: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: "", email: "", major: "", degree: "" });

  useEffect(() => {
    async function loadProfile() {
      try {
        setError(null);
        const profile = await apiFetch<ProfileResponse>("/api/profile", {
          credentials: "include",
        });
        setUser({
          name: profile.name,
          email: profile.email,
          major: profile.major,
          degree: profile.degree,
          profileImage: profile.profile_image_url,
        });
        setFormData({ name: profile.name, email: profile.email, major: profile.major, degree: profile.degree });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load profile.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleSave = async () => {
    try {
      setError(null);
      const updated = await apiFetch<ProfileResponse>("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, major: formData.major, degree: formData.degree }),
      });
      setUser((u) => ({ ...u, name: updated.name, email: updated.email, major: updated.major, degree: updated.degree }));
      setFormData({ name: updated.name, email: updated.email, major: updated.major, degree: updated.degree });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex-grow p-6 bg-background text-foreground">
        <div className="max-w-3xl mx-auto rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow p-6 bg-background text-foreground min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6">

            {/* Avatar */}
            <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
              {user.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(user.name || "?")
              )}
            </div>

            {/* Name / email */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => { setFormData({ name: user.name, email: user.email, major: user.major, degree: user.degree }); setIsEditing(true); }}
                className="flex items-center justify-center gap-2 border rounded-md px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <Edit className="size-4" />
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 border border-red-200 rounded-md px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm p-6">
          <h3 className="font-semibold mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Major</p>
              <p className="text-sm font-medium">{user.major || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Degree</p>
              <p className="text-sm font-medium">{user.degree || "—"}</p>
            </div>
          </div>
        </div>


      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs text-gray-500">Name</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-500">Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-500">Major</span>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-500">Degree</span>
                <select
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="BS">BS</option>
                  <option value="MS">MS</option>
                  <option value="PhD">PhD</option>
                  <option value="BA">BA</option>
                </select>
              </label>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
