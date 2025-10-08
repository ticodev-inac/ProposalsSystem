class TempProposalService {
    constructor() {
        this.storageKey = 'temp_proposal_data'
    }

    // Salvar dados temporários da proposta
    saveTempData(data) {
        try {
            const existingData = this.getTempData()
            const updatedData = { ...existingData, ...data }
            localStorage.setItem(this.storageKey, JSON.stringify(updatedData))
            console.log('✅ Dados temporários salvos:', updatedData)
            return updatedData
        } catch (error) {
            console.error('❌ Erro ao salvar dados temporários:', error)
            throw error
        }
    }

    // Recuperar dados temporários da proposta
    getTempData() {
        try {
            const data = localStorage.getItem(this.storageKey)
            return data ? JSON.parse(data) : {}
        } catch (error) {
            console.error('❌ Erro ao recuperar dados temporários:', error)
            return {}
        }
    }

    // Atualizar seção específica dos dados temporários
    updateSection(section, data) {
        try {
            const tempData = this.getTempData()
            tempData[section] = data
            localStorage.setItem(this.storageKey, JSON.stringify(tempData))
            console.log(`✅ Seção ${section} atualizada:`, data)
            return tempData
        } catch (error) {
            console.error(`❌ Erro ao atualizar seção ${section}:`, error)
            throw error
        }
    }

    // Recuperar seção específica
    getSection(section) {
        const tempData = this.getTempData()
        return tempData[section] || null
    }

    // Limpar dados temporários
    clearTempData() {
        try {
            localStorage.removeItem(this.storageKey)
            console.log('✅ Dados temporários limpos')
        } catch (error) {
            console.error('❌ Erro ao limpar dados temporários:', error)
        }
    }

    // Alias de compatibilidade para chamadas antigas
    clearTempProposal() {
        return this.clearTempData()
    }

    // Verificar se existem dados temporários
    hasTempData() {
        return !!localStorage.getItem(this.storageKey)
    }

    // Preparar dados finais para criação da proposta
    prepareFinalProposalData() {
        const tempData = this.getTempData()

        // Estrutura final da proposta
        const proposalData = {
            // Dados básicos do formulário inicial
            user_id: tempData.basicInfo?.user_id,
            company_id: tempData.basicInfo?.company_id,
            client_id: tempData.basicInfo?.client_id,
            proposal_number: tempData.basicInfo?.proposal_number,
            title: tempData.basicInfo?.title,
            description: tempData.basicInfo?.description || tempData.basicInfo?.observations,
            status: tempData.basicInfo?.status || 'draft',
            status_detalhado: tempData.basicInfo?.status_detalhado,
            event_type: tempData.basicInfo?.event_type,
            participants_count: tempData.basicInfo?.participants_count,
            start_date: tempData.basicInfo?.start_date,
            end_date: tempData.basicInfo?.end_date,
            start_time: tempData.basicInfo?.start_time,
            end_time: tempData.basicInfo?.end_time,
            location: tempData.basicInfo?.location,
            contractor_name: tempData.basicInfo?.contractor_name,
            requester_name: tempData.basicInfo?.requester_name,
            phone: tempData.basicInfo?.phone,
            email: tempData.basicInfo?.email,

            // Configurações de exibição
            incluir_opcionais: tempData.totalGeral?.incluir_opcionais || false,
            incluir_v_un_itens: tempData.totalGeral?.incluir_v_un_itens || false,
            incluir_v_un_insumos: tempData.totalGeral?.incluir_v_un_insumos || false,
            incluir_v_un_opcionais: tempData.totalGeral?.incluir_v_un_opcionais || false,

            // Totais calculados
            total_amount: tempData.totalGeral?.total_amount || 0,
            total_geral: tempData.totalGeral?.total_geral || 0,

            // Dados estruturados das etapas
            items: tempData.items || [],
            insumos: tempData.insumos || [],
            optionals: tempData.optionals || [],
            opcional_nao_inclusos: tempData.opcional_nao_inclusos || [],
            dados_fornecedor: tempData.fornecedor || null,
            politica: tempData.politica || null,
            condicoes_gerais: tempData.condicoesGerais || null,

            // Timestamps
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        return proposalData
    }

    // Validar se todos os dados necessários estão presentes
    validateCompleteness() {
        const tempData = this.getTempData()
        const errors = []

        if (!tempData.basicInfo) {
            errors.push('Informações básicas da proposta não encontradas')
        }

        if (!tempData.fornecedor?.supplier_id) {
            errors.push('Fornecedor não selecionado')
        }

        if (!tempData.items || tempData.items.length === 0) {
            errors.push('Nenhum item adicionado à proposta')
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
}

export default new TempProposalService()
