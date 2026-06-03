import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  UserService,
  StudioService,
  BranchService,
  RoomService,
} from "../../../services/api";
import { Loader2, Building, MapPin, Clock } from "lucide-react";
import { Studio, Branch, User, Room } from "../../../types/types";

import { StudioDetailsTab } from "./tabs/StudioDetailsTab";
import { BranchManagementTab } from "./tabs/BranchManagementTab";
import { TeamManagementTab } from "./tabs/TeamManagementTab";

export const Administration: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);

  const [activeTab, setActiveTab] = useState<"details" | "team" | "branches">(
    "details"
  );

  // Create Mode (New Studio Onboarding)
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    contact_email: "",
    website_url: "",
    schedule_start_hour: 7,
    schedule_end_hour: 23,
    branchName: "Main Branch",
    branchAddress: "",
    branchCity: "",
    branchPhone: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const studioData = await StudioService.getMyStudio();
      setStudio(studioData);

      // Load branches
      const branchesData = await BranchService.getAll();
      setBranches(branchesData);

      // Load Rooms
      const roomsData = await RoomService.getAll();
      setRooms(roomsData);

      // Load Instructors
      const instructorsData = await UserService.getInstructors();
      setInstructors(instructorsData);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setStudio(null); // Show create form
      } else {
        console.error("Failed to load data", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: createForm.name,
        description: createForm.description,
        contact_email: createForm.contact_email,
        contact_phone: createForm.contact_phone,
        website_url: createForm.website_url,
        schedule_start_hour: createForm.schedule_start_hour,
        schedule_end_hour: createForm.schedule_end_hour,
        branchData: {
          name: createForm.branchName,
          address: createForm.branchAddress,
          city: createForm.branchCity,
          phone_number: createForm.branchPhone,
        },
      };
      await StudioService.create(payload);
      await fetchData();
    } catch (err: any) {
      setCreateError(
        err.response?.data?.error || err.message || "שגיאה ביצירת הסטודיו"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !studio && !createForm.name)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );

  // View 1: Create Studio Form (Onboarding)
  if (!studio) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-indigo-100 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="text-indigo-600 dark:text-indigo-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              ברוכים הבאים ל-Classly!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              בואו נגדיר את הסטודיו והסניף הראשי שלך.
            </p>
          </div>

          <form onSubmit={handleCreateStudio} className="space-y-6">
            {/* Studio Details */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Building size={18} /> פרטי הסטודיו
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    שם הסטודיו *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    placeholder="לדוגמה: יוגה סטודיו שלי"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="tel"
                    className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    placeholder="טלפון ליצירת קשר ראשי"
                    value={createForm.contact_phone}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        contact_phone: e.target.value,
                      })
                    }
                  />
                  <input
                    type="email"
                    className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    placeholder="אימייל ליצירת קשר ראשי"
                    value={createForm.contact_email}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        contact_email: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-3 flex items-center gap-2">
                <Clock size={18} /> שעות פעילות הסטודיו
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    שעת התחלה
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    value={createForm.schedule_start_hour}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        schedule_start_hour: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    שעת סיום
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    value={createForm.schedule_end_hour}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        schedule_end_hour: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Branch Details */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h3 className="font-semibold text-indigo-800 dark:text-indigo-400 mb-3 flex items-center gap-2">
                <MapPin size={18} /> מיקום הסניף הראשי
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    שם הסניף *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    value={createForm.branchName}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        branchName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    כתובת *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    value={createForm.branchAddress}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        branchAddress: e.target.value,
                      })
                    }
                    placeholder="לדוגמה: רחוב הרצל 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                      עיר *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      value={createForm.branchCity}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          branchCity: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                      טלפון הסניף
                    </label>
                    <input
                      type="tel"
                      className="w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      value={createForm.branchPhone}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          branchPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {createError && (
              <div className="text-red-500 text-sm">{createError}</div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
            >
              צור את הסטודיו שלי
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View 2: Existing Studio Management
  return (
    <div className="space-y-6">
      <Helmet>
        <title>ניהול | Classly</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building className="text-indigo-600 dark:text-indigo-400" /> {studio.name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            מספר סידורי:{" "}
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 rounded font-bold">
              {studio.serial_number}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "details" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            פרטים
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "branches" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            סניפים
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "team" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            צוות
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === "details" && (
        <StudioDetailsTab studio={studio} onUpdate={fetchData} />
      )}

      {activeTab === "branches" && (
        <BranchManagementTab
          branches={branches}
          rooms={rooms}
          onRefresh={fetchData}
        />
      )}

      {activeTab === "team" && <TeamManagementTab instructors={instructors} />}
    </div>
  );
};
