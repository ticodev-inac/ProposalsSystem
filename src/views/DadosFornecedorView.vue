<template>
  <div class="dados-fornecedor-container">
    <div class="header-section">
      <h1>Dados do Fornecedor</h1>
      <p class="subtitle">Selecione e configure os dados do fornecedor para esta proposta</p>
    </div>

    <!-- Seleção de Fornecedor -->
    <div class="card supplier-selection">
      <div class="card-header">
        <h3>Selecionar Fornecedor</h3>
        <p>Encontre o fornecedor apropriado para esta proposta</p>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="supplierSelect">Fornecedor *</label>
          <select 
            id="supplierSelect"
            v-model="selectedSupplierId" 
            @change="onSupplierChange"
            class="form-control"
            :disabled="loading"
          >
            <option value="">Selecione um fornecedor</option>
            <option 
              v-for="supplier in suppliers" 
              :key="supplier.id" 
              :value="supplier.id"
            >
              {{ supplier.company_name }} - {{ formatCNPJ(supplier.cnpj) }}
            </option>
          </select>
        </div>

        <!-- Fornecedor Selecionado -->
        <div v-if="selectedSupplier" class="selected-supplier-info">
          <h4>{{ selectedSupplier.company_name }}</h4>
          <div class="supplier-details">
            <p><strong>CNPJ:</strong> {{ formatCNPJ(selectedSupplier.cnpj) }}</p>
            <p><strong>Telefone:</strong> {{ formatPhone(selectedSupplier.phone) }}</p>
            <p><strong>Email:</strong> {{ selectedSupplier.email }}</p>
            <p><strong>Endereço:</strong> {{ selectedSupplier.address }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Finalizar Proposta -->
    <div class="finalize-section">
      <h3>Finalizar Proposta</h3>
      <p>Após selecionar o fornecedor, você pode finalizar a proposta.</p>
      
      <div class="action-buttons">
        <button 
          @click="goBack" 
          class="btn btn-secondary"
        >
          Voltar
        </button>
        <button 
          @click="finalizeProposal" 
          class="btn btn-success"
          :disabled="!selectedSupplier || saving"
        >
          {{ saving ? 'Salvando...' : 'Finalizar Proposta' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useDatabaseStore } from '../stores/database'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'
import FixoService from '../services/fixoService'
import TempProposalService from '@/services/TempProposalService'

const supabase = createClient(
  'https://kmwxjhqtqhpznhxwwjcf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3hqaHF0cWhwem5oeHd3amNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODQyMDgsImV4cCI6MjA3MzI2MDIwOH0.GTrvSxzV_mcE88m2fYw5pX3Ag78oicHoL1x11VP8tiI'
)

export default {
  name: 'DadosFornecedorView',
  setup() {
    const database = useDatabaseStore()

    // Estados
    const loading = ref(false)
    const saving = ref(false)
    
    // Fornecedores
    const suppliers = ref([])
    const selectedSupplierId = ref('')
    const selectedSupplier = ref(null)

    // Proposta atual
    const currentProposalId = computed(() => database.currentProposalId)

    // Router
    const router = useRouter()

    // Carregar fornecedores - usando 'suppliers' que é o nome correto
    const loadSuppliers = async () => {
      try {
        loading.value = true
        const { data, error } = await supabase
          .from('suppliers')  // Nome correto conforme mostrado na imagem
          .select('*')
          .order('company_name')

        if (error) throw error
        suppliers.value = data || []
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error)
        alert('Erro ao carregar fornecedores: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // Quando selecionar um fornecedor
    const onSupplierChange = () => {
      if (selectedSupplierId.value) {
        selectedSupplier.value = suppliers.value.find(s => s.id === selectedSupplierId.value)
      } else {
        selectedSupplier.value = null
      }
    }

    // Finalizar proposta
    const finalizeProposal = async () => {
      if (!selectedSupplier.value || !currentProposalId.value) return

      try {
        saving.value = true
        
        // Atualizar proposta com fornecedor selecionado
        const { error } = await supabase
          .from('proposals')  // Corrigido: era 'propostas', agora é 'proposals'
          .update({ 
            supplier_id: selectedSupplier.value.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProposalId.value)

        if (error) throw error

        alert('Proposta finalizada com sucesso!')
        router.push('/propostas')
      } catch (error) {
        console.error('Erro ao finalizar proposta:', error)
        alert('Erro ao finalizar proposta: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    // Voltar
    const goBack = () => {
      router.go(-1)
    }

    // Formatadores
    const formatCNPJ = (cnpj) => {
      if (!cnpj) return ''
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }

    const formatPhone = (phone) => {
      if (!phone) return ''
      return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
    }

    // Carregar dados da proposta atual
    const loadProposalData = async () => {
      if (!currentProposalId.value) return

      try {
        const { data, error } = await supabase
          .from('proposals')  // Corrigido: era 'propostas', agora é 'proposals'
          .select('supplier_id')
          .eq('id', currentProposalId.value)
          .single()

        if (error) throw error

        if (data?.supplier_id) {
          selectedSupplierId.value = data.supplier_id
          onSupplierChange()
        }
      } catch (error) {
        console.error('Erro ao carregar dados da proposta:', error)
      }
    }

    onMounted(async () => {
      await loadSuppliers()
      await loadProposalData()
    })

    return {
      loading,
      saving,
      suppliers,
      selectedSupplierId,
      selectedSupplier,
      currentProposalId,
      onSupplierChange,
      finalizeProposal,
      goBack,
      formatCNPJ,
      formatPhone
    }
  }
}
</script>

<style scoped>
.dados-fornecedor-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
}

.card {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.card-header {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.card-header h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.card-header p {
  margin: 0;
  color: #6c757d;
}

.card-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.selected-supplier-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #e3f2fd;
  border-radius: 0.375rem;
  border-left: 4px solid #2196f3;
}

.selected-supplier-info h4 {
  margin: 0 0 1rem 0;
  color: #1976d2;
}

.supplier-details p {
  margin: 0.5rem 0;
  color: #495057;
}

.finalize-section {
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.finalize-section h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.finalize-section p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #218838;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .dados-fornecedor-container {
    padding: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>


