import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

import { verifyIDCard } from "../services/gemini";

const Auth = ({ setUser }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [loginRole, setLoginRole] = useState("user");

  // 🔥 NEW: State to hold the user on the "Check Email" screen
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const MASTER_ADMIN_EMAIL = "admin@email.com";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });

  // 🔥 NEW: Auto-Login Polling Logic
  useEffect(() => {
    let interval;
    if (awaitingVerification && auth.currentUser) {
      interval = setInterval(async () => {
        try {
          await auth.currentUser.reload(); // Refresh Auth state from Firebase server

          if (auth.currentUser.emailVerified) {
            clearInterval(interval);

            // User Verified! Fetch data and log them in.
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              localStorage.setItem("user", JSON.stringify(userData));
              if (setUser) setUser(userData);

              toast.success("🎉 Email Verified! Logging you in...");
              navigate("/");
            }
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [awaitingVerification, navigate, setUser]);

  // LOGIC 3: Auto-fill / Clear Credentials based on role and mode
  useEffect(() => {
    setFormData({
      name: "",
      email: "",
      gender: "",
      password: "",
      confirmPassword: "",
    });
  }, [isLogin, loginRole]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // LOGIC 1: Fuzzy Name Matching
  const isNameMatch = (inputName, extractedName) => {
    if (!extractedName) return false;
    const cleanInput = inputName.toLowerCase().replace(/[^a-z]/g, "");
    const cleanExtracted = extractedName.toLowerCase().replace(/[^a-z]/g, "");
    return (
      cleanExtracted.includes(cleanInput) || cleanInput.includes(cleanExtracted)
    );
  };

  // LOGIC 2: Password Strength Calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-200" };

    let score = 0;
    if (pass.length > 5) score++; // At least 6 chars
    if (pass.length > 7 && /[0-9]/.test(pass)) score++; // 8+ chars & number
    if (/[^A-Za-z0-9]/.test(pass)) score++; // Special char

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-red-500" };
      case 2:
        return { score: 2, label: "Medium", color: "bg-yellow-500" };
      case 3:
        return { score: 3, label: "Strong", color: "bg-emerald-500" };
      default:
        return { score: 0, label: "Too Short", color: "bg-slate-200" };
    }
  };

  const passStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { name, email, gender, password, confirmPassword } = formData;

    try {
      // ===========================
      // LOGIN LOGIC
      // ===========================
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userAuth = userCredential.user;

        // 🔥 Change: Strict Email Verification Check
        if (!userAuth.emailVerified && loginRole !== "admin") {
          await auth.signOut();
          throw new Error(
            "Please verify your email address before logging in.",
          );
        }

        const userDocRef = doc(db, "users", userAuth.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          // RBAC CHECK: STRICT ADMIN Check
          if (loginRole === "admin") {
            if (
              userData.role !== "admin" ||
              userAuth.email !== MASTER_ADMIN_EMAIL
            ) {
              throw new Error(
                "Access Denied: You do not have Admin privileges.",
              );
            }
          }

          localStorage.setItem("user", JSON.stringify(userData));
          if (setUser) setUser(userData); // Sync global App state

          toast.success(`Logged in as ${loginRole}`);

          if (userData.role === "admin" && loginRole === "admin") {
            navigate("/admin");
          } else {
            navigate("/");
          }
        } else {
          toast.error("User data profile not found in database.");
        }
      }

      // ===========================
      // SIGNUP LOGIC (Serverless)
      // ===========================
      else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (passStrength.score < 2) {
          throw new Error("Password is too weak. Please make it stronger.");
        }
        if (!idFile) {
          throw new Error("Please upload your Student ID Card.");
        }

        // 1. Verify ID (Direct Frontend Call)
        toast.loading("Scanning ID Card & Checking Authenticity...", {
          id: "verifyToast",
        });

        const result = await verifyIDCard(idFile);

        toast.dismiss("verifyToast");

        // 🔥 Authenticity Check
        if (result.isValid && result.authenticity_score < 6) {
          throw new Error(
            "ID check failed: Image looks like a photocopy or screen. Please upload a clear photo of the physical card.",
          );
        }

        // 2. LOGIC: Determine Status
        let isVerified = false;
        let verificationStatus = "pending";
        let institutionName = "";
        let studentName = name;
        let verificationReason = "Manual Review Required";

        if (result.isValid && isNameMatch(name, result.name)) {
          isVerified = true;
          verificationStatus = "verified";
          institutionName = result.institution;
          studentName = result.name;
          verificationReason = "Auto-verified by AI";
          toast.success(
            "✅ ID Verified! Please check email to activate account.",
          );
        } else if (result.isValid && !isNameMatch(name, result.name)) {
          isVerified = false;
          verificationStatus = "pending";
          verificationReason = `Name Mismatch: ID says '${result.name}'`;
          toast("⚠️ Name didn't match. Sent to Admin for review.", {
            icon: "⏳",
            duration: 5000,
          });
        } else {
          isVerified = false;
          verificationStatus = "pending";
          verificationReason = result.reason || "AI could not read ID";
          toast("⚠️ ID Scan unclear. Sent to Admin for review.", {
            icon: "⏳",
            duration: 5000,
          });
        }

        // 3. Create Firebase Account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userAuth = userCredential.user;
        const emailDomain = email.split("@")[1];

        // 🔥 Send Verification Email
        await sendEmailVerification(userAuth);

        // Convert file to base64 if pending
        let idImageBase64 = null;
        if (verificationStatus === "pending") {
          idImageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(idFile);
          });
        }

        const newUserProfile = {
          uid: userAuth.uid,
          name,
          email,
          gender,
          organization: institutionName || emailDomain,

          // ID Verification Stats
          isVerified: isVerified,
          verificationStatus: verificationStatus,
          verificationReason: verificationReason,
          studentName: studentName,
          idCardImage: idImageBase64 || null,
          role: "user",

          // 🔥 NEW: Flags initialized to false
          isAadharVerified: false,
          aadharNumber: null,
          isMedicalCompleted: false,
          medical: null,
          isDriver: false,
          licenseVerified: false,
          rcVerified: false,
          carDetails: null,

          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, "users", userAuth.uid), newUserProfile);

        if (verificationStatus === "pending") {
          await setDoc(doc(db, "admin_requests", userAuth.uid), {
            userId: userAuth.uid,
            status: "pending",
            reason: verificationReason,
            name: name,
            email: email,
            imageBase64: idImageBase64,
            timestamp: serverTimestamp(),
          });
        }

        // 🔥 ENABLE WAITING MODE
        setAwaitingVerification(true);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Authentication failed");
      toast.dismiss("verifyToast");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 RENDER WAITING SCREEN IF SIGNED UP
  if (awaitingVerification) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md animate-in fade-in zoom-in duration-300">
          <div className="text-6xl mb-4">✉️</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Check your Inbox
          </h2>
          <p className="text-slate-500 mb-6">
            We sent a verification link to <strong>{formData.email}</strong>.
            <br />
            Click it to verify.
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 py-3 rounded-xl">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></div>
            Waiting for you to click...
          </div>
          <p className="text-xs text-slate-400 mt-4">
            The app will auto-login once verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            {isLogin
              ? "Select login type and enter credentials"
              : "Institutional Verification Required"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ROLE SELECTION DROPDOWN (Login Only) */}
          {isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
                Login As
              </label>
              <select
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all text-slate-700 font-medium"
              >
                <option value="user">User / Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
                  Full Name (As on ID)
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
                  Gender
                </label>
                <select
                  name="gender"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all text-slate-700"
                  onChange={handleChange}
                  value={formData.gender}
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
              Institution Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="name@university.edu"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
              onChange={handleChange}
              value={formData.email}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300 pr-12"
                onChange={handleChange}
                value={formData.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isLogin && formData.password && (
              <div className="mt-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex gap-1 h-1 mb-1">
                  <div
                    className={`flex-1 rounded-full transition-colors duration-300 ${passStrength.score >= 1 ? passStrength.color : "bg-slate-200"}`}
                  ></div>
                  <div
                    className={`flex-1 rounded-full transition-colors duration-300 ${passStrength.score >= 2 ? passStrength.color : "bg-slate-200"}`}
                  ></div>
                  <div
                    className={`flex-1 rounded-full transition-colors duration-300 ${passStrength.score >= 3 ? passStrength.color : "bg-slate-200"}`}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span
                    className={
                      passStrength.score > 0
                        ? "text-slate-600"
                        : "text-slate-400"
                    }
                  >
                    Strength
                  </span>
                  <span
                    className={
                      passStrength.score >= 2
                        ? "text-emerald-500"
                        : "text-red-500"
                    }
                  >
                    {passStrength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300 pr-12"
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-bold text-slate-900 mb-2 ml-1">
                  Upload Student/Employee ID{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setIdFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-dashed border-slate-300 rounded-xl p-2"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                  If AI cannot verify this ID automatically, it will be sent to
                  Admin for approval.
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg mt-4 ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-200"
            }`}
          >
            {loading
              ? "Processing..."
              : isLogin
                ? "Login"
                : "Verify & Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-600 font-bold hover:underline transition-all"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
