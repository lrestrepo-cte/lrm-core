import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kksudwzrehzeuwyphfkz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrc3Vkd3pyZWh6ZXV3eXBoZmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTgwMDgsImV4cCI6MjA5NjYzNDAwOH0.xpP6FGcdRXbcIN4qxjfaV6XvbUfDWkkACgkia5T9fqU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)