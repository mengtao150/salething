import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 配置缺失，将使用本地存储模式')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// 检查是否配置了 Supabase
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co')
}
