<template>
  <div class="pdf-button-container">
    <!-- Botão principal -->
    <button 
      @click="handleGeneratePDF"
      :disabled="!canGenerate || !proposalId"
      :class="buttonClass"
      class="pdf-button"
    >
      <span v-if="isGenerating" class="loading-spinner"></span>
      <span class="button-icon">📄</span>
      <span class="button-text">{{ buttonText }}</span>
    </button>

    <!-- Menu de opções (dropdown) -->
    <div v-if="showOptions" class="pdf-options" ref="optionsMenu">
      <button @click="downloadPDF" :disabled="!canGenerate" class="option-item">
        <span class="option-icon">⬇️</span>
        Download PDF
      </button>
      
      <button @click="previewPDF" :disabled="!canGenerate" class="option-item">
        <span class="option-icon">👁️</span>
        Visualizar PDF
      </button>
      
      <hr class="option-divider">
      
      <label class="option-item checkbox-item">
        <input 
          type="checkbox" 
          v-model="options.includeWatermark"
          :disabled="!canGenerate"
        >
        <span>Incluir marca d'água</span>
      </label>
    </div>

    <!-- Indicador de erro -->
    <div v-if="hasError" class="error-message">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
      <button @click="clearError" class="error-close">×</button>
    </div>

    <!-- Modal de preview -->
    <div v-if="showPreview" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <div class="preview-header">
          <h3>Preview do PDF</h3>
          <button @click="closePreview" class="close-button">×</button>
        </div>
        <iframe 
          v-if="previewUrl" 
          :src="previewUrl" 
          class="preview-iframe"
          title="Preview do PDF"
        ></iframe>
        <div class="preview-actions">
          <button @click="downloadFromPreview" class="action-button primary">
            Download
          </button>
          <button @click="closePreview" class="action-button secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePDFStore } from '../stores/pdf.js'

export default {
  name: 'PDFButton',
  props: {
    proposalId: {
      type: String,
      required: true
    },
    variant: {
      type: String,
      default: 'primary', // primary, secondary, minimal
      validator: (value) => ['primary', 'secondary', 'minimal'].includes(value)
    },
    showDropdown: {
      type: Boolean,
      default: true
    },
    autoFilename: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['pdf-generated', 'pdf-error', 'pdf-downloaded'],

  setup(props, { emit }) {
    const pdfStore = usePDFStore()
    
    // Estado local
    const showOptions = ref(false)
    const showPreview = ref(false)
    const previewUrl = ref(null)
    const optionsMenu = ref(null)
    
    // Opções locais
    const options = ref({
      includeWatermark: true,
      theme: 'default'
    })

    // Computeds
    const isGenerating = computed(() => pdfStore.isGenerating)
    const canGenerate = computed(() => pdfStore.canGenerate && props.proposalId)
    const hasError = computed(() => pdfStore.hasError)
    const error = computed(() => pdfStore.error)

    const buttonText = computed(() => {
      if (isGenerating.value) return 'Gerando PDF...'
      return 'Gerar PDF'
    })

    const buttonClass = computed(() => {
      const classes = [`pdf-button--${props.variant}`]
      if (isGenerating.value) classes.push('pdf-button--loading')
      if (hasError.value) classes.push('pdf-button--error')
      return classes.join(' ')
    })

    // Métodos
    const handleGeneratePDF = async () => {
      if (props.showDropdown) {
        showOptions.value = !showOptions.value
      } else {
        await downloadPDF()
      }
    }

    const downloadPDF = async () => {
      try {
        showOptions.value = false
        const filename = await pdfStore.downloadPDF(props.proposalId, options.value)
        emit('pdf-downloaded', { filename, proposalId: props.proposalId })
      } catch (error) {
        emit('pdf-error', { error, proposalId: props.proposalId })
      }
    }

    const previewPDF = async () => {
      try {
        showOptions.value = false
        previewUrl.value = await pdfStore.generatePreviewURL(props.proposalId, options.value)
        showPreview.value = true
        emit('pdf-generated', { type: 'preview', proposalId: props.proposalId })
      } catch (error) {
        emit('pdf-error', { error, proposalId: props.proposalId })
      }
    }

    const downloadFromPreview = async () => {
      try {
        const filename = await pdfStore.downloadPDF(props.proposalId, options.value)
        emit('pdf-downloaded', { filename, proposalId: props.proposalId })
        closePreview()
      } catch (error) {
        emit('pdf-error', { error, proposalId: props.proposalId })
      }
    }

    const closePreview = () => {
      showPreview.value = false
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
      }
    }

    const clearError = () => {
      pdfStore.clearError()
    }

    // Fechar dropdown ao clicar fora
    const handleClickOutside = (event) => {
      if (optionsMenu.value && !optionsMenu.value.contains(event.target)) {
        showOptions.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      closePreview() // Limpar URL do preview
    })

    return {
      // Estado
      showOptions,
      showPreview,
      previewUrl,
      optionsMenu,
      options,
      
      // Computeds
      isGenerating,
      canGenerate,
      hasError,
      error,
      buttonText,
      buttonClass,
      
      // Métodos
      handleGeneratePDF,
      downloadPDF,
      previewPDF,
      downloadFromPreview,
      closePreview,
      clearError
    }
  }
}
</script>

<style scoped>
.pdf-button-container {
  position: relative;
  display: inline-block;
}

.pdf-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.pdf-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variantes do botão */
.pdf-button--primary {
  background: #0066cc;
  color: white;
}

.pdf-button--primary:hover:not(:disabled) {
  background: #0052a3;
}

.pdf-button--secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
}

.pdf-button--secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.pdf-button--minimal {
  background: transparent;
  color: #0066cc;
  padding: 6px 12px;
}

.pdf-button--minimal:hover:not(:disabled) {
  background: #f8f9fa;
}

/* Estado de loading */
.pdf-button--loading {
  pointer-events: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dropdown de opções */
.pdf-options {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 8px 0;
  margin-top: 4px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s ease;
}

.option-item:hover:not(:disabled) {
  background: #f8f9fa;
}

.option-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-item {
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 4px;
}

.option-divider {
  margin: 8px 0;
  border: none;
  border-top: 1px solid #dee2e6;
}

/* Mensagem de erro */
.error-message {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #f8d7da;
  color: #721c24;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1001;
}

.error-close {
  background: none;
  border: none;
  color: #721c24;
  cursor: pointer;
  font-size: 16px;
  margin-left: auto;
}

/* Modal de preview */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.preview-content {
  background: white;
  border-radius: 8px;
  width: 90vw;
  height: 90vh;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #dee2e6;
}

.preview-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-iframe {
  flex: 1;
  border: none;
  width: 100%;
}

.preview-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #dee2e6;
  justify-content: flex-end;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-button.primary {
  background: #0066cc;
  color: white;
}

.action-button.primary:hover {
  background: #0052a3;
}

.action-button.secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
}

.action-button.secondary:hover {
  background: #e9ecef;
}
</style>