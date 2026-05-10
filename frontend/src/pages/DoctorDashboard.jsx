import API from "../api";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Activity, AlertCircle, CheckCircle, LogOut, Pill, Plus, Search, Stethoscope, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";



function StatusBadge({ status }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    fulfilled: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || "bg-stone-100 text-stone-600"}`}>{status}</span>;
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total_patients: 0, total_prescriptions: 0, today_prescriptions: 0 });
  const [searchQ, setSearchQ] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [showRxForm, setShowRxForm] = useState(false);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxSuccess, setRxSuccess] = useState("");
  const [rxError, setRxError] = useState("");
  const [rxForm, setRxForm] = useState({
    pharmacy_id: "",
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    notes: "",
    diagnosis: ""
  });

  const loadPatients = useCallback(async (query) => {
    try {
      const response = await axios.get(`${API}/patients?q=${encodeURIComponent(query)}`);
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    axios.get(`${API}/stats/doctor`).then(response => setStats(response.data)).catch(console.error);
    axios.get(`${API}/pharmacies`).then(response => setPharmacies(response.data.pharmacies || [])).catch(console.error);
    loadPatients("");
  }, [loadPatients]);

  async function handleSelectPatient(patient) {
    try {
      const response = await axios.get(`${API}/patients/${patient.id}`);
      setSelectedPatient(response.data.patient);
    } catch {
      setSelectedPatient(patient);
    }

    setShowRxForm(false);
    setRxSuccess("");
    setRxError("");
  }

  async function handleRxSubmit(event) {
    event.preventDefault();
    setRxLoading(true);
    setRxError("");
    setRxSuccess("");

    try {
      await axios.post(`${API}/patients/${selectedPatient.id}/prescriptions`, {
        ...rxForm,
        prescriber_id: user.id
      });
      setRxSuccess("Prescription sent to pharmacy successfully!");
      setShowRxForm(false);
      setRxForm({
        pharmacy_id: "",
        medication_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        notes: "",
        diagnosis: ""
      });
      setStats(current => ({
        ...current,
        total_prescriptions: current.total_prescriptions + 1,
        today_prescriptions: current.today_prescriptions + 1
      }));
      handleSelectPatient(selectedPatient);
    } catch (error) {
      setRxError(error.response?.data?.detail || error.message);
    } finally {
      setRxLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAF9F6", fontFamily: "Work Sans, sans-serif" }}>
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-800 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>Hospito</span>
          </div>
          <button data-testid="logout-btn" onClick={handleLogout} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div data-testid="doctor-id-banner" className="bg-white border border-stone-200 rounded-xl p-6 mb-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-stone-400 text-xs font-semibold uppercase tracking-wide mb-1">Doctor Dashboard</p>
            <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>Dr. {user?.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-sm">Doctor ID:</span>
                <code data-testid="doctor-id-value" className="bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded text-sm font-mono font-bold">{user?.id}</code>
              </div>
              {user?.specialization ? <span className="text-xs bg-green-50 text-green-800 border border-green-200 px-2.5 py-0.5 rounded-full font-medium">{user.specialization}</span> : null}
              {user?.license_number ? <span className="text-xs text-stone-400">License: {user.license_number}</span> : null}
            </div>
          </div>
          <div className="hidden md:flex w-16 h-16 bg-green-50 rounded-full items-center justify-center border border-green-200">
            <Stethoscope className="w-8 h-8 text-green-700" />
          </div>
        </div>

        <div data-testid="doctor-stats" className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Patients", value: stats.total_patients, icon: Users },
            { label: "My Prescriptions", value: stats.total_prescriptions, icon: Pill },
            { label: "Today", value: stats.today_prescriptions, icon: Activity }
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</p>
                <Icon className="w-4 h-4 text-green-700" />
              </div>
              <p className="text-2xl font-bold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-stone-200 rounded-lg shadow-sm">
            <div className="p-5 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900 mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Patient Search</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input data-testid="patient-search-input" value={searchQ} onChange={event => { const value = event.target.value; setSearchQ(value); loadPatients(value); }} placeholder="Search by name or email..." className="w-full border border-stone-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {patients.length === 0 ? <p className="text-stone-400 text-sm text-center py-8">No patients found</p> : patients.map(patient => (
                <button key={patient.id} data-testid="patient-list-item" onClick={() => handleSelectPatient(patient)} className={`w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0 ${selectedPatient?.id === patient.id ? "bg-green-50" : ""}`}>
                  <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-stone-500">
                    {patient.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{patient.name}</p>
                    <p className="text-xs text-stone-400">{patient.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <div className="bg-white border border-stone-200 rounded-lg p-12 text-center shadow-sm">
                <Search className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-400">Select a patient to view details and create prescriptions</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div data-testid="selected-patient-card" className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>{selectedPatient.name}</h3>
                      <p className="text-sm text-stone-500">{selectedPatient.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-stone-400">Patient ID:</span>
                        <code className="text-xs bg-stone-100 px-2 py-0.5 rounded font-mono">{selectedPatient.id}</code>
                      </div>
                    </div>
                    <button data-testid="create-prescription-btn" onClick={() => { setShowRxForm(true); setRxSuccess(""); setRxError(""); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all" style={{ background: "#14532D" }}>
                      <Plus className="w-4 h-4" /> Prescribe
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {selectedPatient.blood_type ? <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-stone-500 mb-0.5">Blood Type</p><p className="font-bold text-red-700">{selectedPatient.blood_type}</p></div> : null}
                    {selectedPatient.date_of_birth ? <div className="p-3 bg-stone-50 rounded-lg"><p className="text-xs text-stone-500 mb-0.5">Date of Birth</p><p className="font-medium text-stone-800">{selectedPatient.date_of_birth}</p></div> : null}
                    {selectedPatient.phone ? <div className="p-3 bg-stone-50 rounded-lg"><p className="text-xs text-stone-500 mb-0.5">Phone</p><p className="font-medium text-stone-800">{selectedPatient.phone}</p></div> : null}
                    {(selectedPatient.allergies || []).length > 0 ? <div className="p-3 bg-amber-50 rounded-lg"><p className="text-xs text-stone-500 mb-0.5">Allergies</p><p className="font-medium text-amber-800">{selectedPatient.allergies.join(", ")}</p></div> : null}
                  </div>

                  {(selectedPatient.medical_history || []).length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <p className="text-sm font-semibold text-stone-700 mb-2">Medical History</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.medical_history.map((item, index) => (
                          <span key={`${item.condition}-${index}`} className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-full text-xs text-stone-700">{item.condition}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {rxSuccess ? <div data-testid="rx-success" className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm"><CheckCircle className="w-4 h-4" /> {rxSuccess}</div> : null}
                {rxError ? <div data-testid="rx-error" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="w-4 h-4" /> {rxError}</div> : null}

                {showRxForm ? (
                  <div data-testid="prescription-form" className="bg-white border border-green-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>New Prescription</h3>
                      <button type="button" onClick={() => setShowRxForm(false)} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                    </div>
                    <form onSubmit={handleRxSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Pharmacy *</label>
                        <select data-testid="rx-pharmacy" required value={rxForm.pharmacy_id} onChange={event => setRxForm(current => ({ ...current, pharmacy_id: event.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800">
                          <option value="">Select pharmacy</option>
                          {pharmacies.map(pharmacy => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.pharmacy_name || pharmacy.name}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">Medication *</label>
                          <input data-testid="rx-medication" required value={rxForm.medication_name} onChange={event => setRxForm(current => ({ ...current, medication_name: event.target.value }))} placeholder="e.g. Metformin 500mg" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">Dosage *</label>
                          <input data-testid="rx-dosage" required value={rxForm.dosage} onChange={event => setRxForm(current => ({ ...current, dosage: event.target.value }))} placeholder="e.g. 500mg" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">Frequency *</label>
                          <select data-testid="rx-frequency" required value={rxForm.frequency} onChange={event => setRxForm(current => ({ ...current, frequency: event.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800">
                            <option value="">Select</option>
                            {["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 8 hours", "Every 12 hours", "As needed", "Weekly"].map(item => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">Duration *</label>
                          <input data-testid="rx-duration" required value={rxForm.duration} onChange={event => setRxForm(current => ({ ...current, duration: event.target.value }))} placeholder="e.g. 30 days" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Diagnosis</label>
                        <input data-testid="rx-diagnosis" value={rxForm.diagnosis} onChange={event => setRxForm(current => ({ ...current, diagnosis: event.target.value }))} placeholder="Primary diagnosis" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
                        <textarea data-testid="rx-notes" value={rxForm.notes} onChange={event => setRxForm(current => ({ ...current, notes: event.target.value }))} rows={2} placeholder="Additional notes for pharmacist" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800 resize-none" />
                      </div>

                      <button data-testid="rx-submit-btn" type="submit" disabled={rxLoading} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all" style={{ background: rxLoading ? "#6B7280" : "#14532D" }}>
                        {rxLoading ? "Sending..." : "Send Prescription to Pharmacy"}
                      </button>
                    </form>
                  </div>
                ) : null}

                {(selectedPatient.prescriptions || []).length > 0 ? (
                  <div className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <div className="p-5 border-b border-stone-100">
                      <h3 className="font-semibold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>Prescription History</h3>
                    </div>
                    <div className="divide-y divide-stone-100">
                      {selectedPatient.prescriptions.map(rx => (
                        <div key={rx.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-stone-800">{rx.medication_name}</p>
                            <p className="text-xs text-stone-400">{rx.dosage} · {rx.frequency}</p>
                          </div>
                          <StatusBadge status={rx.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
