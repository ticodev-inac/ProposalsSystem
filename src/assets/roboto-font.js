/**
 * Configuração da fonte Roboto para jsPDF
 * Inclui as variantes Regular, Bold e Italic
 */

// Base64 da fonte Roboto Regular (versão simplificada para exemplo)
// Em produção, você deve incluir os arquivos de fonte completos
const robotoRegular = `data:font/truetype;charset=utf-8;base64,AAEAAAASAQAABAAgR0RFRgAUAA4AAAEsAAAAKEdQT1MHlAhkAAABVAAAA...`

// Base64 da fonte Roboto Bold
const robotoBold = `data:font/truetype;charset=utf-8;base64,AAEAAAASAQAABAAgR0RFRgAUAA4AAAEsAAAAKEdQT1MHlAhkAAABVAAAA...`

// Base64 da fonte Roboto Italic
const robotoItalic = `data:font/truetype;charset=utf-8;base64,AAEAAAASAQAABAAgR0RFRgAUAA4AAAEsAAAAKEdQT1MHlAhkAAABVAAAA...`

/**
 * Registra as fontes Roboto no jsPDF (versão simplificada)
 * @param {jsPDF} doc - Instância do jsPDF
 */
export function registerRobotoFonts(doc) {
    try {
        // Mapeia "Arial" (e "Roboto") para uma fonte nativa segura do jsPDF (Helvetica)
        if (doc && typeof doc.setFont === 'function') {
            const originalSetFont = doc.setFont.bind(doc)
            doc.setFont = (family = 'Arial', weight = 'normal') => {
                const f = String(family || '').toLowerCase()
                if (f === 'arial' || f === 'roboto' || f.startsWith('roboto-')) {
                    return originalSetFont('helvetica', weight)
                }
                try {
                    return originalSetFont(family, weight)
                } catch (e) {
                    console.warn('Fonte não reconhecida, usando fallback Helvetica:', e)
                    return originalSetFont('helvetica', weight)
                }
            }
        }

        console.log('Usando fonte Arial (mapeada para Helvetica no jsPDF por compatibilidade)')
        return true
    } catch (error) {
        console.warn('Erro ao configurar fontes:', error)
        return false
    }
}

/**
 * Configurações de fonte padrão
 */
export const fontConfig = {
    family: 'Roboto',
    fallback: 'helvetica',
    sizes: {
        title: 16,
        subtitle: 14,
        body: 10,
        small: 8,
        caption: 7,
    },
    weights: {
        normal: 'normal',
        bold: 'bold',
        italic: 'italic',
    },
}

/**
 * Aplica fonte com fallback
 * @param {jsPDF} doc - Instância do jsPDF
 * @param {string} weight - Peso da fonte (normal, bold, italic)
 * @param {number} size - Tamanho da fonte
 */
export function setFont(doc, weight = 'normal', size = 10) {
    try {
        doc.setFont(fontConfig.family, weight)
        doc.setFontSize(size)
    } catch (error) {
        // Fallback para fonte padrão
        console.warn('Usando fonte fallback:', error)
        doc.setFont(fontConfig.fallback, weight)
        doc.setFontSize(size)
    }
}

/**
 * Função de compatibilidade para registrar fonte única
 * @param {jsPDF} doc - Instância do jsPDF (opcional)
 */
export function registerRobotoFont(doc = null) {
    if (doc) {
        return registerRobotoFonts(doc)
    }

    // Se não há documento, apenas retorna true (será registrado depois)
    console.log('Fonte Roboto será registrada quando o documento PDF for criado')
    return true
}
