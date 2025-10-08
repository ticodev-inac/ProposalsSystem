import { createClient } from '@supabase/supabase-js'

class SuppliesService {
    constructor() {
        this.supabase = null
        this.tableName = 'supplies'
    }

    setSupabaseClient(supabaseClient) {
        this.supabase = supabaseClient
    }

    async getAllSupplies() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select(
                    `
          *,
          supply_types (
            id,
            name,
            description,
            color
          )
        `
                )
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar insumos:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async createSupply(supplyData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([
                    {
                        name: supplyData.name?.trim(),
                        description: supplyData.description?.trim(),
                        type: supplyData.type,
                        type_id: supplyData.type_id,
                        price: parseFloat(supplyData.price || 0),
                        unit: supplyData.unit,
                        is_active: supplyData.is_active !== false,
                    },
                ])
                .select(
                    `
          *,
          supply_types (
            id,
            name,
            description,
            color
          )
        `
                )
                .single()

            if (error) {
                console.error('Erro ao criar insumo:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async updateSupply(id, supplyData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update({
                    name: supplyData.name?.trim(),
                    description: supplyData.description?.trim(),
                    type: supplyData.type,
                    type_id: supplyData.type_id,
                    price: parseFloat(supplyData.price || 0),
                    unit: supplyData.unit,
                    is_active: supplyData.is_active !== false,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select(
                    `
          *,
          supply_types (
            id,
            name,
            description,
            color
          )
        `
                )
                .single()

            if (error) {
                console.error('Erro ao atualizar insumo:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async deleteSupply(id) {
        try {
            const { error } = await this.supabase.from(this.tableName).delete().eq('id', id)

            if (error) {
                console.error('Erro ao excluir insumo:', error)
                throw error
            }

            return true
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getSupplyById(id) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select(
                    `
          *,
          supply_types (
            id,
            name,
            description,
            color
          )
        `
                )
                .eq('id', id)
                .single()

            if (error) {
                console.error('Erro ao buscar insumo:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async searchSupplies(searchTerm, typeFilter = null) {
        try {
            let query = this.supabase
                .from(this.tableName)
                .select(
                    `
          *,
          supply_types (
            id,
            name,
            description,
            color
          )
        `
                )
                .eq('is_active', true)

            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            }

            if (typeFilter) {
                query = query.eq('type', typeFilter)
            }

            const { data, error } = await query.order('name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar insumos:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getSuppliesByType(typeName) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select(
                    `
          *,
          supply_types (
            id,
            name,
            description,
            color
          )
        `
                )
                .eq('type', typeName)
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar insumos por tipo:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }
}

export default new SuppliesService()
