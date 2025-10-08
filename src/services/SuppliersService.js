import { createClient } from '@supabase/supabase-js'

class SuppliersService {
    constructor() {
        this.supabase = null
        this.tableName = 'suppliers'
    }

    setSupabaseClient(supabaseClient) {
        this.supabase = supabaseClient
    }

    async getAllSuppliers() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('company_name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar fornecedores:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getSupplierById(id) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Erro ao buscar fornecedor:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async createSupplier(supplierData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([supplierData])
                .select()
                .single()

            if (error) {
                console.error('Erro ao criar fornecedor:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async updateSupplier(id, supplierData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update(supplierData)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Erro ao atualizar fornecedor:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async deleteSupplier(id) {
        try {
            const { error } = await this.supabase.from(this.tableName).delete().eq('id', id)

            if (error) {
                console.error('Erro ao deletar fornecedor:', error)
                throw error
            }

            return true
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async searchSuppliers(searchTerm) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .or(
                    `company_name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
                )
                .order('company_name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar fornecedores:', error)
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
}

export default new SuppliersService()
