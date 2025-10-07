<template>
  <div class="itens-page">
    <!-- Header Padronizado -->
    <HeaderProposal
      title="Itens"
      subtitle="Adicione produtos e serviços ao catálogo"
    />

    <!-- Seção de Busca e Filtros -->
    <div class="search-section">
      <div class="search-box">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Buscar itens..."
          @input="filterItens"
        />
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>

      <div class="filters">
        <select v-model="selectedSpecificCategory" @change="filterItens">
          <option value="">Todas as categorias</option>
          <option
            v-for="category in serviceCategories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>

        <button
          class="btn btn-secondary btn-sm"
          @click="clearFilters"
          v-if="selectedSpecificCategory"
        >
          <i class="fa-solid fa-times"></i> Limpar Filtros
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
          :key="item.id"
          class="grid-row"
        >
          <div class="grid-cell item-cell">
            <div class="item-name">{{ item.codigo }}</div>
            <div class="item-description">{{ item.descricao }}</div>
          </div>

          <div class="grid-cell">
            <span class="category-chip">{{ item.category_name || 'Sem categoria' }}</span>
          </div>

          <div class="grid-cell">{{ formatCurrency(item.valor_unitario) }}</div>
          <div class="grid-cell">{{ item.unidade }}</div>
          <div class="grid-cell">
            <div class="action-buttons">
              <button
                class="btn btn-sm btn-secondary"
                @click="handleEdit(item)"
                title="Editar"
              >
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteItem(item)"
                title="Excluir"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Editar Serviço -->
    <div v-if="showEditServiceModal" class="modal-overlay" @click="closeEditServiceModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Editar Serviço</h3>
          <button class="close-btn" @click="closeEditServiceModal">&times;</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveService">
            <div class="form-row">
              <div class="form-group">
                <label>Nome/Código</label>
                <input v-model="serviceForm.name" type="text" required maxlength="100" />
              </div>
              <div class="form-group">
                <label>Unidade</label>
                <input v-model="serviceForm.unit" type="text" required maxlength="20" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Categoria (Serviço)</label>
                <select v-model="serviceForm.category">
                  <option value="">Sem categoria</option>
                  <option
                    v-for="cat in serviceCategories"
                    :key="cat.id"
                    :value="cat.name"
                  >
                    {{ cat.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Valor Unitário</label>
                <div class="currency-input">
                  <span class="currency-symbol">R$</span>
                  <input
                    v-model.number="serviceForm.unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    inputmode="decimal"
                  />
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Preço Mín.</label>
                <input v-model.number="serviceForm.min_price" type="number" step="0.01" min="0" />
              </div>
              <div class="form-group">
                <label>Preço Máx.</label>
                <input v-model.number="serviceForm.max_price" type="number" step="0.01" min="0" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Duração (h)</label>
                <input v-model.number="serviceForm.duration_hours" type="number" step="0.5" min="0" />
              </div>
              <div class="form-group">
                <label>Observações</label>
                <input v-model="serviceForm.observations" type="text" maxlength="300" />
              </div>
            </div>

            <div class="form-group">
              <label>Descrição</label>
              <textarea v-model="serviceForm.description" rows="3" maxlength="500"></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeEditServiceModal">
                <i class="fa-solid fa-times"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- /Modal Editar Serviço -->

  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import HeaderProposal from '@/components/HeaderProposal.vue'

export default {
  name: 'ItensView',
  components: { HeaderProposal },
  setup() {
    const itens = ref([])
    const filteredItens = ref([])
    const loading = ref(false)
    const searchTerm = ref('')
    const categories = ref([]) // categories (type='servico')
    const selectedSpecificCategory = ref('')

    // ====== EDITOR DE SERVIÇOS
    const showEditServiceModal = ref(false)
    const saving = ref(false)
    const serviceForm = ref({
      id: null,
      name: '',
      category: '',
      description: '',
      unit_price: null,
      unit: '',
      min_price: null,
      max_price: null,
      duration_hours: null,
      observations: ''
    })
    const serviceErrors = ref({})

    // sua função 1:1
    const openEditServiceModal = (service) => {
      serviceForm.value = {
        id: service.id ?? null,
        name: service.name ?? '',
        category: service.category ?? '',
        description: service.description ?? '',
        unit_price: service.price ?? null, // mapeia do banco
        unit: service.unit ?? '',
        min_price: service.min_price ?? null,
        max_price: service.max_price ?? null,
        duration_hours: service.duration_hours ?? null,
        observations: service.observations ?? ''
      }
      serviceErrors.value = {}
      showEditServiceModal.value = true
    }

    const resetServiceForm = () => {
      serviceForm.value = {
        id: null,
        name: '',
        category: '',
        description: '',
        unit_price: null,
        unit: '',
        min_price: null,
        max_price: null,
        duration_hours: null,
        observations: ''
      }
    }

    const closeEditServiceModal = () => {
      showEditServiceModal.value = false
      resetServiceForm()
      serviceErrors.value = {}
    }

    const saveService = async () => {
      try {
        saving.value = true
        const payload = {
          name: serviceForm.value.name?.trim(),
          description: serviceForm.value.description?.trim() || '',
          category: serviceForm.value.category || null,
          price: Number(serviceForm.value.unit_price || 0),
          unit: serviceForm.value.unit || '',
          min_price: serviceForm.value.min_price ?? null,
          max_price: serviceForm.value.max_price ?? null,
          duration_hours: serviceForm.value.duration_hours ?? null,
          observations: serviceForm.value.observations ?? ''
        }
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', serviceForm.value.id)

        if (error) throw error
        closeEditServiceModal()
        await loadItens()
        alert('Serviço atualizado com sucesso!')
      } catch (err) {
        console.error('Erro ao salvar serviço:', err)
        alert('Erro ao salvar serviço')
      } finally {
        saving.value = false
      }
    }

    // categorias: somente serviços
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('type', 'servico')
          .order('name')
        if (error) throw error
        categories.value = data || []
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }
    const serviceCategories = computed(() => categories.value)

    // carregar **apenas serviços**
    const loadItens = async () => {
      try {
        loading.value = true
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name')
        if (error) throw error

        const mapped = (data || []).map(r => ({
          ...r,
          codigo: r.name ?? '',
          descricao: r.description ?? '',
          categoria: 'servico',
          category: r.category ?? '',             // string (nome)
          category_name: r.category ?? 'Serviço', // usado na UI
          valor_unitario: Number(r.price ?? 0),
          unidade: r.unit ?? ''
        }))

        itens.value = mapped
        filteredItens.value = mapped
      } catch (error) {
        console.error('Erro ao carregar serviços:', error)
        alert('Erro ao carregar itens')
      } finally {
        loading.value = false
      }
    }

    const filterItens = () => {
      let filtered = itens.value

      if (searchTerm.value) {
        const term = (searchTerm.value || '').toLowerCase()
        filtered = filtered.filter(item =>
          (item.codigo || '').toLowerCase().includes(term) ||
          (item.descricao || '').toLowerCase().includes(term) ||
          (item.category_name || '').toLowerCase().includes(term)
        )
      }

      if (selectedSpecificCategory.value) {
        const catName = categories.value.find(cat => cat.id === selectedSpecificCategory.value)?.name
        filtered = filtered.filter(item => item.category === catName)
      }

      filteredItens.value = filtered
    }

    const clearFilters = () => {
      selectedSpecificCategory.value = ''
      searchTerm.value = ''
      filterItens()
    }

    const handleEdit = (item) => {
      const asService = {
        id: item.id,
        name: item.codigo ?? item.name ?? '',
        category: item.category ?? item.category_name ?? '',
        description: item.descricao ?? item.description ?? '',
        price: Number(item.valor_unitario ?? item.price ?? 0),
        unit: item.unidade ?? item.unit ?? '',
        min_price: item.min_price ?? null,
        max_price: item.max_price ?? null,
        duration_hours: item.duration_hours ?? null,
        observations: item.observations ?? ''
      }
      openEditServiceModal(asService)
    }

    const deleteItem = async (item) => {
      if (!confirm('Tem certeza que deseja excluir este serviço?')) return
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', item.id)
        if (error) throw error

        await loadItens()
        alert('Serviço excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir serviço:', error)
        alert('Erro ao excluir serviço')
      }
    }

    const formatCurrency = (value) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

    onMounted(async () => {
      await loadItens()
      await loadCategories()
    })

    return {
      // listagem/filtro
      itens,
      filteredItens,
      loading,
      searchTerm,
      selectedSpecificCategory,
      serviceCategories,
      filterItens,
      clearFilters,

      // ações
      handleEdit,
      deleteItem,
      formatCurrency,

      // modal serviço
      showEditServiceModal,
      serviceForm,
      serviceErrors,
      openEditServiceModal,
      closeEditServiceModal,
      saveService,
      saving
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

/* chip de categoria (desktop e mobile) */
.category-chip {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: #e5e7eb;
  color: #374151;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

@media (max-width: 768px) {
  .itens-page {
    padding: 10px;
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
}
</style>

