import { createClient } from '@supabase/supabase-js'

class SupplyTypesService {
    constructor() {
        this.supabase = null
        this.tableName = 'supply_types'
    }

    setSupabaseClient(supabaseClient) {
        this.supabase = supabaseClient
    }

    async getAllTypes() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar tipos de insumos:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async createType(typeData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([
                    {
                        name: typeData.name.toLowerCase().replace(/\s+/g, '_'),
                        description: typeData.description?.trim() || null,
                        color: typeData.color || '#007bff',
                        is_active: true,
                    },
                ])
                .select()
                .single()

            if (error) {
                console.error('Erro ao criar tipo de insumo:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async updateType(id, typeData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update({
                    name: typeData.name.toLowerCase().replace(/\s+/g, '_'),
                    description: typeData.description?.trim() || null,
                    color: typeData.color || '#007bff',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Erro ao atualizar tipo de insumo:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async deleteType(id) {
        try {
            // Verificar se existem insumos usando este tipo
            const { data: supplies, error: suppliesError } = await this.supabase
                .from('supplies')
                .select('id')
                .eq('type_id', id)
                .limit(1)

            if (suppliesError) throw suppliesError

            if (supplies && supplies.length > 0) {
                throw new Error(
                    'Não é possível excluir este tipo pois existem insumos associados a ele.'
                )
            }

            const { error } = await this.supabase.from(this.tableName).delete().eq('id', id)

            if (error) {
                console.error('Erro ao excluir tipo de insumo:', error)
                throw error
            }

            return true
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getTypeById(id) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Erro ao buscar tipo de insumo:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    // Método para inicializar tipos padrão
    async initializeDefaultTypes() {
        try {
            const defaultTypes = [
                {
                    name: 'material',
                    description: 'Materiais e componentes físicos',
                    color: '#1976d2',
                },
                {
                    name: 'mao_obra',
                    description: 'Mão de obra e serviços humanos',
                    color: '#7b1fa2',
                },
                {
                    name: 'equipamento',
                    description: 'Equipamentos e ferramentas',
                    color: '#388e3c',
                },
            ]

            for (const type of defaultTypes) {
                try {
                    await this.createType(type)
                } catch (error) {
                    // Ignorar erro se o tipo já existir
                    if (error.code !== '23505') {
                        console.error('Erro ao criar tipo padrão:', error)
                    }
                }
            }

            return true
        } catch (error) {
            console.error('Erro ao inicializar tipos padrão:', error)
            throw error
        }
    }
}

export default new SupplyTypesService()
