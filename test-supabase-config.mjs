import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const url = process.env.DATABASE_URL;
const anonKey = process.env.ANON_PUBLIC_KEY;
const serviceKey = process.env.SUPABASE_ROLE_KEY;

console.log("=== RAW ENV VALUES ===");
console.log("URL:", JSON.stringify(url));
console.log("Anon Key:", JSON.stringify(anonKey));
console.log("Service Key:", JSON.stringify(serviceKey));
console.log("");

// Test 2: Coba dengan service key
if (serviceKey) {
  console.log("--- Test dengan SERVICE ROLE KEY ---");
  const client2 = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client2.storage.listBuckets();
  console.log("Result:", data ? "✅ Success" : "❌ Failed");
  console.log("Error:", error);
  console.log("");
}
