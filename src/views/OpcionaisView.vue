<template>
  <div class="opcionais-page">
    <div class="page-header">
      <h1>Opcionais</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showCreateModal = true" v-if="!currentProposalId">
          <i class="fa-solid fa-plus"></i> Novo Opcional
        </button>
      </div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Buscar..."
          @input="currentProposalId ? filterItems() : filterOpcionais()"
        >
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>
      <div class="filters" v-if="!currentProposalId">
        <select v-model="selectedStatus" @change="filterOpcionais">
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>
    </div>

    

    <!-- Modo de seleção por proposta: listar Produtos e Serviços -->
    <div v-if="currentProposalId" class="itens-grid">
      <div class="grid-header">
        <div class="grid-cell">Código</div>
        <div class="grid-cell">Descrição</div>
        <div class="grid-cell">Categoria</div>
        <div class="grid-cell">Valor Unitário</div>
        <div class="grid-cell">Unidade</div>
        <div class="grid-cell">Ações</div>
      </div>

      <div v-if="loadingItems" class="loading">Carregando itens...</div>
      <div v-else-if="filteredItems.length === 0" class="no-data">Nenhum item encontrado</div>
      <div v-else>
        <div v-for="item in filteredItems" :key="item.key" class="grid-row">
          <div class="grid-cell">{{ item.codigo }}</div>
          <div class="grid-cell">{{ item.descricao }}</div>
          <div class="grid-cell">
            <span class="status-badge" :class="item.categoria === 'Produto' ? 'ativo' : 'inativo'">{{ item.categoria }}</span>
          </div>
          <div class="grid-cell">{{ formatCurrency(item.valor_unitario) }}</div>
          <div class="grid-cell">{{ item.unidade || '-' }}</div>
          <div class="grid-cell">
            <div class="action-buttons">
              <button 
                class="btn btn-sm btn-success"
                @click="selectAsOptional(item)"
                title="Selecionar como opcional"
              >
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid de CRUD antigo (aparece somente quando NÃO é fluxo por proposta) -->
    <div class="opcionais-grid" v-if="!currentProposalId">
      <div class="grid-header">
        <div class="grid-cell">Código</div>
        <div class="grid-cell">Descrição</div>
        <div class="grid-cell">Valor</div>
        <div class="grid-cell">Status</div>
        <div class="grid-cell">Não Inclusos</div>
        <div class="grid-cell">Ações</div>
      </div>
      
      <div v-if="loading" class="loading">Carregando...</div>
      
      <div v-else-if="filteredOpcionais.length === 0" class="no-data">
        Nenhum opcional encontrado
      </div>
      
      <div v-else>
        <div 
          v-for="opcional in filteredOpcionais" 
          :key="opcional.id" 
          class="grid-row"
        >
          <div class="grid-cell">{{ opcional.codigo }}</div>
          <div class="grid-cell">{{ opcional.descricao }}</div>
          <div class="grid-cell">{{ formatCurrency(opcional.valor) }}</div>
          <div class="grid-cell">
            <span class="status-badge" :class="opcional.status">
              {{ opcional.status === 'ativo' ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
          <div class="grid-cell">
            <span class="nao-inclusos" v-if="opcional.nao_inclusos">
              {{ opcional.nao_inclusos }}
            </span>
            <span v-else class="text-muted">-</span>
          </div>
          <div class="grid-cell">
            <div class="action-buttons">
              <button 
                class="btn btn-sm btn-secondary" 
                @click="editOpcional(opcional)"
                title="Editar"
              >
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button 
                class="btn btn-sm btn-danger" 
                @click="deleteOpcional(opcional.id)"
                title="Excluir"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Criar/Editar Opcional -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showEditModal ? 'Editar Opcional' : 'Novo Opcional' }}</h3>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveOpcional">
            <div class="form-group">
              <label>Código:</label>
              <input 
                type="text" 
                v-model="currentOpcional.codigo" 
                required
                placeholder="Código do opcional"
              >
            </div>
            <div class="form-group">
              <label>Descrição:</label>
              <textarea 
                v-model="currentOpcional.descricao" 
                required
                placeholder="Descrição do opcional"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label>Valor:</label>
              <input 
                type="number" 
                v-model="currentOpcional.valor" 
                step="0.01"
                min="0"
                required
                placeholder="0,00"
              >
            </div>
            <div class="form-group">
              <label>Status:</label>
              <select v-model="currentOpcional.status" required>
                <option value="">Selecione um status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Não Inclusos:</label>
              <textarea 
                v-model="currentOpcional.nao_inclusos" 
                placeholder="Itens não inclusos neste opcional"
                rows="3"
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeModals">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                {{ showEditModal ? 'Atualizar' : 'Criar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useDatabaseStore } from '@/stores/database'

