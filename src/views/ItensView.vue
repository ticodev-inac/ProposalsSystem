<template>
  <div class="itens-page">
    <!-- Header Padronizado -->
    <HeaderProposal
      title="Itens"
      subtitle="Adicione produtos e serviços à sua proposta"
      :context-info="proposalContextInfo"
      :can-advance="canAdvance"
      @cancel="cancelEditing"
      @advance="goToInsumos"
    >
      <template #actions>
        <!-- Botões removidos conforme solicitado -->
      </template>
    </HeaderProposal>

    <!-- Seção de Busca e Filtros -->
    <div class="search-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Buscar itens..."
          @input="filterItens"
        >
        <i class="fas fa-search"></i>
      </div>
      <div class="filters">
        <select v-model="selectedCategory" @change="onCategoryTypeChange">
          <option value="">Todos os tipos</option>
          <option value="produto">Produtos</option>
          <option value="servico">Serviços</option>
        </select>
        <select v-model="selectedSpecificCategory" @change="filterItens" :disabled="!selectedCategory">
          <option value="">Todas as categorias</option>
          <option 
            v-for="category in filteredCategories" 
            :key="category.id" 
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        <button class="btn btn-secondary btn-sm" @click="clearFilters" v-if="selectedCategory || selectedSpecificCategory">
          <i class="fas fa-times"></i> Limpar Filtros
        </button>
      </div>
    </div>

    <div class="itens-grid">
      <div class="grid-header">
        <div class="grid-cell">Item</div>
        <div class="grid-cell">Categoria</div>
        <div class="grid-cell">Valor Unitário</div>
        <div class="grid-cell">Unidade</div>
        <div class="grid-cell">Ações</div>
      </div>
      
      <div v-if="loading" class="loading">Carregando...</div>
      
      <div v-else-if="filteredItens.length === 0" class="no-data">
        Nenhum item encontrado
      </div>
      
      <div v-else>
        <div 
          v-for="item in filteredItens" 
          :key="`${item.categoria}-${item.id}`" 
          class="grid-row"
        >
          <div class="grid-cell item-cell">
            <div class="item-name"> {{ item.codigo }}</div>
            <div class="item-description">{{ item.descricao }}</div>
          </div>
          <div class="grid-cell">
            <div class="category-info">
              <span class="category-name">{{ item.category_name || 'Sem categoria' }}</span>
            </div>
          </div>
          <div class="grid-cell">{{ formatCurrency(item.valor_unitario) }}</div>
          <div class="grid-cell">{{ item.unidade }}</div>
          <div class="grid-cell">
            <div class="action-buttons">
              <button 
                class="btn btn-sm btn-secondary" 
                @click="editItem(item)"
                title="Editar"
              >
                ✏️
              </button>
              <button 
                class="btn btn-sm btn-success" 
                @click="selectItem(item)"
                title="Selecionar"
              >
                ✓
              </button>
            </div>
          </div>
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
import HeaderProposal from '@/components/HeaderProposal.vue'
import TempProposalService from '@/services/TempProposalService'

