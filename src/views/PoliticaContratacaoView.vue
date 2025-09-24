<template>
  <div class="politica-contratacao-page">
    <HeaderProposal
      title="Política de Contratação"
      subtitle="Configure as políticas que aparecerão nas propostas"
      :showProposalContext="false"
      :showCancelButton="true"
      cancelButtonText="← Voltar para Condições"
      :showAdvanceButton="true"
      :showSaveButton="false"
      @cancel="voltarParaCondicoes"
      @advance="seguirParaFornecedor"
    />
    <div class="politicas-container" v-if="!loading">
      <div v-if="politicas && politicas.length > 0" class="politicas-content">
        <div v-for="(politica, index) in politicas" :key="politica.id || index" class="politica-section">
          <div class="section-header">
            <h3>{{ politica.titulo }}</h3>
            <div class="section-actions">
              <button class="btn-icon" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon btn-danger" title="Excluir">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="section-content">
            <div class="content-box">
              <p>{{ politica.conteudo }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-handshake"></i>
        </div>
        <h3>Nenhuma política configurada</h3>
        <p>Configure as políticas de contratação na tela de <strong>Configurações Fixas</strong> para visualizá-las aqui.</p>
        <router-link to="/fixo" class="btn btn-primary">
          <i class="fas fa-cog"></i> Ir para Configurações Fixas
        </router-link>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <p>Carregando políticas de contratação...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { FixoService } from '@/services/fixoService'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useDatabaseStore } from '@/stores/database'
import HeaderProposal from '@/components/HeaderProposal.vue'

export default {
  name: 'PoliticaContratacaoView',
  components: { HeaderProposal },
  setup() {
    const router = useRouter()
    const database = useDatabaseStore()
    const loading = ref(true)
    const politicas = ref([])
    const saving = ref(false)

    const loadPoliticas = async () => {
      try {
        loading.value = true
        const data = await FixoService.getPoliticaContratacao()
        
        if (data) {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data
          politicas.value = Array.isArray(parsedData) ? parsedData : []
        } else {
          politicas.value = []
        }
      } catch (error) {
        console.error('Erro ao carregar políticas:', error)
        politicas.value = []
      } finally {
        loading.value = false
      }
    }

    const savePoliticasToProposal = async () => {
      if (!database.currentProposalId || !politicas.value.length) return

      try {
        saving.value = true
        
        const { error } = await supabase
          .from('proposals')
          .update({ 
            politica: JSON.stringify(politicas.value),
            updated_at: new Date().toISOString()
          })
          .eq('id', database.currentProposalId)

        if (error) throw error

        console.log('Políticas de contratação salvas na proposta')
      } catch (error) {
        console.error('Erro ao salvar políticas:', error)
        alert('Erro ao salvar políticas: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    const voltarParaCondicoes = () => {
      router.push('/condicoes-gerais')
    }

    const seguirParaFornecedor = async () => {
      // Salvar políticas antes de avançar
      await savePoliticasToProposal()
      router.push('/dados-fornecedor')
    }

    onMounted(() => {
      loadPoliticas()
    })

    return {
      loading,
      politicas,
      voltarParaCondicoes,
      seguirParaFornecedor
    }
  }
}
</script>

<style scoped>
.politica-contratacao-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.page-subtitle {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
}

.btn-seguir {
  margin-left: auto;
}

.politicas-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e1e5e9;
  overflow: hidden;
}

.politicas-content {
  padding: 30px;
}

.politica-section {
  margin-bottom: 30px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 25px;
}

.politica-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #f8f9fa;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: #e9ecef;
  color: #495057;
}

.btn-icon.btn-danger:hover {
  background: #dc3545;
  color: white;
}

.content-box {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
}

.content-box p {
  margin: 0;
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-wrap;
}

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

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 20px;
}

.empty-state p {
  margin-bottom: 25px;
  font-size: 16px;
  line-height: 1.5;
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