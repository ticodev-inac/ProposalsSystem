import { createClient } from '@supabase/supabase-js'

class ClientsService {
    constructor() {
        // Supabase será inicializado via store
        this.supabase = null
        this.tableName = 'clients'
    }

    setSupabaseClient(supabaseClient) {
        this.supabase = supabaseClient
    }

    async getAllClients() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('company_name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar clientes:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getClientById(id) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Erro ao buscar cliente:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    // Cria uma empresa com company_name (ou name) e retorna o id gerado pelo banco
    async createCompanyAndReturnId(companyName, userId) {
        if (!companyName) return null

        // Tenta criar usando 'company_name' e created_by
        let insert = await this.supabase
            .from('clients') // Corrigido: era 'companies', mas baseado na estrutura deve ser 'clients'
            .insert([{ company_name: companyName, created_by: userId ?? null }])
            .select('id')
            .single()

        // Se falhar (ex.: coluna não existe), tenta com 'name' + created_by
        if (insert.error) {
            insert = await this.supabase
                .from('clients') // Corrigido: era 'companies', agora é 'clients'
                .insert([{ name: companyName, created_by: userId ?? null }])
                .select('id')
                .single()
        }

        // Se ainda falhar por causa do created_by, tenta sem created_by (company_name)
        if (insert.error) {
            insert = await this.supabase
                .from('clients') // Corrigido: era 'companies', agora é 'clients'
                .insert([{ company_name: companyName }])
                .select('id')
                .single()
        }

        // Último fallback: 'name' sem created_by
        if (insert.error) {
            insert = await this.supabase
                .from('clients') // Corrigido: era 'companies', agora é 'clients'
                .insert([{ name: companyName }])
                .select('id')
                .single()
        }

        if (insert.error) {
            console.error('Erro ao criar empresa:', insert.error)
            throw insert.error
        }

        return insert.data?.id ?? null
    }

    async createClient(clientData) {
        try {
            // Usuário pode estar logado ou não; não vamos travar fluxo se não houver sessão
            let userId = null
            try {
                const {
                    data: { user },
                } = await this.supabase.auth.getUser()
                userId = user?.id ?? null
            } catch {
                userId = null
            }

            // company_id direto do form (se já existir)
            let companyId = clientData.company_id || null

            // Se não veio company_id, mas veio company_name, cria a empresa e usa o id gerado
            if (!companyId && clientData.company_name) {
                companyId = await this.createCompanyAndReturnId(clientData.company_name, userId)
            }

            // Fallback opcional para dev (se ainda não tiver companyId)
            if (!companyId) {
                companyId =
                    localStorage.getItem('company_id') ||
                    import.meta.env.VITE_DEFAULT_COMPANY_ID ||
                    null
            }

            if (!companyId) {
                throw new Error(
                    'Não foi possível determinar company_id. Informe company_name ao criar o cliente (para criarmos a company automaticamente) ou defina um company_id.'
                )
            }

            // Monta payload do cliente: tenta incluir created_by; se falhar por coluna inexistente, reenvia sem created_by
            let payload = { ...clientData, company_id: companyId, created_by: userId }
            let insert = await this.supabase
                .from(this.tableName)
                .insert([payload])
                .select()
                .single()

            if (insert.error) {
                // Tenta novamente sem created_by (para schemas que não têm essa coluna)
                payload = { ...clientData, company_id: companyId }
                insert = await this.supabase
                    .from(this.tableName)
                    .insert([payload])
                    .select()
                    .single()
            }

            if (insert.error) {
                console.error('Erro ao criar cliente:', insert.error)
                throw insert.error
            }

            return insert.data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async updateClient(id, clientData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update(clientData)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Erro ao atualizar cliente:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async deleteClient(id) {
        try {
            const { error } = await this.supabase.from(this.tableName).delete().eq('id', id)

            if (error) {
                console.error('Erro ao deletar cliente:', error)
                throw error
            }

            return true
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async searchClients(searchTerm) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .or(
                    `company_name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
                )
                .order('company_name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar clientes:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async checkCnpjExists(cnpj, excludeId = null) {
        try {
            let query = this.supabase.from(this.tableName).select('id').eq('cnpj', cnpj)

            if (excludeId) {
                query = query.neq('id', excludeId)
            }

            const { data, error } = await query

            if (error) {
                console.error('Erro ao verificar CNPJ:', error)
                throw error
            }

            return data && data.length > 0
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async checkEmailExists(email, excludeId = null) {
        try {
            let query = this.supabase.from(this.tableName).select('id').eq('email', email)

            if (excludeId) {
                query = query.neq('id', excludeId)
            }

            const { data, error } = await query

            if (error) {
                console.error('Erro ao verificar email:', error)
                throw error
            }

            return data && data.length > 0
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getClientsCount() {
        try {
            const { count, error } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true })

            if (error) {
                console.error('Erro ao contar clientes:', error)
                throw error
            }

            return count || 0
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }
}

export default new ClientsService()
