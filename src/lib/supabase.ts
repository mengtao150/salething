import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/config/supabase'

// 优先使用配置文件，否则使用环境变量
const supabaseUrl = supabaseConfig.url || import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = supabaseConfig.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 配置缺失，将使用本地存储模式')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// 检查是否配置了 Supabase
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co')
}
