import { ref, computed } from 'vue'
import BootstrapService from '@/services/BootstrapService.js'

/**
 * Composable para interagir com o BootstrapService
 */
export function useBootstrap() {
  const isReady = ref(BootstrapService.isReady())
  
  // Reatividade para o status de inicialização
  const checkReady = () => {
    isReady.value = BootstrapService.isReady()
  }

  // Configurações cacheadas
  const config = computed(() => BootstrapService.getConfig())

  // Verificar funcionalidades
  const isFeatureAvailable = (feature) => {
    return BootstrapService.isFeatureAvailable(feature)
  }

  // Re-inicializar se necessário
  const reinitialize = async () => {
    try {
      await BootstrapService.reinitialize()
      checkReady()
      return true
    } catch (error) {
      console.error('Erro na re-inicialização:', error)
      return false
    }
  }

  // Verificar periodicamente se está pronto (útil para componentes que montam antes do bootstrap)
  const waitForReady = async (timeout = 10000) => {
    const startTime = Date.now()
    
    while (!BootstrapService.isReady() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    checkReady()
    return isReady.value
  }

  return {
    isReady,
    config,
    isFeatureAvailable,
    reinitialize,
    waitForReady,
    checkReady
  }
}