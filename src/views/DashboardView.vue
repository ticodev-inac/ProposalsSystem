<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p class="dashboard-subtitle">Visão geral do sistema de propostas</p>
    </div>
    
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <h3>Clientes Cadastrados</h3>
          <span class="stat-number" id="clientesCount">{{ stats.clientes || '--' }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-box"></i>
        </div>
        <div class="stat-content">
          <h3>Produtos/Serviços</h3>
          <span class="stat-number" id="produtosCount">{{ stats.produtos || '--' }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-file-contract"></i>
        </div>
        <div class="stat-content">
          <h3>Total de Propostas</h3>
          <span class="stat-number" id="propostasCount">{{ stats.propostas || '--' }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="stat-content">
          <h3>Valor Total das Propostas</h3>
          <span class="stat-number" id="valorTotal">{{ formatCurrency(stats.valorTotal) || 'R$ --' }}</span>
        </div>
      </div>
    </div>
    
    <!-- Propostas por Status -->
    <div class="status-section">
      <h2>Propostas por Status</h2>
      <div class="status-grid">
        <div class="status-card status-draft">
          <div class="status-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="status-content">
            <span class="status-number" id="rascunhoCount">{{ statusCounts.rascunho || '--' }}</span>
            <span class="status-label">Rascunho</span>
            <span class="status-sublabel">propostas</span>
          </div>
        </div>
        
        <div class="status-card status-open">
          <div class="status-icon">
            <i class="fas fa-folder-open"></i>
          </div>
          <div class="status-content">
            <span class="status-number" id="abertoCount">{{ statusCounts.aberto || '--' }}</span>
            <span class="status-label">Aberto</span>
            <span class="status-sublabel">propostas</span>
          </div>
        </div>
        
        <div class="status-card status-negotiation">
          <div class="status-icon">
            <i class="fas fa-handshake"></i>
          </div>
          <div class="status-content">
            <span class="status-number" id="negociacaoCount">{{ statusCounts.negociacao || '--' }}</span>
            <span class="status-label">Em Negociação</span>
            <span class="status-sublabel">propostas</span>
          </div>
        </div>
        
        <div class="status-card status-closed">
          <div class="status-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="status-content">
            <span class="status-number" id="fechadoCount">{{ statusCounts.fechado || '--' }}</span>
            <span class="status-label">Fechado</span>
            <span class="status-sublabel">propostas</span>
          </div>
        </div>
        
        <div class="status-card status-lost">
          <div class="status-icon">
            <i class="fas fa-times-circle"></i>
          </div>
          <div class="status-content">
            <span class="status-number" id="perdemosCount">{{ statusCounts.perdemos || '--' }}</span>
            <span class="status-label">Perdemos</span>
            <span class="status-sublabel">propostas</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Últimas Atividades -->
    <div class="activities-section">
      <h2>Últimas Atividades</h2>
      <div class="activities-content">
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <p>Nenhuma atividade recente encontrada</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

const loading = ref(true)
const stats = ref({
  clientes: 0,
  produtos: 0,
  propostas: 0,
  valorTotal: 0
})

const statusCounts = ref({
  rascunho: 0,
  aberto: 0,
  negociacao: 0,
  fechado: 0,
  perdemos: 0
})

const formatCurrency = (value) => {
  if (!value) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // Carregar estatísticas gerais (sem HEAD)
    const [clientesResult, produtosResult, propostasResult] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact' }).limit(1),
      supabase.from('products').select('id', { count: 'exact' }).limit(1),
      supabase.from('proposals').select('id, total_amount', { count: 'exact' })
    ])
    
    stats.value.clientes = clientesResult.count || 0
    stats.value.produtos = produtosResult.count || 0
    stats.value.propostas = propostasResult.count || 0
    
    // Calcular valor total das propostas (todas, sem filtro por usuário)
    if (propostasResult.data) {
      stats.value.valorTotal = propostasResult.data.reduce((total, proposta) => {
        return total + (proposta.total_amount || 0)
      }, 0)
    }
    
    // Carregar contagem por status
    const statusResult = await supabase
      .from('proposals')
      .select('status')
    
    if (statusResult.data) {
      const statusMap = {
        // canônicos
        draft: 'rascunho',
        open: 'aberto',
        negotiation: 'negociacao',
        closed: 'fechado',
        lost: 'perdemos',
        // legados -> canônicos
        sent: 'aberto',
        approved: 'fechado',
        rejected: 'perdemos',
        canceled: 'perdemos'
      }
      
      statusCounts.value = {
        rascunho: 0,
        aberto: 0,
        negociacao: 0,
        fechado: 0,
        perdemos: 0
      }
      
      statusResult.data.forEach(proposta => {
        const mappedStatus = statusMap[proposta.status] || 'rascunho'
        if (statusCounts.value.hasOwnProperty(mappedStatus)) {
          statusCounts.value[mappedStatus]++
        }
      })
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* Dashboard - 100% Width sem limitações */
.dashboard-page {
  background-color: #f8f9fa;
  min-height: calc(100vh - 70px);
  padding: 0;
  width: 100%;
  max-width: none;
}

.dashboard-header {
  background-color: white;
  padding: 30px;
  margin: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: calc(100% - 40px);
}

.dashboard-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 5px;
}

.dashboard-subtitle {
  color: #6c757d;
  font-size: 1rem;
  margin: 0;
}

/* Stats Grid - Otimizado para telas grandes */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 0 20px 30px 20px;
  width: calc(100% - 40px);
}

/* Melhor distribuição em telas grandes */
@media (min-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 25px;
  }
  
  .status-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
  }
  
  .dashboard-header {
    padding: 35px;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
  }
  
  .status-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
}

