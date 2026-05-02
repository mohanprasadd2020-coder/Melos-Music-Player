import { useState } from "react";
import { X, Lock, Loader2, Music2 } from "lucide-react";

interface ResetPasswordModalProps {
  onResetPassword: (password: string) => Promise<{ error: any }>;
  onClose: () => void;
}

export default function ResetPasswordModal({ onResetPassword, onClose }: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const result = await onResetPassword(password);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess("Password reset successful! Redirecting...");
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Create new password</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-primary bg-primary/10 p-2 rounded-lg">{success}</p>}

          <p className="text-xs text-muted-foreground">
            Enter a new password for your account. Make sure it's at least 6 characters long.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">New Password</label>
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            Reset password
          </button>
        </form>
      </div>
    </div>
  );
}
