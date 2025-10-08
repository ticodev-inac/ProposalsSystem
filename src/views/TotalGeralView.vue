<template>
    <div class="total-geral-page">
        <HeaderProposal
            title="Total Geral"
            subtitle="Resumo financeiro da proposta"
            :proposal-info="proposalContextInfo"
            @cancel="cancelEditing"
            @advance="goToCondicoesGerais"
            :can-advance="canAdvance"
        />

        <!-- Controle de Opcionais -->
        <div class="optionals-control">
            <div class="control-section">
                <label class="switch-label">
                    <input
                        type="checkbox"
                        v-model="incluirOpcionais"
                        @change="updateOptionalsSetting"
                        class="switch-input"
                    />
                    <span class="switch-slider"></span>
                    <span class="switch-text">Incluir Opcionais na Proposta</span>
                </label>
                <p class="control-description">
                    Os itens opcionais são complementos que podem ser incluídos ou não na proposta
                    final
                </p>
            </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Carregando totais...</p>
        </div>

        <div v-else class="totals-container">
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="card-header">
                        <h3>Produtos</h3>
                        <i class="fa-solid fa-box"></i>
                    </div>
                    <div class="card-value">{{ formatCurrency(totals.produtos) }}</div>
                    <div class="card-count">{{ counts.produtos }} itens</div>
                </div>

                <div class="summary-card">
                    <div class="card-header">
                        <h3>Serviços</h3>
                        <i class="fa-solid fa-gears"></i>
                    </div>
                    <div class="card-value">{{ formatCurrency(totals.servicos) }}</div>
                    <div class="card-count">{{ counts.servicos }} itens</div>
                </div>

                <div class="summary-card">
                    <div class="card-header">
                        <h3>Insumos</h3>
                        <i class="fa-solid fa-screwdriver-wrench"></i>
                    </div>
                    <div class="card-value">{{ formatCurrency(totals.insumos) }}</div>
                    <div class="card-count">{{ counts.insumos }} itens</div>
                </div>

                <div class="summary-card" v-show="incluirOpcionais">
                    <div class="card-header">
                        <h3>Opcionais</h3>
                        <i class="fa-solid fa-circle-plus"></i>
                    </div>
                    <div class="card-value">{{ formatCurrency(totals.opcionais) }}</div>
                    <div class="card-count">{{ counts.opcionais }} itens</div>
                </div>
            </div>

            <div class="total-breakdown">
                <div class="breakdown-section">
                    <h3>Detalhamento dos Valores</h3>

                    <div class="breakdown-table">
                        <div class="breakdown-row">
                            <span class="breakdown-label">Subtotal Produtos:</span>
                            <span class="breakdown-value">
                                {{ formatCurrency(totals.produtos) }}
                            </span>
                        </div>
                        <div class="breakdown-row">
                            <span class="breakdown-label">Subtotal Serviços:</span>
                            <span class="breakdown-value">
                                {{ formatCurrency(totals.servicos) }}
                            </span>
                        </div>
                        <div class="breakdown-row">
                            <span class="breakdown-label">Subtotal Insumos:</span>
                            <span class="breakdown-value">
                                {{ formatCurrency(totals.insumos) }}
                            </span>
                        </div>
                        <div class="breakdown-row" v-show="incluirOpcionais">
                            <span class="breakdown-label">Subtotal Opcionais:</span>
                            <span class="breakdown-value">
                                {{ formatCurrency(totals.opcionais) }}
                            </span>
                        </div>
                        <div class="breakdown-row subtotal">
                            <span class="breakdown-label">Subtotal Geral:</span>
                            <span class="breakdown-value">{{ formatCurrency(subtotal) }}</span>
                        </div>

                        <div class="breakdown-row">
                            <span class="breakdown-label">({{ discount }}%):</span>
                            <span class="breakdown-value discount">
                                -{{ formatCurrency(discountAmount) }}
                            </span>
                        </div>

                        <div class="breakdown-row">
                            <span class="breakdown-label">({{ taxRate }}%):</span>
                            <span class="breakdown-value">{{ formatCurrency(taxAmount) }}</span>
                        </div>

                        <div class="breakdown-row total">
                            <span class="breakdown-label">TOTAL GERAL:</span>
                            <span class="breakdown-value">{{ formatCurrency(totalGeral) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { ref, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { supabase } from '@/services/supabase'
    import { useDatabaseStore } from '@/stores/database'
    import HeaderProposal from '@/components/HeaderProposal.vue'
    import TempProposalService from '@/services/TempProposalService'

    export default {
        name: 'TotalGeralView',
        components: {
            HeaderProposal,
        },
        setup() {
            const router = useRouter()
            const database = useDatabaseStore()
            const loading = ref(false)

            // Controle de opcionais
            const incluirOpcionais = ref(true)

            const totals = ref({
                produtos: 0,
                servicos: 0,
                insumos: 0,
                opcionais: 0,
            })
            const counts = ref({
                produtos: 0,
                servicos: 0,
                insumos: 0,
                opcionais: 0,
            })

            const discount = ref(0)
            const taxRate = ref(0)
            const observations = ref('')

            // Proposta atual
            const currentProposalId = computed(() => database.currentProposalId)
            const currentProposal = ref(null)

            // Informações para o header
            const proposalContextInfo = computed(() => {
                if (!currentProposal.value) return ''
                const parts = []
                if (currentProposal.value.proposal_number) {
                    parts.push(`#${currentProposal.value.proposal_number}`)
                }
                if (currentProposal.value.title) {
                    parts.push(currentProposal.value.title)
                }
                return parts.join(' - ')
            })

            const canAdvance = computed(() => {
                return (
                    totals.value.produtos > 0 ||
                    totals.value.servicos > 0 ||
                    totals.value.insumos > 0
                )
            })

            const subtotal = computed(() => {
                let base = totals.value.produtos + totals.value.servicos + totals.value.insumos
                if (incluirOpcionais.value) {
                    base += totals.value.opcionais
                }
                return base
            })

            const discountAmount = computed(() => {
                return subtotal.value * (discount.value / 100)
            })

            const taxAmount = computed(() => {
                return (subtotal.value - discountAmount.value) * (taxRate.value / 100)
            })

            const totalGeral = computed(() => {
                return subtotal.value - discountAmount.value + taxAmount.value
            })

            const goToPoliticaContratacao = () => {
                router.push('/politica-contratacao')
            }

            const goToDadosFornecedor = () => {
                router.push('/dados-fornecedor')
            }

            const computeTotalsFromProposal = (proposal) => {
                const items = Array.isArray(proposal?.items) ? proposal.items : []
                const supplies = Array.isArray(proposal?.supplies) ? proposal.supplies : []
                const optionals = Array.isArray(proposal?.optionals) ? proposal.optionals : []

                // Produtos e Serviços a partir de items
                const produtos = items.filter(
                    (i) => (i.categoria || '').toLowerCase() === 'produto'
                )
                const servicos = items.filter(
                    (i) => (i.categoria || '').toLowerCase() === 'servico'
                )

                totals.value.produtos = produtos.reduce(
                    (sum, it) => sum + Number(it.valor_unitario || 0) * Number(it.quantity || 1),
                    0
                )
                counts.value.produtos = produtos.length

                totals.value.servicos = servicos.reduce(
                    (sum, it) => sum + Number(it.valor_unitario || 0) * Number(it.quantity || 1),
                    0
                )
                counts.value.servicos = servicos.length

                // Insumos a partir de supplies
                totals.value.insumos = supplies.reduce(
                    (sum, it) =>
                        sum + Number(it.valor_unitario || it.price || 0) * Number(it.quantity || 1),
                    0
                )
                counts.value.insumos = supplies.length

                // Opcionais a partir de optionals (mostrados separadamente)
                totals.value.opcionais = optionals.reduce(
                    (sum, it) =>
                        sum + Number(it.valor_unitario || it.price || 0) * Number(it.quantity || 1),
                    0
                )
                counts.value.opcionais = optionals.length
            }

            const calculateTotals = async () => {
                loading.value = true
                try {
                    if (currentProposalId.value && currentProposal.value) {
                        // Recalcular com base na proposta
                        computeTotalsFromProposal(currentProposal.value)
                    } else {
                        // Fallback antigo: somar todas as tabelas
                        const { data: produtos, error: produtosError } = await supabase
                            .from('products')
                            .select('price')
                        if (produtosError) throw produtosError
                        totals.value.produtos =
                            produtos?.reduce((sum, item) => sum + (item.price || 0), 0) || 0
                        counts.value.produtos = produtos?.length || 0

                        const { data: servicos, error: servicosError } = await supabase
                            .from('services')
                            .select('price')
                        if (servicosError) throw servicosError
                        totals.value.servicos =
                            servicos?.reduce((sum, item) => sum + (item.price || 0), 0) || 0
                        counts.value.servicos = servicos?.length || 0

                        const { data: insumos, error: insumosError } = await supabase
                            .from('supplies')
                            .select('price')
                        if (insumosError) throw insumosError
                        totals.value.insumos =
                            insumos?.reduce((sum, item) => sum + (item.price || 0), 0) || 0
                        counts.value.insumos = insumos?.length || 0

                        const { data: opcionais, error: opcionaisError } = await supabase
                            .from('optionals')
                            .select('price')
                            .eq('is_active', true)
                        if (opcionaisError) throw opcionaisError
                        totals.value.opcionais =
                            opcionais?.reduce(
                                (sum, item) => sum + (item.price ?? item.valor ?? 0),
                                0
                            ) || 0
                        counts.value.opcionais = opcionais?.length || 0
                    }
                } catch (error) {
                    console.error('Erro ao calcular totais:', error)
                    alert('Erro ao calcular totais')
                } finally {
                    loading.value = false
                }
            }

            const saveSettings = async () => {
                try {
                    const payload = {
                        discount: Number(discount.value) || 0,
                        tax_rate: Number(taxRate.value) || 0,
                        observations: observations.value || '',
                        updated_at: new Date().toISOString(),
                    }

                    // Salva configurações globais (retrocompatibilidade)
                    const { data: updated, error: updateError } = await supabase
                        .from('fixo_config')
                        .update({ dados: payload, is_active: true })
                        .eq('tipo', 'total_geral')
                        .select('dados')
                        .maybeSingle()
                    if (updateError) throw updateError
                    let saved = updated
                    if (!saved) {
                        const { data: inserted, error: insertError } = await supabase
                            .from('fixo_config')
                            .insert({ tipo: 'total_geral', dados: payload, is_active: true })
                            .select('dados')
                            .maybeSingle()
                        if (insertError) throw insertError
                        saved = inserted
                    }

                    // Se houver proposta ativa, persiste o total_amount calculado nela (sem opcionais)
                    if (currentProposalId.value) {
                        await supabase
                            .from('proposals')
                            .update({
                                total_amount: Number(totalGeral.value) || 0,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', currentProposalId.value)
                        if (currentProposal.value) {
                            currentProposal.value.total_amount = Number(totalGeral.value) || 0
                        }
                    }

                    alert('Configurações salvas com sucesso!')
                } catch (error) {
                    console.error('Erro ao salvar configurações:', error)
                    alert('Erro ao salvar configurações')
                }
            }

            const loadSettings = async () => {
                try {
                    const { data, error } = await supabase
                        .from('fixo_config')
                        .select('dados')
                        .eq('tipo', 'total_geral')
                        .maybeSingle()
                    if (error) throw error
                    const cfg = data?.dados || {}
                    discount.value = Number(cfg.discount) || 0
                    taxRate.value = Number(cfg.tax_rate) || 0
                    observations.value = cfg.observations || ''
                } catch (error) {
                    console.error('Erro ao carregar configurações:', error)
                    discount.value = 0
                    taxRate.value = 0
                    observations.value = ''
                }
            }

            const loadProposal = async () => {
                if (!currentProposalId.value) return
                try {
                    const { data, error } = await supabase
                        .from('proposals')
                        .select('*')
                        .eq('id', currentProposalId.value)
                        .single()
                    if (error) throw error
                    currentProposal.value = data
                    computeTotalsFromProposal(data)
                } catch (err) {
                    console.error('Erro ao carregar proposta atual:', err)
                }
            }

            const exportTotals = () => {
                const data = {
                    totals: totals.value,
                    counts: counts.value,
                    subtotal: subtotal.value,
                    discount: discount.value,
                    discountAmount: discountAmount.value,
                    taxRate: taxRate.value,
                    taxAmount: taxAmount.value,
                    totalGeral: totalGeral.value,
                    observations: observations.value,
                    exportDate: new Date().toISOString(),
                }

                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `total-geral-${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }

            const formatCurrency = (value) => {
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                }).format(value || 0)
            }

            // Função para atualizar configuração de opcionais
            const updateOptionalsSetting = () => {
                // Salvar no armazenamento temporário
                TempProposalService.updateSection('totalGeral', {
                    incluir_opcionais: incluirOpcionais.value,
                    total_amount: subtotal.value,
                    total_geral: totalGeral.value,
                })
            }

            // Função para cancelar edição
            const cancelEditing = () => {
                if (
                    confirm(
                        'Tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas.'
                    )
                ) {
                    TempProposalService.clearTempData()
                    database.clearEditingState()
                    router.push('/propostas')
                }
            }

            // Função para avançar para próxima etapa
            const goToCondicoesGerais = () => {
                // Salvar dados atuais no armazenamento temporário
                TempProposalService.updateSection('totalGeral', {
                    incluir_opcionais: incluirOpcionais.value,
                    total_amount: subtotal.value,
                    total_geral: totalGeral.value,
                    discount: discount.value,
                    tax_rate: taxRate.value,
                    observations: observations.value,
                })

                router.push('/condicoes-gerais')
            }

            onMounted(async () => {
                await loadSettings()

                // Carregar dados temporários se existirem
                const tempData = TempProposalService.getSection('totalGeral')
                if (tempData) {
                    incluirOpcionais.value = tempData.incluir_opcionais ?? true
                    if (tempData.discount !== undefined) discount.value = tempData.discount
                    if (tempData.tax_rate !== undefined) taxRate.value = tempData.tax_rate
                    if (tempData.observations) observations.value = tempData.observations
                }

                if (currentProposalId.value) {
                    await loadProposal()
                } else {
                    await calculateTotals()
                }
            })

            return {
                loading,
                totals,
                counts,
                discount,
                taxRate,
                observations,
                subtotal,
                discountAmount,
                taxAmount,
                totalGeral,
                calculateTotals,
                cancelEditing,
                saveSettings,
                exportTotals,
                formatCurrency,
                // Controle de opcionais
                incluirOpcionais,
                updateOptionalsSetting,
                // Proposta
                currentProposalId,
                currentProposal,
                proposalContextInfo,
                canAdvance,
                // Navegação
                goToCondicoesGerais,
                goToPoliticaContratacao,
                goToDadosFornecedor,
            }
        },
    }
</script>

<style scoped>
    .total-geral-page {
        padding: 0;
        background: #f8fafc;
        min-height: 100vh;
    }

    /* Controle de Opcionais */
    .optionals-control {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin: 0 2rem 2rem 2rem;
        padding: 1.5rem;
    }

    .control-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .switch-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        font-weight: 500;
        color: #374151;
    }

    .switch-input {
        position: relative;
        width: 3rem;
        height: 1.5rem;
        appearance: none;
        background: #d1d5db;
        border-radius: 0.75rem;
        transition: background-color 0.2s;
        cursor: pointer;
    }

    .switch-input:checked {
        background: #3b82f6;
    }

    .switch-input::before {
        content: '';
        position: absolute;
        top: 0.125rem;
        left: 0.125rem;
        width: 1.25rem;
        height: 1.25rem;
        background: white;
        border-radius: 50%;
        transition: transform 0.2s;
    }

    .switch-input:checked::before {
        transform: translateX(1.5rem);
    }

    .switch-text {
        font-size: 1rem;
        font-weight: 600;
    }

    .control-description {
        color: #6b7280;
        font-size: 0.875rem;
        margin: 0;
        margin-left: 3.75rem;
    }

    /* Loading styles */
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 0 2rem;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .totals-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 0 2rem 2rem 2rem;
    }

    .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .summary-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .card-header h3 {
        margin: 0;
        color: #333;
        font-size: 16px;
    }

    .card-header i {
        font-size: 24px;
        color: #007bff;
    }

    .card-value {
        font-size: 24px;
        font-weight: bold;
        color: #28a745;
        margin-bottom: 5px;
    }

    .card-count {
        font-size: 14px;
        color: #666;
    }

    .total-breakdown {
        width: 100%;
    }

    .breakdown-section {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 100%;
    }

    .breakdown-section h3 {
        margin: 0 0 20px 0;
        color: #333;
        font-size: 18px;
    }

    .breakdown-table {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .breakdown-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }

    .breakdown-row.subtotal {
        border-top: 2px solid #dee2e6;
        font-weight: 600;
        margin-top: 10px;
    }

    .breakdown-row.total {
        border-top: 2px solid #007bff;
        border-bottom: 2px solid #007bff;
        font-weight: bold;
        font-size: 18px;
        margin-top: 10px;
        background: #f8f9fa;
        padding: 15px 10px;
    }

    .breakdown-label {
        color: #333;
    }

    .breakdown-value {
        font-weight: 600;
        color: #28a745;
    }

    .breakdown-value.discount {
        color: #dc3545;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
    }

    .form-group input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }

    .form-group textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        resize: vertical;
        min-height: 80px;
    }

    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;
    }

    .btn-primary {
        background: #007bff;
        color: white;
    }

    .btn-primary:hover {
        background: #0056b3;
    }

    .btn-secondary {
        background: #6c757d;
        color: white;
    }

    .btn-secondary:hover {
        background: #545b62;
    }

    .btn-success {
        background: #28a745;
        color: white;
    }

    .btn-success:hover {
        background: #1e7e34;
    }

    @media (max-width: 768px) {
        .total-geral-page {
            padding: 10px;
        }

        .summary-cards {
            grid-template-columns: 1fr;
        }

        .total-breakdown {
            width: 100%;
        }
    }
</style>
