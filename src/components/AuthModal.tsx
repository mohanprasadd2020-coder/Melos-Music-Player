import { useState } from "react";
import { X, Mail, Lock, Loader2, Music2, ArrowLeft } from "lucide-react";

interface AuthModalProps {
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string) => Promise<{ error: any }>;
  onForgotPassword: (email: string) => Promise<{ error: any }>;
  onClose: () => void;
}

export default function AuthModal({ onSignIn, onSignUp, onForgotPassword, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "forgot") {
      if (!email.trim()) return;
      setLoading(true);
      setError("");
      setSuccess("");

      const result = await onForgotPassword(email);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess("Password reset link sent! Check your email.");
        setTimeout(() => {
          setEmail("");
          setMode("signin");
          setSuccess("");
        }, 3000);
      }
    } else {
      if (!email.trim() || !password.trim()) return;
      setLoading(true);
      setError("");
      setSuccess("");

      const result = mode === "signin"
        ? await onSignIn(email, password)
        : await onSignUp(email, password);

      setLoading(false);
      if (result.error) {
        setError(result.error.message);
      } else if (mode === "signup") {
        setSuccess("Account created! Check your email to verify, or sign in now.");
        setMode("signin");
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {mode === "forgot" && (
              <button
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setSuccess("");
                  setEmail("");
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <Music2 size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {mode === "signin"
                ? "Welcome back"
                : mode === "signup"
                ? "Create account"
                : "Reset password"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-xs text-primary bg-primary/10 p-2 rounded-lg">{success}</p>
          )}

          {mode === "forgot" ? (
            <>
              <p className="text-xs text-muted-foreground">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 pl-9 pr-3 bg-secondary text-foreground rounded-lg text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send reset link
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 pl-9 pr-3 bg-secondary text-foreground rounded-lg text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-3 bg-secondary text-foreground rounded-lg text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === "signin" ? "Sign In" : "Sign Up"}
              </button>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError("");
                    setPassword("");
                  }}
                  className="w-full text-center text-xs text-primary font-medium hover:underline"
                >
                  Forgot password?
                </button>
              )}

              <p className="text-center text-xs text-muted-foreground">
                {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError("");
                    setPassword("");
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  {mode === "signin" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
