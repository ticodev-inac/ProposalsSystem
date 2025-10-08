import { ref, computed } from 'vue'
import { useDatabaseStore } from '@/stores/database'
import PDFDataService from '@/services/PDFDataService.js'
import PDFGenerator from '@/services/pdf-generator.js'

export function usePDF() {
    const isGenerating = ref(false)
    const progress = ref(0)
    const error = ref(null)

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

    /**
     * Gera PDF da proposta
     */
    const generateProposalPDF = async (proposal, options = {}) => {
        try {
            isGenerating.value = true
            error.value = null
            progress.value = 0

            // Etapa 1: Carregar dados completos (20%)
            progress.value = 20
            const pdfData = await PDFDataService.loadProposalData(proposal.id)

            // Etapa 2: Inicializar gerador PDF (40%)
            progress.value = 40
            const pdfGenerator = new PDFGenerator()
            await pdfGenerator.initialize()

            // Etapa 3: Gerar PDF (80%)
            progress.value = 80
            const pdfResult = await pdfGenerator.generateProposalPDF(pdfData, options)

            // Etapa 4: Download (100%)
            progress.value = 100
            const fileName = _buildFileName(pdfData)
            // Fazer download
            pdfResult.save(fileName)

            return {
                success: true,
                fileName,
                doc: pdfResult,
            }
        } catch (err) {
            error.value = err.message || 'Erro ao gerar PDF'
            console.error('Erro na geração do PDF:', err)
            throw err
        } finally {
            isGenerating.value = false
            progress.value = 0
        }
    }

    /**
     * Gera preview do PDF (sem download)
     */
    const generatePreview = async (proposal, options = {}) => {
        try {
            isGenerating.value = true
            error.value = null

            const pdfData = await PDFDataService.loadProposalData(proposal.id)

            const pdfGenerator = new PDFGenerator()
            await pdfGenerator.initialize()

            const pdfResult = await pdfGenerator.generateProposalPDF(pdfData, {
                ...options,
                preview: true,
            })

            const blob = pdfResult.output('blob')
            const url = URL.createObjectURL(blob)

            return url
        } catch (err) {
            error.value = err.message || 'Erro ao gerar preview'
            console.error('Erro na geração do preview:', err)
            throw err
        } finally {
            isGenerating.value = false
        }
    }

    return {
        isGenerating: computed(() => isGenerating.value),
        progress: computed(() => progress.value),
        error: computed(() => error.value),
        generateProposalPDF,
        generatePreview,
    }
}
