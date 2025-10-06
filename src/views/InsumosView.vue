<template>
  <div class="insumos-page">
    <!-- Header Padronizado -->
<HeaderProposal
  title="Insumos"
  subtitle="Adicione materiais, mão de obra e equipamentos"
>

  <template #actions>
    <div class="header-actions">
      <button class="btn btn-secondary btn-lg" @click="showTypesModal = true">
        <i class="fas fa-tags"></i> Gerenciar Tipos
      </button>
      <button class="btn btn-primary btn-lg" @click="showCreateModal = true">
        <i class="fas fa-plus"></i> Adicionar Insumo
      </button>
    </div>
  </template>
</HeaderProposal>

    <!-- Seção de Busca e Filtros -->
    <div class="search-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Buscar insumos..."
          @input="filterInsumos"
        >
        <i class="fas fa-search"></i>
      </div>
      <div class="filters">
        <select v-model="selectedType" @change="filterInsumos">
          <option value="">Todos os tipos</option>
          <option 
            v-for="type in availableTypes" 
            :key="type.id" 
            :value="type.name"
          >
            {{ getTypeLabel(type.name) }}
          </option>
        </select>
      </div>
    </div>

    <div class="insumos-grid">
      <div class="grid-header">
        <div class="grid-cell">Insumo</div>
        <div class="grid-cell">Tipo</div>
        <div class="grid-cell">Valor Unitário</div>
        <div class="grid-cell">Unidade</div>
        <div class="grid-cell">Ações</div>
      </div>
      
      <div v-if="loading" class="loading">Carregando...</div>
      
      <div v-else-if="filteredInsumos.length === 0" class="no-data">
        Nenhum insumo encontrado
      </div>
      
      <div v-else>
        <div 
          v-for="insumo in filteredInsumos" 
          :key="insumo.id" 
          class="grid-row"
        >
          <div class="grid-cell insumo-cell">
            <div class="insumo-name">{{ insumo.codigo }}</div>
            <div class="insumo-description">{{ insumo.descricao }}</div>
          </div>
<div class="grid-cell">
  <span
    class="category-chip"
    :style="{ backgroundColor: getTypeColor(insumo.tipo), color: '#fff' }"
  >
    {{ getTypeLabel(insumo.tipo) }}
  </span>
</div>

          <div class="grid-cell">{{ formatCurrency(insumo.valor_unitario) }}</div>
          <div class="grid-cell">{{ insumo.unidade }}</div>
          <div class="grid-cell">
<div class="action-buttons">
  <button 
    class="btn btn-sm btn-secondary" 
    @click="editInsumo(insumo)"
    title="Editar"
  >
    <i class="fas fa-edit"></i>
  </button>
  <button 
    class="btn btn-sm btn-danger" 
    @click="deleteInsumo(insumo.id)"
    title="Excluir"
  >
    <i class="fas fa-trash"></i>
  </button>
</div>

          </div>
        </div>
      </div>
    </div>

    <!-- Modal Criar/Editar Insumo -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showEditModal ? 'Editar Insumo' : 'Novo Insumo' }}</h3>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveInsumo">
            <div class="form-row">
              <div class="form-group">
                <label>Código/Nome: <span class="required">*</span></label>
                <input 
                  type="text" 
                  v-model="currentInsumo.codigo" 
                  required
                  placeholder="Ex: CABO-10MM, SOLDADOR-JUNIOR"
                  maxlength="100"
                >
              </div>
              <div class="form-group">
                <label for="unidade">Unidade: <span class="required">*</span></label>
                <div class="unit-input-group">
                  <select 
                    id="unidade" 
                    v-model="currentInsumo.unidade" 
                    @change="onUnitChange"
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="m">m</option>
                    <option value="cm">cm</option>
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="unidade">unidade</option>
                    <option value="pacote">pacote</option>
                    <option value="caixa">caixa</option>
                    <option value="rolo">rolo</option>
                    <option value="outros">Outros...</option>
                  </select>
                  <input 
                    v-if="showCustomUnit"
                    type="text" 
                    v-model="customUnit"
                    placeholder="Digite a unidade personalizada"
                    class="custom-unit-input"
                    @blur="setCustomUnit"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label>Descrição: <span class="required">*</span></label>
              <textarea 
                v-model="currentInsumo.descricao" 
                required
                placeholder="Descrição detalhada do insumo..."
                rows="3"
                maxlength="500"
              ></textarea>
              <small class="char-counter">{{ currentInsumo.descricao?.length || 0 }}/500</small>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Tipo: <span class="required">*</span></label>
                <div class="type-selection">
                  <select v-model="currentInsumo.tipo" required>
                    <option value="">Selecione um tipo</option>
                    <option 
                      v-for="type in availableTypes" 
                      :key="type.id" 
                      :value="type.name"
                    >
                      {{ getTypeLabel(type.name) }}
                    </option>
                  </select>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-primary"
                    @click="openQuickTypeModal"
                    title="Criar tipo rápido"
                  >
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
<div class="form-group">
  <label>Valor Unitário:</label>
  <div class="currency-input">
    <span class="currency-symbol">R$</span>
    <input
      type="number"
      v-model.number="currentInsumo.valor_unitario"
      step="0.01"
      min="0"
      inputmode="decimal"
      placeholder="0,00"
    >
  </div>
