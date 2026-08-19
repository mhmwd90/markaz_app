import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button, Input, Field, Card } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { email: "admin@qurancenter.test", label: "Administrator" },
  { email: "teacher1@qurancenter.test", label: "Teacher" },
  { email: "parent1@qurancenter.test", label: "Parent" },
];

export function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
      toast(err, "error");
    } else {
      toast("Welcome back!", "success");
      navigate("/");
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo1234");
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-emerald-700 p-8 text-white lg:p-12">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold">Quran Center</p>
              <p className="text-sm text-emerald-100">Memorization Manager</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
            Nurture memorization, one verse at a time.
          </h1>
          <p className="mt-4 text-emerald-100">
            A complete platform for Quran memorization centers — manage students, track
            memorization progress, record attendance, and keep parents informed.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Role-based access</div>
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Arabic & RTL support</div>
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Progress tracking</div>
          </div>
        </div>

        <p className="relative text-xs text-emerald-200">© {new Date().getFullYear()} Quran Center Manager</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6 dark:bg-slate-950 lg:p-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your credentials to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@qurancenter.test"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <LogIn className="h-4 w-4" /> Sign in
            </Button>
          </form>

          <Card className="mt-6 p-4">
            <p className="text-xs font-medium text-slate-500">Quick demo access (password: demo1234)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.email}
                  onClick={() => fillDemo(d.email)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-600"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
