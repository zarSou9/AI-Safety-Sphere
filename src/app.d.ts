import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from './DatabaseDefinitions';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			supabaseService: SupabaseClient;
			getSession(): Promise<Session | null>;
		}
		// interface Error {}
		// interface Platform {}
	}
}
