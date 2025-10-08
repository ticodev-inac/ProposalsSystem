import { createClient } from '@supabase/supabase-js'

class ProductsService {
    constructor() {
        this.supabase = null
        this.tableName = 'products'
    }

    setSupabaseClient(supabaseClient) {
        this.supabase = supabaseClient
    }

    async getAllProducts() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar produtos:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async getProductsByType(type) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('type', type)
                .order('name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar produtos por tipo:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async createProduct(productData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([productData])
                .select()
                .single()

            if (error) {
                console.error('Erro ao criar produto:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async updateProduct(id, productData) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update(productData)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Erro ao atualizar produto:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async deleteProduct(id) {
        try {
            const { error } = await this.supabase.from(this.tableName).delete().eq('id', id)

            if (error) {
                console.error('Erro ao deletar produto:', error)
                throw error
            }

            return true
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async searchProducts(query) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
                .order('name', { ascending: true })

            if (error) {
                console.error('Erro ao buscar produtos:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    // Métodos de categorias ajustados para tipos
    async getAllCategories(type = null) {
        try {
            let query = this.supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true })

            if (type) {
                query = query.eq('type', type)
            }

            const { data, error } = await query

            if (error) {
                console.error('Erro ao buscar categorias:', error)
                throw error
            }

            return data || []
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async createCategory(name, type) {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .insert([{ name: name.trim(), type }])
                .select()
                .single()

            if (error) {
                console.error('Erro ao criar categoria:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async updateCategory(id, name, type) {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .update({ name: name.trim(), type, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Erro ao atualizar categoria:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }

    async deleteCategory(id) {
        try {
            const { error } = await this.supabase.from('categories').delete().eq('id', id)

            if (error) {
                console.error('Erro ao deletar categoria:', error)
                throw error
            }

            return true
        } catch (error) {
            console.error('Erro na operação de banco:', error)
            throw error
        }
    }
}

export default new ProductsService()
