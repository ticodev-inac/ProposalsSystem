import { ref, computed } from 'vue'
import { useDatabaseStore } from '@/stores/database'
import PDFDataService from '@/services/PDFDataService.js'
import PDFGenerator from '@/services/pdf-generator.js'

// Estado global para geração de PDF
const isGenerating = ref(false)
const generationError = ref(null)
const lastGeneratedPDF = ref(null)

export function usePDFGenerator() {
    const databaseStore = useDatabaseStore()

    // ==== Helpers para montar o nome do arquivo (DDMMAAAA_SISTEMA_AGENCIA_CIDADE.pdf) ====
    const _slug = (s) =>
        !s
            ? ''
            : String(s)
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-zA-Z0-9]+/g, '_')
                  .replace(/^_+|_+$/g, '')
                  .replace(/_+/g, '_')

    const _formatDateForName = (raw) => {
        if (!raw) {
            const d = new Date()
            return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`
        }
        const ymd = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})$/) // AAAA-MM-DD
        if (ymd) return `${ymd[3]}${ymd[2]}${ymd[1]}`
        const dmy = String(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/) // DD/MM/AAAA
        if (dmy) return `${dmy[1]}${dmy[2]}${dmy[3]}`
        return _formatDateForName(null)
    }

    const _extractCity = (local) => {
        if (!local) return ''
        // pega o último pedaço após "-" ou ","
        if (local.includes('-')) return local.split('-').pop().trim()
        if (local.includes(',')) return local.split(',').pop().trim()
        return String(local).trim()
    }

    const _buildFileName = (pdfData) => {
        const data = _formatDateForName(
            pdfData?.event?.data_inicio || pdfData?.metadata?.data_criacao
        )
        const sistema =
            pdfData?.metadata?.sistema || pdfData?.event?.sistema || pdfData?.event?.tipo || ''
        const agencia =
            pdfData?.event?.empresa_contratante ||
            pdfData?.client?.nome ||
            pdfData?.cliente?.nome ||
            ''
        const cidade = pdfData?.event?.cidade || _extractCity(pdfData?.event?.local) || ''

        const parts = [data, _slug(sistema), _slug(agencia), _slug(cidade)].filter(Boolean)

        if (!parts.length) {
            const today = new Date().toISOString().slice(0, 10)
            const n = pdfData?.metadata?.numero || pdfData?.metadata?.id || 'sem_numero'
            return `Proposta_${n}_${today}.pdf`
        }
        return `${parts.join('_')}.pdf`
    }

    // Estado computado
    const canGenerate = computed(() => !isGenerating.value)
    const hasError = computed(() => !!generationError.value)

    // Limpar erro
    const clearError = () => {
        generationError.value = null
    }

    // Gerar PDF da proposta
    const generateProposalPDF = async (proposalId, options = {}) => {
        if (isGenerating.value) {
            throw new Error('Já existe uma geração de PDF em andamento')
        }

        try {
            isGenerating.value = true
            generationError.value = null

            console.log('🔄 Iniciando geração de PDF para proposta:', proposalId)

            // 1. Carregar dados da proposta
            const pdfData = await PDFDataService.loadProposalData(proposalId)

            // 2. Inicializar gerador
            const pdfGenerator = new PDFGenerator()
            await pdfGenerator.initialize()

            // 3. Gerar PDF
            const doc = await pdfGenerator.generateProposalPDF(pdfData, options)

            // 4. Preparar informações do PDF
            const filename = _buildFileName(pdfData)
            const blob = doc.output('blob')

            const pdfInfo = {
                doc,
                blob,
                filename,
                proposalId,
                generatedAt: new Date(),
            }

            lastGeneratedPDF.value = pdfInfo
            console.log('✅ PDF gerado com sucesso:', filename)

            return pdfInfo
        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error)
            generationError.value = error.message || 'Erro desconhecido ao gerar PDF'
            throw error
        } finally {
            isGenerating.value = false
        }
    }

    // Download do PDF
    const downloadPDF = (pdfInfo = null) => {
        const pdf = pdfInfo || lastGeneratedPDF.value

        if (!pdf || !pdf.blob) {
            throw new Error('Nenhum PDF disponível para download')
        }

        try {
            const url = URL.createObjectURL(pdf.blob)
            const link = document.createElement('a')
            link.href = url
            link.download = pdf.filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            console.log('PDF baixado:', pdf.filename)
        } catch (error) {
            console.error('Erro ao baixar PDF:', error)
            throw new Error('Erro ao baixar o arquivo PDF')
        }
    }

    // Gerar e baixar PDF em uma operação
    const generateAndDownloadPDF = async (proposalId, options = {}) => {
        try {
            const pdfInfo = await generateProposalPDF(proposalId, options)
            downloadPDF(pdfInfo)
            return pdfInfo
        } catch (error) {
            console.error('Erro ao gerar e baixar PDF:', error)
            throw error
        }
    }

    // Gerar preview do PDF
    const previewPDF = async (proposalId, options = {}) => {
        try {
            const pdfInfo = await generateProposalPDF(proposalId, options)
            const url = URL.createObjectURL(pdfInfo.blob)
            return url
        } catch (error) {
            console.error('Erro ao gerar preview:', error)
            throw error
        }
    }

    return {
        // Estado
        isGenerating: computed(() => isGenerating.value),
        generationError: computed(() => generationError.value),
        lastGeneratedPDF: computed(() => lastGeneratedPDF.value),
        canGenerate,
        hasError,

        // Métodos
        generateProposalPDF,
        downloadPDF,
        generateAndDownloadPDF,
        previewPDF,
        clearError,
    }
}
