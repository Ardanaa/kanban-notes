import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

type Database = Record<string, unknown>;

type ClientOptions = SupabaseClientOptions<"public">;

type GenericClient = SupabaseClient<Database, "public">;

export class SupabaseAuthConfigurationError extends Error {
  constructor(
    message =
      "Supabase server client requires either a Clerk Supabase token template or SUPABASE_SERVICE_ROLE_KEY.",
  ) {
    super(message);
    this.name = "SupabaseAuthConfigurationError";
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const noStoreFetch: typeof fetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    cache: "no-store",
  });

function initClient(key: string, options?: ClientOptions): GenericClient {
  return createClient<Database, "public">(supabaseUrl, key, {
    global: {
      fetch: noStoreFetch,
      ...options?.global,
    },
    ...options,
  });
}

export const supabase = initClient(supabaseAnonKey);

export async function createSupabaseServerClient(): Promise<GenericClient> {
  const { getToken } = await auth();

  try {
    const token = await getToken({ template: "supabase" });
    if (token) {
      return initClient(supabaseAnonKey, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to fetch Clerk Supabase token", error);
    }
  }

  if (supabaseServiceRoleKey) {
    return initClient(supabaseServiceRoleKey);
  }

  throw new SupabaseAuthConfigurationError();
}

let cachedAdminClient: GenericClient | null = null;

export function createSupabaseAdminClient(): GenericClient {
  if (!supabaseServiceRoleKey) {
    throw new SupabaseAuthConfigurationError();
  }

  if (!cachedAdminClient) {
    cachedAdminClient = initClient(supabaseServiceRoleKey);
  }

  return cachedAdminClient;
}