export default {
  name: 'ItensView',
  components: {
    HeaderProposal
  },
  setup() {
    const router = useRouter()
    const database = useDatabaseStore()
    const itens = ref([])
    const filteredItens = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const searchTerm = ref('')
    const selectedCategory = ref('')
    const selectedSpecificCategory = ref('')
    const categories = ref([])
    const filteredCategories = computed(() => {
      if (!selectedCategory.value) return []
      
      if (selectedCategory.value === 'produto') {
        // Para produtos, mostrar categorias do tipo 'produto'
        return categories.value.filter(cat => cat.type === 'produto')
      } else if (selectedCategory.value === 'servico') {
        // Para serviços, mostrar categorias do tipo 'servico'
        return categories.value.filter(cat => cat.type === 'servico')
      }
      
      return []
    })
    const showEditModal = ref(false)
    const isEditing = ref(false)
    const itemForm = ref({
      id: null,
      name: '',
      description: '',
      price: 0,
      category: '',
      is_active: true
    })
    const currentItem = ref({
      codigo: '',
      descricao: '',
      categoria: '',
      valor_unitario: 0,
      unidade: '',
      category_id: null
    })

    // Contexto da proposta
    const currentProposalId = computed(() => database.currentProposalId)
    const currentProposal = ref(null)
    const savingSelection = ref(false)
    const selectedItems = ref([])
    
    // Informações para o header padronizado
    const proposalContextInfo = computed(() => {
      const tempData = TempProposalService.getTempData()
      return {
        title: tempData?.title || 'Nova Proposta',
        client: tempData?.client_name || 'Cliente não selecionado',
        step: 'Itens',
        totalSteps: 5
      }
    })

    const canAdvance = computed(() => {
      return selectedItems.value.length > 0
    })

    const currentProposalIdShort = computed(() => {
      const id = currentProposalId.value || ''
      return id ? id.substring(0, 8) + '…' : ''
    })
    const itemsSubtotal = computed(() => {
      return selectedItems.value.reduce((sum, it) => sum + (Number(it.valor_unitario || 0) * Number(it.quantity || 1)), 0)
    })

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
        // Reconstrói seleção a partir do que já existe na proposta
        const existing = Array.isArray(data?.items) ? data.items : []
        selectedItems.value = existing.map((it) => ({
          key: it.key || `${it.source_table || (it.categoria === 'produto' ? 'products' : 'services')}:${it.source_id || it.id || it.codigo}`,
          source_table: it.source_table || (it.categoria === 'produto' ? 'products' : 'services'),
          source_id: it.source_id ?? it.id ?? null,
          id: it.source_id ?? it.id ?? null,
          codigo: it.codigo ?? it.name ?? '',
          descricao: it.descricao ?? it.description ?? '',
          categoria: it.categoria ?? (it.source_table === 'products' ? 'produto' : 'servico'),
          unidade: it.unidade ?? it.unit ?? '',
          valor_unitario: Number(it.valor_unitario ?? it.price ?? 0),
          quantity: Number(it.quantity ?? 1)
        }))
      } catch (err) {
        console.error('Erro ao carregar proposta atual:', err)
      }
    }

    const loadItens = async () => {
      try {
        loading.value = true
        
        // Carrega produtos com categoria (products tem category_id)
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*, category:category_id(id, name, type)')
          .order('name')
        
        // Carrega serviços sem categoria (services não tem category_id)
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .order('name')
        
        if (productsError) throw productsError
        if (servicesError) throw servicesError

        const mapProduct = (r) => ({
          ...r,
          codigo: r.name ?? r.codigo ?? '',
          descricao: r.description ?? r.descricao ?? '',
          categoria: 'produto',
          category_id: r.category_id || null,
          category_name: r.category?.name || 'Sem categoria',
          valor_unitario: Number(r.price ?? r.valor_unitario ?? 0),
          unidade: r.unit ?? r.unidade ?? '',
          status: 'ativo'
        })

        const mapService = (r) => ({
          ...r, // Preservar todos os campos originais
          codigo: r.name ?? r.codigo,
          descricao: r.description ?? r.descricao,
          categoria: 'servico',
          category_id: null, // services não tem category_id
          category_name: r.category || 'Serviço', // usar categoria real do serviço ou padrão
          valor_unitario: r.price ?? r.valor_unitario,
          unidade: r.unit ?? r.unidade,
          status: 'ativo',
          // Incluir campos adicionais dos serviços
          min_price: r.min_price ?? null,
          max_price: r.max_price ?? null,
          duration_hours: r.duration_hours ?? null,
          observations: r.observations ?? '',
          category: r.category ?? ''
        })

        const mapped = [
          ...(products || []).map(mapProduct),
          ...(services || []).map(mapService)
        ]

        itens.value = mapped
        filteredItens.value = mapped
        
        console.log('Itens carregados:', mapped.length)
      } catch (error) {
        console.error('Erro ao carregar itens:', error)
        alert('Erro ao carregar itens: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        if (error) throw error
        categories.value = data || []
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }

    const filterItens = () => {
      let filtered = itens.value
      
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase()
        filtered = filtered.filter(item => 
          item.codigo.toLowerCase().includes(term) ||
          item.descricao.toLowerCase().includes(term) ||
          item.category_name.toLowerCase().includes(term)
        )
      }
      
      if (selectedCategory.value) {
        filtered = filtered.filter(item => item.categoria === selectedCategory.value)
      }

      if (selectedSpecificCategory.value) {
        // Para produtos: filtrar por category_id
        // Para serviços: filtrar por category (nome da categoria)
        filtered = filtered.filter(item => {
          if (item.categoria === 'produto') {
            return item.category_id === selectedSpecificCategory.value
          } else {
            // Para serviços, comparar com o nome da categoria
            const categoryName = categories.value.find(cat => cat.id === selectedSpecificCategory.value)?.name
            return item.category === categoryName
          }
        })
      }
      
      filteredItens.value = filtered
    }

    const onCategoryTypeChange = () => {
      selectedSpecificCategory.value = ''
      filterItens()
    }

    const clearFilters = () => {
      selectedCategory.value = ''
      selectedSpecificCategory.value = ''
      searchTerm.value = ''
      filterItens()
    }

    const selectForProposal = (item) => {
      if (!currentProposalId.value) return
      const key = `${item.categoria === 'produto' ? 'products' : 'services'}:${item.id}`
      const existing = selectedItems.value.find((s) => s.key === key)
      if (existing) {
        existing.quantity = Number(existing.quantity || 1) + 1
      } else {
        selectedItems.value.push({
          key,
          source_table: item.categoria === 'produto' ? 'products' : 'services',
          source_id: item.id,
          id: item.id,
          codigo: item.codigo,
          descricao: item.descricao,
          categoria: item.categoria,
          unidade: item.unidade,
          valor_unitario: Number(item.valor_unitario || 0),
          quantity: 1
        })
      }
    }

    const selectItem = (item) => {
      selectForProposal(item)
    }

    const onQtyChange = (s) => {
      if (Number(s.quantity) < 1 || isNaN(Number(s.quantity))) {
        s.quantity = 1
      }
    }

    const removeSelected = (s) => {
      selectedItems.value = selectedItems.value.filter((x) => x.key !== s.key)
    }

    const saveSelection = async () => {
      if (!currentProposalId.value) return
      try {
        savingSelection.value = true
        // Normaliza payload a ser salvo no JSON da proposta
        const payload = selectedItems.value.map((s) => ({
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

        // Recalcula total_amount preservando outras parcelas (se possível)
        let currentTotal = Number(currentProposal.value?.total_amount || 0)
        let prevItemsSubtotal = 0
        if (Array.isArray(currentProposal.value?.items)) {
          prevItemsSubtotal = currentProposal.value.items.reduce((sum, it) => sum + (Number(it.valor_unitario || 0) * Number(it.quantity || 1)), 0)
        }
        const newItemsSubtotal = itemsSubtotal.value
        const newTotalAmount = currentTotal - prevItemsSubtotal + newItemsSubtotal

        const { error } = await supabase
          .from('proposals')
          .update({
            items: payload,
            total_amount: newTotalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProposalId.value)
        if (error) throw error

        // Atualiza localmente e avança
        if (!currentProposal.value) currentProposal.value = {}
        currentProposal.value.items = payload
        currentProposal.value.total_amount = newTotalAmount

        alert('Itens da proposta salvos com sucesso!')
        
        // Avança para a próxima etapa (Insumos)
        router.push('/insumos')
      } catch (err) {
        console.error('Erro ao salvar seleção de itens:', err)
        alert('Erro ao salvar itens da proposta')
      } finally {
        savingSelection.value = false
      }
    }

    const goToOptionals = () => {
      router.push('/opcionais')
    }

    const saveItem = async () => {
      try {
        saving.value = true

        // Determinar automaticamente se é produto ou serviço baseado na categoria
        const selectedCategory = categories.value.find(c => c.id === currentItem.value.category_id)
        if (selectedCategory) {
          currentItem.value.categoria = selectedCategory.type === 'produto' ? 'produto' : 'servico'
        } else {
          // Se não tem categoria, usar o valor padrão ou manter o atual
          currentItem.value.categoria = currentItem.value.categoria || 'produto'
        }

        // Direciona para a tabela correta com base em categoria
        const table = currentItem.value.categoria === 'produto' ? 'products' : 'services'
        const payload = {
          name: currentItem.value.codigo,
          description: currentItem.value.descricao,
          price: currentItem.value.valor_unitario,
          unit: currentItem.value.unidade,
          category_id: currentItem.value.categoria === 'produto' ? currentItem.value.category_id : undefined
        }

        if (showEditModal.value) {
          const { error } = await supabase
            .from(table)
            .update(payload)
            .eq('id', currentItem.value.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from(table)
            .insert([payload])
          if (error) throw error
        }

        closeModals()
        loadItens()
        alert(showEditModal.value ? 'Item atualizado com sucesso!' : 'Item criado com sucesso!')
      } catch (error) {
        console.error('Erro ao salvar item:', error)
        alert('Erro ao salvar item: ' + (error?.message || ''))
      } finally {
        saving.value = false
      }
    }

    const editItem = (item) => {
      console.log('Item sendo editado:', item) // Para debug
      
      currentItem.value = {
        id: item.id,
        codigo: item.codigo ?? item.name ?? '',
        descricao: item.descricao ?? item.description ?? '',
        categoria: item.categoria ?? item.category ?? '',
        valor_unitario: Number(item.valor_unitario ?? item.price ?? 0),
        unidade: item.unidade ?? item.unit ?? '',
        category_id: item.category_id || null,
        status: item.status ?? (item.is_active ? 'ativo' : 'inativo'),
        // Campos adicionais para serviços
        min_price: item.min_price ?? null,
        max_price: item.max_price ?? null,
        duration_hours: item.duration_hours ?? null,
        observations: item.observations ?? '',
        category: item.category ?? ''
      }
      
      console.log('currentItem após mapeamento:', currentItem.value) // Para debug
      showEditModal.value = true
    }

    const deleteItem = async (item) => {
      if (!confirm('Tem certeza que deseja excluir este item?')) return
      
      try {
        const table = item.categoria === 'produto' ? 'products' : 'services'
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', item.id)
        if (error) throw error
        
        loadItens()
        alert('Item excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir item:', error)
        alert('Erro ao excluir item')
      }
    }

    const closeModals = () => {
      showEditModal.value = false
      currentItem.value = {
        codigo: '',
        descricao: '',
        categoria: '',
        valor_unitario: 0,
        unidade: '',
        category_id: null
      }
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0)
    }

    // Funções para o header padronizado
    const cancelEditing = () => {
      database.clearEditingState()
      TempProposalService.clearTempData()
      router.push('/propostas')
    }

    const goToInsumos = async () => {
      // Salva os itens selecionados no armazenamento temporário
      const tempData = TempProposalService.getTempData()
      const updatedData = {
        ...tempData,
        items: selectedItems.value
      }
      TempProposalService.saveTempData(updatedData)
      router.push('/insumos')
    }

    onMounted(async () => {
      await loadItens()
      await loadCategories()
      await loadProposal()
    })

    return {
      itens,
      filteredItens,
      loading,
      searchTerm,
      selectedCategory,
      selectedSpecificCategory,
      categories,
      filteredCategories,
      showEditModal,
      currentItem,
      // Header padronizado
      proposalContextInfo,
      canAdvance,
      cancelEditing,
      goToInsumos,
      // Proposta
      currentProposalId,
      currentProposal,
      currentProposalIdShort,
      selectedItems,
      itemsSubtotal,
      savingSelection,
      // Methods
      filterItens,
      onCategoryTypeChange,
      clearFilters,
      selectForProposal,
      selectItem,
      onQtyChange,
      removeSelected,
      saveSelection,
      saveItem,
      editItem,
      deleteItem,
      closeModals,
      formatCurrency,
      loadCategories
    }
  }
}
</script>

<style scoped>
.itens-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
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

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filters select {
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.filters select:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.itens-grid {
  margin: 0 2rem 2rem 2rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.grid-header {
  display: grid;
  grid-template-columns: 1fr 150px 120px 100px 120px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  color: #495057;
}

.grid-row {
  display: grid;
  grid-template-columns: 1fr 150px 120px 100px 120px;
  border-bottom: 1px solid #dee2e6;
  transition: background-color 0.2s;
  min-height: 60px;
  align-items: flex-start;
}

.grid-row:hover {
  background-color: #f8f9fa;
}

.grid-cell {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  border-right: 1px solid #dee2e6;
}

.grid-cell:last-child {
  border-right: none;
}

.category-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: white !important;
  font-weight: 600;
}

.category-badge.produto {
  background: #e3f2fd;
  color: #1976d2;
}

.category-badge.servico {
  background: #f3e5f5;
  color: #7b1fa2;
}

.item-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start !important;
  gap: 2px;
  padding: 12px !important;
}

.item-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.2;
}

.item-description {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.3;
  margin-top: 2px;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-name {
  font-size: 0.85em;
  color: #666;
  font-style: italic;
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

.selection-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.selection-panel.empty {
  opacity: 0.9;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.selected-list {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.selected-row {
  display: grid;
  grid-template-columns: 120px 1fr 120px 120px 100px 140px 140px 90px;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
}

.selected-row.header {
  background: #f8fafc;
  font-weight: 600;
}

.selected-row > div {
  padding: 10px 12px;
  display: flex;
  align-items: center;
}

.qty-input {
  width: 80px;
  padding: 6px 8px;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.subtotal {
  font-size: 16px;
}

.pill {
  background: #e2e8f0;
  border-radius: 999px;
  padding: 2px 8px;
}

/* Modal e botões já existentes */
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

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.875rem;
}

/* Estilos para o modal de categorias */
.add-category-section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.add-category-section h4,
.existing-categories h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 150px 80px;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .form-group {
  margin-bottom: 0;
}

.categories-list {
  max-height: 400px;
  overflow-y: auto;
}

.category-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 10px;
  padding: 15px;
  background: #f9fafb;
}

.category-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.category-badge {
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.category-type {
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 500;
}

.category-description {
  color: #6b7280;
  font-size: 13px;
  font-style: italic;
}

.category-actions {
  display: flex;
  gap: 8px;
}

.category-edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-edit .form-row {
  grid-template-columns: 1fr 120px 60px;
}

.category-edit input,
.category-edit select,
.category-edit textarea {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .itens-page {
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
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters select {
    min-width: auto;
  }
  
  .grid-header,
  .grid-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .grid-cell {
    border-right: none;
    border-bottom: 1px solid #dee2e6;
    justify-content: space-between;
  }
  
  .grid-cell:before {
    content: attr(data-label);
    font-weight: 600;
    color: #495057;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .category-edit .form-row {
    grid-template-columns: 1fr;
  }
  
  .category-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .category-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>
