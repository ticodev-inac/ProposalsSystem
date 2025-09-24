<template>
  <!-- template header -->
  <div class="header-proposal">
    <div class="header-content">
      <div class="header-left">
        <h1>{{ title }}</h1>
        <p class="page-subtitle">{{ subtitle }}</p>
        <div class="proposal-context" v-if="showProposalContext">
         
        </div>
      </div>
      <div class="header-actions">
        <!-- Slot para ações customizadas -->
        <slot name="actions"></slot>
        
        <button 
          class="btn-cancel" 
          @click="$emit('cancel')"
          v-if="showCancelButton"
        >
          <i class="fas fa-times"></i>
          {{ cancelButtonText }}
        </button>
        <!-- mantém os demais botões -->
        <button 
          class="btn-advance" 
          @click="$emit('advance')"
          :disabled="!canAdvance"
          v-if="showAdvanceButton"
        >
          <i class="fas fa-arrow-right"></i>
          {{ advanceButtonText }}
        </button>
        <button 
          class="btn-save" 
          @click="$emit('save')"
          :disabled="!canSave"
          v-if="showSaveButton"
        >
          <i class="fas fa-save"></i>
          {{ saveButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  showProposalContext: {
    type: Boolean,
    default: true
  },
  proposalInfo: {
    type: String,
    default: ''
  },
  showCancelButton: {
    type: Boolean,
    default: true
  },
  showAdvanceButton: {
    type: Boolean,
    default: true
  },
  showSaveButton: {
    type: Boolean,
    default: false
  },
  advanceButtonText: {
    type: String,
    default: 'Avançar'
  },
  saveButtonText: {
    type: String,
    default: 'Salvar'
  },
  canAdvance: {
    type: Boolean,
    default: true
  },
  canSave: {
    type: Boolean,
    default: true
  },
  cancelButtonText: {
    type: String,
    default: 'Cancelar'
  }
})

const emit = defineEmits(['cancel', 'advance', 'save'])
</script>

<style scoped>
.header-proposal {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 1200px;
  margin: 0 auto;
}

.header-left h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.proposal-context {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.proposal-status {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  width: fit-content;
}

.proposal-info {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.btn-cancel,
.btn-advance,
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  min-height: 36px;
}

/* Estilos para botões customizados no slot */
.header-actions .btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  font-weight: 500;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s;
}

.header-actions .btn-lg {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 36px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-advance {
  background: #3b82f6;
  color: white;
}

.btn-advance:hover:not(:disabled) {
  background: #2563eb;
}

.btn-advance:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-save {
  background: #10b981;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #059669;
}

.btn-save:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-cancel i,
.btn-advance i,
.btn-save i {
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .header-proposal {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .btn-cancel,
  .btn-advance,
  .btn-save {
    padding: 0.625rem 1.25rem;
    font-size: 0.8rem;
  }
}
</style>