export default {
  name: 'OpcionaisView',
  setup() {
    const router = useRouter()
    const database = useDatabaseStore()
    // --- CRUD existente ---
    const opcionais = ref([])
    const filteredOpcionais = ref([])
    const loading = ref(false)
    const searchTerm = ref('')
    const selectedStatus = ref('')
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const currentOpcional = ref({
      codigo: '',
      descricao: '',
      valor: 0,
      status: 'ativo',
      nao_inclusos: ''
    })

    const loadOpcionais = async () => {
      try {
        loading.value = true
        const { data, error } = await supabase
          .from('optionals')
          .select('*')
          .order('name')
        if (error) throw error
        const mapped = (data || []).map(r => ({
          ...r,
          codigo: r.name ?? r.codigo,
          descricao: r.description ?? r.descricao,
          valor: r.price ?? r.valor ?? 0,
          status: r.is_active ? 'ativo' : 'inativo',
          nao_inclusos: r.not_included ?? r.nao_inclusos ?? ''
        }))
        opcionais.value = mapped
        filteredOpcionais.value = mapped
      } catch (error) {
        console.error('Erro ao carregar opcionais:', error)
        alert('Erro ao carregar opcionais')
      } finally {
        loading.value = false
      }
    }

    const filterOpcionais = () => {
      let filtered = opcionais.value
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase()
        filtered = filtered.filter(opcional => 
          (opcional.codigo || '').toLowerCase().includes(term) ||
          (opcional.descricao || '').toLowerCase().includes(term)
        )
      }
      if (selectedStatus.value) {
        filtered = filtered.filter(opcional => opcional.status === selectedStatus.value)
      }
      filteredOpcionais.value = filtered
    }

    const editOpcional = (opcional) => {
      currentOpcional.value = { ...opcional }
      showEditModal.value = true
    }

    const saveOpcional = async () => {
      try {
        const payload = {
          name: currentOpcional.value.codigo,
          description: currentOpcional.value.descricao,
          price: currentOpcional.value.valor,
          is_active: currentOpcional.value.status === 'ativo',
          not_included: currentOpcional.value.nao_inclusos
        }
        if (showEditModal.value) {
          const { error } = await supabase
            .from('optionals')
            .update(payload)
            .eq('id', currentOpcional.value.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('optionals')
            .insert([payload])
          if (error) throw error
        }
        await loadOpcionais()
        closeModals()
      } catch (error) {
        console.error('Erro ao salvar opcional:', error)
        alert('Erro ao salvar opcional')
      }
    }

    const deleteOpcional = async (id) => {
      try {
        const { error } = await supabase
          .from('optionals')
          .delete()
          .eq('id', id)
        if (error) throw error
        await loadOpcionais()
      } catch (error) {
        console.error('Erro ao excluir opcional:', error)
        alert('Erro ao excluir opcional')
      }
    }

    const closeModals = () => {
      showCreateModal.value = false
      showEditModal.value = false
      currentOpcional.value = {
        codigo: '',
        descricao: '',
        valor: 0,
        status: 'ativo',
        nao_inclusos: ''
      }
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0)
    }

    // --- Novo: Fluxo de Opcionais por Proposta ---
    const currentProposalId = computed(() => database.currentProposalId)
    const currentProposal = ref(null)
    const currentProposalIdShort = computed(() => {
      const id = currentProposalId.value || ''
      return id ? id.substring(0, 8) + '…' : ''
    })

    const loadingItems = ref(false)
    const allItems = ref([])
    const filteredItems = ref([])
    const selectedOptionals = ref([])
    const savingSelection = ref(false)

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
        const existing = Array.isArray(data?.optionals) ? data.optionals : []
        selectedOptionals.value = existing.map((it) => ({
          key: it.key || `${it.source_table}:${it.source_id || it.id || it.codigo}`,
          source_table: it.source_table || 'products',
          source_id: it.source_id ?? it.id ?? null,
          id: it.source_id ?? it.id ?? null,
          codigo: it.codigo ?? it.name ?? '',
          descricao: it.descricao ?? it.description ?? '',
          categoria: it.categoria ?? (it.source_table === 'services' ? 'Serviço' : 'Produto'),
          unidade: it.unidade ?? it.unit ?? '',
          valor_unitario: Number(it.valor_unitario ?? it.price ?? 0),
          quantity: Number(it.quantity ?? 1)
        }))
      } catch (err) {
        console.error('Erro ao carregar proposta atual:', err)
      }
    }

    const loadProductsAndServices = async () => {
      try {
        loadingItems.value = true
        const [productsRes, servicesRes] = await Promise.all([
          supabase.from('products').select('*').order('name'),
          supabase.from('services').select('*').order('name')
        ])
        if (productsRes.error) throw productsRes.error
        if (servicesRes.error) throw servicesRes.error
        const products = (productsRes.data || []).map(p => ({
          key: `products:${p.id}`,
          source_table: 'products',
          source_id: p.id,
          id: p.id,
          codigo: p.name ?? p.codigo,
          descricao: p.description ?? p.descricao,
          categoria: 'Produto',
          unidade: p.unit ?? p.unidade ?? '',
          valor_unitario: Number(p.price ?? p.valor_unitario ?? 0)
        }))
        const services = (servicesRes.data || []).map(s => ({
          key: `services:${s.id}`,
          source_table: 'services',
          source_id: s.id,
          id: s.id,
          codigo: s.name ?? s.codigo,
          descricao: s.description ?? s.descricao,
          categoria: 'Serviço',
          unidade: s.unit ?? s.unidade ?? '',
          valor_unitario: Number(s.price ?? s.valor_unitario ?? 0)
        }))
        const combined = [...products, ...services]
        allItems.value = combined
        filteredItems.value = filterItemsInternal(combined, searchTerm.value)
      } catch (err) {
        console.error('Erro ao carregar itens:', err)
        alert('Erro ao carregar itens para opcionais')
      } finally {
        loadingItems.value = false
      }
    }

    const filterItemsInternal = (items, term) => {
      if (!term) return items
      const t = term.toLowerCase()
      return items.filter(item => 
        (item.codigo || '').toLowerCase().includes(t) ||
        (item.descricao || '').toLowerCase().includes(t) ||
        (item.categoria || '').toLowerCase().includes(t)
      )
    }
    const filterItems = () => {
      filteredItems.value = filterItemsInternal(allItems.value, searchTerm.value)
    }

    const selectAsOptional = (item) => {
      if (!currentProposalId.value) return
      const key = `${item.source_table}:${item.id}`
      const existing = selectedOptionals.value.find(s => s.key === key)
      if (existing) {
        existing.quantity = Number(existing.quantity || 1) + 1
      } else {
        selectedOptionals.value.push({
          ...item,
          quantity: 1
        })
      }
    }

    const onQtyChange = (s) => {
      if (Number(s.quantity) < 1 || isNaN(Number(s.quantity))) {
        s.quantity = 1
      }
    }

    const removeSelected = (s) => {
      selectedOptionals.value = selectedOptionals.value.filter(x => x.key !== s.key)
    }

    const optionalsSubtotal = computed(() => {
      return selectedOptionals.value.reduce((sum, it) => sum + (Number(it.valor_unitario || 0) * Number(it.quantity || 1)), 0)
    })

    const saveSelection = async () => {
      if (!currentProposalId.value) return
      try {
        savingSelection.value = true
        const payload = selectedOptionals.value.map(s => ({
          key: s.key,
          source_table: s.source_table,
          source_id: s.source_id,
          codigo: s.codigo,
          descricao: s.descricao,
          categoria: s.categoria,
          unidade: s.unidade,
          valor_unitario: s.valor_unitario,
          quantity: s.quantity
        }))
        // Não altera total_amount aqui (opcionais não somam no total principal por padrão)
        const { error } = await supabase
          .from('proposals')
          .update({
            optionals: payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProposalId.value)
        if (error) throw error
        if (!currentProposal.value) currentProposal.value = {}
        currentProposal.value.optionals = payload
        alert('Opcionais salvos com sucesso!')
        router.push('/total-geral')
      } catch (err) {
        console.error('Erro ao salvar opcionais da proposta:', err)
        alert('Erro ao salvar opcionais da proposta')
      } finally {
        savingSelection.value = false
      }
    }

    const cancelEditing = () => {
      if (confirm('Tem certeza que deseja cancelar a edição da proposta? As alterações não salvas serão perdidas.')) {
        database.clearEditingState()
        TempProposalService.clearTempData()
        router.push('/propostas')
      }
    }

    onMounted(() => {
      if (currentProposalId.value) {
        loadProductsAndServices()
        loadProposal()
      } else {
        loadOpcionais()
      }
    })

    return {
      // CRUD antigo
      opcionais,
      filteredOpcionais,
      loading,
      searchTerm,
      selectedStatus,
      showCreateModal,
      showEditModal,
      currentOpcional,
      filterOpcionais,
      saveOpcional,
      editOpcional,
      deleteOpcional,
      closeModals,

      // Novo fluxo por proposta
      currentProposalId,
      currentProposal,
      currentProposalIdShort,
      loadingItems,
      allItems,
      filteredItems,
      selectedOptionals,
      savingSelection,
      filterItems,
      selectAsOptional,
      onQtyChange,
      removeSelected,
      optionalsSubtotal,
      saveSelection,
      cancelEditing,

      formatCurrency
    }
  }
}
</script>

