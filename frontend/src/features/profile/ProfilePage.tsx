import React, { useEffect, useState } from "react";
import { Edit, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";

type ProfileResponse = {
  id: number;
  name: string;
  email: string;
  phone: string;
  major: string;
  degree: string;
  profile_image_url: string | null;
};

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fallbackName = "New Student";
  const fallbackEmail = "student@example.com";

  const [user, setUser] = useState({
    name: fallbackName,
    email: fallbackEmail,
    cohort: "2023",
    majors: [""],
    minors: "N/A",
    pathway: "Philosophy & Logic",
    semesters: ["SPRING 2025"],
    degreePlans: ["Plan A", "Plan B"],
    profileImage: null as string | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  {/*edit profile boolean*/}
  const [isEditing, setIsEditing] = useState(false);

  {/*edit profile temporary data*/}
  const [formData, setFormData] = useState({
    name: fallbackName,
    email: fallbackEmail,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setError(null);
        const profile = await apiFetch<ProfileResponse>("/api/profile", {
          credentials: "include",
        });

        setUser((current) => ({
          ...current,
          name: profile.name || fallbackName,
          email: profile.email || fallbackEmail,
          majors: [profile.major || ""],
          profileImage: profile.profile_image_url,
        }));
        setFormData({
          name: profile.name || fallbackName,
          email: profile.email || fallbackEmail,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load profile.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);
  

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleEditProfile = () => {
    setFormData({
      name: user.name,
      email: user.email,
    });
    setIsEditing(true);
  };

  {/*save and cancel functions*/}
  const handleSave = async () => {
    try {
      setError(null);
      const updatedProfile = await apiFetch<ProfileResponse>("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      setUser({
        ...user,
        name: updatedProfile.name,
        email: updatedProfile.email,
        majors: [updatedProfile.major],
        profileImage: updatedProfile.profile_image_url,
      });
      setFormData({
        name: updatedProfile.name,
        email: updatedProfile.email,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    }
  };

const handleCancel = () => {
  setIsEditing(false);
};


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;
    const imageURL = URL.createObjectURL(file);
    
    setUser({
      ...user,
      profileImage: imageURL,
    });
  };

  const handleResetImage = () => {
    setUser({
      ...user,
      profileImage: null,
    });
  };

  
  return (
    <div className="flex-grow p-6 bg-background text-foreground min-h-screen">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
            Loading profile...
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* Profile Card */}
            <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-col items-center text-center">

                <div className="w-32 h-32 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white text-3xl mb-4">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>

                <h2 className="text-2xl mb-1">{user.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{user.email}</p>

                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm mb-4">
                  Cohort: {user.cohort}
                </span>

                <button onClick={handleEditProfile} className="w-full border rounded-md py-2 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 hover:dark:bg-slate-800">
                  <Edit className="size-4" />
                  Edit Profile
                </button>
                <button
                  onClick={async () => { await logout(); navigate("/login", { replace: true }); }}
                  className="w-full border border-red-200 rounded-md py-2 text-sm flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 mt-2"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
                

              </div>
            </div>

            {/* Academic Info */}
            <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="font-semibold mb-4">Academic Information</h3>

              <div className="space-y-4">

                <div>
                  <p className="text-sm text-gray-500 mb-2">Major(s)</p>
                  {user.majors.map((major, i) => (
                    <div key={i} className="bg-blue-50 border dark:bg-slate-700 border-blue-200 rounded-lg p-3 mb-2">
                      <p className="font-medium text-blue-900 dark:text-blue-300">{major}</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">Systems and Software</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Minor(s)</p>
                  <p className="text-sm">{user.minors}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">HASS Pathway</p>
                  <span className="border px-3 py-1 rounded-full text-sm">
                    {user.pathway}
                  </span>
                </div>

              </div>
            </div>

            {/* Friends */}
            <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="font-semibold mb-2">My Friends</h3>
              <p className="text-sm text-gray-500">No friends added yet</p>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* Semesters */}
            <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">My Semesters</h3>
                <button className="border px-3 py-1 rounded text-sm hover:bg-gray-50">
                  Add Semester
                </button>
              </div>

              {user.semesters.map((semester, i) => (
                <div key={i}>
                  <p className="text-sm font-medium mb-3">{semester}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1,2,3,4].map(n => (
                      <div
                        key={n}
                        className="border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-400 cursor-pointer"
                      >
                        <p className="text-xs text-gray-500">Add Course</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Degree Plans */}
            <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">My Degree Plans</h3>
                <button className="border px-3 py-1 rounded text-sm hover:bg-gray-50">
                  Create Plan
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {user.degreePlans.map((plan, i) => (
                  <div key={i} className="border rounded-lg p-4 hover:shadow-md cursor-pointer">
                    <p className="font-medium mb-2">{plan}</p>

                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>{12 + i*6} courses</span>
                      <span>{50 + i*15}%</span>
                    </div>

                    <div className="bg-gray-200 h-2 rounded-full">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${50 + i*15}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/** Edit Profile UI */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg w-96">

            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

            {/* Profile Picture Upload */}
            {/* Profile Picture Editor */}
            <div className="flex flex-col items-center gap-3 mb-4">

              <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white text-xl">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(user.name)
                )}
              </div>

              <label className="border px-3 py-1 rounded text-sm cursor-pointer hover:bg-gray-100">
                Change Picture
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>

              {user.profileImage && (
                <button
                  onClick={handleResetImage}
                  className="text-xs text-red-500"
                >
                  Remove Picture
                </button>
              )}

            </div>


            <div className="space-y-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Name"
              />

              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Email"
              />
            </div>

            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded"
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

