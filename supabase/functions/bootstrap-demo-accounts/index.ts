import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DemoAccount {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "teacher" | "parent";
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "admin@qurancenter.test", password: "demo1234", full_name: "Center Administrator", role: "admin" },
  { email: "teacher1@qurancenter.test", password: "demo1234", full_name: "Ustadh Abdulrahman", role: "teacher" },
  { email: "teacher2@qurancenter.test", password: "demo1234", full_name: "Ustadha Khadija", role: "teacher" },
  { email: "teacher3@qurancenter.test", password: "demo1234", full_name: "Ustadh Bilal", role: "teacher" },
  { email: "parent1@qurancenter.test", password: "demo1234", full_name: "Mahmoud Al-Rashid", role: "parent" },
  { email: "parent2@qurancenter.test", password: "demo1234", full_name: "Layla Al-Zahra", role: "parent" },
  { email: "parent3@qurancenter.test", password: "demo1234", full_name: "Omar Ibn Adam", role: "parent" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; created: boolean; error?: string }[] = [];

    for (const account of DEMO_ACCOUNTS) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.full_name, role: account.role },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already been registered") || error.message.toLowerCase().includes("already exists")) {
          results.push({ email: account.email, created: false });
        } else {
          results.push({ email: account.email, created: false, error: error.message });
        }
        continue;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: account.email,
            full_name: account.full_name,
            role: account.role,
          },
          { onConflict: "id" }
        );
        if (profileError) {
          results.push({ email: account.email, created: true, error: `profile: ${profileError.message}` });
        } else {
          results.push({ email: account.email, created: true });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, accounts: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
