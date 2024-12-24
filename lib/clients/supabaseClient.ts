import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/database'

// Client singleton
export const supabase = createClientComponentClient<Database>()

export const createClient = () => {
  return supabase
}
