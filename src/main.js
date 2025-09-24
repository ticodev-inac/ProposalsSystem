import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import BootstrapService from './services/BootstrapService'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Inicializar aplicação com bootstrap
async function initializeApp() {
  try {
    // Mostrar loading se necessário
    console.log('🚀 Inicializando aplicação...')
    
    // Executar bootstrap
    await BootstrapService.initialize()
    
    // Montar aplicação
    app.mount('#app')
    
    console.log('✅ Aplicação inicializada com sucesso!')
  } catch (error) {
    console.error('❌ Erro na inicialização:', error)
    
    // Montar aplicação mesmo com erro (modo degradado)
    app.mount('#app')
    
    // Mostrar notificação de erro para o usuário
    alert(`Erro na inicialização: ${error.message}\nA aplicação funcionará em modo limitado.`)
  }
}

// Inicializar
initializeApp()
