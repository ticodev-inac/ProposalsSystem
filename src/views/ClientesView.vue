<template>
  <div class="clientes-page">
    <div class="clientes-header">
      <div class="header-content">
        <h1>Clientes</h1>
        <p class="page-subtitle">Gerencie seus clientes</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i>
        Novo Cliente
      </button>
    </div>
    
    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          placeholder="Buscar clientes..." 
          v-model="searchTerm"
          @input="filterClients"
        >
      </div>
    </div>
    
    <div class="clients-grid" v-if="filteredClients.length > 0">
      <div 
        v-for="client in filteredClients" 
        :key="client.id" 
        class="client-card"
        @click="viewClient(client)"
      >
        <div class="client-info">
          <h3>{{ client.company_name }}</h3>
          <p v-if="client.cnpj">CNPJ: {{ formatCNPJ(client.cnpj) }}</p>
          <p v-if="client.email">{{ client.email }}</p>
          <p v-if="client.phone">{{ client.phone }}</p>
          <p v-if="client.contact_name">Contato: {{ client.contact_name }}</p>
        </div>
        <div class="client-actions">
          <button class="btn-secondary" @click.stop="editClient(client)" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-danger" @click.stop="deleteClient(client.id)" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <i class="fas fa-users"></i>
      <h3>Nenhum cliente encontrado</h3>
      <p>Adicione seu primeiro cliente clicando no botão "Novo Cliente"</p>
    </div>

    <!-- Modal Criar/Editar Cliente -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="onOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Editar Cliente' : 'Novo Cliente' }}</h2>
          <button class="modal-close" @click="closeModals">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="saveClient" class="client-form">
          <div class="form-group">
            <label for="companyName">Nome da Empresa *</label>
            <input 
              type="text" 
              id="companyName" 
              v-model="currentClient.company_name" 
              required
              :class="{ 'error': errors.company_name }"
            >
            <span v-if="errors.company_name" class="error-message">{{ errors.company_name }}</span>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="cnpj">CNPJ</label>
              <input 
                type="text" 
                id="cnpj" 
                v-model="currentClient.cnpj"
                @input="formatCNPJInput"
                placeholder="00.000.000/0000-00"
                :class="{ 'error': errors.cnpj }"
              >
              <span v-if="errors.cnpj" class="error-message">{{ errors.cnpj }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              v-model="currentClient.email"
              :class="{ 'error': errors.email }"
            >
            <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          </div>
          
          <div class="form-group">
            <label for="endereco">Endereço</label>
            <input 
              type="text" 
              id="endereco" 
              v-model="currentClient.address"
            >
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="cidade">Cidade</label>
              <input 
                type="text" 
                id="cidade" 
                v-model="currentClient.city"
              >
            </div>
            <div class="form-group">
              <label for="estado">Estado</label>
              <input 
                type="text" 
                id="estado" 
                v-model="currentClient.state"
                maxlength="2"
                placeholder="SP"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="cep">CEP</label>
            <input 
              type="text" 
              id="cep" 
              v-model="currentClient.zip_code"
              placeholder="00000-000"
            >
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="telefone">Telefone</label>
              <input 
                type="text" 
                id="telefone" 
                v-model="currentClient.phone"
                @input="formatPhoneInput"
                placeholder="(00) 00000-0000"
              >
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="contactName">Nome do Contato</label>
              <input 
                type="text" 
                id="contactName" 
                v-model="currentClient.contact_name"
              >
            </div>
            <div class="form-group">
              <label for="contactPosition">Cargo do Contato</label>
              <input 
                type="text" 
                id="contactPosition" 
                v-model="currentClient.contact_position"
              >
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModals">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Salvando...' : (showEditModal ? 'Atualizar' : 'Criar') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Visualizar Cliente -->
    <div v-if="showViewModal" class="modal-overlay" @click="onOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Detalhes do Cliente</h2>
          <button class="modal-close" @click="closeModals">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="client-details" v-if="viewingClient">
          <div class="detail-section">
            <h3>Informações da Empresa</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Nome da Empresa:</label>
                <span>{{ viewingClient.company_name || '-' }}</span>
              </div>
              <div class="detail-item" v-if="viewingClient.cnpj">
                <label>CNPJ:</label>
                <span>{{ formatCNPJ(viewingClient.cnpj) }}</span>
              </div>
              <div class="detail-item" v-if="viewingClient.phone">
                <label>Telefone:</label>
                <span>{{ viewingClient.phone }}</span>
              </div>
              <div class="detail-item" v-if="viewingClient.email">
                <label>E-mail:</label>
                <span>{{ viewingClient.email }}</span>
              </div>
              <div class="detail-item" v-if="viewingClient.address">
                <label>Endereço:</label>
                <span>{{ viewingClient.address }}</span>
              </div>
              <div class="detail-item" v-if="viewingClient.city">
                <label>Cidade:</label>
                <span>{{ viewingClient.city }}</span>
              </div>
              <div class="detail-item" v-if="viewingClient.state">
                <label>Estado:</label>
                <span>{{ viewingClient.state }}</span>
              </div>
              <div class="detail-item" v-if="viewingClient.zip_code">
                <label>CEP:</label>
                <span>{{ formatCEP(viewingClient.zip_code) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="viewingClient.contact_name || viewingClient.contact_position">
            <h3>Informações do Contato</h3>
            <div class="detail-grid">
              <div class="detail-item" v-if="viewingClient.contact_name">
                <label>Nome do Contato:</label>
                <span>{{ viewingClient.contact_name }}</span>
              </div>
              <div class="detail-item" v-if="viewingClient.contact_position">
                <label>Cargo:</label>
                <span>{{ viewingClient.contact_position }}</span>
              </div>
            </div>
          </div>


        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="editClient(viewingClient)">
            <i class="fas fa-edit"></i>
            Editar
          </button>
          <button class="btn-primary" @click="closeModals">Fechar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'

export default {
  name: 'ClientesView',
  setup() {
    const clients = ref([])
    const filteredClients = ref([])
    const searchTerm = ref('')
    const loading = ref(false)
    const saving = ref(false)
    
    // Modal states
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showViewModal = ref(false)
    
    // Current client data
    const currentClient = ref({})
    const viewingClient = ref(null)
    const errors = ref({})

    // não fecha ao clicar fora (padrão: false)
const allowOverlayClose = ref(false)

const onOverlayClick = () => {
  if (!allowOverlayClose.value) return
  // se algum dia quiser permitir fechar clicando fora, é só setar true
  closeModals()
}

    
    const resetCurrentClient = () => {
      currentClient.value = {
        company_name: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        contact_name: '',
        contact_position: '',
        is_active: true
      }
    }

    const loadClients = async () => {
      try {
        loading.value = true
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('company_name')
        
        if (error) throw error
        
        clients.value = data || []
        filteredClients.value = data || []
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        alert('Erro ao carregar clientes')
      } finally {
        loading.value = false
      }
    }

    const saveClient = async () => {
      try {
        saving.value = true
        
        const clientData = {
          company_name: currentClient.value.company_name,
          cnpj: currentClient.value.cnpj,
          email: currentClient.value.email || null,
          phone: currentClient.value.phone || null,
          address: currentClient.value.address || null,
          city: currentClient.value.city || null,
          state: currentClient.value.state || null,
          zip_code: currentClient.value.zip_code || null,
          contact_name: currentClient.value.contact_name || null,
          contact_position: currentClient.value.contact_position || null,
          is_active: currentClient.value.is_active
        }

        if (showEditModal.value) {
          const { error } = await supabase
            .from('clients')
            .update(clientData)
            .eq('id', currentClient.value.id)
          
          if (error) throw error
          alert('Cliente atualizado com sucesso!')
        } else {
          const { error } = await supabase
            .from('clients')
            .insert([clientData])
          
          if (error) throw error
          alert('Cliente criado com sucesso!')
        }
        
        closeModals()
        loadClients()
      } catch (error) {
        console.error('Erro ao salvar cliente:', error)
        alert('Erro ao salvar cliente: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    const filterClients = () => {
      if (!searchTerm.value) {
        filteredClients.value = clients.value
        return
      }
      
      const term = searchTerm.value.toLowerCase()
      filteredClients.value = clients.value.filter(client => 
        client.company_name?.toLowerCase().includes(term) ||
        client.cnpj?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term) ||
        client.contact_name?.toLowerCase().includes(term)
      )
    }

    const validateClient = () => {
      errors.value = {}
      
      if (!currentClient.value.company_name?.trim()) {
        errors.value.company_name = 'Nome da empresa é obrigatório'
      }
      
      if (currentClient.value.cnpj && !isValidCNPJ(currentClient.value.cnpj)) {
        errors.value.cnpj = 'CNPJ inválido'
      }
      
      if (currentClient.value.email && !isValidEmail(currentClient.value.email)) {
        errors.value.email = 'E-mail inválido'
      }
      
      return Object.keys(errors.value).length === 0
    }

    const checkCNPJExists = async (cnpj, excludeId = null) => {
      if (!cnpj) return false
      
      try {
        let query = supabase
          .from('clients')
          .select('id')
          .eq('cnpj', cnpj)
        
        if (excludeId) {
          query = query.neq('id', excludeId)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        return data && data.length > 0
      } catch (error) {
        console.error('Erro ao verificar CNPJ:', error)
        return false
      }
    }

    const checkEmailExists = async (email, excludeId = null) => {
      if (!email) return false
      
      try {
        let query = supabase
          .from('clients')
          .select('id')
          .eq('email', email)
        
        if (excludeId) {
          query = query.neq('id', excludeId)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        return data && data.length > 0
      } catch (error) {
        console.error('Erro ao verificar email:', error)
        return false
      }
    }



    const openCreateModal = () => {
      resetCurrentClient()
      showCreateModal.value = true
    }

    const editClient = (client) => {
      currentClient.value = { ...client }
      showViewModal.value = false
      showEditModal.value = true
    }

    const viewClient = (client) => {
      viewingClient.value = client
      showViewModal.value = true
    }

    const deleteClient = async (clientId) => {
      if (!confirm('Tem certeza que deseja excluir este cliente?')) return
      
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId)
        
        if (error) throw error
        
        alert('Cliente excluído com sucesso!')
        await loadClients()
      } catch (error) {
        console.error('Erro ao excluir cliente:', error)
        alert('Erro ao excluir cliente')
      }
    }

    const closeModals = () => {
      showCreateModal.value = false
      showEditModal.value = false
      showViewModal.value = false
      resetCurrentClient()
      viewingClient.value = null
    }

    // Utility functions
    const formatCNPJ = (cnpj) => {
      if (!cnpj) return ''
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }

    const formatCNPJInput = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length <= 14) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
        currentClient.value.cnpj = value
      }
    }

    const formatPhoneInput = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length <= 11) {
        if (value.length <= 10) {
          value = value.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
        } else {
          value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
        }
        currentClient.value.phone = value
      }
    }

    const formatCEPInput = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length <= 8) {
        value = value.replace(/^(\d{5})(\d{3})$/, '$1-$2')
        currentClient.value.zip_code = value
      }
    }

    const formatCEP = (cep) => {
      if (!cep) return ''
      return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
    }

    const isValidCNPJ = (cnpj) => {
      cnpj = cnpj.replace(/\D/g, '')
      if (cnpj.length !== 14) return false
      
      // Validação básica de CNPJ
      if (/^(\d)\1+$/.test(cnpj)) return false
      
      let soma = 0
      let peso = 2
      
      for (let i = 11; i >= 0; i--) {
        soma += parseInt(cnpj.charAt(i)) * peso
        peso = peso === 9 ? 2 : peso + 1
      }
      
      let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11)
      
      soma = 0
      peso = 2
      
      for (let i = 12; i >= 0; i--) {
        soma += parseInt(cnpj.charAt(i)) * peso
        peso = peso === 9 ? 2 : peso + 1
      }
      
      let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11)
      
      return parseInt(cnpj.charAt(12)) === digito1 && parseInt(cnpj.charAt(13)) === digito2
    }

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    onMounted(() => {
      loadClients()
    })

    return {
      clients,
      filteredClients,
      searchTerm,
      loading,
      saving,
      showCreateModal,
      showEditModal,
      showViewModal,
      currentClient,
      viewingClient,
      errors,
      onOverlayClick,
      filterClients,
      openCreateModal,
      editClient,
      viewClient,
      deleteClient,
      saveClient,
      closeModals,
      formatCNPJ,
      formatCNPJInput,
      formatPhoneInput,
      formatCEPInput,
      formatCEP
    }
  }
}
</script>

<style scoped>
.clientes-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.clientes-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  gap: 20px;
}

.header-content h1 {
  margin: 0 0 5px 0;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
}

.page-subtitle {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.search-section {
  margin-bottom: 30px;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-box i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
}

.search-box input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #007bff;
}

.clients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.client-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.client-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.client-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.client-info p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.client-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary, .btn-danger {
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state i {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* Modal Styles */
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e1e5e9;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #333;
}

.client-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.form-group input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e1e5e9;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.modal-actions .btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.modal-actions .btn-primary {
  padding: 10px 16px;
  font-size: 14px;
}

/* Client Details Styles */
.client-details {
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  border-bottom: 1px solid #e1e5e9;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.detail-item label {
  font-weight: 500;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  color: #333;
  font-size: 14px;
}

.detail-section p {
  margin: 0;
  color: #333;
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .clientes-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .clients-grid {
    grid-template-columns: 1fr;
  }
  
  .client-card {
    flex-direction: column;
    gap: 15px;
  }
  
  .client-actions {
    align-self: flex-end;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
}
</style>