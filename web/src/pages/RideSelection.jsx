import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 🔥 Firebase
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const RideSelection = () => {
  const navigate = useNavigate();
  // 🔥 Get User Data to check verification status
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));

  // 🔐 Firebase auth guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (!authUser) {
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 🔒 GATEKEEPER: AADHAR REQUIRED
  // You cannot enter "Get Started" without Aadhar verification
  if (user && !user.isAadharVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-orange-100">
          <div className="text-5xl mb-4">🆔</div>
          <h2 className="text-2xl font-black text-slate-900">Identity Check</h2>
          <p className="text-slate-500 mt-2 mb-6">
            To ensure safety, you must verify your <strong>Aadhar Card</strong>{" "}
            before accessing the platform.
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-200"
          >
            Verify Aadhar in Profile ➔
          </button>
        </div>
      </div>
    );
  }

  // --- ORIGINAL UI (Visible ONLY if Aadhar Verified) ---
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          How are you commuting today?
        </h2>
        <p className="text-slate-500 mb-12 text-lg">
          Choose your role to start saving CO₂.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Give a Ride */}
          <button
            onClick={() => navigate("/ride-giver")}
            className="group bg-white p-10 rounded-3xl shadow-xl text-left"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🚗</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Give a Ride
            </h3>
            <p className="text-slate-500">
              Have empty seats? Share them and earn Green Points.
            </p>
          </button>

          {/* Take a Ride */}
          <button
            onClick={() => navigate("/ride-taker")}
            className="group bg-white p-10 rounded-3xl shadow-xl text-left"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🎒</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Take a Ride
            </h3>
            <p className="text-slate-500">
              Find verified drivers heading your way.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideSelection;
