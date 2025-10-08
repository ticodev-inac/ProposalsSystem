import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase.js'

export const useConfigStore = defineStore('config', {
    state: () => ({
        empresa: null,
        configuracoes: null,
        loading: false,
        error: null,
    }),

    actions: {
        async loadConfig() {
            this.loading = true
            this.error = null

            try {
                const { data, error } = await supabase.from('fixo_config').select('*')

                if (error) throw error

                // Separar dados por tipo
                data.forEach((item) => {
                    if (item.tipo === 'empresa') {
                        this.empresa = item.dados
                    } else if (item.tipo === 'configuracoes') {
                        this.configuracoes = item.dados
                    }
                })

                return data
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        async updateEmpresa(dadosEmpresa) {
            try {
                const { data, error } = await supabase
                    .from('fixo_config')
                    .upsert({
                        tipo: 'empresa',
                        dados: dadosEmpresa,
                        is_active: true,
                    })
                    .select()

                if (error) throw error

                this.empresa = dadosEmpresa
                return data
            } catch (error) {
                this.error = error.message
                throw error
            }
        },
    },
})
