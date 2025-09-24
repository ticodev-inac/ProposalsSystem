<template>
  <div class="configuracoes-view">
    <div class="header">
      <h1>Configurações do Sistema</h1>
      <p>Gerencie as configurações da empresa e do sistema</p>
    </div>
    
    <div class="content">
      <div class="config-section">
        <h3>Dados da Empresa</h3>
        
        <div class="form-group" v-if="empresaData">
          <label>Nome:</label>
          <input v-model="empresaData.nome" type="text" class="form-control">
        </div>
        
        <div class="form-group" v-if="empresaData">
          <label>Endereço:</label>
          <input v-model="empresaData.endereco" type="text" class="form-control">
        </div>
        
        <div class="form-group" v-if="empresaData">
          <label>Telefone:</label>
          <input v-model="empresaData.telefone" type="text" class="form-control">
        </div>
        
        <div class="form-group" v-if="empresaData">
          <label>Email:</label>
          <input v-model="empresaData.email" type="email" class="form-control">
        </div>
        
        <div class="form-group" v-if="empresaData">
          <label>CNPJ:</label>
          <input v-model="empresaData.cnpj" type="text" class="form-control">
        </div>
        
        <div class="actions">
          <button class="btn-primary" @click="salvarDados" :disabled="loading">{{ loading ? 'Salvando...' : 'Salvar Dados' }}</button>
          <button class="btn-secondary" @click="recarregarDados">Recarregar</button>
        </div>
      </div>
      
      <div class="loading" v-if="loading">
        <p>Carregando dados...</p>
      </div>
      
      <div class="error" v-if="error">
        <p>Erro: {{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useDatabaseStore } from '@/stores/database'

export default {
  name: 'ConfiguracoesView',
  setup() {
    const database = useDatabaseStore()
    const loading = ref(false)
    const error = ref(null)
    
    const empresaData = computed(() => database.empresaData)
    
    const carregarDados = async () => {
      loading.value = true
      error.value = null
      
      try {
        await database.loadEmpresaData()
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    const salvarDados = async () => {
      if (!empresaData.value) return
      
      loading.value = true
      error.value = null
      
      try {
        const result = await database.updateEmpresaData(empresaData.value)
        if (result.success) {
          alert('Dados salvos com sucesso!')
        } else {
          error.value = result.error
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    const recarregarDados = () => {
      carregarDados()
    }
    
    onMounted(() => {
      carregarDados()
    })
    
    return {
      empresaData,
      loading,
      error,
      salvarDados,
      recarregarDados
    }
  }
}
</script>

<style scoped>
.configuracoes-view {
  padding: 20px;
  max-width: 800px;
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

.config-section {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.config-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  border-bottom: 2px solid #42b883;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-control:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #42b883;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #369870;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}
</style>