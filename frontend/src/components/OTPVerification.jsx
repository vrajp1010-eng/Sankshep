import { useState, useRef, useEffect, useCallback } from "react";
import { LoaderCircle, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function OTPVerification({ email, purpose, onBack, onSuccess }) {
  const { verifyOtp, resendOtp } = useAuth();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const maskEmail = (e) => {
    const parts = e.split("@");
    if (parts.length !== 2) return "***";
    const local = parts[0];
    const masked = local.length <= 2 ? local[0] + "***" : local[0] + "***" + local[local.length - 1];
    return `${masked}@${parts[1]}`;
  };

  const handleDigitChange = (index, value) => {
    // Only accept digits
    if (value && !/^\d$/.test(value)) return;

    setError("");
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-advance to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (value && newDigits.every((d) => d !== "")) {
      handleSubmit(newDigits.join(""));
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").trim().slice(0, OTP_LENGTH);
    if (!/^\d+$/.test(pasted)) return;
    const newDigits = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
    if (newDigits.every((d) => d !== "")) {
      handleSubmit(newDigits.join(""));
    }
  };

  const handleSubmit = useCallback(
    async (code) => {
      if (!code || code.length !== OTP_LENGTH) {
        setError("Please enter all 6 digits.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        await verifyOtp(email, code, purpose);
        onSuccess?.();
      } catch (err) {
        setError(err.message || "Verification failed.");
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    },
    [email, purpose, verifyOtp, onSuccess]
  );

  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");
    try {
      await resendOtp(email, purpose);
      setResendTimer(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Sankshep.ai" className="h-12 w-auto object-contain" />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
            <ShieldCheck className="h-7 w-7 text-primary-700" strokeWidth={1.75} />
          </div>
        </div>

        <h1 className="text-center font-display text-xl font-bold text-slate-900 mb-1">
          Verify your email
        </h1>
        <p className="text-center text-sm text-slate-500 mb-6">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-slate-700">{maskEmail(email)}</span>
        </p>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2.5 mb-5" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={`otp-digit ${error ? "otp-digit-error" : ""}`}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Verify Button */}
        <button
          type="button"
          onClick={() => handleSubmit(digits.join(""))}
          disabled={loading || digits.some((d) => d === "")}
          className="btn-primary w-full mb-4"
        >
          {loading ? (
            <LoaderCircle className="h-5 w-5 animate-spin" strokeWidth={1.75} />
          ) : (
            "Verify & Continue"
          )}
        </button>

        {/* Resend */}
        <div className="text-center mb-4">
          <p className="text-sm text-slate-500">
            Didn't receive a code?{" "}
            {resendTimer > 0 ? (
              <span className="font-medium text-slate-400">
                Resend in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 disabled:opacity-50"
              >
                {resendLoading ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                Resend code
              </button>
            )}
          </p>
        </div>

        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="mx-auto flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Back to {purpose === "signup" ? "sign up" : "login"}
        </button>
      </div>
    </div>
  );
}
