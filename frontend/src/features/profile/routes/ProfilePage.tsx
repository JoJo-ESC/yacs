import React from "react";
import { Edit } from "lucide-react";

export default function ProfilePage() {
  const user = {
    name: "Maggie Trebilcock",
    email: "trebim2@rpi.edu",
    cohort: "2023",
    majors: ["Computer Science"],
    minors: "N/A",
    pathway: "Philosophy & Logic",
    semesters: ["SPRING 2025"],
    degreePlans: ["Plan A", "Plan B"],
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="flex-grow p-6 bg-background text-foreground min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* Profile Card */}
            <div className="border rounded-xl p-6 bg-white shadow-sm">
              <div className="flex flex-col items-center text-center">

                <div className="w-32 h-32 rounded-full bg-purple-600 flex items-center justify-center text-white text-3xl mb-4">
                  {getInitials(user.name)}
                </div>

                <h2 className="text-2xl mb-1">{user.name}</h2>
                <p className="text-gray-500 text-sm mb-1">{user.email}</p>

                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm mb-4">
                  Cohort: {user.cohort}
                </span>

                <button className="w-full border rounded-md py-2 text-sm flex items-center justify-center gap-2 hover:bg-gray-50">
                  <Edit className="size-4" />
                  Edit Profile
                </button>

              </div>
            </div>

            {/* Academic Info */}
            <div className="border rounded-xl p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-4">Academic Information</h3>

              <div className="space-y-4">

                <div>
                  <p className="text-sm text-gray-500 mb-2">Major(s)</p>
                  {user.majors.map((major, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                      <p className="font-medium text-blue-900">{major}</p>
                      <p className="text-xs text-blue-700">Systems and Software</p>
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
            <div className="border rounded-xl p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-2">My Friends</h3>
              <p className="text-sm text-gray-500">No friends added yet</p>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* Semesters */}
            <div className="border rounded-xl p-6 bg-white shadow-sm">
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
            <div className="border rounded-xl p-6 bg-white shadow-sm">
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
      </div>
    </div>
  );
}
