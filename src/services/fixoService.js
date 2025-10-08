import { supabase } from './supabase.js'

class FixoService {
    // Buscar condições gerais
    static async getCondicoesGerais() {
        try {
            const { data, error } = await supabase
                .from('fixo_config')
                .select('*')
                .eq('tipo', 'condicoes')
                .single()

            if (error && error.code !== 'PGRST116') throw error

            return data?.dados || ''
        } catch (error) {
            console.error('Erro ao buscar condições gerais:', error)
            return ''
        }
    }

    // Salvar condições gerais
    static async saveCondicoesGerais(condicoesGerais) {
        try {
            // Verificar se já existe um registro de condições
            const { data: existing } = await supabase
                .from('fixo_config')
                .select('id')
                .eq('tipo', 'condicoes')
                .single()

            if (existing) {
                // Atualizar registro existente
                const { data, error } = await supabase
                    .from('fixo_config')
                    .update({
                        dados: condicoesGerais,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
                    .select()
                    .single()

                if (error) throw error
                return data
            } else {
                // Criar novo registro
                const { data, error } = await supabase
                    .from('fixo_config')
                    .insert({
                        tipo: 'condicoes',
                        dados: condicoesGerais,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single()

                if (error) throw error
                return data
            }
        } catch (error) {
            console.error('Erro ao salvar condições gerais:', error)
            throw error
        }
    }

    // Buscar política de contratação
    static async getPoliticaContratacao() {
        try {
            const { data, error } = await supabase
                .from('fixo_config')
                .select('*')
                .eq('tipo', 'politica')
                .single()

            if (error && error.code !== 'PGRST116') throw error

            return data?.dados || ''
        } catch (error) {
            console.error('Erro ao buscar política de contratação:', error)
            return ''
        }
    }

    // Salvar política de contratação
    static async savePoliticaContratacao(politicaContratacao) {
        try {
            // Verificar se já existe um registro de política
            const { data: existing } = await supabase
                .from('fixo_config')
                .select('id')
                .eq('tipo', 'politica')
                .single()

            if (existing) {
                // Atualizar registro existente
                const { data, error } = await supabase
                    .from('fixo_config')
                    .update({
                        dados: politicaContratacao,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
                    .select()
                    .single()

                if (error) throw error
                return data
            } else {
                // Criar novo registro
                const { data, error } = await supabase
                    .from('fixo_config')
                    .insert({
                        tipo: 'politica',
                        dados: politicaContratacao,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single()

                if (error) throw error
                return data
            }
        } catch (error) {
            console.error('Erro ao salvar política de contratação:', error)
            throw error
        }
    }

    // Buscar configuração completa (para compatibilidade)
    static async getConfig() {
        try {
            const condicoesGerais = await this.getCondicoesGerais()
            const politicaContratacao = await this.getPoliticaContratacao()

            return {
                condicoes_gerais: condicoesGerais,
                politica_contratacao: politicaContratacao,
            }
        } catch (error) {
            console.error('Erro ao buscar configuração completa:', error)
            throw error
        }
    }

    // Salvar configuração completa
    static async saveConfig(condicoesGerais, politicaContratacao) {
        try {
            const results = await Promise.all([
                this.saveCondicoesGerais(condicoesGerais || ''),
                this.savePoliticaContratacao(politicaContratacao || ''),
            ])

            return {
                condicoes_gerais: results[0],
                politica_contratacao: results[1],
            }
        } catch (error) {
            console.error('Erro ao salvar configuração completa:', error)
            throw error
        }
    }
    // Buscar formas de pagamento
    static async getFormasPagamento() {
        try {
            const { data, error } = await supabase
                .from('fixo_config')
                .select('*')
                .eq('tipo', 'pagamento')
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data?.dados || ''
        } catch (error) {
            console.error('Erro ao buscar formas de pagamento:', error)
            return ''
        }
    }

    // Salvar formas de pagamento
    static async saveFormasPagamento(formasPagamento) {
        try {
            const { data: existing } = await supabase
                .from('fixo_config')
                .select('id')
                .eq('tipo', 'pagamento')
                .single()

            if (existing) {
                const { data, error } = await supabase
                    .from('fixo_config')
                    .update({
                        dados: formasPagamento,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
                    .select()
                    .single()
                if (error) throw error
                return data
            } else {
                const { data, error } = await supabase
                    .from('fixo_config')
                    .insert({
                        tipo: 'pagamento',
                        dados: formasPagamento,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single()
                if (error) throw error
                return data
            }
        } catch (error) {
            console.error('Erro ao salvar formas de pagamento:', error)
            throw error
        }
    }
}

export { FixoService }
export default FixoService
