<template>
  <div id="app">
    <!-- Sidebar -->
    <nav class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }" v-if="isAuthenticated">
      <div class="sidebar-header">
        <h2 v-if="!sidebarCollapsed">Sistema de Propostas</h2>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <i class="fas fa-bars"></i>
        </button>
      </div>
      
      <ul class="sidebar-menu">
        <li class="menu-item">
          <router-link to="/" class="menu-link">
            <i class="fas fa-home"></i>
            <span v-if="!sidebarCollapsed">Dashboard</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/fixo" class="menu-link">
            <i class="fas fa-cog"></i>
            <span v-if="!sidebarCollapsed">Fixo</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/clientes" class="menu-link">
            <i class="fas fa-users"></i>
            <span v-if="!sidebarCollapsed">Clientes</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/modelos" class="menu-link">
            <i class="fas fa-file-alt"></i>
            <span v-if="!sidebarCollapsed">Modelos</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/propostas" class="menu-link">
            <i class="fas fa-file-contract"></i>
            <span v-if="!sidebarCollapsed">Propostas</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/produtos-servicos" class="menu-link">
            <i class="fas fa-box"></i>
            <span v-if="!sidebarCollapsed">Produtos/Serviços</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/vendedor-empresa" class="menu-link">
            <i class="fas fa-building"></i>
            <span v-if="!sidebarCollapsed">Vendedor/Empresa</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/itens" class="menu-link">
            <i class="fas fa-list"></i>
            <span v-if="!sidebarCollapsed">Itens</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/insumos" class="menu-link">
            <i class="fas fa-tools"></i>
            <span v-if="!sidebarCollapsed">Insumos</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/opcionais" class="menu-link">
            <i class="fas fa-check-square"></i>
            <span v-if="!sidebarCollapsed">Opcionais</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/total-geral" class="menu-link">
            <i class="fas fa-calculator"></i>
            <span v-if="!sidebarCollapsed">Total Geral</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/condicoes-gerais" class="menu-link">
            <i class="fas fa-file-text"></i>
            <span v-if="!sidebarCollapsed">Condições Gerais</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/politica-contratacao" class="menu-link">
            <i class="fas fa-shield-alt"></i>
            <span v-if="!sidebarCollapsed">Política Contratação</span>
          </router-link>
        </li>
        <li class="menu-item">
          <router-link to="/dados-fornecedor" class="menu-link">
            <i class="fas fa-truck"></i>
            <span v-if="!sidebarCollapsed">Dados Fornecedor</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Main Content - Sempre Full Width -->
    <main class="main-content" :class="{ 'main-expanded': sidebarCollapsed, 'no-sidebar': !isAuthenticated }">
      <header class="top-header">
        <div class="header-left">
          <h1 id="pageTitle">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span>US</span>
          </div>
        </div>
      </header>

      <div class="content" id="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const sidebarCollapsed = ref(false)
    const auth = useAuthStore()
    const isAuthenticated = computed(() => !!auth.user)
    
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
      // Salvar preferência
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
    }
    
    const pageTitle = computed(() => {
      const titles = {
        'Dashboard': 'Dashboard',
        'Fixo': 'Fixo',
        'Clientes': 'Clientes',
        'Modelos': 'Modelos',
        'Propostas': 'Propostas',
        'ProdutosServicos': 'Produtos/Serviços',
        'VendedorEmpresa': 'Vendedor/Empresa',
        'Itens': 'Itens',
        'Insumos': 'Insumos',
        'Opcionais': 'Opcionais',
        'TotalGeral': 'Total Geral',
        'CondicoesGerais': 'Condições Gerais',
        'PoliticaContratacao': 'Política Contratação',
        'DadosFornecedor': 'Dados Fornecedor'
      }
      return titles[route.name] || 'Sistema de Propostas'
    })
    
    // Carregar preferência salva
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed === 'true') {
      sidebarCollapsed.value = true
    }
    
    return {
      sidebarCollapsed,
      toggleSidebar,
      pageTitle,
      isAuthenticated
    }
  }
}
</script>

<style>
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
  overflow-x: hidden;
}

/* Layout Flex - Sem margens excessivas */
#app {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
}

/* Sidebar Fixa */
.sidebar {
  width: 280px;
  background-color: #ffffff;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  transition: all 0.3s ease;
  z-index: 1000;
  flex-shrink: 0;
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80px;
}

.sidebar-header h2 {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-toggle {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background-color: #f8f9fa;
  color: #495057;
}

/* Sidebar Menu */
.sidebar-menu {
  list-style: none;
  padding: 0;
}

.menu-item {
  border-bottom: 1px solid #f8f9fa;
}

.menu-link {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #6c757d;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.menu-link:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.menu-link.router-link-active {
  background-color: #007bff;
  color: white;
}

.menu-link.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background-color: #0056b3;
}

.menu-link i {
  margin-right: 12px;
  width: 20px;
  text-align: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.sidebar-collapsed .menu-link {
  justify-content: center;
  padding: 15px 10px;
}

.sidebar-collapsed .menu-link i {
  margin-right: 0;
}

.menu-link span {
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.3s ease;
}

.sidebar-collapsed .menu-link span {
  opacity: 0;
  width: 0;
}

/* Main Content - Flex 1 para ocupar todo espaço */
.main-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: calc(100vw - 280px);
  transition: all 0.3s ease;
  overflow-x: hidden;
}

/* Quando não há sidebar (usuário não logado) */
.no-sidebar {
  margin-left: 0 !important;
  width: 100vw !important;
}

.main-expanded {
  margin-left: 70px;
  width: calc(100vw - 70px);
}

/* Top Header - Full Width */
.top-header {
  background-color: white;
  padding: 15px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 70px;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.top-header h1 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  background-color: #007bff;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Content - 100% Width sem max-width */
.content {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  max-width: none;
  padding: 0;
}

/* Responsividade */
@media (max-width: 1024px) {
  .sidebar {
    width: 250px;
  }
  
  .main-content {
    margin-left: 250px;
    width: calc(100vw - 250px);
  }
  
  .main-expanded {
    margin-left: 70px;
    width: calc(100vw - 70px);
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: 280px;
  }
  
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    width: 100vw;
  }
  
  .main-expanded {
    margin-left: 0;
    width: 100vw;
  }
  
  .top-header {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .top-header {
    padding: 10px 15px;
  }
  
  .top-header h1 {
    font-size: 1.3rem;
  }
}
</style>
