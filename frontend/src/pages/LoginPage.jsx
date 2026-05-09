import API from "../api";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Pill, Stethoscope, User } from "lucide-react";
import { formatApiError, useAuth } from "../context/AuthContext";

const ROLES = [
  { key: "patient", label: "Patient", icon: User },
  { key: "doctor", label: "Doctor", icon: Stethoscope },
  { key: "pharmacist", label: "Pharmacist", icon: Pill }
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    specialization: "",
    license_number: "",
    pharmacy_name: "",
    date_of_birth: "",
    blood_type: ""
  });

  const bgUrl = "https://images.unsplash.com/photo-1648775507324-b48dd3791fa5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMG1vZGVybiUyMGNsaW5pYyUyMGludGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc3NTkyMTg5M3ww&ixlib=rb-4.1.0&q=85";

  function handleChange(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "login") {
        await login(form.email, form.password);
      } else {
        await register({ ...form, role });
      }

      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#FAF9F6" }}>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={bgUrl} alt="Healthcare" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-green-800" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Hospito</span>
            </div>
            <p className="text-white/80 text-lg max-w-sm mt-2" style={{ fontFamily: "Work Sans, sans-serif" }}>
              Secure healthcare interoperability for patients, doctors, and pharmacists.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {ROLES.map(({ key, label, icon: Icon }) => (
                <div key={key} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <Icon className="w-5 h-5 text-white mx-auto mb-1" />
                  <span className="text-white text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-green-800 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>Hospito</span>
          </div>

          <h1 className="text-3xl font-bold text-stone-900 mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
            {tab === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-stone-500 mb-6 text-sm" style={{ fontFamily: "Work Sans, sans-serif" }}>
            {tab === "login" ? "Sign in to your HealthSync account" : "Join HealthSync today"}
          </p>

          <div className="flex rounded-lg border border-stone-200 p-1 mb-6 bg-stone-50">
            {["login", "register"].map(item => (
              <button
                key={item}
                data-testid={`tab-${item}`}
                type="button"
                onClick={() => {
                  setTab(item);
                  setError("");
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${tab === item ? "bg-white text-green-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
              >
                {item === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {tab === "register" ? (
            <div className="mb-5">
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    data-testid={`role-${key}`}
                    type="button"
                    onClick={() => setRole(key)}
                    className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all ${role === key ? "border-green-700 bg-green-50 text-green-800" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"}`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div data-testid="auth-error" className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" ? (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                <input data-testid="input-name" name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800 transition-colors" />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input data-testid="input-email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
              <div className="relative">
                <input data-testid="input-password" name="password" type={showPassword ? "text" : "password"} required value={form.password} onChange={handleChange} placeholder="••••••••" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800 transition-colors" />
                <button type="button" onClick={() => setShowPassword(current => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === "register" && role === "patient" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Date of Birth</label>
                  <input data-testid="input-dob" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Blood Type</label>
                  <select data-testid="input-blood-type" name="blood_type" value={form.blood_type} onChange={handleChange} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800">
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {tab === "register" && role === "doctor" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Specialization</label>
                  <input data-testid="input-specialization" name="specialization" value={form.specialization} onChange={handleChange} placeholder="e.g. Internal Medicine" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">License Number</label>
                  <input data-testid="input-license" name="license_number" value={form.license_number} onChange={handleChange} placeholder="MD-XXXX-XXXXX" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                </div>
              </>
            ) : null}

            {tab === "register" && role === "pharmacist" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Pharmacy Name</label>
                  <input data-testid="input-pharmacy-name" name="pharmacy_name" value={form.pharmacy_name} onChange={handleChange} placeholder="Your pharmacy name" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">License Number</label>
                  <input data-testid="input-pharmacist-license" name="license_number" value={form.license_number} onChange={handleChange} placeholder="RPH-XXXX-XXXXX" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800" />
                </div>
              </>
            ) : null}

            <button data-testid="auth-submit" type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm" style={{ background: loading ? "#6B7280" : "#14532D" }}>
              {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Demo Accounts</p>
            <div className="space-y-1.5 text-xs text-stone-600" style={{ fontFamily: "Work Sans, sans-serif" }}>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-green-700" />
                <span><span className="font-semibold text-green-800">Patient:</span> patient@demo.com / Patient@2025!</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
                <span><span className="font-semibold text-blue-700">Doctor:</span> doctor@demo.com / Doctor@2025!</span>
              </div>
              <div className="flex items-center gap-2">
                <Pill className="w-3.5 h-3.5 text-purple-700" />
                <span><span className="font-semibold text-purple-700">Pharmacist:</span> pharmacist@demo.com / Pharma@2025!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
