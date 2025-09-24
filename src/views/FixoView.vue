<template>
  <div class="fixo-view">
    <div class="page-header">
      <h1>Fixo</h1>
    </div>

    <!-- Sistema de Abas -->
    <div class="tabs-container">
      <div class="tabs-header">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'condicoes' }"
          @click="activeTab = 'condicoes'"
        >
          Condições Gerais
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'politica' }"
          @click="activeTab = 'politica'"
        >
          Política de Contratação
        </button>
      </div>

      <!-- Aba Condições Gerais -->
      <div v-if="activeTab === 'condicoes'" class="tab-content">
        <div class="content-header">
          <h2>Condições Gerais</h2>
          <p class="subtitle">Configure as condições que aparecerão nas propostas</p>
        </div>

        <div class="form-container">
          <div class="form-section">
            <h3>Configurações das Condições Gerais</h3>
            
            <div class="form-group">
              <label>Prazo de Validade da Proposta</label>
              <input 
                v-model="condicoesForm.prazoValidadeProposta" 
                type="text" 
                placeholder="Ex: 30 dias | Após o quarto mês"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Prazo de Entrega/Execução</label>
              <input 
                v-model="condicoesForm.prazoEntregaExecucao" 
                type="text" 
                placeholder="Ex: 5 dias"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Garantia</label>
              <input 
                v-model="condicoesForm.garantia" 
                type="text" 
                placeholder="Ex: 06 meses"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Condições Especiais</label>
              <textarea 
                v-model="condicoesForm.condicoesEspeciais"
                placeholder="Digite as condições especiais..."
                rows="6"
                class="form-textarea"
              ></textarea>
            </div>

            <div class="form-actions">
              <button @click="salvarCondicoes" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Salvando...' : 'Salvar Condições Gerais' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Aba Política de Contratação -->
      <div v-if="activeTab === 'politica'" class="tab-content">
        <div class="content-header">
          <h2>Política de Contratação</h2>
          <p class="subtitle">Configure as políticas que aparecerão nas propostas</p>
        </div>

        <div class="form-container">
          <div class="form-section">
            <div class="section-actions">
              <button @click="adicionarSecao" class="btn btn-secondary">
                <i class="fas fa-plus"></i> Adicionar Nova Seção
              </button>
            </div>

            <div v-for="(secao, index) in politicaSections" :key="secao.id" class="policy-section">
              <div class="section-header">
                <input 
                  v-model="secao.titulo" 
                  placeholder="Título da Seção"
                  class="section-title-input"
                />
                <button @click="removerSecao(index)" class="btn btn-danger btn-small">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              
              <div class="section-content">
                <textarea 
                  v-model="secao.conteudo"
                  placeholder="Conteúdo da seção..."
                  rows="4"
                  class="form-textarea"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button @click="salvarPolitica" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Salvando...' : 'Salvar Política de Contratação' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { FixoService } from '@/services/fixoService'

export default {
  name: 'FixoView',
  setup() {
    const activeTab = ref('condicoes')
    const saving = ref(false)
    
    // Formulário de Condições Gerais
    const condicoesForm = ref({
      prazoValidadeProposta: '',
      prazoEntregaExecucao: '',
      garantia: '',
      condicoesEspeciais: ''
    })

    // Seções da Política de Contratação
    const politicaSections = ref([
      { id: 1, titulo: 'ALICIAMENTO E CONTRATAÇÃO:', conteudo: '' },
      { id: 2, titulo: 'COMPROMISSOS CONTRATUAIS:', conteudo: '' },
      { id: 3, titulo: 'POLÍTICA DE NO SHOW:', conteudo: '' },
      { id: 4, titulo: 'DECLARAÇÃO DE CONFIDENCIALIDADE:', conteudo: '' },
      { id: 5, titulo: 'ACEITE DA PROPOSTA:', conteudo: '' }
    ])

    let nextSectionId = 6

    const carregarDados = async () => {
      try {
        const [condicoes, politica] = await Promise.all([
          FixoService.getCondicoesGerais(),
          FixoService.getPoliticaContratacao()
        ])

        if (condicoes) {
          const dadosCondicoes = typeof condicoes === 'string' ? JSON.parse(condicoes) : condicoes
          condicoesForm.value = { ...condicoesForm.value, ...dadosCondicoes }
        }

        if (politica) {
          const dadosPolitica = typeof politica === 'string' ? JSON.parse(politica) : politica
          if (Array.isArray(dadosPolitica)) {
            politicaSections.value = dadosPolitica
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    const salvarCondicoes = async () => {
      try {
        saving.value = true
        await FixoService.saveCondicoesGerais(JSON.stringify(condicoesForm.value))
        alert('Condições gerais salvas com sucesso!')
      } catch (error) {
        console.error('Erro ao salvar condições:', error)
        alert('Erro ao salvar condições gerais')
      } finally {
        saving.value = false
      }
    }

    const salvarPolitica = async () => {
      try {
        saving.value = true
        await FixoService.savePoliticaContratacao(JSON.stringify(politicaSections.value))
        alert('Política de contratação salva com sucesso!')
      } catch (error) {
        console.error('Erro ao salvar política:', error)
        alert('Erro ao salvar política de contratação')
      } finally {
        saving.value = false
      }
    }

    const adicionarSecao = () => {
      politicaSections.value.push({
        id: nextSectionId++,
        titulo: 'Nova Seção',
        conteudo: ''
      })
    }

    const removerSecao = (index) => {
      if (politicaSections.value.length > 1) {
        politicaSections.value.splice(index, 1)
      }
    }

    onMounted(() => {
      carregarDados()
    })

    return {
      activeTab,
      saving,
      condicoesForm,
      politicaSections,
      salvarCondicoes,
      salvarPolitica,
      adicionarSecao,
      removerSecao
    }
  }
}
</script>

<style scoped>
.fixo-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.tabs-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e1e5e9;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
}

.tab-button {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  color: #6c757d;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
}

.tab-button.active {
  color: #007bff;
  background: white;
  border-bottom-color: #007bff;
}

.tab-button:hover:not(.active) {
  background: #e9ecef;
}

.tab-content {
  padding: 30px;
}

.content-header {
  margin-bottom: 30px;
}

.content-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  color: #6c757d;
  margin: 0;
  font-size: 16px;
}

.form-container {
  max-width: 800px;
}

.form-section h3 {
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 20px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.section-actions {
  margin-bottom: 25px;
}

.policy-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.section-title-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.section-title-input:focus {
  outline: none;
  border-color: #007bff;
}

.form-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
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
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
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
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.btn-small {
  padding: 8px 12px;
  font-size: 12px;
}
</style>