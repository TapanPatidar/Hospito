import API from "../api";

import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, AlertTriangle, Clock, LogOut, Pill, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = "/api";

function StatusBadge({ status }) {
  const colors = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    fulfilled: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
    completed: "bg-stone-100 text-stone-600"
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || colors.active}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    axios.get(`${API}/patients/${user.id}/prescriptions`)
      .then(response => setPrescriptions(response.data.prescriptions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  const history = user?.medical_history || [];
  const allergies = user?.allergies || [];

  return (
    <div className="min-h-screen" style={{ background: "#FAF9F6", fontFamily: "Work Sans, sans-serif" }}>
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-800 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>HealthSync</span>
          </div>
          <button data-testid="logout-btn" onClick={handleLogout} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div data-testid="patient-id-banner" className="bg-green-800 text-white rounded-xl p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-green-200 text-xs font-semibold uppercase tracking-wide mb-1">Patient Portal</p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>Welcome, {user?.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-green-200 text-sm">Patient ID:</span>
              <code data-testid="patient-id-value" className="bg-green-700 px-2.5 py-0.5 rounded text-sm font-mono font-bold">{user?.id}</code>
            </div>
          </div>
          <div className="hidden md:flex w-16 h-16 bg-green-700 rounded-full items-center justify-center">
            <User className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div data-testid="patient-profile-card" className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <User className="w-4 h-4 text-green-800" /> My Profile
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Name</span><span className="font-medium text-stone-800">{user?.name}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Email</span><span className="font-medium text-stone-800 text-xs">{user?.email}</span></div>
              {user?.date_of_birth ? <div className="flex justify-between"><span className="text-stone-500">Date of Birth</span><span className="font-medium text-stone-800">{user.date_of_birth}</span></div> : null}
              {user?.blood_type ? <div className="flex justify-between"><span className="text-stone-500">Blood Type</span><span className="font-bold text-red-600">{user.blood_type}</span></div> : null}
              {user?.phone ? <div className="flex justify-between"><span className="text-stone-500">Phone</span><span className="font-medium text-stone-800">{user.phone}</span></div> : null}
            </div>
          </div>

          <div data-testid="medical-history-card" className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <Clock className="w-4 h-4 text-green-800" /> Medical History
            </h2>
            {history.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-4">No medical history recorded</p>
            ) : (
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={`${item.condition}-${index}`} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-stone-800">{item.condition}</p>
                      <p className="text-xs text-stone-500">{item.diagnosed}</p>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div data-testid="allergies-card" className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Allergies
            </h2>
            {allergies.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-4">No allergies recorded</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergies.map(item => (
                  <span key={item} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full text-sm font-medium">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div data-testid="prescriptions-section" className="mt-6 bg-white border border-stone-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <Pill className="w-4 h-4 text-green-800" /> My Prescriptions
              <span className="ml-auto text-xs text-stone-400 font-normal">{prescriptions.length} total</span>
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-stone-400 text-sm">Loading prescriptions...</div>
          ) : prescriptions.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-sm">No prescriptions found</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {prescriptions.map(rx => (
                <div key={rx.id} data-testid="prescription-item" className="p-5 flex items-start justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pill className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{rx.medication_name}</p>
                      <p className="text-sm text-stone-500">{rx.dosage} · {rx.frequency} · {rx.duration}</p>
                      {rx.diagnosis ? <p className="text-xs text-stone-400 mt-0.5">Diagnosis: {rx.diagnosis}</p> : null}
                      <p className="text-xs text-stone-400 mt-0.5">By Dr. {rx.prescriber_name} · {rx.pharmacy_name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={rx.status} />
                    <span className="text-xs text-stone-400">{rx.created_at ? new Date(rx.created_at).toLocaleDateString() : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