@media (min-width: 992px) and (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .status-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.2s ease;
  min-height: 120px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 1.5rem;
  color: white;
}

.stat-content h3 {
  color: #6c757d;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-number {
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
}

.status-section {
  margin: 0 20px 30px 20px;
}

.status-section h2 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 25px;
}

/* Status Grid - Melhor ocupação horizontal */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  width: 100%;
}

.status-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s ease;
  min-height: 90px;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-draft .status-icon {
  background: linear-gradient(135deg, #6c757d, #495057);
}

.status-open .status-icon {
  background: linear-gradient(135deg, #17a2b8, #138496);
}

.status-negotiation .status-icon {
  background: linear-gradient(135deg, #ffc107, #e0a800);
}

.status-closed .status-icon {
  background: linear-gradient(135deg, #28a745, #1e7e34);
}

.status-lost .status-icon {
  background: linear-gradient(135deg, #dc3545, #c82333);
}

.status-icon i {
  color: white;
  font-size: 1.2rem;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-number {
  color: #2c3e50;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
}

.status-label {
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-sublabel {
  color: #6c757d;
  font-size: 0.75rem;
}

.activities-section {
  margin: 0 20px 30px 20px;
}

.activities-section h2 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 25px;
}

.activities-content {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.empty-state {
  text-align: center;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0;
}

/* Responsividade Completa */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .status-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 0;
  }
  
  .dashboard-header {
    margin: 15px;
    padding: 20px;
    width: calc(100% - 30px);
  }
  
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    margin: 0 15px 20px 15px;
    gap: 15px;
    width: calc(100% - 30px);
  }
  
  .stat-card {
    padding: 20px;
    min-height: 100px;
  }
  
  .status-section {
    margin: 0 15px 20px 15px;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .activities-section {
    margin: 0 15px 20px 15px;
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    margin: 10px;
    padding: 15px;
    width: calc(100% - 20px);
  }
  
  .stats-grid {
    margin: 0 10px 15px 10px;
    width: calc(100% - 20px);
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
    padding: 20px 15px;
  }
  
  .status-section {
    margin: 0 10px 15px 10px;
  }
  
  .activities-section {
    margin: 0 10px 15px 10px;
  }
}
</style>