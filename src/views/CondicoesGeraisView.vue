<template>
  <div class="condicoes-gerais-page">
    <!-- Cabeçalho simples padronizado -->
    <div class="simple-header">
      <h1>Condições Gerais</h1>
      <p class="subtitle">Configure as condições que aparecerão nas propostas</p>
    </div>

    <div class="condicoes-container" v-if="!loading">
      <div class="config-display" v-if="condicoesGerais">
        <div class="config-section">
          <h3>Configurações das Condições Gerais</h3>

          <div class="config-item" v-if="condicoesGerais.prazoValidadeProposta">
            <label>Prazo de Validade da Proposta:</label>
            <div class="config-value">{{ condicoesGerais.prazoValidadeProposta }}</div>
          </div>

          <div class="config-item" v-if="condicoesGerais.prazoEntregaExecucao">
            <label>Prazo de Entrega/Execução:</label>
            <div class="config-value">{{ condicoesGerais.prazoEntregaExecucao }}</div>
          </div>

          <div class="config-item" v-if="condicoesGerais.garantia">
            <label>Garantia:</label>
            <div class="config-value">{{ condicoesGerais.garantia }}</div>
          </div>

          <div class="config-item" v-if="condicoesGerais.condicoesEspeciais">
            <label>Condições Especiais:</label>
            <div class="config-value text-content">{{ condicoesGerais.condicoesEspeciais }}</div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-icon">
          <i class="fa-solid fa-file-contract"></i>
        </div>
        <h3>Nenhuma condição configurada</h3>
        <p>
          Configure as condições gerais na tela de <strong>Configurações Fixas</strong>
          para visualizá-las aqui.
        </p>
        <router-link to="/fixo" class="btn btn-primary">
          <i class="fa-solid fa-gear"></i> Ir para Configurações Fixas
        </router-link>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <p>Carregando condições gerais...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { FixoService } from '@/services/fixoService'
import { supabase } from '@/services/supabase'
import { useDatabaseStore } from '@/stores/database'

export default {
  name: 'CondicoesGeraisView',
  setup() {
    const database = useDatabaseStore()
    const loading = ref(true)
    const condicoesGerais = ref(null)
    const saving = ref(false)

    const loadCondicoesGerais = async () => {
      try {
        loading.value = true
        const data = await FixoService.getCondicoesGerais()
        if (data) {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data
          condicoesGerais.value = parsedData
          await saveCondicoesToProposal()
        } else {
          condicoesGerais.value = null
        }
      } catch (error) {
        console.error('Erro ao carregar condições gerais:', error)
        condicoesGerais.value = null
      } finally {
        loading.value = false
      }
    }

    const saveCondicoesToProposal = async () => {
      if (!database.currentProposalId || !condicoesGerais.value) return
      try {
        saving.value = true
        const { error } = await supabase
          .from('proposals')
          .update({
            condicoes_gerais: JSON.stringify(condicoesGerais.value),
            updated_at: new Date().toISOString()
          })
          .eq('id', database.currentProposalId)
        if (error) throw error
      } catch (error) {
        console.error('Erro ao salvar condições gerais:', error)
        alert('Erro ao salvar condições gerais: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    onMounted(loadCondicoesGerais)

    return {
      loading,
      condicoesGerais
    }
  }
}
</script>

<style scoped>
.condicoes-gerais-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Cabeçalho simples — igual ao da Política */
.simple-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
}
.simple-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}
.simple-header .subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.condicoes-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e1e5e9;
  overflow: hidden;
}
.config-display {
  padding: 30px;
}
.config-section h3 {
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 20px;
  font-weight: 600;
}
.config-item {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f3f4;
}
.config-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.config-item label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 14px;
}
.config-value {
  color: #34495e;
  font-size: 16px;
  line-height: 1.5;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}
.text-content {
  white-space: pre-wrap;
  min-height: 60px;
}

/* estados */
.empty-state {
  text-align: center;
  padding: 60px 30px;
  color: #7f8c8d;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #bdc3c7;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary {
  background: #007bff;
  color: white;
}
.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.loading-state {
  text-align: center;
  padding: 60px 30px;
  color: #7f8c8d;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

