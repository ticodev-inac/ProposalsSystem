/**
 * Gerenciador de assets para PDF
 * Centraliza o carregamento de imagens, fontes e outros recursos
 */

import { registerRobotoFonts } from '../assets/roboto-font.js'

/**
 * Carrega logo da empresa
 * @returns {Promise<string>} Base64 da imagem ou null
 */
export async function loadLogo() {
  try {
    // Tentar carregar logo.png do diretório public
    const logoUrl = '/logo.png'
    
    const response = await fetch(logoUrl)
    if (!response.ok) {
      throw new Error('Logo não encontrado')
    }
    
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
    
  } catch (error) {
    console.warn('Logo não encontrado, usando placeholder:', error)
    
    // Retornar logo placeholder (SVG simples)
    const placeholderSvg = `
      <svg width="100" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="60" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
        <text x="50" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">LOGO</text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(placeholderSvg)}`
  }
}

/**
 * Configura todos os assets necessários para o PDF
 * @param {jsPDF} doc - Instância do jsPDF
 * @returns {Promise<Object>} Assets carregados
 */
export async function setupPDFAssets(doc) {
  const assets = {
    logo: null,
    fontsLoaded: false
  }
  
  try {
    // Carregar logo
    assets.logo = await loadLogo()
    
    // Registrar fontes se o documento foi fornecido
    if (doc) {
      assets.fontsLoaded = registerRobotoFonts(doc)
    }
    
    console.log('Assets PDF configurados:', {
      logo: assets.logo ? 'Carregado' : 'Não disponível',
      fonts: assets.fontsLoaded ? 'Carregadas' : 'Usando fallback'
    })
    
  } catch (error) {
    console.error('Erro ao configurar assets PDF:', error)
  }
  
  return assets
}

// Alias para compatibilidade
export const loadPDFAssets = setupPDFAssets

/**
 * Utilitários para trabalhar com imagens
 */
export const imageUtils = {
  /**
   * Redimensiona imagem mantendo proporção
   * @param {number} originalWidth 
   * @param {number} originalHeight 
   * @param {number} maxWidth 
   * @param {number} maxHeight 
   * @returns {Object} Novas dimensões
   */
  resizeKeepAspect(originalWidth, originalHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
    return {
      width: originalWidth * ratio,
      height: originalHeight * ratio
    }
  },
  
  /**
   * Converte imagem para formato compatível com jsPDF
   * @param {string} imageData - Base64 da imagem
   * @returns {Object} Dados da imagem processada
   */
  processForPDF(imageData) {
    // Detectar formato da imagem
    let format = 'JPEG'
    if (imageData.includes('data:image/png')) format = 'PNG'
    if (imageData.includes('data:image/svg')) format = 'SVG'
    
    return {
      data: imageData,
      format,
      isValid: imageData && imageData.startsWith('data:image/')
    }
  }
}