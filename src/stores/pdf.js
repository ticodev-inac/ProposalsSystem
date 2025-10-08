import { defineStore } from 'pinia'
import PDFDataService from '../services/PDFDataService.js'
import PDFGenerator from '../services/pdf-generator.js'

export const usePDFStore = defineStore('pdf', {
    state: () => ({
        // Estado da geração
        isGenerating: false,
        error: null,
        lastGeneratedAt: null,

        // Cache dos dados normalizados
        cachedPdfData: null,
        cachedProposalId: null,

        // Configurações
        options: {
            theme: 'default',
            includeWatermark: true,
            filename: null, // Auto-gerado se null
        },
    }),

    getters: {
        canGenerate: (state) => !state.isGenerating,
        hasError: (state) => !!state.error,
        isReady: (state) => !state.isGenerating && !state.error,
    },

    actions: {
        /**
         * Gera PDF de uma proposta
         * @param {string} proposalId - ID da proposta
         * @param {Object} customOptions - Opções personalizadas
         * @returns {Promise<Blob>} PDF como blob
         */
        async generatePDF(proposalId, customOptions = {}) {
            if (this.isGenerating) {
                throw new Error('Já existe uma geração de PDF em andamento')
            }

            this.isGenerating = true
            this.error = null

            try {
                console.log('🔄 Iniciando geração de PDF para proposta:', proposalId)

                // 1. Carregar e normalizar dados
                const pdfData = await this._loadPdfData(proposalId)

                // 2. Aplicar opções
                const options = { ...this.options, ...customOptions }

                // 3. Gerar PDF
                const doc = await PDFGenerator.generatePDF(pdfData, options)

                // 4. Gerar nome do arquivo
                const filename = this._generateFilename(pdfData, options.filename)

                // 5. Obter blob
                const blob = doc.output('blob')

                // 6. Atualizar estado
                this.lastGeneratedAt = new Date()
                this.cachedPdfData = pdfData
                this.cachedProposalId = proposalId

                console.log('✅ PDF gerado com sucesso:', filename)

                return { blob, filename, doc }
            } catch (error) {
                console.error('❌ Erro ao gerar PDF:', error)
                this.error = error.message || 'Erro desconhecido ao gerar PDF'
                throw error
            } finally {
                this.isGenerating = false
            }
        },

        /**
         * Gera e faz download do PDF
         * @param {string} proposalId - ID da proposta
         * @param {Object} customOptions - Opções personalizadas
         */
        async downloadPDF(proposalId, customOptions = {}) {
            try {
                const { doc, filename } = await this.generatePDF(proposalId, customOptions)
                doc.save(filename)
                return filename
            } catch (error) {
                console.error('Erro ao fazer download do PDF:', error)
                throw error
            }
        },

        /**
         * Gera PDF e retorna URL para preview
         * @param {string} proposalId - ID da proposta
         * @param {Object} customOptions - Opções personalizadas
         * @returns {Promise<string>} URL do blob
         */
        async generatePreviewURL(proposalId, customOptions = {}) {
            try {
                const { blob } = await this.generatePDF(proposalId, customOptions)
                return URL.createObjectURL(blob)
            } catch (error) {
                console.error('Erro ao gerar preview do PDF:', error)
                throw error
            }
        },

        /**
         * Carrega dados da proposta (com cache)
         */
        async _loadPdfData(proposalId) {
            // Verificar cache
            if (this.cachedProposalId === proposalId && this.cachedPdfData) {
                console.log('📋 Usando dados em cache para proposta:', proposalId)
                return this.cachedPdfData
            }

            // Carregar dados frescos
            console.log('🔄 Carregando dados da proposta:', proposalId)
            const pdfData = await PDFDataService.loadProposalData(proposalId)

            // Atualizar cache
            this.cachedPdfData = pdfData
            this.cachedProposalId = proposalId

            return pdfData
        },

        /**
         * Gera nome do arquivo baseado nos dados da proposta
         */
        _generateFilename(pdfData, customFilename) {
            if (customFilename) return customFilename

            const numero = pdfData.metadata?.numero || 'PROP'
            const cliente = pdfData.client?.nome || 'Cliente'
            const data = new Date().toISOString().slice(0, 10)

            // Limpar caracteres especiais
            const cleanCliente = cliente.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)

            return `${numero}_${cleanCliente}_${data}.pdf`
        },

        /**
         * Limpa cache e estado
         */
        clearCache() {
            this.cachedPdfData = null
            this.cachedProposalId = null
            this.error = null
            this.lastGeneratedAt = null
            console.log('🧹 Cache do PDF limpo')
        },

        /**
         * Atualiza opções de geração
         */
        updateOptions(newOptions) {
            this.options = { ...this.options, ...newOptions }
        },

        /**
         * Limpa erro
         */
        clearError() {
            this.error = null
        },
    },
})
