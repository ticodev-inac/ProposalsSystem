import { createClient } from '@supabase/supabase-js'

class ProposalsService {
    constructor() {
        this.supabase = null
        // Usar tabela unificada
        this.tableName = 'proposals'
    }

    setSupabaseClient(supabaseClient) {
        this.supabase = supabaseClient
    }

    async getAllProposals() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Erro ao buscar propostas:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getProposalById(id) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Erro ao buscar proposta:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async createProposal(proposalData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([proposalData])
                .select()
                .single()

            if (error) {
                console.error('Erro ao criar proposta:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async updateProposal(id, proposalData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update(proposalData)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Erro ao atualizar proposta:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async deleteProposal(id) {
        try {
            const { error } = await this.supabase.from(this.tableName).delete().eq('id', id)

            if (error) {
                console.error('Erro ao deletar proposta:', error)
                throw error
            }

            return true
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async searchProposals(searchTerm) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .or(
                    `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,proposal_number.ilike.%${searchTerm}%`
                )
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Erro ao buscar propostas:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getProposalsCount() {
        try {
            const { count, error } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true })

            if (error) {
                console.error('Erro ao contar propostas:', error)
                throw error
            }

            return count || 0
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getNextProposalNumber(clientId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('proposal_number')
                .eq('client_id', clientId)
                .order('proposal_number', { ascending: false })
                .limit(1)

            if (error) {
                console.error('Erro ao buscar próximo número:', error)
                throw error
            }

            if (data && data.length > 0) {
                const lastNumber = parseInt(data[0].proposal_number) || 0
                return (lastNumber + 1).toString()
            }

            return '1'
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }
}

export default new ProposalsService()
