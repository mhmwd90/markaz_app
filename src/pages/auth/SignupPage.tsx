import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, UserPlus, Shield, GraduationCap, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button, Input, Field, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { value: "parent", label: "Parent", icon: Users, desc: "Track your child's progress" },
  { value: "teacher", label: "Teacher", icon: GraduationCap, desc: "Manage students & records" },
  { value: "admin", label: "Administrator", icon: Shield, desc: "Full center management" },
];

export function SignupPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName, role);
    setLoading(false);
    if (err) {
      setError(err);
      toast(err, "error");
    } else {
      toast("Account created. Welcome!", "success");
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join your Quran memorization center.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name" required>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label="Password" required hint="At least 6 characters">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            <Field label="I am a" required>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
                        role === r.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <UserPlus className="h-4 w-4" /> Create account
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
