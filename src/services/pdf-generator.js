import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { setupPDFAssets } from './pdf-assets.js'
import { registerRobotoFonts } from '../assets/roboto-font.js'

class PDFGenerator {
  constructor() {
    this.doc = null
    this.assets = null
    this.currentY = 20
    this.pageHeight = 297 // A4 height in mm
    this.margin = 20
    this.contentWidth = 170 // 210 - 40 (margins)
  }

  async initialize() {
    try {
      // Criar documento PDF
      this.doc = new jsPDF('portrait', 'mm', 'a4')
      
      // Registrar fontes Roboto
      registerRobotoFonts(this.doc)
      
      // Carregar assets (logo, etc.)
      this.assets = await setupPDFAssets(this.doc)
      
      console.log('✅ PDF Generator inicializado')
      return true
    } catch (error) {
      console.error('❌ Erro ao inicializar PDF Generator:', error)
      // Continuar sem assets se houver erro
      this.assets = { logo: null, fontsLoaded: false }
      return false
    }
  }

  async generateProposalPDF(pdfData, options = {}) {
    if (!this.doc) {
      await this.initialize()
    }

    try {
      console.log('📄 Gerando PDF com dados:', pdfData)

      // Cabeçalho (sem ID da proposta)
      this._addHeader(pdfData)
      
      // Remover seção de cliente - dados já estão no evento
      // if (pdfData.client && pdfData.client.nome) {
      //   this._addClientSection(pdfData.client)
      // }
      
      // Dados do evento (NOVO)
      if (pdfData.event && pdfData.event.nome) {
        this._addEventSection(pdfData.event)
      }
      
      // Dados do fornecedor + vendedor responsável
      if (pdfData.supplier && pdfData.supplier.nome) {
        this._addSupplierSection(pdfData.supplier)
      }
      
      // Itens (renomeado de Produtos/Serviços) - com tabela formatada
      this._addItemsSection(pdfData.items || [], 'Itens')
      
      // Insumos (manter como está - já funciona perfeitamente)
      this._addItemsSection(pdfData.supplies || [], 'Insumos')
      
      // Opcionais (sempre mostrar tabela formatada, mesmo se vazia)
      console.log('🔍 PDF Generator - Opcionais recebidos:', pdfData.optionals)
      console.log('🔍 PDF Generator - Tipo dos opcionais:', typeof pdfData.optionals, Array.isArray(pdfData.optionals))
      console.log('🔍 PDF Generator - Quantidade de opcionais:', pdfData.optionals?.length || 0)
      this._addItemsSection(pdfData.optionals || [], 'Opcionais Não Inclusos')
      
      // Totais detalhados (manter como está - já está profissional)
      this._addDetailedTotalsSection(pdfData.totals, pdfData.optionals)
      
      // Condições e políticas (manter como está - já funciona)
      if (pdfData.texts?.conditions) {
        this._addFormattedTextSection('Condições Gerais', pdfData.texts.conditions)
      }
      
      if (pdfData.texts?.policy) {
        this._addFormattedTextSection('Política de Contratação', pdfData.texts.policy)
      }
      
      // Rodapé
      this._addFooter(pdfData)
      
      console.log('✅ PDF gerado com sucesso')
      return this.doc

    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error)
      throw error
    }
  }

  _addHeader(pdfData) {
    // Logo com tamanho corrigido (menos comprimida)
    if (this.assets?.logo) {
      // Aumentar altura para evitar compressão
      this.doc.addImage(this.assets.logo, 'PNG', this.margin, this.margin, 40, 20)
    }

    // Título
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('PROPOSTA COMERCIAL', this.margin + 50, this.margin + 12)

    // Data (removido ID da proposta)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Data: ${pdfData.metadata.data_criacao}`, this.margin + 50, this.margin + 22)

    this.currentY = this.margin + 40
  }

  _addClientSection(client) {
    this._checkPageBreak(60)
    
    // Título da seção com fundo verde
    this.doc.setFillColor(76, 175, 80) // Verde similar ao modelo
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFont('Roboto-Bold', 'bold')
    this.doc.setFontSize(12)
    this.doc.rect(20, this.currentY, 170, 8, 'F')
    this.doc.text('DADOS DO CLIENTE', 22, this.currentY + 5.5)
    
    this.currentY += 12
    
    // Configurar texto preto para o conteúdo
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont('Roboto-Regular', 'normal')
    this.doc.setFontSize(10)
    
    // Layout em duas colunas
    const leftColumn = 22
    const rightColumn = 110
    let currentRow = this.currentY
    
    // Coluna esquerda
    if (client?.nome) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Nome:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(client.nome, leftColumn + 15, currentRow)
      currentRow += 6
    }
    
    if (client?.cnpj_cpf) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('CNPJ/CPF:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(client.cnpj_cpf, leftColumn + 25, currentRow)
      currentRow += 6
    }
    
    if (client?.endereco) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Endereço:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      // Quebrar endereço se for muito longo
      const enderecoLines = this.doc.splitTextToSize(client.endereco, 65)
      this.doc.text(enderecoLines, leftColumn + 22, currentRow)
      currentRow += (enderecoLines.length * 5)
    }
    
    // Coluna direita (resetar posição)
    currentRow = this.currentY
    
    if (client?.telefone) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Telefone:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(client.telefone, rightColumn + 22, currentRow)
      currentRow += 6
    }

    if (client?.email) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('E-mail:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(client.email, rightColumn + 18, currentRow)
      currentRow += 6
    }

    // Atualizar posição Y para a maior das duas colunas + margem
    this.currentY = Math.max(this.currentY + 30, currentRow + 10)
  }

  _addSupplierSection(supplier) {
    console.log('📋 Adicionando seção do fornecedor:', supplier)
    
    this._checkPageBreak(80)
    
    // Título da seção com fundo verde (IGUAL AO DADOS DO EVENTO)
    this.doc.setFillColor(76, 175, 80) // Verde similar ao modelo
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFont('Roboto-Bold', 'bold')
    this.doc.setFontSize(12)
    this.doc.rect(20, this.currentY, 170, 8, 'F')
    this.doc.text('DADOS DO FORNECEDOR', 22, this.currentY + 5.5)
    
    this.currentY += 12
    
    // Configurar texto preto para o conteúdo (IGUAL AO DADOS DO EVENTO)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont('Roboto-Regular', 'normal')
    this.doc.setFontSize(10)
    
    // Layout em duas colunas IGUAL AO DADOS DO EVENTO
    const leftColumn = 22
    const rightColumn = 110
    let currentRow = this.currentY
    
    // EMPRESA (Coluna Esquerda)
    this.doc.setFont('Roboto-Bold', 'bold')
    this.doc.text('EMPRESA:', leftColumn, currentRow)
    currentRow += 6
    
    // Nome da empresa
    if (supplier.nome) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Nome:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(supplier.nome, leftColumn + 15, currentRow)
      currentRow += 6
    }
    
    if (supplier.cnpj) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('CNPJ:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(supplier.cnpj, leftColumn + 15, currentRow)
      currentRow += 6
    }
    
    if (supplier.endereco) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Endereço:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      const enderecoLines = this.doc.splitTextToSize(supplier.endereco, 65)
      this.doc.text(enderecoLines, leftColumn + 22, currentRow)
      currentRow += (enderecoLines.length * 6)
    }
    
    if (supplier.telefone) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Telefone:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(supplier.telefone, leftColumn + 22, currentRow)
      currentRow += 6
    }
    
    if (supplier.email) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Email:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(supplier.email, leftColumn + 15, currentRow)
    }
    
    // VENDEDOR RESPONSÁVEL (Coluna Direita) - resetar posição igual ao DADOS DO EVENTO
    currentRow = this.currentY
    
    this.doc.setFont('Roboto-Bold', 'bold')
    this.doc.text('RESPONSÁVEL:', rightColumn, currentRow)
    currentRow += 6
    
    if (supplier.vendedor) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Nome:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(supplier.vendedor.nome || 'Não informado', rightColumn + 15, currentRow)
      currentRow += 6
      
      if (supplier.vendedor.email) {
        this.doc.setFont('Roboto-Bold', 'bold')
        this.doc.text('E-mail:', rightColumn, currentRow)
        this.doc.setFont('Roboto-Regular', 'normal')
        this.doc.text(supplier.vendedor.email, rightColumn + 18, currentRow)
        currentRow += 6
      }
      
      if (supplier.vendedor.telefone) {
        this.doc.setFont('Roboto-Bold', 'bold')
        this.doc.text('Telefone:', rightColumn, currentRow)
        this.doc.setFont('Roboto-Regular', 'normal')
        this.doc.text(supplier.vendedor.telefone, rightColumn + 22, currentRow)
        currentRow += 6
      }
    } else {
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text('Vendedor não informado', rightColumn, currentRow)
    }
    
    // Atualizar posição Y IGUAL AO DADOS DO EVENTO
    this.currentY = Math.max(this.currentY + 36, currentRow + 10)
  }

  _addItemsSection(items, title) {
    console.log(`🔍 Adicionando seção: ${title}`)
    console.log(`🔍 Itens recebidos:`, items)
    console.log(`🔍 Quantidade de itens:`, items?.length)
    
    this._checkPageBreak(50)
    
    // 🔥 ADICIONAR ESPAÇAMENTO EXTRA ANTES DO TÍTULO
    this.currentY += 5 // Espaço adicional antes do título
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 12 // 🔥 AUMENTADO DE 10 PARA 12

    // Se não houver itens, mostrar mensagem
    if (!items || items.length === 0) {
      console.log(`⚠️ Nenhum item encontrado para ${title}`)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'italic')
      this.doc.text(`Nenhum item em ${title.toLowerCase()}`, this.margin, this.currentY)
      this.currentY += 15
      return
    }

    console.log(`✅ Processando ${items.length} itens para ${title}`)

    // Detectar tipo de seção baseado no título e campos disponíveis
    const isItems = title === 'Itens'
    const isOptionals = title === 'Opcionais Não Inclusos'
    const isSupplies = title === 'Insumos'

    let tableData, headers, columnStyles

    if (isItems) {
      // Tabela para ITENS - Larguras drasticamente reduzidas
      tableData = items.map(item => [
        {
          content: `${item.codigo || item.name || ''}\n${item.descricao || item.description || ''}`,
          styles: { 
            fontStyle: 'normal',
            lineHeight: 1.2
          }
        },
        item.quantidade?.toString() || '0',
        item.valor_unitario_formatted || 'R$ 0,00',
        item.subtotal_formatted || 'R$ 0,00'
      ])
      headers = [['Item', 'Qtd', 'Valor Unit.', 'Subtotal']]
      columnStyles = {
        0: { 
          cellWidth: 70, // 🔥 REDUZIDO DE 85 PARA 70
          valign: 'top',
          fontSize: 8, // 🔥 REDUZIDO DE 9 PARA 8
          lineHeight: 1.1
        },
        1: { cellWidth: 15, halign: 'center', fontSize: 8 }, // 🔥 REDUZIDO DE 18 PARA 15
        2: { cellWidth: 25, halign: 'right', fontSize: 8 },  // 🔥 REDUZIDO DE 30 PARA 25
        3: { cellWidth: 25, halign: 'right', fontSize: 8 }   // 🔥 REDUZIDO DE 30 PARA 25
      }
    } else if (isOptionals) {
      // Tabela para OPCIONAIS - Larguras drasticamente reduzidas
      tableData = items.map(item => [
        {
          content: `${item.codigo || item.name || ''}\n${item.descricao || item.description || ''}`,
          styles: { 
            fontStyle: 'normal',
            lineHeight: 1.2
          }
        },
        item.quantidade?.toString() || '0',
        item.valor_unitario_formatted || 'R$ 0,00',
        item.subtotal_formatted || 'R$ 0,00'
      ])
      headers = [['Item', 'Qtd', 'Valor Unit.', 'Subtotal']]
      columnStyles = {
        0: { 
          cellWidth: 70, // 🔥 REDUZIDO DE 85 PARA 70
          valign: 'top',
          fontSize: 8, // 🔥 REDUZIDO DE 9 PARA 8
          lineHeight: 1.1
        },
        1: { cellWidth: 15, halign: 'center', fontSize: 8 }, // 🔥 REDUZIDO DE 18 PARA 15
        2: { cellWidth: 25, halign: 'right', fontSize: 8 },  // 🔥 REDUZIDO DE 30 PARA 25
        3: { cellWidth: 25, halign: 'right', fontSize: 8 }   // 🔥 REDUZIDO DE 30 PARA 25
      }
    } else {
      // Tabela para INSUMOS - Larguras drasticamente reduzidas
      tableData = items.map(item => [
        {
          content: `${item.codigo || item.name || ''}\n${item.descricao || item.description || ''}`,
          styles: { 
            fontStyle: 'normal',
            lineHeight: 1.2
          }
        },
        item.quantidade?.toString() || '0',
        item.valor_unitario_formatted || 'R$ 0,00',
        item.subtotal_formatted || 'R$ 0,00'
      ])
      headers = [['Item', 'Qtd', 'Valor Unit.', 'Subtotal']]
      columnStyles = {
        0: { 
          cellWidth: 70, // 🔥 REDUZIDO DE 85 PARA 70
          valign: 'top',
          fontSize: 8, // 🔥 REDUZIDO DE 9 PARA 8
          lineHeight: 1.1
        },
        1: { cellWidth: 15, halign: 'center', fontSize: 8 }, // 🔥 REDUZIDO DE 18 PARA 15
        2: { cellWidth: 25, halign: 'right', fontSize: 8 },  // 🔥 REDUZIDO DE 30 PARA 25
        3: { cellWidth: 25, halign: 'right', fontSize: 8 }   // 🔥 REDUZIDO DE 30 PARA 25
      }
    }

    // Gerar tabela com configurações simplificadas
    this.doc.autoTable({
      head: headers,
      body: tableData,
      startY: this.currentY,
      columnStyles: columnStyles,
      headStyles: {
        fillColor: [52, 144, 220],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9, // 🔥 REDUZIDO DE 10 PARA 9
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8, // 🔥 REDUZIDO DE 9 PARA 8
        cellPadding: 2, // 🔥 REDUZIDO DE 3 PARA 2
        valign: 'top',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
      // 🔥 REMOVIDO: tableWidth e cellWidth conflitantes
      styles: {
        overflow: 'linebreak'
      },
      // 🔥 CONFIGURAÇÃO SIMPLIFICADA
      pageBreak: 'auto',
      showHead: 'everyPage'
    })

    this.currentY = this.doc.lastAutoTable.finalY + 15
  }

  _addDetailedTotalsSection(totals, optionals) {
    this._checkPageBreak(60)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('RESUMO FINANCEIRO', this.margin, this.currentY)
    this.currentY += 15

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    if (totals) {
      // Subtotal de itens
      if (totals.subtotal_itens > 0) {
        this.doc.text(`Subtotal Produtos/Serviços: ${totals.subtotal_itens_formatted}`, this.margin, this.currentY)
        this.currentY += 6
      }

      // Subtotal de insumos
      if (totals.subtotal_insumos > 0) {
        this.doc.text(`Subtotal Insumos: ${totals.subtotal_insumos_formatted}`, this.margin, this.currentY)
        this.currentY += 6
      }

      // Subtotal de opcionais (apenas se houver opcionais selecionados)
      const hasSelectedOptionals = optionals && optionals.some(opt => opt.selecionado)
      if (hasSelectedOptionals && totals.subtotal_opcionais > 0) {
        this.doc.text(`Subtotal Opcionais: ${totals.subtotal_opcionais_formatted}`, this.margin, this.currentY)
        this.currentY += 6
      }

      this.currentY += 5

      // Total final
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(12)
      const totalFinal = hasSelectedOptionals ? totals.total_com_opcionais_formatted : totals.total_sem_opcionais_formatted
      this.doc.text(`TOTAL GERAL: ${totalFinal}`, this.margin, this.currentY)
      this.currentY += 20
    } else {
      // Fallback se não houver totais
      this.doc.setFont('helvetica', 'italic')
      this.doc.text('Totais não calculados', this.margin, this.currentY)
      this.currentY += 20
    }
  }

  _addFormattedTextSection(title, content) {
    if (!content) return

    this._checkPageBreak(30)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 10

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    // Se for array de objetos estruturados
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (item.titulo) {
          this._checkPageBreak(15)
          this.doc.setFont('helvetica', 'bold')
          this.doc.text(item.titulo, this.margin, this.currentY)
          this.currentY += 7
          this.doc.setFont('helvetica', 'normal')
        }
        
        if (item.conteudo) {
          this._checkPageBreak(10)
          const lines = this.doc.splitTextToSize(item.conteudo, this.contentWidth)
          lines.forEach(line => {
            this._checkPageBreak(5)
            this.doc.text(line, this.margin, this.currentY)
            this.currentY += 5
          })
          this.currentY += 3
        }
      })
    } else {
      // Se for string simples
      const cleanText = content.toString().trim()
      if (cleanText) {
        // Quebrar texto em parágrafos
        const paragraphs = cleanText.split('\n').filter(p => p.trim())
        
        paragraphs.forEach(paragraph => {
          if (paragraph.trim()) {
            this._checkPageBreak(15)
            
            // Quebrar parágrafo em linhas
            const lines = this.doc.splitTextToSize(paragraph.trim(), this.contentWidth)
            
            lines.forEach(line => {
              this._checkPageBreak(5)
              this.doc.text(line, this.margin, this.currentY)
              this.currentY += 5
            })
            
            this.currentY += 3 // Espaço entre parágrafos
          }
        })
      }
    }

    this.currentY += 10
  }

  _addFooter(pdfData) {
    const pageCount = this.doc.internal.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        this.doc.internal.pageSize.width - this.margin - 20,
        this.doc.internal.pageSize.height - 10
      )
    }
  }

  _checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - 25) {
      this.doc.addPage()
      this.currentY = 20
    }
  }

  _formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  _addEventSection(event) {
    this._checkPageBreak(60)
    
    // Título da seção com fundo verde
    this.doc.setFillColor(76, 175, 80) // Verde similar ao modelo
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFont('Roboto-Bold', 'bold')
    this.doc.setFontSize(12)
    this.doc.rect(20, this.currentY, 170, 8, 'F')
    this.doc.text('DADOS DO EVENTO', 22, this.currentY + 5.5)
    
    this.currentY += 12
    
    // Configurar texto preto para o conteúdo
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont('Roboto-Regular', 'normal')
    this.doc.setFontSize(10)
    
    // Layout em duas colunas como no modelo antigo
    const leftColumn = 22
    const rightColumn = 110
    let currentRow = this.currentY
    
    // Coluna esquerda
    if (event.nome) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Evento:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.nome, leftColumn + 20, currentRow)
      currentRow += 6
    }
    
    if (event.participantes) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Participantes:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.participantes.toString(), leftColumn + 30, currentRow)
      currentRow += 6
    }
    
    if (event.data_inicio) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Data de Início:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.data_inicio, leftColumn + 30, currentRow)
      currentRow += 6
    }
    
    if (event.horario_inicio) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Horário de Início:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.horario_inicio, leftColumn + 35, currentRow)
      currentRow += 6
    }
    
    if (event.empresa_contratante) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Empresa:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.empresa_contratante, leftColumn + 22, currentRow)
      currentRow += 6
    }
    
    if (event.solicitante) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Solicitante:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.solicitante, leftColumn + 25, currentRow)
    }
    
    // Coluna direita (resetar posição)
    currentRow = this.currentY
    
    if (event.local) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Local:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.local, rightColumn + 15, currentRow)
      currentRow += 6
    }
    
    if (event.tipo) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Tipo de evento:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.tipo, rightColumn + 30, currentRow)
      currentRow += 6
    }
    
    if (event.data_fim) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Data de Fim:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.data_fim, rightColumn + 25, currentRow)
      currentRow += 6
    }
    
    if (event.horario_fim) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Horário de Fim:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.horario_fim, rightColumn + 30, currentRow)
      currentRow += 6
    }
    
    if (event.telefone) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Telefone:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.telefone, rightColumn + 22, currentRow)
      currentRow += 6
    }
    
    if (event.email) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('E-mail:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.email, rightColumn + 18, currentRow)
    }
    
    // Atualizar posição Y para a maior das duas colunas + margem MAIOR
    this.currentY = Math.max(this.currentY + 36, currentRow + 20) // 🔥 AUMENTADO DE 10 PARA 20
  }

  _addItemsSection(items, title) {
    console.log(`🔍 Adicionando seção: ${title}`)
    console.log(`🔍 Itens recebidos:`, items)
    console.log(`🔍 Quantidade de itens:`, items?.length)
    
    this._checkPageBreak(50)
    
    // 🔥 ADICIONAR ESPAÇAMENTO EXTRA ANTES DO TÍTULO
    this.currentY += 5 // Espaço adicional antes do título
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 12 // 🔥 AUMENTADO DE 10 PARA 12

    // Se não houver itens, mostrar mensagem
    if (!items || items.length === 0) {
      console.log(`⚠️ Nenhum item encontrado para ${title}`)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'italic')
      this.doc.text(`Nenhum item em ${title.toLowerCase()}`, this.margin, this.currentY)
      this.currentY += 15
      return
    }

    console.log(`✅ Processando ${items.length} itens para ${title}`)

    // Detectar tipo de seção baseado no título e campos disponíveis
    const isItems = title === 'Itens'
    const isOptionals = title === 'Opcionais Não Inclusos'
    const isSupplies = title === 'Insumos'

    let tableData, headers, columnStyles

    if (isItems) {
      // Tabela para ITENS - Novo formato com código e descrição vertical
      tableData = items.map(item => [
        {
          content: `${item.codigo || item.name || ''}\n${item.descricao || item.description || ''}`,
          styles: { 
            fontStyle: 'normal',
            lineHeight: 1.2
          }
        },
        item.quantidade?.toString() || '0',
        item.valor_unitario_formatted || 'R$ 0,00',
        item.subtotal_formatted || 'R$ 0,00'
      ])
      headers = [['Item', 'Qtd', 'Valor Unit.', 'Subtotal']]
      columnStyles = {
        0: { 
          cellWidth: 100, // Mais espaço para código + descrição
          valign: 'top',
          fontSize: 9,
          lineHeight: 1.2
        },
        1: { cellWidth: 20, halign: 'center' }, // Quantidade
        2: { cellWidth: 25, halign: 'right' },  // Valor Unit.
        3: { cellWidth: 25, halign: 'right' }   // Subtotal
      }
    } else if (isOptionals) {
      // Tabela para OPCIONAIS - Novo formato com código e descrição vertical
      tableData = items.map(item => [
        {
          content: `${item.codigo || item.name || ''}\n${item.descricao || item.description || ''}`,
          styles: { 
            fontStyle: 'normal',
            lineHeight: 1.2
          }
        },
        item.quantidade?.toString() || '0',
        item.valor_unitario_formatted || 'R$ 0,00',
        item.subtotal_formatted || 'R$ 0,00'
      ])
      headers = [['Item', 'Qtd', 'Valor Unit.', 'Subtotal']]
      columnStyles = {
        0: { 
          cellWidth: 100, // Mais espaço para código + descrição
          valign: 'top',
          fontSize: 9,
          lineHeight: 1.2
        },
        1: { cellWidth: 20, halign: 'center' }, // Quantidade
        2: { cellWidth: 25, halign: 'right' },  // Valor Unit.
        3: { cellWidth: 25, halign: 'right' }   // Subtotal
      }
    } else {
      // Tabela para INSUMOS - Novo formato com código e descrição vertical
      tableData = items.map(item => [
        {
          content: `${item.codigo || item.name || ''}\n${item.descricao || item.description || ''}`,
          styles: { 
            fontStyle: 'normal',
            lineHeight: 1.2
          }
        },
        item.quantidade?.toString() || '0',
        item.valor_unitario_formatted || 'R$ 0,00',
        item.subtotal_formatted || 'R$ 0,00'
      ])
      headers = [['Item', 'Qtd', 'Valor Unit.', 'Subtotal']]
      columnStyles = {
        0: { 
          cellWidth: 100, // Mais espaço para código + descrição
          valign: 'top',
          fontSize: 9,
          lineHeight: 1.2
        },
        1: { cellWidth: 20, halign: 'center' }, // Quantidade
        2: { cellWidth: 25, halign: 'right' },  // Valor Unit.
        3: { cellWidth: 25, halign: 'right' }   // Subtotal
      }
    }

    // Gerar tabela com configurações padronizadas
    this.doc.autoTable({
      head: headers,
      body: tableData,
      startY: this.currentY,
      columnStyles: columnStyles,
      headStyles: {
        fillColor: [52, 144, 220],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'top',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'wrap',
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 15
  }

  _addDetailedTotalsSection(totals, optionals) {
    this._checkPageBreak(60)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('RESUMO FINANCEIRO', this.margin, this.currentY)
    this.currentY += 15

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    if (totals) {
      // Subtotal de itens
      if (totals.subtotal_itens > 0) {
        this.doc.text(`Subtotal Produtos/Serviços: ${totals.subtotal_itens_formatted}`, this.margin, this.currentY)
        this.currentY += 6
      }

      // Subtotal de insumos
      if (totals.subtotal_insumos > 0) {
        this.doc.text(`Subtotal Insumos: ${totals.subtotal_insumos_formatted}`, this.margin, this.currentY)
        this.currentY += 6
      }

      // Subtotal de opcionais (apenas se houver opcionais selecionados)
      const hasSelectedOptionals = optionals && optionals.some(opt => opt.selecionado)
      if (hasSelectedOptionals && totals.subtotal_opcionais > 0) {
        this.doc.text(`Subtotal Opcionais: ${totals.subtotal_opcionais_formatted}`, this.margin, this.currentY)
        this.currentY += 6
      }

      this.currentY += 5

      // Total final
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(12)
      const totalFinal = hasSelectedOptionals ? totals.total_com_opcionais_formatted : totals.total_sem_opcionais_formatted
      this.doc.text(`TOTAL GERAL: ${totalFinal}`, this.margin, this.currentY)
      this.currentY += 20
    } else {
      // Fallback se não houver totais
      this.doc.setFont('helvetica', 'italic')
      this.doc.text('Totais não calculados', this.margin, this.currentY)
      this.currentY += 20
    }
  }

  _addFormattedTextSection(title, content) {
    if (!content) return

    // 🔥 MELHORAR VERIFICAÇÃO DE QUEBRA DE PÁGINA
    this._checkPageBreak(40) // Aumentado de 30 para 40
    
    // 🔥 ADICIONAR ESPAÇAMENTO EXTRA ANTES DO TÍTULO
    this.currentY += 5 // Espaço adicional antes do título
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 12 // 🔥 AUMENTADO DE 10 PARA 12

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    // Se for array de objetos estruturados
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (item.titulo) {
          this._checkPageBreak(20) // 🔥 AUMENTADO DE 15 PARA 20
          this.doc.setFont('helvetica', 'bold')
          this.doc.text(item.titulo, this.margin, this.currentY)
          this.currentY += 8 // 🔥 AUMENTADO DE 7 PARA 8
          this.doc.setFont('helvetica', 'normal')
        }
        
        if (item.conteudo) {
          this._checkPageBreak(15) // 🔥 AUMENTADO DE 10 PARA 15
          const lines = this.doc.splitTextToSize(item.conteudo, this.contentWidth)
          lines.forEach(line => {
            this._checkPageBreak(8) // 🔥 AUMENTADO DE 5 PARA 8
            this.doc.text(line, this.margin, this.currentY)
            this.currentY += 6 // 🔥 AUMENTADO DE 5 PARA 6
          })
          this.currentY += 4 // 🔥 AUMENTADO DE 3 PARA 4
        }
      })
    } else {
      // Se for string simples
      const cleanText = content.toString().trim()
      if (cleanText) {
        // Quebrar texto em parágrafos
        const paragraphs = cleanText.split('\n').filter(p => p.trim())
        
        paragraphs.forEach((paragraph, index) => {
          if (paragraph.trim()) {
            this._checkPageBreak(20) // 🔥 AUMENTADO DE 15 PARA 20
            
            // Quebrar parágrafo em linhas
            const lines = this.doc.splitTextToSize(paragraph.trim(), this.contentWidth)
            
            lines.forEach(line => {
              this._checkPageBreak(8) // 🔥 AUMENTADO DE 5 PARA 8
              this.doc.text(line, this.margin, this.currentY)
              this.currentY += 6 // 🔥 AUMENTADO DE 5 PARA 6
            })
            
            // 🔥 CORREÇÃO: Espaço entre parágrafos apenas se não for o último
            if (index < paragraphs.length - 1) {
              this.currentY += 4 // Aumentado de 3 para 4
            }
          }
        })
      }
    }

    this.currentY += 15 // 🔥 AUMENTADO DE 10 PARA 15 - Espaço após seção
  }

  _checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin + 10 // 🔥 MARGEM SUPERIOR MAIOR NA NOVA PÁGINA
    }
  }

  _formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  _addEventSection(event) {
    this._checkPageBreak(60)
    
    // Título da seção com fundo verde
    this.doc.setFillColor(76, 175, 80) // Verde similar ao modelo
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFont('Roboto-Bold', 'bold')
    this.doc.setFontSize(12)
    this.doc.rect(20, this.currentY, 170, 8, 'F')
    this.doc.text('DADOS DO EVENTO', 22, this.currentY + 5.5)
    
    this.currentY += 12
    
    // Configurar texto preto para o conteúdo
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont('Roboto-Regular', 'normal')
    this.doc.setFontSize(10)
    
    // Layout em duas colunas como no modelo antigo
    const leftColumn = 22
    const rightColumn = 110
    let currentRow = this.currentY
    
    // Coluna esquerda
    if (event.nome) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Evento:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.nome, leftColumn + 20, currentRow)
      currentRow += 6
    }
    
    if (event.participantes) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Participantes:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.participantes.toString(), leftColumn + 30, currentRow)
      currentRow += 6
    }
    
    if (event.data_inicio) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Data de Início:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.data_inicio, leftColumn + 30, currentRow)
      currentRow += 6
    }
    
    if (event.horario_inicio) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Horário de Início:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.horario_inicio, leftColumn + 35, currentRow)
      currentRow += 6
    }
    
    if (event.empresa_contratante) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Empresa:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.empresa_contratante, leftColumn + 22, currentRow)
      currentRow += 6
    }
    
    if (event.solicitante) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Solicitante:', leftColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.solicitante, leftColumn + 25, currentRow)
    }
    
    // Coluna direita (resetar posição)
    currentRow = this.currentY
    
    if (event.local) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Local:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.local, rightColumn + 15, currentRow)
      currentRow += 6
    }
    
    if (event.tipo) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Tipo de evento:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.tipo, rightColumn + 30, currentRow)
      currentRow += 6
    }
    
    if (event.data_fim) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Data de Fim:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.data_fim, rightColumn + 25, currentRow)
      currentRow += 6
    }
    
    if (event.horario_fim) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Horário de Fim:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.horario_fim, rightColumn + 30, currentRow)
      currentRow += 6
    }
    
    if (event.telefone) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('Telefone:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.telefone, rightColumn + 22, currentRow)
      currentRow += 6
    }
    
    if (event.email) {
      this.doc.setFont('Roboto-Bold', 'bold')
      this.doc.text('E-mail:', rightColumn, currentRow)
      this.doc.setFont('Roboto-Regular', 'normal')
      this.doc.text(event.email, rightColumn + 18, currentRow)
    }
    
    // Atualizar posição Y para a maior das duas colunas + margem MAIOR
    this.currentY = Math.max(this.currentY + 36, currentRow + 20) // 🔥 AUMENTADO DE 10 PARA 20
  }
}

// Função de conveniência para gerar PDF
export async function generatePDF(proposalData, options = {}) {
  const generator = new PDFGenerator()
  await generator.initialize()
  return await generator.generateProposalPDF(proposalData, options)
}

export default PDFGenerator