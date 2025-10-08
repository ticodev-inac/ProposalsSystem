import { createClient } from '@supabase/supabase-js'

class ProposalHistoryService {
    constructor() {
        this.supabase = null
        this.tableName = 'proposal_history'
    }

    setSupabaseClient(supabaseClient) {
        this.supabase = supabaseClient
    }

    async logChange(
        proposalId,
        userId,
        action,
        fieldChanged,
        oldValue,
        newValue,
        description = null
    ) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([
                    {
                        proposal_id: proposalId,
                        user_id: userId,
                        action: action, // 'create', 'update', 'delete', 'status_change', etc.
                        field_changed: fieldChanged,
                        old_value: oldValue,
                        new_value: newValue,
                        description: description,
                        created_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single()

            if (error) {
                console.error('Erro ao registrar histórico:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de histórico:', error)
            throw error
        }
    }

    async getProposalHistory(proposalId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('proposal_id', proposalId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Erro ao buscar histórico:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de histórico:', error)
            throw error
        }
    }
}

export default new ProposalHistoryService()
