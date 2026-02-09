import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [selectedUser, setSelectedUser] = useState(null); // For ID verification
  const [selectedSOS, setSelectedSOS] = useState(null);   // For Emergency investigation

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRides: 0,
    totalCo2Saved: "0.0",
  });
  const [chartData, setChartData] = useState([]);

  // --- LOGOUT ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      toast.success("Admin logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  // --- DATA LISTENERS ---
  useEffect(() => {
    // 1. SOS FEED LISTENER
    const qAlerts = query(
      collection(db, "sos_alerts"),
      orderBy("timestamp", "desc")
    );
    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      setAlerts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 2. PENDING VERIFICATIONS LISTENER
    const qPending = query(
      collection(db, "users"),
      where("verificationStatus", "==", "pending")
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // 3. RIDE STATS & ANALYTICS LISTENER
    const unsubRides = onSnapshot(collection(db, "rides"), (snapshot) => {
      let totalKm = 0;
      let activeCount = 0;
      const monthlyMap = {};

      snapshot.docs.forEach((doc) => {
        const ride = doc.data();
        const distance = parseFloat(ride.distance || 0);
        totalKm += distance;

        if (["requested", "accepted", "ongoing"].includes(ride.status))
          activeCount++;

        if (ride.createdAt) {
          const date = ride.createdAt.toDate();
          const month = date.toLocaleString("default", { month: "short" });
          if (!monthlyMap[month]) monthlyMap[month] = 0;
          monthlyMap[month] += distance * 0.12;
        }
      });

      setStats((prev) => ({
        ...prev,
        activeRides: activeCount,
        totalCo2Saved: (totalKm * 0.12).toFixed(1),
      }));

      setChartData(
        Object.keys(monthlyMap).map((m) => ({
          name: m,
          saved: parseFloat(monthlyMap[m].toFixed(1)),
        }))
      );
    });

    // 4. TOTAL USERS LISTENER
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
    });

    return () => {
      unsubAlerts();
      unsubPending();
      unsubRides();
      unsubUsers();
    };
  }, []);

  // --- ACTIONS ---

  const resolveAlert = async (id, actionType) => {
    try {
      const alertRef = doc(db, "sos_alerts", id);
      const statusUpdate = actionType === "POLICE" ? "POLICE_NOTIFIED" : "RESOLVED";
      
      await updateDoc(alertRef, {
        status: statusUpdate,
        dispatchedAt: serverTimestamp(),
      });

      toast.success(
        actionType === "POLICE" 
          ? "All ride & identity details forwarded to Police Station" 
          : "Campus Security Dispatched Successfully"
      );
      setSelectedSOS(null);
    } catch (error) {
      toast.error("Failed to update SOS status");
    }
  };

  const handleApproveUser = async (uid, name) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        isVerified: true,
        verificationStatus: "verified",
      });
      toast.success(`${name} Approved ✅`);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const handleRejectUser = async (uid, name) => {
    if (!window.confirm(`Are you sure you want to reject ${name}?`)) return;
    try {
      await updateDoc(doc(db, "users", uid), {
        verificationStatus: "rejected",
      });
      toast.success(`${name} Rejected ❌`);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Rejection failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans antialiased text-slate-900 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">
              Admin Dashboard
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Real-time Security & Identity Management
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">System: Secure</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-95"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard title="Pending IDs" value={pendingUsers.length} color={pendingUsers.length > 0 ? "text-amber-500" : "text-slate-400"} />
          <StatCard title="Active SOS" value={alerts.filter((a) => a.status === "ACTIVE").length} color="text-red-600" />
          <StatCard title="Active Rides" value={stats.activeRides} color="text-emerald-600" />
          <StatCard title="CO₂ Saved" value={`${stats.totalCo2Saved}kg`} color="text-blue-600" />
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: ACTIONS & FEEDS */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* SOS FEED */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                🚨 Security Feed
              </h3>
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-xs font-bold">
                    No Active Emergencies
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-5 rounded-3xl border-l-8 shadow-sm transition-all bg-white ${
                        alert.status === "ACTIVE" ? "border-red-500" : "border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          alert.status === "ACTIVE" ? "bg-red-600 text-white animate-pulse" : "bg-slate-100 text-slate-500"
                        }`}>
                          {alert.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {alert.timestamp?.toDate().toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900">{alert.userName}</h4>
                      <p className="text-[10px] text-slate-500 mb-4 font-mono">Location Attached ✓</p>
                      
                      <button 
                        onClick={() => setSelectedSOS(alert)}
                        className="w-full py-2.5 bg-red-50 text-red-600 text-[10px] font-black rounded-xl hover:bg-red-600 hover:text-white transition uppercase tracking-widest"
                      >
                        Investigate Context 🔍
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* VERIFICATION QUEUE */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                🆔 Verification Queue <span className="text-amber-500">({pendingUsers.length})</span>
              </h3>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {pendingUsers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-xs font-bold">
                    All Users Verified
                  </div>
                ) : (
                  pendingUsers.map((user) => (
                    <div key={user.id} className="bg-white p-5 rounded-3xl shadow-sm border border-amber-100 relative overflow-hidden">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold">
                          {user.name?.[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="w-full mt-2 py-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl hover:bg-slate-800 transition shadow-md"
                      >
                        REVIEW DETAILS 🔍
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ANALYTICS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Sustainability Analytics</h3>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} dy={10} />
                      <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="saved" stroke="#10b981" fillOpacity={1} fill="url(#colorSaved)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 uppercase tracking-widest font-bold animate-pulse">Waiting for ride data...</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">System Log</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Admin actions are permanent. When investigating SOS, review ride context carefully. Escalate to Police only in confirmed high-threat situations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL: SOS EMERGENCY INVESTIGATION --- */}
      {selectedSOS && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-red-600 italic uppercase tracking-tighter">Emergency Context</h2>
              <button onClick={() => setSelectedSOS(null)} className="text-slate-400 text-xl hover:text-slate-600">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* User Data */}
              <div className="bg-slate-50 p-5 rounded-2xl">
                <h3 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Distress User</h3>
                <DetailRow label="Name" value={selectedSOS.userName} />
                <DetailRow label="Email" value={selectedSOS.email} />
                <DetailRow label="Location" value={`${selectedSOS.location?.lat.toFixed(4)}, ${selectedSOS.location?.lng.toFixed(4)}`} />
                <a 
                  href={`https://www.google.com/maps?q=${selectedSOS.location?.lat},${selectedSOS.location?.lng}`}
                  target="_blank" rel="noreferrer"
                  className="mt-4 block w-full py-2 bg-white border border-red-200 text-red-600 text-center rounded-lg text-[10px] font-bold hover:bg-red-50 transition"
                >
                  VIEW ON GOOGLE MAPS
                </a>
              </div>

              {/* Ride/Vehicle Context */}
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                <h3 className="text-[10px] font-black text-blue-600 uppercase mb-3 tracking-widest">Ride/Vehicle Details</h3>
                {selectedSOS.rideContext ? (
                  <>
                    <DetailRow label="Vehicle" value={selectedSOS.rideContext.vehicleName} />
                    <DetailRow label="Plate No" value={selectedSOS.rideContext.vehicleNumber} />
                    <DetailRow label="Offered By" value={selectedSOS.rideContext.driverName || "N/A"} />
                    <div className="mt-3 pt-2 border-t border-blue-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Other Passengers</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSOS.rideContext.passengers?.length > 0 ? (
                          selectedSOS.rideContext.passengers.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-white text-[9px] rounded-md border border-blue-100 font-bold text-blue-600">
                              {p.name}
                            </span>
                          ))
                        ) : <span className="text-[10px] text-slate-400 italic">Solo Ride</span>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-500 italic">No Active Ride Found</p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase">User triggered SOS manually outside of a ride.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => resolveAlert(selectedSOS.id, "DISPATCH")}
                className="py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition active:scale-95 text-xs uppercase tracking-widest"
              >
                Dispatch Security
              </button>
              <button 
                onClick={() => resolveAlert(selectedSOS.id, "POLICE")}
                className="py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-200 active:scale-95 text-xs uppercase tracking-widest"
              >
                🚨 Police Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ID VERIFICATION REVIEW --- */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">✕</button>
            <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tighter italic">Verification Review</h2>
            
            <div className="space-y-4 mb-8">
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Submitted ID Card</p>
                <div className="rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-inner flex justify-center">
                  {selectedUser.idCardImage ? (
                    <img src={selectedUser.idCardImage} alt="ID" className="w-full h-auto max-h-[300px] object-contain" />
                  ) : <div className="p-8 text-center text-slate-400 text-xs font-bold">🚫 No Image Data Found</div>}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">User Claimed</p>
                <DetailRow label="Name" value={selectedUser.name} />
                <DetailRow label="Email" value={selectedUser.email} />
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">AI Analysis</p>
                <DetailRow label="Detected Name" value={selectedUser.studentName || "Not Detected"} />
                <DetailRow label="Institution" value={selectedUser.aiInstitution || "Not Detected"} />
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-emerald-100">
                  <span className="text-xs font-bold text-slate-400 uppercase">Match Status</span>
                  <span className={`text-xs font-bold ${selectedUser.verificationStatus === "verified" ? "text-emerald-600" : "text-amber-600"}`}>
                    {selectedUser.verificationReason || "Pending Review"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleApproveUser(selectedUser.id, selectedUser.name)} className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-lg text-sm">✅ APPROVE</button>
              <button onClick={() => handleRejectUser(selectedUser.id, selectedUser.name)} className="py-3 bg-white border-2 border-slate-100 text-slate-500 hover:text-red-500 font-bold rounded-xl transition text-sm">❌ REJECT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const StatCard = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <h3 className={`text-3xl font-black mt-1 ${color}`}>{value}</h3>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-slate-200/50 last:border-0 pb-2 mb-2 last:mb-0 last:pb-0">
    <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
    <span className="text-xs font-bold text-slate-900 text-right max-w-[60%] truncate">{value}</span>
  </div>
);

export default AdminDashboard;