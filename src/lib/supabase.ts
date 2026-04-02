import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/config/supabase'

// 从配置文件获取
const supabaseUrl = supabaseConfig.url
const supabaseAnonKey = supabaseConfig.anonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