</div>

            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeModals">
                <i class="fas fa-times"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i class="fas" :class="saving ? 'fa-spinner fa-spin' : (showEditModal ? 'fa-save' : 'fa-plus')"></i>
                {{ saving ? 'Salvando...' : (showEditModal ? 'Atualizar' : 'Criar') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Gerenciar Tipos -->
    <div v-if="showTypesModal" class="modal-overlay" @click="closeTypesModal">
      <div class="modal-content types-modal" @click.stop>
        <div class="modal-header">
          <h3>Gerenciar Tipos de Insumos</h3>
          <button class="close-btn" @click="closeTypesModal">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Formulário para novo tipo -->
          <div class="new-type-form">
            <h4>Adicionar Novo Tipo</h4>
            <form @submit.prevent="createNewType">
              <div class="form-row">
                <div class="form-group">
                  <label>Nome do Tipo:</label>
                  <input 
                    type="text" 
                    v-model="newTypeName" 
                    required
                    placeholder="Ex: Ferramentas, Consumíveis"
                    maxlength="50"
                  >
                </div>
                <div class="form-group">
                  <label>Cor:</label>
                  <input 
                    type="color" 
                    v-model="newTypeColor"
                    class="color-picker"
                  >
                </div>
              </div>
              <div class="form-group">
                <label>Descrição (opcional):</label>
                <input 
                  type="text" 
                  v-model="newTypeDescription" 
                  placeholder="Descrição do tipo..."
                  maxlength="200"
                >
              </div>
              <button type="submit" class="btn btn-primary" :disabled="creatingType">
                <i class="fas" :class="creatingType ? 'fa-spinner fa-spin' : 'fa-plus'"></i>
                {{ creatingType ? 'Criando...' : 'Adicionar Tipo' }}
              </button>
            </form>
          </div>

          <!-- Lista de tipos existentes -->
          <div class="existing-types">
            <h4>Tipos Existentes</h4>
            <div v-if="loadingTypes" class="loading-small">Carregando tipos...</div>
            <div v-else-if="availableTypes.length === 0" class="no-types">
              Nenhum tipo cadastrado ainda.
            </div>
            <div v-else class="types-list">
              <div 
                v-for="type in availableTypes" 
                :key="type.id"
                class="type-item"
              >
                <div v-if="editingTypeId === type.id" class="type-edit-form">
                  <div class="form-row">
                    <input 
                      type="text" 
                      v-model="editingTypeName"
                      placeholder="Nome do tipo"
                      maxlength="50"
                    >
                    <input 
                      type="color" 
                      v-model="editingTypeColor"
                      class="color-picker-small"
                    >
                  </div>
                  <input 
                    type="text" 
                    v-model="editingTypeDescription"
                    placeholder="Descrição (opcional)"
                    maxlength="200"
                  >
                  <div class="edit-actions">
                    <button class="btn btn-sm btn-success" @click="saveTypeEdit">
                      <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" @click="cancelTypeEdit">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <div v-else class="type-info">
                  <div class="type-color" :style="{ backgroundColor: type.color }"></div>
                  <div class="type-details">
                    <strong>{{ getTypeLabel(type.name) }}</strong>
                    <small v-if="type.description">{{ type.description }}</small>
                    <small class="usage-count">({{ getTypeUsageCount(type.name) }} insumos)</small>
                  </div>
                  <div class="type-actions">
                    <button 
                      class="btn btn-sm btn-outline-secondary"
                      @click="startTypeEdit(type)"
                      title="Editar tipo"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button 
                      v-if="!isDefaultType(type.name) && getTypeUsageCount(type.name) === 0"
                      class="btn btn-sm btn-outline-danger"
                      @click="deleteType(type.id)"
                      title="Excluir tipo"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

   
    </div>

    
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useDatabaseStore } from '@/stores/database'
import HeaderProposal from '@/components/HeaderProposal.vue'
import TempProposalService from '@/services/TempProposalService'
import SupplyTypesService from '@/services/SupplyTypesService'
import SuppliesService from '@/services/SuppliesService'

export default {
  name: 'InsumosView',
  components: {
    HeaderProposal
  },
  setup() {
    const router = useRouter()
    const database = useDatabaseStore()
    
    const insumos = ref([])
    const filteredInsumos = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const searchTerm = ref('')
    const selectedType = ref('')
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    
    // Gerenciamento de tipos
    const availableTypes = ref([])
    const loadingTypes = ref(false)
    const showTypesModal = ref(false)
    const creatingType = ref(false)
    const newTypeName = ref('')
    const newTypeDescription = ref('')
    const newTypeColor = ref('#007bff')
    
    // Modal tipo rápido
    const showQuickTypeModal = ref(false)
    const quickTypeName = ref('')
    const quickTypeInput = ref(null)
    
    // Edição de tipos
    const editingTypeId = ref(null)
    const editingTypeName = ref('')
    const editingTypeDescription = ref('')
    const editingTypeColor = ref('')
    
    const currentInsumo = ref({
      codigo: '',
      descricao: '',
      tipo: '',
      valor_unitario: 0,
      unidade: ''
    })

    // Custom unit handling
    const showCustomUnit = ref(false)
    const customUnit = ref('')

    // Contexto da proposta
    const currentProposalId = computed(() => database.currentProposalId)
    const currentProposal = ref(null)
    const savingSelection = ref(false)
    const selectedInsumos = ref([])
    
    // Informações para o header padronizado
    const proposalContextInfo = computed(() => {
      const tempData = TempProposalService.getTempData()
      return {
        title: tempData?.title || 'Nova Proposta',
        client: tempData?.client_name || 'Cliente não selecionado',
        step: 'Insumos',
        totalSteps: 5
      }
    })

    const canAdvance = computed(() => {
      return selectedInsumos.value.length > 0
    })

    const currentProposalIdShort = computed(() => {
      const id = currentProposalId.value || ''
      return id ? id.substring(0, 8) + '…' : ''
    })
    const insumosSubtotal = computed(() => {
      return selectedInsumos.value.reduce((sum, it) => sum + (Number(it.valor_unitario || 0) * Number(it.quantity || 1)), 0)
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
        const existing = Array.isArray(data?.supplies) ? data.supplies : []
        selectedInsumos.value = existing.map((it) => ({
          key: it.key || `supplies:${it.source_id || it.id || it.codigo}`,
          source_table: 'supplies',
          source_id: it.source_id || it.id || null,
          id: it.source_id || it.id || null,
          codigo: it.codigo || it.name || '',
          descricao: it.descricao || it.description || '',
          tipo: it.tipo || it.type || '',
          unidade: it.unidade || it.unit || '',
          valor_unitario: Number(it.valor_unitario || it.price || 0),
          quantity: Number(it.quantity || 1)
        }))
      } catch (err) {
        console.error('Erro ao carregar proposta atual:', err)
      }
    }

    const selectForProposal = (insumo) => {
      if (!currentProposalId.value) return
      const key = `supplies:${insumo.id}`
      const existing = selectedInsumos.value.find((s) => s.key === key)
      if (existing) {
        existing.quantity = Number(existing.quantity || 1) + 1
      } else {
        selectedInsumos.value.push({
          key,
          source_table: 'supplies',
          source_id: insumo.id,
          id: insumo.id,
          codigo: insumo.codigo,
          descricao: insumo.descricao,
          tipo: insumo.tipo,
          unidade: insumo.unidade,
          valor_unitario: Number(insumo.valor_unitario || 0),
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
      selectedInsumos.value = selectedInsumos.value.filter((x) => x.key !== s.key)
    }

    const saveAndGoToOptionals = async () => {
      if (!currentProposalId.value) return
      try {
        savingSelection.value = true
        const payload = selectedInsumos.value.map((s) => ({
          key: s.key,
          source_table: s.source_table,
          source_id: s.source_id,
          codigo: s.codigo,
          descricao: s.descricao,
          tipo: s.tipo,
          unidade: s.unidade,
          valor_unitario: s.valor_unitario,
          quantity: s.quantity
        }))

        console.log('Salvando insumos:', payload) // Debug
        console.log('Proposal ID:', currentProposalId.value) // Debug

        const { error } = await supabase
          .from('proposals')
          .update({
            supplies: payload, // Mudança: usar 'supplies' em vez de 'insumos'
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProposalId.value)
        
        if (error) {
          console.error('Erro do Supabase:', error) // Debug melhorado
          throw error
        }

        alert('Insumos da proposta salvos com sucesso!')
        router.push('/opcionais')
      } catch (err) {
        console.error('Erro ao salvar seleção de insumos:', err)
        alert('Erro ao salvar insumos da proposta: ' + (err && err.message || err))
      } finally {
        savingSelection.value = false
      }
    }

    const goToOptionals = () => {
      router.push('/opcionais')
    }

    // Funções para gerenciar tipos
    const loadSupplyTypes = async () => {
      loadingTypes.value = true
      try {
        const data = await SupplyTypesService.getAllTypes()
        availableTypes.value = data
      } catch (error) {
        console.error('Erro ao carregar tipos:', error)
      } finally {
        loadingTypes.value = false
      }
    }

    const createNewType = async () => {
      if (!newTypeName.value.trim()) return
      
      creatingType.value = true
      try {
        await SupplyTypesService.createType({
          name: newTypeName.value.trim(),
          color: newTypeColor.value,
          description: newTypeDescription.value.trim() || null
        })
        
        await loadSupplyTypes()
        newTypeName.value = ''
        newTypeColor.value = '#007bff'
        newTypeDescription.value = ''
        
      } catch (error) {
        console.error('Erro ao criar tipo:', error)
        alert('Erro ao criar tipo')
      } finally {
        creatingType.value = false
      }
    }

    const startTypeEdit = (type) => {
      editingTypeId.value = type.id
      editingTypeName.value = type.name
      editingTypeColor.value = type.color
      editingTypeDescription.value = type.description || ''
    }

    const cancelTypeEdit = () => {
      editingTypeId.value = null
      editingTypeName.value = ''
      editingTypeColor.value = ''
      editingTypeDescription.value = ''
    }

// 2) Salvar edição de tipo — trocar update -> updateType
const saveTypeEdit = async () => {
  try {
    await SupplyTypesService.updateType(editingTypeId.value, {
      name: editingTypeName.value.trim(),
      color: editingTypeColor.value,
      description: editingTypeDescription.value.trim() || null
    })
    
    await loadSupplyTypes()
    await loadInsumos()
    cancelTypeEdit()
    
  } catch (error) {
    console.error('Erro ao atualizar tipo:', error)
    alert('Erro ao atualizar tipo')
  }
}


// 3) Excluir tipo — trocar delete -> deleteType
const deleteType = async (typeId) => {
  if (!confirm('Tem certeza que deseja excluir este tipo?')) return
  
  try {
    await SupplyTypesService.deleteType(typeId)
    await loadSupplyTypes()
  } catch (error) {
    console.error('Erro ao excluir tipo:', error)
    alert('Erro ao excluir tipo')
  }
}


    const isDefaultType = (typeName) => {
      return ['MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO'].includes(typeName)
    }

    const closeTypesModal = () => {
      showTypesModal.value = false
    }

    const openQuickTypeModal = () => {
      showQuickTypeModal.value = true
      quickTypeName.value = ''
      nextTick(() => {
        if (quickTypeInput.value) {
          quickTypeInput.value.focus()
        }
      })
    }

    const closeQuickTypeModal = () => {
      showQuickTypeModal.value = false
      quickTypeName.value = ''
    }

// 1) Criar tipo rápido — use o mesmo padrão de nome do create
const createQuickType = async () => {
  if (!quickTypeName.value.trim()) return
  
  creatingType.value = true
  try {
    const newType = await SupplyTypesService.createType({
      name: quickTypeName.value.trim(),
      color: '#007bff',
      description: null
    })
    
    await loadSupplyTypes()
    currentInsumo.value.tipo = newType.name
    closeQuickTypeModal()
    
  } catch (error) {
    console.error('Erro ao criar tipo rápido:', error)
    alert('Erro ao criar tipo rápido')
  } finally {
    creatingType.value = false
  }
}


    const getTypeUsageCount = (typeName) => {
      return insumos.value.filter(insumo => insumo.tipo === typeName).length
    }

    const getTypeBadgeClass = (typeName) => {
      return `type-${typeName.toLowerCase().replace('_', '-')}`
    }

    const getTypeColor = (typeName) => {
      const type = availableTypes.value.find(t => t.name === typeName)
      return type?.color || '#6c757d'
    }

    const loadInsumos = async () => {
      try {
        loading.value = true
        const { data, error } = await supabase
          .from('supplies')
          .select(`
            *,
            supply_types (
              name,
              description,
              color
            )
          `)
          .order('name')

        if (error) throw error

        // EN -> PT com suporte a tipos dinâmicos
        const mapped = (data || []).map(r => ({
          ...r,
          codigo: r.name || r.codigo,
          descricao: r.description || r.descricao,
          tipo: r.supply_types?.name || r.type || r.tipo || '',
          valor_unitario: r.price || r.valor_unitario,
          unidade: r.unit || r.unidade,
          status: r.is_active ? 'ativo' : 'inativo'
        }))
        
        insumos.value = mapped
        filteredInsumos.value = mapped
      } catch (error) {
        console.error('Erro ao carregar insumos:', error)
        alert('Erro ao carregar insumos')
      } finally {
        loading.value = false
      }
    }

    const filterInsumos = () => {
      let filtered = insumos.value
      
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase()
        filtered = filtered.filter(insumo => 
          insumo.codigo.toLowerCase().includes(term) ||
          insumo.descricao.toLowerCase().includes(term)
        )
      }
      
      if (selectedType.value) {
        filtered = filtered.filter(insumo => insumo.tipo === selectedType.value)
      }
      
      filteredInsumos.value = filtered
    }

const saveInsumo = async () => {
  try {
    saving.value = true;

    // --- validações obrigatórias (mantém)
    if (!currentInsumo.value.codigo?.trim()) {
      alert('Por favor, informe o código/nome do insumo.');
      return;
    }
    if (!currentInsumo.value.descricao?.trim()) {
      alert('Por favor, informe a descrição do insumo.');
      return;
    }
    if (!currentInsumo.value.tipo) {
      alert('Por favor, selecione o tipo do insumo.');
      return;
    }
    if (!currentInsumo.value.unidade) {
      alert('Por favor, selecione a unidade do insumo.');
      return;
    }

    // --- NOVO: normaliza o preço (vazio => 0) e só barra NEGATIVO
    const raw = currentInsumo.value.valor_unitario;
    const num = Number(raw); // se vier string "0" vira 0
    if (!Number.isFinite(num)) {
      alert('Por favor, informe um valor unitário válido.');
      return;
    }
    if (num < 0) {
      alert('O valor unitário não pode ser negativo.');
      return;
    }
    const valorUnitarioNormalizado = num || 0; // aceita 0

    // tipo selecionado
    const selectedTypeObj = availableTypes.value.find(t => t.name === currentInsumo.value.tipo);

    const insumoData = {
      name: currentInsumo.value.codigo.trim(),
      description: currentInsumo.value.descricao.trim(),
      type: currentInsumo.value.tipo,
      type_id: selectedTypeObj?.id || null,
      // --- NOVO: usa o normalizado
      price: valorUnitarioNormalizado,
      unit: currentInsumo.value.unidade,
      is_active: true
    };

    if (showEditModal.value) {
      const { error } = await supabase
        .from('supplies')
        .update(insumoData)
        .eq('id', currentInsumo.value.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('supplies')
        .insert([insumoData]);
      if (error) throw error;
    }

    closeModals();
    loadInsumos();
    alert(showEditModal.value ? 'Insumo atualizado com sucesso!' : 'Insumo criado com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar insumo:', error);
    if (error.code === '23505') {
      alert('Já existe um insumo com este código/nome.');
    } else {
      alert('Erro ao salvar insumo: ' + (error && error.message || ''));
    }
  } finally {
    saving.value = false;
  }
};


    const editInsumo = (insumo) => {
      currentInsumo.value = {
        id: insumo.id,
        codigo: insumo.codigo ?? insumo.name ?? '',
        descricao: insumo.descricao ?? insumo.description ?? '',
        tipo: insumo.tipo ?? insumo.type ?? '',
        valor_unitario: insumo.valor_unitario ?? insumo.price ?? 0,
        unidade: insumo.unidade ?? insumo.unit ?? '',
        status: insumo.status ?? (insumo.is_active ? 'ativo' : 'inativo')
      }
      showEditModal.value = true
    }

    const deleteInsumo = async (id) => {
      if (!confirm('Tem certeza que deseja excluir este insumo?')) return
      
      try {
        const { error } = await supabase
          .from('supplies')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        loadInsumos()
        alert('Insumo excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir insumo:', error)
        alert('Erro ao excluir insumo')
      }
    }

    const onUnitChange = () => {
      if (currentInsumo.value.unidade === 'outros') {
        showCustomUnit.value = true
        customUnit.value = ''
        nextTick(() => {
          // Focar no input customizado
          const customInput = document.querySelector('.custom-unit-input')
          if (customInput) customInput.focus()
        })
      } else {
        showCustomUnit.value = false
        customUnit.value = ''
      }
    }

    const setCustomUnit = () => {
      if (customUnit.value.trim()) {
        currentInsumo.value.unidade = customUnit.value.trim()
        showCustomUnit.value = false
      } else {
        currentInsumo.value.unidade = ''
        showCustomUnit.value = false
      }
    }

    const closeModals = () => {
      showCreateModal.value = false
      showEditModal.value = false
      showCustomUnit.value = false
      customUnit.value = ''
      currentInsumo.value = {
        codigo: '',
        descricao: '',
        tipo: '',
        valor_unitario: 0,
        unidade: ''
      }
    }

    const getTypeLabel = (type) => {
      const labels = {
        material: 'Material',
        mao_obra: 'Mão de Obra',
        equipamento: 'Equipamento'
      }
      
      // Procurar primeiro nos tipos dinâmicos
      const dynamicType = availableTypes.value.find(t => t.name === type)
      if (dynamicType?.description) {
        return dynamicType.description
      }
      
      return labels[type] || type || 'Não definido'
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

    const goToOpcionais = async () => {
      if (currentProposalId.value && selectedInsumos.value.length > 0) {
        await saveAndGoToOptionals()
      } else {
        // Salva os insumos selecionados no armazenamento temporário
        const tempData = TempProposalService.getTempData()
        const updatedData = {
          ...tempData,
          insumos: selectedInsumos.value
        }
        TempProposalService.saveTempData(updatedData)
        router.push('/opcionais')
      }
    }

    onMounted(async () => {
      // Inicializar o cliente Supabase nos serviços
      SupplyTypesService.setSupabaseClient(supabase)
      SuppliesService.setSupabaseClient(supabase)
      
      await loadInsumos()
      await loadSupplyTypes()
      await loadProposal()
      // Carrega dados temporários se existirem
      const tempData = TempProposalService.getTempData()
      if (tempData && tempData.insumos) {
        selectedInsumos.value = tempData.insumos
      }
    })

    return {
      insumos,
      filteredInsumos,
      loading,
      saving,
      searchTerm,
      selectedType,
      showCreateModal,
      showEditModal,
      currentInsumo,
      // Header padronizado
      proposalContextInfo,
      canAdvance,
      cancelEditing,
      goToOpcionais,
      // Proposta
      currentProposalId,
      currentProposal,
      currentProposalIdShort,
      selectedInsumos,
      insumosSubtotal,
      savingSelection,
      // Métodos
      loadInsumos,
      filterInsumos,
      saveInsumo,
      editInsumo,
      deleteInsumo,
      closeModals,
      getTypeLabel,
      formatCurrency,
      selectForProposal,
      onQtyChange,
      removeSelected,
      saveAndGoToOptionals,
      // Tipos
      availableTypes,
      loadingTypes,
      showTypesModal,
      creatingType,
      newTypeName,
      newTypeDescription,
      newTypeColor,
      showQuickTypeModal,
      quickTypeName,
      quickTypeInput,
      editingTypeId,
      editingTypeName,
      editingTypeDescription,
      editingTypeColor,
      // Funções de tipos
      loadSupplyTypes,
      createNewType,
      createQuickType,
      getTypeColor,
      getTypeBadgeClass,
      getTypeUsageCount,
      isDefaultType,
      closeTypesModal,
      openQuickTypeModal,
      closeQuickTypeModal,
      startTypeEdit,
      cancelTypeEdit,
      saveTypeEdit,
      deleteType,
      // Custom unit handling
      showCustomUnit,
      customUnit,
      onUnitChange,
      setCustomUnit
    }
  }
}
</script>

<style scoped>
.insumos-page {
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
  min-width: 200px;
}

.insumos-grid {
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

.insumo-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start !important;
  gap: 2px;
  padding: 12px !important;
}

.insumo-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.2;
}

.insumo-description {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.3;
  margin-top: 2px;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: white !important;
  font-weight: 600;
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

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .insumos-page {
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
.proposal-context {
  background: #e3f2fd;
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #1976d2;
}

.proposal-context .badge {
  background: #1976d2;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.selection-panel {
  margin-top: 30px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

.empty-selection {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.pill {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.selected-list {
  max-height: 400px;
  overflow-y: auto;
}

.selected-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr 80px 120px 120px 80px;
  gap: 15px;
  padding: 12px 20px;
  border-bottom: 1px solid #f1f3f4;
  align-items: center;
}

.selected-row.header {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.qty-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  text-align: center;
}

.panel-footer {
  padding: 20px;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subtotal {
  font-size: 16px;
  color: #495057;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.required {
  color: #dc3545;
}

.char-counter {
  color: #6c757d;
  font-size: 12px;
  text-align: right;
  display: block;
  margin-top: 5px;
}

.type-selection {
  display: flex;
  gap: 10px;
  align-items: center;
}

.type-selection select {
  flex: 1;
}

.currency-input {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-weight: 600;
}

.currency-input input {
  padding-left: 35px;
}

.types-modal {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.new-type-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.new-type-form h4 {
  margin-bottom: 15px;
  color: #333;
}

.color-picker {
  width: 60px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.existing-types h4 {
  margin-bottom: 15px;
  color: #333;
}

.loading-small {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-style: italic;
}

.no-types {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-style: italic;
}

.types-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.type-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.type-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.type-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
}

.type-details strong {
  display: block;
  color: #333;
}

.type-details small {
  color: #6c757d;
}

.type-actions {
  display: flex;
  gap: 5px;
}

.quick-type-modal {
  max-width: 400px;
}

.type-edit-form {
  width: 100%;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.type-edit-form .form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.type-edit-form input[type="text"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.color-picker-small {
  width: 50px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.edit-actions {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
  margin-top: 10px;
}

.usage-count {
  color: #6c757d;
  font-style: italic;
}

.unit-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-unit-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.custom-unit-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
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

</style>