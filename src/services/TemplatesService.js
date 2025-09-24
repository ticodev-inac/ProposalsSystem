import { createClient } from '@supabase/supabase-js'

class TemplatesService {
  constructor() {
    this.supabase = null
    this.tableName = 'proposal_templates'
  }

  setSupabaseClient(supabaseClient) {
    this.supabase = supabaseClient
  }

  async getAllTemplates() {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar modelos:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro na operação de banco:', error)
      throw error
    }
  }

  async getTemplateById(id) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar modelo:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro na operação de banco:', error)
      throw error
    }
  }

  async createTemplate(templateData) {
    try {
      const { data: authData } = await this.supabase.auth.getUser()
      const userId = authData?.user?.id
  
      if (!userId) {
        throw new Error('Usuário não autenticado')
      }
  
      // Função para validar e formatar campos de tempo
      const formatTimeField = (timeValue) => {
        if (!timeValue || timeValue === '') {
          return null
        }
        // Se já está no formato HH:MM, retorna como está
        if (typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue)) {
          return timeValue
        }
        return null
      }
  
      // Função para validar e formatar campos de data
      const formatDateField = (dateValue) => {
        if (!dateValue || dateValue === '') {
          return null
        }
        return dateValue
      }
  
      const payload = {
        ...templateData,
        user_id: userId,
        status: 'template',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Tratar campos de tempo especificamente
        start_time: formatTimeField(templateData.start_time),
        end_time: formatTimeField(templateData.end_time),
        // Tratar campos de data
        start_date: formatDateField(templateData.start_date),
        end_date: formatDateField(templateData.end_date)
      }
  
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert([payload])
        .select()
        .single()
  
      if (error) {
        console.error('Erro ao criar modelo:', error)
        throw error
      }
  
      return data
    } catch (error) {
      console.error('Erro na operação de banco:', error)
      throw error
    }
  }

  async updateTemplate(id, templateData) {
    try {
      // Função para validar e formatar campos de tempo
      const formatTimeField = (timeValue) => {
        if (!timeValue || timeValue === '') {
          return null
        }
        if (typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue)) {
          return timeValue
        }
        return null
      }
  
      // Função para validar e formatar campos de data
      const formatDateField = (dateValue) => {
        if (!dateValue || dateValue === '') {
          return null
        }
        return dateValue
      }
  
      const payload = {
        ...templateData,
        updated_at: new Date().toISOString(),
        // Tratar campos de tempo especificamente
        start_time: formatTimeField(templateData.start_time),
        end_time: formatTimeField(templateData.end_time),
        // Tratar campos de data
        start_date: formatDateField(templateData.start_date),
        end_date: formatDateField(templateData.end_date)
      }
  
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single()
  
      if (error) {
        console.error('Erro ao atualizar modelo:', error)
        throw error
      }
  
      return data
    } catch (error) {
      console.error('Erro na operação de banco:', error)
      throw error
    }
  }

  async deleteTemplate(id) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar modelo:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Erro na operação de banco:', error)
      throw error
    }
  }

  // Método para criar um modelo a partir de uma proposta existente
  async createTemplateFromProposal(proposalId, templateName, templateDescription, templateColor = '#007bff') {
    try {
      // Buscar a proposta original
      const { data: proposal, error: proposalError } = await this.supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single()

      if (proposalError) throw proposalError

      // Buscar itens, insumos e opcionais relacionados
      const [itemsResult, insumosResult, opcionaisResult] = await Promise.all([
        this.supabase.from('proposal_items').select('*').eq('proposal_id', proposalId),
        this.supabase.from('proposal_insumos').select('*').eq('proposal_id', proposalId),
        this.supabase.from('proposal_opcionais').select('*').eq('proposal_id', proposalId)
      ])

      // Preparar dados do modelo
      const templateData = {
        name: templateName,
        description: templateDescription,
        color: templateColor,
        
        // Copiar campos da proposta
        client_id: proposal.client_id,
        company_id: proposal.company_id,
        title: proposal.title,
        event_type: proposal.event_type,
        participants_count: proposal.participants_count,
        location: proposal.location,
        start_date: proposal.start_date,
        end_date: proposal.end_date,
        start_time: proposal.start_time,
        end_time: proposal.end_time,
        contractor_name: proposal.contractor_name,
        requester_name: proposal.requester_name,
        phone: proposal.phone,
        email: proposal.email,
        status_detalhado: proposal.status_detalhado,
        total_amount: proposal.total_amount,
        total_geral: proposal.total_geral,
        incluir_opcionais: proposal.incluir_opcionais,
        incluir_v_un_itens: proposal.incluir_v_un_itens,
        incluir_v_un_insumos: proposal.incluir_v_un_insumos,
        incluir_v_un_opcionais: proposal.incluir_v_un_opcionais,
        
        // Armazenar dados relacionados em JSONB
        items: itemsResult.data || [],
        insumos: insumosResult.data || [],
        opcionais: opcionaisResult.data || []
      }

      return await this.createTemplate(templateData)
    } catch (error) {
      console.error('Erro ao criar modelo a partir de proposta:', error)
      throw error
    }
  }
}

export default new TemplatesService()