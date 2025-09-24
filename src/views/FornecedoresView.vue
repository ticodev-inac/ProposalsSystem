<template>
  <div class="fornecedores-view">
    <div class="header">
      <h1>Gerenciar Fornecedores</h1>
      <p>Cadastre e gerencie seus fornecedores</p>
    </div>
    
    <!-- Estado de erro -->
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="listarFornecedores">Tentar Novamente</button>
    </div>
    
    <div v-else class="content">
      <div class="actions">
        <button class="btn-primary" @click="novoFornecedor">Novo Fornecedor</button>
        <button class="btn-secondary" @click="listarFornecedores" :disabled="loading">{{ loading ? 'Carregando...' : 'Atualizar Lista' }}</button>
      </div>
      
      <div class="search-bar">
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Buscar fornecedores por nome, email ou CNPJ..."
          @input="filtrarFornecedores"
          class="search-input"
        />
      </div>
      
      <div class="fornecedores-list" v-if="fornecedoresFiltrados.length > 0">
        <h3>Fornecedores Cadastrados ({{ fornecedoresFiltrados.length }})</h3>
        <div class="fornecedor-item" v-for="fornecedor in fornecedoresFiltrados" :key="fornecedor.id">
          <div class="fornecedor-info">
            <strong>{{ fornecedor.company_name || fornecedor.contact_name || 'Nome não informado' }}</strong>
            <span class="email">{{ fornecedor.email || 'Email não informado' }}</span>
            <span class="cnpj" v-if="fornecedor.cnpj">CNPJ: {{ fornecedor.cnpj }}</span>
            <span class="phone" v-if="fornecedor.phone">Tel: {{ fornecedor.phone }}</span>
          </div>
          <div class="fornecedor-actions">
            <button class="btn-edit" @click="editarFornecedor(fornecedor)">Editar</button>
            <button class="btn-delete" @click="confirmarExclusao(fornecedor)">Excluir</button>
          </div>
        </div>
      </div>
      
      <div class="empty-state" v-else-if="!loading">
        <p v-if="searchTerm">Nenhum fornecedor encontrado para "{{ searchTerm }}".</p>
        <p v-else>Nenhum fornecedor cadastrado. Clique em "Novo Fornecedor" para começar.</p>
      </div>
      
      <div class="loading-state" v-if="loading">
        <p>Carregando fornecedores...</p>
      </div>
    </div>
    
    <!-- Modal de Novo Fornecedor -->
    <div v-if="showCreateModal" class="modal-overlay" @click="fecharModalCriar">
      <div class="modal-content form-modal" @click.stop>
        <div class="modal-header">
          <h3>Novo Fornecedor</h3>
          <button class="modal-close" @click="fecharModalCriar">×</button>
        </div>
        <form @submit.prevent="salvarFornecedor" class="fornecedor-form">
          <div class="form-group">
            <label for="fornecedorNome">Razão Social *</label>
            <input 
              type="text" 
              id="fornecedorNome" 
              v-model="novoFornecedorData.company_name" 
              required 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="fornecedorEndereco">Endereço</label>
            <input 
              type="text" 
              id="fornecedorEndereco" 
              v-model="novoFornecedorData.address" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="fornecedorContato">Responsável</label>
            <input 
              type="text" 
              id="fornecedorContato" 
              v-model="novoFornecedorData.contact_name" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="fornecedorCargo">Cargo</label>
            <input 
              type="text" 
              id="fornecedorCargo" 
              v-model="novoFornecedorData.contact_position" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="fornecedorCnpj">CNPJ</label>
            <input 
              type="text" 
              id="fornecedorCnpj" 
              v-model="novoFornecedorData.cnpj" 
              class="form-input"
              @input="formatarCNPJ"
            />
          </div>
          
          <div class="form-group">
            <label for="fornecedorTelefone">Telefone</label>
            <input 
              type="text" 
              id="fornecedorTelefone" 
              v-model="novoFornecedorData.phone" 
              class="form-input"
              @input="formatarTelefone"
            />
          </div>
          
          <div class="form-group">
            <label for="fornecedorEmail">E-mail</label>
            <input 
              type="email" 
              id="fornecedorEmail" 
              v-model="novoFornecedorData.email" 
              class="form-input"
            />
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="fecharModalCriar">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="salvandoFornecedor">
              {{ salvandoFornecedor ? 'Criando...' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Modal de Editar Fornecedor -->
    <div v-if="showEditModal" class="modal-overlay" @click="fecharModalEditar">
      <div class="modal-content form-modal" @click.stop>
        <div class="modal-header">
          <h3>Editar Fornecedor</h3>
          <button class="modal-close" @click="fecharModalEditar">×</button>
        </div>
        <form @submit.prevent="atualizarFornecedor" class="fornecedor-form">
          <div class="form-group">
            <label for="editFornecedorNome">Razão Social *</label>
            <input 
              type="text" 
              id="editFornecedorNome" 
              v-model="fornecedorEditando.company_name" 
              required 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editFornecedorEndereco">Endereço</label>
            <input 
              type="text" 
              id="editFornecedorEndereco" 
              v-model="fornecedorEditando.address" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editFornecedorContato">Responsável</label>
            <input 
              type="text" 
              id="editFornecedorContato" 
              v-model="fornecedorEditando.contact_name" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editFornecedorCargo">Cargo</label>
            <input 
              type="text" 
              id="editFornecedorCargo" 
              v-model="fornecedorEditando.contact_position" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editFornecedorCnpj">CNPJ</label>
            <input 
              type="text" 
              id="editFornecedorCnpj" 
              v-model="fornecedorEditando.cnpj" 
              class="form-input"
              @input="formatarCNPJEdicao"
            />
          </div>
          
          <div class="form-group">
            <label for="editFornecedorTelefone">Telefone</label>
            <input 
              type="text" 
              id="editFornecedorTelefone" 
              v-model="fornecedorEditando.phone" 
              class="form-input"
              @input="formatarTelefoneEdicao"
            />
          </div>
          
          <div class="form-group">
            <label for="editFornecedorEmail">E-mail</label>
            <input 
              type="email" 
              id="editFornecedorEmail" 
              v-model="fornecedorEditando.email" 
              class="form-input"
            />
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="fecharModalEditar">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="salvandoFornecedor">
              {{ salvandoFornecedor ? 'Atualizando...' : 'Atualizar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Modal de Confirmação de Exclusão -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelarExclusao">
      <div class="modal-content" @click.stop>
        <h3>Confirmar Exclusão</h3>
        <p>Tem certeza que deseja excluir o fornecedor <strong>{{ fornecedorParaExcluir?.company_name || fornecedorParaExcluir?.contact_name }}</strong>?</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="cancelarExclusao">Cancelar</button>
          <button class="btn-danger" @click="excluirFornecedor" :disabled="deletingSupplier">{{ deletingSupplier ? 'Excluindo...' : 'Excluir' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useDatabaseStore } from '../stores/database.js'

export default {
  name: 'FornecedoresView',
  setup() {
    const databaseStore = useDatabaseStore()
    const fornecedores = ref([])
    const loading = ref(false)
    const error = ref(null)
    const searchTerm = ref('')
    const showDeleteModal = ref(false)
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const fornecedorParaExcluir = ref(null)
    const fornecedorEditando = ref({})
    const deletingSupplier = ref(false)
    const salvandoFornecedor = ref(false)
    
    // Dados do novo fornecedor
    const novoFornecedorData = ref({
      company_name: '',
      address: '',
      contact_name: '',
      contact_position: '',
      cnpj: '',
      phone: '',
      email: ''
    })
    
    const fornecedoresFiltrados = computed(() => {
      if (!searchTerm.value) return fornecedores.value
      
      const term = searchTerm.value.toLowerCase()
      return fornecedores.value.filter(fornecedor => 
        (fornecedor.company_name && fornecedor.company_name.toLowerCase().includes(term)) ||
        (fornecedor.contact_name && fornecedor.contact_name.toLowerCase().includes(term)) ||
        (fornecedor.email && fornecedor.email.toLowerCase().includes(term)) ||
        (fornecedor.cnpj && fornecedor.cnpj.includes(term))
      )
    })
    
    const novoFornecedor = () => {
      // Limpar dados do formulário
      novoFornecedorData.value = {
        company_name: '',
        address: '',
        contact_name: '',
        contact_position: '',
        cnpj: '',
        phone: '',
        email: ''
      }
      showCreateModal.value = true
    }
    
    const fecharModalCriar = () => {
      showCreateModal.value = false
      novoFornecedorData.value = {
        company_name: '',
        address: '',
        contact_name: '',
        contact_position: '',
        cnpj: '',
        phone: '',
        email: ''
      }
    }
    
    const salvarFornecedor = async () => {
      try {
        salvandoFornecedor.value = true
        
        // Validações básicas
        if (!novoFornecedorData.value.company_name.trim()) {
          alert('Por favor, informe a razão social do fornecedor.')
          return
        }
        
        // Verificar se CNPJ já existe (se informado)
        if (novoFornecedorData.value.cnpj) {
          const cnpjExiste = fornecedores.value.some(f => f.cnpj === novoFornecedorData.value.cnpj)
          if (cnpjExiste) {
            alert('Já existe um fornecedor cadastrado com este CNPJ.')
            return
          }
        }
        
        // Verificar se email já existe (se informado)
        if (novoFornecedorData.value.email) {
          const emailExiste = fornecedores.value.some(f => f.email === novoFornecedorData.value.email)
          if (emailExiste) {
            alert('Já existe um fornecedor cadastrado com este email.')
            return
          }
        }
        
        // Criar fornecedor no banco
        const novoFornecedor = await databaseStore.createSupplier(novoFornecedorData.value)
        
        // Adicionar à lista local
        fornecedores.value.push(novoFornecedor)
        
        console.log('✅ Fornecedor criado com sucesso:', novoFornecedor)
        fecharModalCriar()
        alert('Fornecedor criado com sucesso!')
        
      } catch (error) {
        console.error('❌ Erro ao criar fornecedor:', error)
        alert('Erro ao criar fornecedor. Tente novamente.')
      } finally {
        salvandoFornecedor.value = false
      }
    }
    
    const listarFornecedores = async () => {
      try {
        loading.value = true
        error.value = null
        
        console.log('🔄 Iniciando carregamento de fornecedores...')
        
        // Inicializar Supabase se necessário
        if (!databaseStore.isConnected) {
          console.log('🔄 Inicializando Supabase...')
          await databaseStore.initializeSupabase()
        }
        
        // Carregar fornecedores do banco
        const fornecedoresData = await databaseStore.loadSuppliers()
        fornecedores.value = fornecedoresData || []
        
        console.log('✅ Fornecedores carregados:', fornecedores.value.length)
      } catch (err) {
        console.error('❌ Erro ao listar fornecedores:', err)
        error.value = 'Erro ao carregar fornecedores. Verifique a conexão com o banco de dados.'
        fornecedores.value = []
      } finally {
        loading.value = false
      }
    }
    
    const editarFornecedor = (fornecedor) => {
      // Criar cópia dos dados para edição
      fornecedorEditando.value = { ...fornecedor }
      showEditModal.value = true
    }
    
    const fecharModalEditar = () => {
      showEditModal.value = false
      fornecedorEditando.value = {}
    }
    
    const atualizarFornecedor = async () => {
      try {
        salvandoFornecedor.value = true
        
        // Validações básicas
        if (!fornecedorEditando.value.company_name.trim()) {
          alert('Por favor, informe a razão social do fornecedor.')
          return
        }
        
        // Verificar se CNPJ já existe em outro fornecedor (se informado)
        if (fornecedorEditando.value.cnpj) {
          const cnpjExiste = fornecedores.value.some(f => 
            f.cnpj === fornecedorEditando.value.cnpj && f.id !== fornecedorEditando.value.id
          )
          if (cnpjExiste) {
            alert('Já existe outro fornecedor cadastrado com este CNPJ.')
            return
          }
        }
        
        // Verificar se email já existe em outro fornecedor (se informado)
        if (fornecedorEditando.value.email) {
          const emailExiste = fornecedores.value.some(f => 
            f.email === fornecedorEditando.value.email && f.id !== fornecedorEditando.value.id
          )
          if (emailExiste) {
            alert('Já existe outro fornecedor cadastrado com este email.')
            return
          }
        }
        
        // Atualizar fornecedor no banco
        const fornecedorAtualizado = await databaseStore.updateSupplier(fornecedorEditando.value.id, fornecedorEditando.value)
        
        // Atualizar na lista local
        const index = fornecedores.value.findIndex(f => f.id === fornecedorEditando.value.id)
        if (index !== -1) {
          fornecedores.value[index] = fornecedorAtualizado
        }
        
        console.log('✅ Fornecedor atualizado com sucesso:', fornecedorAtualizado)
        fecharModalEditar()
        alert('Fornecedor atualizado com sucesso!')
        
      } catch (error) {
        console.error('❌ Erro ao atualizar fornecedor:', error)
        alert('Erro ao atualizar fornecedor. Tente novamente.')
      } finally {
        salvandoFornecedor.value = false
      }
    }
    
    const filtrarFornecedores = () => {
      // A filtragem é reativa através do computed
    }
    
    const confirmarExclusao = (fornecedor) => {
      fornecedorParaExcluir.value = fornecedor
      showDeleteModal.value = true
    }
    
    const cancelarExclusao = () => {
      showDeleteModal.value = false
      fornecedorParaExcluir.value = null
    }
    
    const excluirFornecedor = async () => {
      try {
        deletingSupplier.value = true
        
        await databaseStore.deleteSupplier(fornecedorParaExcluir.value.id)
        
        // Remover da lista local
        fornecedores.value = fornecedores.value.filter(f => f.id !== fornecedorParaExcluir.value.id)
        
        console.log('✅ Fornecedor excluído com sucesso')
        cancelarExclusao()
        alert('Fornecedor excluído com sucesso!')
      } catch (error) {
        console.error('❌ Erro ao excluir fornecedor:', error)
        alert('Erro ao excluir fornecedor. Tente novamente.')
      } finally {
        deletingSupplier.value = false
      }
    }
    
    // Funções de formatação
    const formatarCNPJ = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      value = value.replace(/^(\d{2})(\d)/, '$1.$2')
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
      value = value.replace(/(\d{4})(\d)/, '$1-$2')
      novoFornecedorData.value.cnpj = value
    }
    
    const formatarCNPJEdicao = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      value = value.replace(/^(\d{2})(\d)/, '$1.$2')
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
      value = value.replace(/(\d{4})(\d)/, '$1-$2')
      fornecedorEditando.value.cnpj = value
    }
    
    const formatarTelefone = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      value = value.replace(/^(\d{2})(\d)/, '($1) $2')
      value = value.replace(/(\d)(\d{4})$/, '$1-$2')
      novoFornecedorData.value.phone = value
    }
    
    const formatarTelefoneEdicao = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      value = value.replace(/^(\d{2})(\d)/, '($1) $2')
      value = value.replace(/(\d)(\d{4})$/, '$1-$2')
      fornecedorEditando.value.phone = value
    }
    
    onMounted(async () => {
      console.log('🚀 FornecedoresView montada, carregando dados...')
      await listarFornecedores()
    })
    
    return {
      fornecedores,
      fornecedoresFiltrados,
      loading,
      error,
      searchTerm,
      showDeleteModal,
      showCreateModal,
      showEditModal,
      fornecedorParaExcluir,
      fornecedorEditando,
      deletingSupplier,
      salvandoFornecedor,
      novoFornecedorData,
      novoFornecedor,
      fecharModalCriar,
      salvarFornecedor,
      editarFornecedor,
      fecharModalEditar,
      atualizarFornecedor,
      listarFornecedores,
      filtrarFornecedores,
      confirmarExclusao,
      cancelarExclusao,
      excluirFornecedor,
      formatarCNPJ,
      formatarCNPJEdicao,
      formatarTelefone,
      formatarTelefoneEdicao
    }
  }
}
</script>

<style scoped>
/* Estilos base */
.fornecedores-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.actions {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  justify-content: center;
}

.search-bar {
  margin-bottom: 30px;
  text-align: center;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 12px 16px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

/* Botões */
.btn-primary, .btn-secondary, .btn-edit, .btn-delete, .btn-danger {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.btn-edit {
  background-color: #f39c12;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
}

.btn-edit:hover {
  background-color: #e67e22;
}

.btn-delete {
  background-color: #e74c3c;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
}

.btn-delete:hover {
  background-color: #c0392b;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Lista de fornecedores */
.fornecedores-list h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
}

.fornecedor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  margin-bottom: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.fornecedor-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.fornecedor-info {
  flex: 1;
}

.fornecedor-info strong {
  display: block;
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 5px;
}

.fornecedor-info span {
  display: block;
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 3px;
}

.fornecedor-actions {
  display: flex;
  gap: 10px;
}

.empty-state, .loading-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
}

/* Estilos dos modais */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  max-height: 90vh;
  overflow-y: auto;
}

.form-modal {
  max-width: 600px;
  text-align: left;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e1e8ed;
}

.modal-header h3 {
  color: #2c3e50;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #2c3e50;
}

.modal-content h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.modal-content p {
  color: #7f8c8d;
  margin-bottom: 25px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

/* Formulário */
.fornecedor-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.form-input:invalid {
  border-color: #e74c3c;
}

/* Responsividade */
@media (max-width: 768px) {
  .fornecedores-view {
    padding: 15px;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .fornecedor-item {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .fornecedor-actions {
    justify-content: center;
  }
  
  .modal-content {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
.error-state {
  text-align: center;
  padding: 40px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  margin: 20px 0;
}

.error-state p {
  color: #c33;
  margin-bottom: 20px;
  font-size: 16px;
}
</style>