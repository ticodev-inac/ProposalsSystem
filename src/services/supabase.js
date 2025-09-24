import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kmwxjhqtqhpznhxwwjcf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3hqaHF0cWhwem5oeHd3amNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODQyMDgsImV4cCI6MjA3MzI2MDIwOH0.GTrvSxzV_mcE88m2fYw5pX3Ag78oicHoL1x11VP8tiI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Função para testar conexão
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('fixo_config').select('*').limit(1)
    if (error) throw error
    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error.message)
    return false
  }
}