<style scoped>
.opcionais-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-box i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filters select {
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 150px;
}

/* Contexto da Proposta */
.proposal-context {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1976d2;
  font-weight: 500;
}

.proposal-context .badge {
  background: #2196f3;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* Grid de Itens para Seleção */
.itens-grid {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.itens-grid .grid-header {
  display: grid;
  grid-template-columns: 120px 2fr 120px 120px 100px 120px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  color: #495057;
}

.itens-grid .grid-row {
  display: grid;
  grid-template-columns: 120px 2fr 120px 120px 100px 120px;
  border-bottom: 1px solid #dee2e6;
  transition: background-color 0.2s;
}

.itens-grid .grid-row:hover {
  background-color: #f8f9fa;
}

.itens-grid .grid-cell {
  padding: 15px;
  display: flex;
  align-items: center;
  border-right: 1px solid #dee2e6;
}

.itens-grid .grid-cell:last-child {
  border-right: none;
}

/* Painel de Seleção */
.selection-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.selection-panel.empty {
  min-height: 200px;
}

.panel-header {
  background: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
}

.panel-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.empty-selection {
  padding: 40px 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.empty-selection .pill {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin: 0 5px;
}

.selected-list {
  padding: 0;
}

.selected-row {
  display: grid;
  grid-template-columns: 100px 2fr 100px 80px 80px 100px 100px 80px;
  padding: 12px 20px;
  border-bottom: 1px solid #dee2e6;
  align-items: center;
  gap: 10px;
}

.selected-row.header {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.selected-row:last-child {
  border-bottom: none;
}

.qty-input {
  width: 60px;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.panel-footer {
  background: #f8f9fa;
  padding: 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.subtotal {
  font-size: 16px;
  color: #333;
}

.subtotal strong {
  color: #28a745;
  font-size: 18px;
}

.next-actions {
  display: flex;
  gap: 10px;
}

/* Grid de CRUD antigo */
.opcionais-grid {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.opcionais-grid .grid-header {
  display: grid;
  grid-template-columns: 120px 1fr 120px 100px 200px 120px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  color: #495057;
}

.opcionais-grid .grid-row {
  display: grid;
  grid-template-columns: 120px 1fr 120px 100px 200px 120px;
  border-bottom: 1px solid #dee2e6;
  transition: background-color 0.2s;
}

.opcionais-grid .grid-row:hover {
  background-color: #f8f9fa;
}

.opcionais-grid .grid-cell {
  padding: 15px;
  display: flex;
  align-items: center;
  border-right: 1px solid #dee2e6;
}

.opcionais-grid .grid-cell:last-child {
  border-right: none;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.ativo {
  background: #d4edda;
  color: #155724;
}

.status-badge.inativo {
  background: #f8d7da;
  color: #721c24;
}

.nao-inclusos {
  font-size: 12px;
  color: #666;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-muted {
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
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

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .opcionais-page {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .search-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .itens-grid .grid-header,
  .itens-grid .grid-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .opcionais-grid .grid-header,
  .opcionais-grid .grid-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .grid-cell {
    border-right: none;
    border-bottom: 1px solid #dee2e6;
    justify-content: space-between;
  }
  
  .selected-row {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  
  .panel-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .next-actions {
    justify-content: center;
  }
}
</style>
