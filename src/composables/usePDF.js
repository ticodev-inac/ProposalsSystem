import { ref, computed } from 'vue'
import { useDatabaseStore } from '@/stores/database'
import PDFDataService from '@/services/PDFDataService.js'
import PDFGenerator from '@/services/pdf-generator.js'

export function usePDF() {
    const isGenerating = ref(false)
    const progress = ref(0)
    const error = ref(null)

    const databaseStore = useDatabaseStore()

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
            const fileName = `Proposta_${pdfData.metadata.numero || pdfData.metadata.id}_${new Date().toISOString().split('T')[0]}.pdf`

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
