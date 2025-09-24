import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '../views/DashboardView.vue'
import PropostasView from '../views/PropostasView.vue'
import ClientesView from '../views/ClientesView.vue'
import FornecedoresView from '../views/FornecedoresView.vue'
import ConfiguracoesView from '../views/ConfiguracoesView.vue'
import FixoView from '../views/FixoView.vue'
import ModelosView from '../views/ModelosView.vue'
import ProdutosServicosView from '../views/ProdutosServicosView.vue'
import VendedorEmpresaView from '../views/VendedorEmpresaView.vue'
import ItensView from '../views/ItensView.vue'
import InsumosView from '../views/InsumosView.vue'
import OpcionaisView from '../views/OpcionaisView.vue'
import TotalGeralView from '../views/TotalGeralView.vue'
import CondicoesGeraisView from '../views/CondicoesGeraisView.vue'
import PoliticaContratacaoView from '../views/PoliticaContratacaoView.vue'
import DadosFornecedorView from '../views/DadosFornecedorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/fixo',
      name: 'fixo',
      component: FixoView
    },
    {
      path: '/modelos',
      name: 'modelos',
      component: ModelosView
    },
    {
      path: '/produtos-servicos',
      name: 'produtos-servicos',
      component: ProdutosServicosView
    },
    {
      path: '/vendedor-empresa',
      name: 'vendedor-empresa',
      component: VendedorEmpresaView
    },
    {
      path: '/itens',
      name: 'itens',
      component: ItensView
    },
    {
      path: '/insumos',
      name: 'insumos',
      component: InsumosView
    },
    {
      path: '/opcionais',
      name: 'opcionais',
      component: OpcionaisView
    },
    {
      path: '/total-geral',
      name: 'total-geral',
      component: TotalGeralView
    },
    {
      path: '/condicoes-gerais',
      name: 'condicoes-gerais',
      component: CondicoesGeraisView
    },
    {
      path: '/politica-contratacao',
      name: 'politica-contratacao',
      component: PoliticaContratacaoView
    },
    {
      path: '/dados-fornecedor',
      name: 'dados-fornecedor',
      component: DadosFornecedorView
    },
    {
      path: '/propostas',
      name: 'propostas',
      component: PropostasView
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: ClientesView
    },
    {
      path: '/fornecedores',
      name: 'fornecedores',
      component: FornecedoresView
    },
    {
      path: '/configuracoes',
      name: 'configuracoes',
      component: ConfiguracoesView
    },
    { 
      path: '/login', 
      name: 'login', 
      component: () => import('@/views/LoginView.vue'), 
      meta: { requiresAuth: false } 
    },
    { 
      path: '/register', 
      name: 'register', 
      component: () => import('@/views/RegisterView.vue'), 
      meta: { requiresAuth: false } 
    }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.init()

  // Se já está logado e tenta acessar login/register, manda para dashboard
  if ((to.name === 'login' || to.name === 'register') && auth.user) {
    return { name: 'dashboard' }
  }

  const requiresAuth = to.meta.requiresAuth !== false
  if (requiresAuth && !auth.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router