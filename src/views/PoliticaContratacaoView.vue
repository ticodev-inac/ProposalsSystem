<template>
    <div class="politica-contratacao-page">
        <!-- Cabeçalho simples padronizado -->
        <div class="simple-header">
            <h1>Política de Contratação</h1>
            <p class="subtitle">Configure as políticas que aparecerão nas propostas</p>
        </div>

        <div class="politicas-container" v-if="!loading">
            <div v-if="politicas && politicas.length > 0" class="politicas-content">
                <div
                    v-for="(politica, index) in politicas"
                    :key="politica.id || index"
                    class="politica-section"
                >
                    <div class="section-header">
                        <h3>{{ politica.titulo }}</h3>
                        <!-- 🔻 Removidos os botões de editar/excluir -->
                    </div>

                    <div class="section-content">
                        <div class="content-box">
                            <p>{{ politica.conteudo }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-handshake"></i>
                </div>
                <h3>Nenhuma política configurada</h3>
                <p>
                    Configure as políticas de contratação na tela de
                    <strong>Configurações Fixas</strong>
                    para visualizá-las aqui.
                </p>
                <router-link to="/fixo" class="btn btn-primary">
                    <i class="fa-solid fa-gear"></i>
                    Ir para Configurações Fixas
                </router-link>
            </div>
        </div>

        <div class="loading-state" v-if="loading">
            <div class="spinner"></div>
            <p>Carregando políticas de contratação...</p>
        </div>
    </div>
</template>

<script>
    import { ref, onMounted } from 'vue'
    import { FixoService } from '@/services/fixoService'
    import { supabase } from '@/services/supabase'
    import { useDatabaseStore } from '@/stores/database'

    export default {
        name: 'PoliticaContratacaoView',
        setup() {
            const database = useDatabaseStore()
            const loading = ref(true)
            const politicas = ref([])
            const saving = ref(false)

            const loadPoliticas = async () => {
                try {
                    loading.value = true
                    const data = await FixoService.getPoliticaContratacao()
                    if (data) {
                        const parsedData = typeof data === 'string' ? JSON.parse(data) : data
                        politicas.value = Array.isArray(parsedData) ? parsedData : []
                        // salva na proposta se houver proposta aberta
                    } else {
                        politicas.value = []
                    }
                } catch (error) {
                    console.error('Erro ao carregar políticas:', error)
                    politicas.value = []
                } finally {
                    loading.value = false
                }
            }

            onMounted(loadPoliticas)

            return {
                loading,
                politicas,
            }
        },
    }
</script>

<style scoped>
    .politica-contratacao-page {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }

    /* Cabeçalho simples — mesmo padrão para todas as telas */
    .simple-header {
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        padding: 1.5rem 2rem;
        margin-bottom: 2rem;
    }
    .simple-header h1 {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
    }
    .simple-header .subtitle {
        font-size: 1rem;
        color: #6b7280;
        margin: 0;
    }

    .politicas-container {
        background: white;
        border-radius: 12px;
        border: 1px solid #e1e5e9;
        overflow: hidden;
    }

    .politicas-content {
        padding: 30px;
    }

    .politica-section {
        margin-bottom: 30px;
        border-bottom: 1px solid #e9ecef;
        padding-bottom: 25px;
    }
    .politica-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    .section-header h3 {
        color: #2c3e50;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    /* caixas de conteúdo */
    .content-box {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
    }
    .content-box p {
        margin: 0;
        line-height: 1.6;
        color: #2c3e50;
        white-space: pre-wrap;
    }

    /* estados */
    .empty-state {
        text-align: center;
        padding: 60px 30px;
        color: #7f8c8d;
    }
    .empty-icon {
        font-size: 48px;
        margin-bottom: 20px;
        color: #bdc3c7;
    }
    .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .btn-primary {
        background: #007bff;
        color: white;
    }
    .btn-primary:hover {
        background: #0056b3;
        transform: translateY(-1px);
    }

    .loading-state {
        text-align: center;
        padding: 60px 30px;
        color: #7f8c8d;
    }
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
