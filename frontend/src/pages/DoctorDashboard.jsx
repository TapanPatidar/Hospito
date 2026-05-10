import API from "../api";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  LogOut,
  Pill,
  Plus,
  Search,
  Stethoscope,
  Users,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function StatusBadge({ status }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    fulfilled: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        colors[status] || "bg-stone-100 text-stone-600"
      }`}
    >
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
    </span>
  );
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    total_patients: 0,
    total_prescriptions: 0,
    today_prescriptions: 0
  });

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
      const response = await axios.get(
        `${API}/patients?q=${encodeURIComponent(query)}`
      );
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    axios
      .get(`${API}/stats/doctor`)
      .then((res) => setStats(res.data))
      .catch(console.error);

    axios
      .get(`${API}/pharmacies`)
      .then((res) => setPharmacies(res.data.pharmacies || []))
      .catch(console.error);

    loadPatients("");
  }, [loadPatients]);

  async function handleSelectPatient(patient) {
    try {
      const res = await axios.get(`${API}/patients/${patient.id}`);
      setSelectedPatient(res.data.patient);
    } catch {
      setSelectedPatient(patient);
    }

    setShowRxForm(false);
    setRxSuccess("");
    setRxError("");
  }

  async function handleRxSubmit(e) {
    e.preventDefault();
    setRxLoading(true);
    setRxError("");
    setRxSuccess("");

    try {
      await axios.post(
        `${API}/patients/${selectedPatient.id}/prescriptions`,
        {
          ...rxForm,
          prescriber_id: user.id
        }
      );

      setRxSuccess("Prescription sent successfully!");
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

      setStats((cur) => ({
        ...cur,
        total_prescriptions: cur.total_prescriptions + 1,
        today_prescriptions: cur.today_prescriptions + 1
      }));

      handleSelectPatient(selectedPatient);
    } catch (err) {
      setRxError(err.response?.data?.detail || err.message);
    } finally {
      setRxLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAF9F6" }}>
      <header className="bg-white border-b px-6 py-4 flex justify-between">
        <h1 className="font-bold">Doctor Dashboard</h1>
        <button onClick={handleLogout}>
          <LogOut /> Logout
        </button>
      </header>

      <main className="p-6 grid grid-cols-3 gap-6">
        {/* Patients */}
        <div>
          <input
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              loadPatients(e.target.value);
            }}
            placeholder="Search patients..."
          />

          {patients.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelectPatient(p)}
              className="p-2 border cursor-pointer"
            >
              {p.name}
            </div>
          ))}
        </div>

        {/* Patient Details */}
        <div className="col-span-2">
          {!selectedPatient ? (
            <p>Select patient</p>
          ) : (
            <>
              <h2>{selectedPatient.name}</h2>

              <button onClick={() => setShowRxForm(true)}>
                <Plus /> Prescribe
              </button>

              {showRxForm && (
                <form onSubmit={handleRxSubmit}>
                  <input
                    placeholder="Medication"
                    value={rxForm.medication_name}
                    onChange={(e) =>
                      setRxForm({
                        ...rxForm,
                        medication_name: e.target.value
                      })
                    }
                  />

                  <button disabled={rxLoading}>
                    {rxLoading ? "Sending..." : "Send"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
