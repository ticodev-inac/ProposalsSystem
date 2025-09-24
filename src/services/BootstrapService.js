import { supabase } from './supabase.js'
import { useDatabaseStore } from '@/stores/database.js'
import { useConfigStore } from '@/stores/config.js'
import FixoService from './fixoService.js'

class BootstrapService {
  static isInitialized = false
  static initPromise = null

  /**
   * Inicialização completa da aplicação
   * Carrega configurações fixas, testa conexão e pré-carrega dados essenciais
   */
  static async initialize() {
    if (this.isInitialized) return true
    if (this.initPromise) return this.initPromise

    this.initPromise = this._performInitialization()
    return this.initPromise
  }

  static async _performInitialization() {
    try {
      console.log('🚀 Iniciando bootstrap da aplicação...')

      // 1. Testar conexão com Supabase
      await this._testSupabaseConnection()

      // 2. Carregar configurações fixas (incluir_v_un, etc.)
      await this._loadFixedConfig()

      // 3. Inicializar stores
      await this._initializeStores()

      // 4. Pré-carregar listas essenciais (clientes/fornecedores)
      await this._preloadEssentialData()

      // 5. Restaurar estado da sessão (proposta em edição)
      await this._restoreSessionState()

      this.isInitialized = true
      console.log('✅ Bootstrap concluído com sucesso!')
      return true

    } catch (error) {
      console.error('❌ Erro no bootstrap:', error)
      throw new Error(`Falha na inicialização: ${error.message}`)
    }
  }

  static async _testSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('fixo_config').select('id').limit(1)
      if (error) throw error
      console.log('✅ Conexão com Supabase estabelecida')
    } catch (error) {
      throw new Error(`Conexão com banco falhou: ${error.message}`)
    }
  }

  static async _loadFixedConfig() {
    try {
      const configStore = useConfigStore()
      await configStore.loadConfig()
      
      // Carregar configurações específicas do FixoService
      const [condicoes, politica] = await Promise.all([
        FixoService.getCondicoesGerais(),
        FixoService.getPoliticaContratacao()
      ])

      console.log('✅ Configurações fixas carregadas')
      return { condicoes, politica, config: configStore.configuracoes }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar config fixa:', error.message)
      // Não bloquear a inicialização por config fixa
      return { condicoes: '', politica: '', config: null }
    }
  }

  static async _initializeStores() {
    try {
      const database = useDatabaseStore()
      await database.initializeSupabase()
      database.initializeFromStorage()
      console.log('✅ Stores inicializadas')
    } catch (error) {
      throw new Error(`Falha na inicialização das stores: ${error.message}`)
    }
  }

  static async _preloadEssentialData() {
    try {
      const database = useDatabaseStore()
      
      // Carregar em paralelo para otimizar performance
      const [clients, suppliers] = await Promise.all([
        database.loadClients().catch(err => {
          console.warn('⚠️ Erro ao pré-carregar clientes:', err.message)
          return []
        }),
        database.loadSuppliers().catch(err => {
          console.warn('⚠️ Erro ao pré-carregar fornecedores:', err.message)
          return []
        })
      ])

      console.log(`✅ Dados essenciais carregados: ${clients?.length || 0} clientes, ${suppliers?.length || 0} fornecedores`)
    } catch (error) {
      console.warn('⚠️ Erro no pré-carregamento:', error.message)
      // Não bloquear a inicialização por falha no pré-carregamento
    }
  }

  static async _restoreSessionState() {
    try {
      const database = useDatabaseStore()
      const currentProposalId = localStorage.getItem('current_proposal_id')
      
      if (currentProposalId) {
        // Verificar se a proposta ainda existe e é válida
        const { data, error } = await supabase
          .from('proposals')
          .select('id, status, client_id')
          .eq('id', currentProposalId)
          .single()

        if (error || !data) {
          console.warn('⚠️ Proposta em edição não encontrada, limpando estado')
          database.clearEditingState()
        } else if (data.status === 'finalizada') {
          console.warn('⚠️ Proposta já finalizada, limpando estado de edição')
          database.clearEditingState()
        } else {
          database.setCurrentProposalId(currentProposalId)
          console.log(`✅ Estado de edição restaurado: proposta ${currentProposalId}`)
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao restaurar estado da sessão:', error.message)
      // Limpar estado em caso de erro
      const database = useDatabaseStore()
      database.clearEditingState()
    }
  }

  /**
   * Verificar se a aplicação está pronta para uso
   */
  static isReady() {
    return this.isInitialized
  }

  /**
   * Forçar re-inicialização (útil para testes ou reset)
   */
  static async reinitialize() {
    this.isInitialized = false
    this.initPromise = null
    return this.initialize()
  }
}

export default BootstrapService