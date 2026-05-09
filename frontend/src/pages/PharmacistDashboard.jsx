import API from "../api";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Activity, Bell, CheckCircle, LogOut, Pill, Wifi, WifiOff, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";


const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

function StatusBadge({ sstatus }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    fulfilled: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || "bg-stone-100 text-stone-600"}`}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</span>;
}

export default function PharmacistDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total_prescriptions: 0, pending: 0, fulfilled: 0, unread_notifications: 0 });
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [rxResponse, statsResponse] = await Promise.all([
        axios.get(`${API}/pharmacies/${user.id}/prescriptions`),
        axios.get(`${API}/stats/pharmacist`)
      ]);
      setPrescriptions(rxResponse.data.prescriptions || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return undefined;

    let reconnectTimer;

    function connect() {
      try {
        const ws = new WebSocket(`${WS_URL}/ws/pharmacy/${user.id}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          ws.send("ping");
        };

        ws.onmessage = event => {
          if (event.data === "pong") return;

          try {
            const message = JSON.parse(event.data);
            if (message.type === "new_prescription") {
              setNotifications(current => [{ ...message, id: `${message.id || Date.now()}-notification`, read: false }, ...current.slice(0, 19)]);
              setStats(current => ({
                ...current,
                unread_notifications: current.unread_notifications + 1,
                pending: current.pending + 1,
                total_prescriptions: current.total_prescriptions + 1
              }));
              loadData();
            }
          } catch {}
        };

        ws.onerror = () => setWsConnected(false);
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [loadData, user?.id]);

  async function updateRxStatus(rxId, status) {
    try {
      await axios.put(`${API}/pharmacies/${user.id}/prescriptions/${rxId}/status`, { status });
      setPrescriptions(current => current.map(item => (item.id === rxId ? { ...item, status } : item)));
      setStats(current => ({
        ...current,
        pending: Math.max(0, current.pending - 1),
        fulfilled: status === "fulfilled" ? current.fulfilled + 1 : current.fulfilled
      }));
    } catch (error) {
      console.error(error);
    }
  }

  function markNotifRead(notificationId) {
    setNotifications(current => current.map(item => (item.id === notificationId ? { ...item, read: true } : item)));
    setStats(current => ({ ...current, unread_notifications: Math.max(0, current.unread_notifications - 1) }));
  }

  async function handleLogout() {
    wsRef.current?.close();
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
            <span className="text-lg font-bold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>HealthSync</span>
          </div>
          <div className="flex items-center gap-4">
            <div data-testid="ws-status" className={`flex items-center gap-1.5 text-xs font-medium ${wsConnected ? "text-green-700" : "text-stone-400"}`}>
              {wsConnected ? <><Wifi className="w-3.5 h-3.5" /> Live</> : <><WifiOff className="w-3.5 h-3.5" /> Reconnecting...</>}
            </div>
            <button data-testid="logout-btn" onClick={handleLogout} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div data-testid="pharmacy-id-banner" className="bg-white border border-stone-200 rounded-xl p-6 mb-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-stone-400 text-xs font-semibold uppercase tracking-wide mb-1">Pharmacist Dashboard</p>
            <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: "Manrope, sans-serif" }}>{user?.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-sm">Pharmacy ID:</span>
                <code data-testid="pharmacy-id-value" className="bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded text-sm font-mono font-bold">{user?.id}</code>
              </div>
              {user?.pharmacy_name ? <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-medium">{user.pharmacy_name}</span> : null}
            </div>
          </div>
          <div className="hidden md:flex w-16 h-16 bg-purple-50 rounded-full items-center justify-center border border-purple-200">
            <Pill className="w-8 h-8 text-purple-700" />
          </div>
        </div>

        <div data-testid="pharmacist-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Rx", value: stats.total_prescriptions, color: "text-stone-900" },
            { label: "Pending", value: stats.pending, color: "text-yellow-700" },
            { label: "Fulfilled", value: stats.fulfilled, color: "text-green-700" },
            { label: "Unread Alerts", value: stats.unread_notifications, color: "text-red-600" }
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm text-center">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`} style={{ fontFamily: "Manrope, sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white border border-stone-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-semibold text-stone-900 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                <Bell className="w-4 h-4 text-green-800" /> Live Alerts
              </h2>
              {stats.unread_notifications > 0 ? <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.unread_notifications}</span> : null}
            </div>
            <div data-testid="notification-feed" className="max-h-[500px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-stone-400 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-stone-200" />
                  <p>Waiting for prescriptions...</p>
                </div>
              ) : notifications.map(item => (
                <div key={item.id} data-testid="notification-item" onClick={() => markNotifRead(item.id)} className={`p-4 border-b border-stone-100 cursor-pointer hover:bg-stone-50 transition-colors ${!item.read ? "bg-green-50 border-l-4 border-l-green-500" : ""}`}>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-stone-800">{item.medication_name || item.message}</p>
                      <p className="text-xs text-stone-500 mt-0.5">Patient: {item.patient_name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Dr. {item.prescriber_name}</p>
                      <p className="text-xs text-stone-300 mt-1">{item.created_at ? new Date(item.created_at).toLocaleTimeString() : ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-white border border-stone-200 rounded-lg shadow-sm">
            <div className="p-5 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                <Pill className="w-4 h-4 text-green-800" /> Prescription Queue
                <span className="ml-auto text-xs text-stone-400 font-normal">{prescriptions.length} total</span>
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone-400 text-sm">Loading prescriptions...</div>
            ) : prescriptions.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Pill className="w-12 h-12 mx-auto mb-3 text-stone-200" />
                <p>No prescriptions in queue</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {prescriptions.map(rx => (
                  <div key={rx.id} data-testid="prescription-queue-item" className="p-5 flex items-start gap-4 hover:bg-stone-50 transition-colors">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${rx.status === "pending" ? "bg-yellow-400" : rx.status === "fulfilled" ? "bg-green-400" : "bg-red-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-stone-900">{rx.medication_name}</p>
                          <p className="text-sm text-stone-500">{rx.dosage} · {rx.frequency} · {rx.duration}</p>
                          {rx.diagnosis ? <p className="text-xs text-stone-400 mt-0.5">Dx: {rx.diagnosis}</p> : null}
                          {rx.notes ? <p className="text-xs text-stone-400 mt-0.5">Notes: {rx.notes}</p> : null}
                        </div>
                        <StatusBadge status={rx.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                        <span>Patient: <span className="font-medium text-stone-600">{rx.patient_name}</span></span>
                        <span>·</span>
                        <span>Dr. {rx.prescriber_name}</span>
                        <span>·</span>
                        <span>{rx.created_at ? new Date(rx.created_at).toLocaleString() : ""}</span>
                      </div>
                    </div>
                    {rx.status === "pending" ? (
                      <div className="flex gap-2 flex-shrink-0">
                        <button data-testid={`fulfill-btn-${rx.id}`} onClick={() => updateRxStatus(rx.id, "fulfilled")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all" style={{ background: "#14532D" }}>
                          <CheckCircle className="w-3.5 h-3.5" /> Fulfill
                        </button>
                        <button data-testid={`reject-btn-${rx.id}`} onClick={() => updateRxStatus(rx.id, "rejected")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
