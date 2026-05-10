import API from "../api";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Activity,
  Bell,
  CheckCircle,
  LogOut,
  Pill,
  Wifi,
  WifiOff,
  XCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const WS_URL = "wss://hospito-yz1a.onrender.com";

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

export default function PharmacistDashboard() {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    total_prescriptions: 0,
    pending: 0,
    fulfilled: 0,
    rejected: 0,
    unread_notifications: 0
  });

  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [rxRes, statsRes] = await Promise.all([
        axios.get(`${API}/pharmacies/${user.id}/prescriptions`),
        axios.get(`${API}/stats/pharmacist`)
      ]);

      setPrescriptions(rxRes.data.prescriptions || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return;

    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/ws/pharmacy/${user.id}`);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connect, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "new_prescription") {
            setNotifications((prev) => [
              { ...msg, id: Date.now(), read: false },
              ...prev
            ]);

            setStats((cur) => ({
              ...cur,
              unread_notifications: cur.unread_notifications + 1,
              pending: cur.pending + 1,
              total_prescriptions: cur.total_prescriptions + 1
            }));

            loadData();
          }
        } catch {}
      };
    };

    connect();

    return () => wsRef.current?.close();
  }, [user?.id, loadData]);

  async function updateRxStatus(rxId, status) {
    try {
      await axios.put(
        `${API}/pharmacies/${user.id}/prescriptions/${rxId}/status`,
        { status }
      );

      setPrescriptions((cur) =>
        cur.map((r) => (r.id === rxId ? { ...r, status } : r))
      );

      setStats((cur) => ({
        ...cur,
        pending: Math.max(0, cur.pending - 1),
        fulfilled:
          status === "fulfilled" ? cur.fulfilled + 1 : cur.fulfilled,
        rejected: status === "rejected" ? cur.rejected + 1 : cur.rejected
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogout() {
    wsRef.current?.close();
    await logout();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between">
        <h1>Pharmacist Dashboard</h1>

        <div className="flex gap-4 items-center">
          {wsConnected ? <Wifi /> : <WifiOff />}
          <button onClick={handleLogout}>
            <LogOut /> Logout
          </button>
        </div>
      </header>

      <main className="mt-6 grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <h2>Notifications</h2>

          {notifications.map((n) => (
            <div key={n.id} className="p-2 border">
              {n.medication_name}
            </div>
          ))}
        </div>

        <div className="col-span-2">
          <h2>Prescriptions</h2>

          {prescriptions.map((rx) => (
            <div key={rx.id} className="p-3 border flex justify-between">
              <div>
                <p>{rx.medication_name}</p>
                <p>{rx.dosage}</p>
              </div>

              <StatusBadge status={rx.status} />

              {rx.status === "pending" && (
                <div>
                  <button onClick={() => updateRxStatus(rx.id, "fulfilled")}>
                    <CheckCircle />
                  </button>
                  <button onClick={() => updateRxStatus(rx.id, "rejected")}>
                    <XCircle />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
