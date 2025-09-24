import { useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import emailjs from "emailjs-com";
import { useNavigate } from "react-router-dom";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Shield, CheckCircle, ArrowLeft, Lock } from "lucide-react";

export default function Verify() {
  const [code, setCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("code"); // "code" → "password"
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        if (!data.verificationCode || !data.codeExpiry) {
          setMessage("❌ No verification request found. Please register again.");
          setLoading(false);
          return;
        }

        if (Date.now() > data.codeExpiry) {
          setMessage("❌ Code expired. Please request a new code.");
          setLoading(false);
          return;
        }

        if (data.verificationCode === code) {
          setStep("password");
          setMessage("✅ Code verified! Please set your permanent password.");
        } else {
          setMessage("❌ Invalid code. Please try again.");
        }
      } else {
        setMessage("❌ User not found.");
      }
    } catch (err) {
      setMessage("❌ " + err.message);
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate new passwords match
    if (newPassword !== confirmPassword) {
      setMessage("❌ New passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("❌ New password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      const ref = doc(db, "users", user.uid);
      const userDoc = await getDoc(ref);
      const userData = userDoc.data();

      // Reauthenticate with their initial password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update to new permanent password
      await updatePassword(user, newPassword);

      // Update Firestore - mark as active and remove temp flags
      await updateDoc(ref, {
        verificationCode: null,
        codeExpiry: null,
        active: true,
        requiresPasswordReset: false,
        initialPassword: null, // Remove initial password
        passwordUpdatedAt: new Date(),
      });

      setMessage("✅ Permanent password set! Account activated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        setMessage("❌ Current password is incorrect. Please enter the password you used during registration.");
      } else {
        setMessage("❌ " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const ref = doc(db, "users", auth.currentUser.uid);

      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setMessage("❌ User record not found.");
        setResending(false);
        return;
      }

      const data = snap.data();

      await updateDoc(ref, {
        verificationCode: newCode,
        codeExpiry: Date.now() + 15 * 60 * 1000,
      });

      await emailjs.send(
        "service_izoz56r",
        "template_k8e3j6m", 
        {
          to_email: data.email,
          full_name: data.fullName,
          verification_code: newCode,
        },
        "PxdAUIRpTbBDMGLvA"
      );

      setMessage("✅ New verification code sent!");
    } catch (err) {
      setMessage("❌ " + err.message);
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
            {step === "code" ? "Verify Your Account" : "Set Permanent Password"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === "code" 
              ? "Enter the 6-digit code sent to your email" 
              : "Create a new permanent password for your account"}
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          {message && (
            <div className={`p-3 rounded-md mb-4 ${
              message.includes('❌') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          {step === "code" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                maxLength="6"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {resending ? "Resending..." : "Resend Code"}
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password (from registration)
                </label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Permanent Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength="6"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength="6"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Setting Password..." : "Set Permanent Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}