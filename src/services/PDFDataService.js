import ProposalsService from './ProposalsService.js'
import ClientsService from './clientsService.js'
import SuppliersService from './SuppliersService.js'
import { supabase } from '@/services/supabase.js'
import { FixoService } from './fixoService.js' // 🔥 ADICIONAR IMPORT

class PDFDataService {
  constructor() {
    this.currencyFormatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })

    this.dateFormatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // ===== Utilitários =====

  /**
   * Converte valores numéricos vindos como string (ex: "R$ 2.800,00", "1.234,56")
   * para Number. Usa `def` como fallback.
   */
  _num(v, def = 0) {
    if (v === undefined || v === null || v === '') return def
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      // remove tudo que não for dígito, vírgula, ponto, sinal
      // remove separador de milhar e troca vírgula por ponto
      const s = v
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(,|$))/g, '')
        .replace(',', '.')
      const n = parseFloat(s)
      return Number.isFinite(n) ? n : def
    }
    return def
  }

  /**
   * Função utilitária para parsear strings JSON com fallback seguro
   */
  _parseIfString(value, defaultValue = []) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (error) {
        console.warn('Erro ao parsear JSON:', value, error)
        return defaultValue
      }
    }
    return value || defaultValue
  }

  // ===== Carregamento principal =====

  /**
   * Carrega e normaliza todos os dados necessários para gerar o PDF
   * @param {string} proposalId - ID da proposta
   * @returns {Object} Dados normalizados para PDF
   */
  async loadProposalData(proposalId) {
    try {
      // 1. Buscar proposta principal
      const proposal = await ProposalsService.getProposalById(proposalId)
      if (!proposal) {
        throw new Error(`Proposta ${proposalId} não encontrada`)
      }

      console.log('📋 Dados da proposta carregados:', proposal)

      // 2. Carregar dados relacionados
      const [clientData, supplierData] = await Promise.all([
        this._loadClientData(proposal.client_id),
        this._loadSupplierData(proposal.supplier_id, proposal.dados_fornecedor)
      ])

      console.log('👤 Dados do cliente:', clientData)
      console.log('🏢 Dados do fornecedor:', supplierData)

      // 3. Parsear arrays que podem vir como strings JSON
      const parsedItems = this._parseIfString(proposal.items, [])
      const parsedSupplies = this._parseIfString(proposal.insumos, [])
      const parsedOptionals = this._parseIfString(proposal.opcionais, []) // optionals → opcionais

      console.log('📦 Itens parseados:', parsedItems)
      console.log('🔧 Insumos parseados:', parsedSupplies)
      console.log('⭐ Opcionais parseados:', parsedOptionals)

      // Políticas (com fallback)
      let policy = this._formatTextContent(proposal.politica)
      if (!policy) {
        console.log('⚠️ Políticas não encontradas na proposta, buscando do fixo_config...')
        try {
          const fixoPolicies = await FixoService.getPoliticaContratacao()
          policy = this._formatTextContent(fixoPolicies)
          console.log('✅ Políticas carregadas do fixo_config:', policy)
          if (!policy) {
            policy = `POLÍTICAS PADRÃO:

• Cancelamento: Até 48h antes do evento sem custos
• Alterações: Sujeitas à disponibilidade e custos adicionais
• Pagamento: Conforme condições acordadas
• Responsabilidades: Definidas em contrato específico`
            console.log('⚠️ Usando políticas padrão')
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar políticas do fixo_config:', error)
          policy = `POLÍTICAS PADRÃO:

• Cancelamento: Até 48h antes do evento sem custos
• Alterações: Sujeitas à disponibilidade e custos adicionais
• Pagamento: Conforme condições acordadas
• Responsabilidades: Definidas em contrato específico`
        }
      }

      // Condições gerais (com fallback)
      let conditions = this._formatTextContent(proposal.condicoes_gerais)
      if (!conditions) {
        console.log('⚠️ Condições não encontradas na proposta, buscando do fixo_config...')
        try {
          const fixoConditions = await FixoService.getCondicoesGerais()
          conditions = this._formatTextContent(fixoConditions)
          console.log('✅ Condições carregadas do fixo_config:', conditions)
          if (!conditions) {
            conditions = `CONDIÇÕES GERAIS PADRÃO:

• Prazo de validade da proposta: 30 dias
• Prazo de entrega: Conforme acordado
• Garantia: 12 meses contra defeitos de fabricação
• Condições especiais: A definir conforme necessidade do evento`
            console.log('⚠️ Usando condições padrão')
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar condições do fixo_config:', error)
          conditions = `CONDIÇÕES GERAIS PADRÃO:

• Prazo de validade da proposta: 30 dias
• Prazo de entrega: Conforme acordado
• Garantia: 12 meses contra defeitos de fabricação
• Condições especiais: A definir conforme necessidade do evento`
        }
      }

      // helper util local para normalizar booleanos (fora do objeto!)
      const toBool = (v, def = undefined) => {
        if (typeof v === 'boolean') return v
        if (typeof v === 'number') return v !== 0
        if (typeof v === 'string') {
          const s = v.trim().toLowerCase()
          if (['true', '1', 't', 'yes', 'y', 'on'].includes(s)) return true
          if (['false', '0', 'f', 'no', 'n', 'off', ''].includes(s)) return false
        }
        return def
      }

      // 4. Normalizar e calcular dados
      const normalizedData = {
        // Metadados da proposta
        metadata: this._normalizeMetadata(proposal),

        // Dados do cliente
        client: clientData,

        // Dados do evento
        event: this._normalizeEventData(proposal),

        // Dados do fornecedor
        supplier: supplierData,

        // Listas normalizadas
        items: this._normalizeItems(parsedItems),
        supplies: this._normalizeSupplies(parsedSupplies),
        optionals: this._normalizeOptionals(parsedOptionals),

        // Totais recalculados
        totals: this._calculateTotals({
          items: parsedItems,
          insumos: parsedSupplies,
          optionals: parsedOptionals
        }),

        // Textos (política e condições)
        texts: {
          policy: policy,
          conditions: conditions
        },

        // Configurações de exibição
        display: {
          // garantir boolean real e fallback para legados
          show_prices: (() => {
            // 1) prioridade: exibir_precos (pode vir string)
            const main = toBool(proposal.exibir_precos, undefined)
            if (main !== undefined) return main

            // 2) compat: se QUALQUER legado for false, esconder
            const legacy = [
              proposal.incluir_v_un_itens,
              proposal.incluir_v_un_insumos,
              proposal.incluir_v_un_opcionais
            ].map(v => toBool(v, true))
            return !legacy.includes(false)
          })(),
          show_watermark: proposal.status !== 'finalizada'
        }
      }

      // LOG TEMPORÁRIO PARA DEBUG
      console.log('🔍 DEBUG show_prices:', normalizedData.display.show_prices)
      console.log('📄 Dados normalizados para PDF:', normalizedData)
      return normalizedData
    } catch (error) {
      console.error('Erro ao carregar dados da proposta:', error)
      throw error
    }
  }


  // ===== Cargas auxiliares =====

  async _loadClientData(clientId) {
    if (!clientId) {
      console.warn('⚠️ Client ID não fornecido')
      return { nome: 'Cliente não informado' }
    }

    try {
      console.log('🔍 Buscando cliente com ID:', clientId)
      const client = await ClientsService.getClientById(clientId)
      console.log('👤 Cliente encontrado:', client)

      if (!client) {
        return { nome: 'Cliente não encontrado' }
      }

      return {
        nome: client.company_name || client.nome || client.name || 'Cliente não informado',
        cnpj_cpf: client.cnpj || client.cpf || client.document || '',
        contato: client.contato || client.contact || '',
        endereco: this._formatAddress(client),
        telefone: client.telefone || client.phone || '',
        email: client.email || ''
      }
    } catch (error) {
      console.error('❌ Erro ao carregar cliente:', error)
      return { nome: 'Erro ao carregar cliente' }
    }
  }

  async _loadSupplierData(supplierId, dadosFornecedor) {
    if (!supplierId) {
      console.warn('⚠️ Supplier ID não fornecido')
      return { nome: 'Fornecedor não informado' }
    }

    try {
      console.log('🔍 Buscando fornecedor com ID:', supplierId)
      const supplier = await SuppliersService.getSupplierById(supplierId)
      console.log('🏢 Fornecedor encontrado:', supplier)

      // Buscar dados do usuário logado (vendedor responsável)
      const vendedorData = await this._loadVendedorData()

      if (!supplier) {
        return { nome: 'Fornecedor não encontrado', vendedor: vendedorData }
      }

      return {
        nome: supplier.company_name || supplier.nome || supplier.name || 'Fornecedor não informado',
        cnpj: supplier.cnpj || '',
        contato: supplier.contact_name || supplier.contato || supplier.contact || '',
        endereco: this._formatAddress(supplier),
        telefone: supplier.phone || supplier.telefone || '',
        email: supplier.email || '',
        vendedor: vendedorData
      }
    } catch (error) {
      console.error('❌ Erro ao carregar fornecedor:', error)
      return { nome: 'Erro ao carregar fornecedor', vendedor: await this._loadVendedorData() }
    }
  }

  async _loadVendedorData() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.warn('⚠️ Usuário não encontrado')
        return {
          nome: 'Vendedor não identificado',
          email: '',
          telefone: '',
          cargo: 'Vendedor'
        }
      }

      return {
        nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Vendedor',
        email: user.email || '',
        telefone: user.user_metadata?.phone || user.phone || '',
        cargo: user.user_metadata?.position || 'Vendedor'
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do vendedor:', error)
      return {
        nome: 'Erro ao carregar vendedor',
        email: '',
        telefone: '',
        cargo: 'Vendedor'
      }
    }
  }

  _normalizeMetadata(proposal) {
    // prioriza o número “sequencial” da proposta vindo do BD
    const rawNumero =
      proposal.proposal_number ??
      proposal.numero ?? // compat
      null;

    // valor que será exibido no PDF
    const displayNumero =
      (rawNumero !== null && rawNumero !== undefined && String(rawNumero).trim() !== '')
        ? String(rawNumero)
        : `PROP-${proposal.id}`; // fallback antigo, só se não houver número

    return {
      id: proposal.id,
      numero: displayNumero,          // <- o que o PDF usa
      proposal_number: rawNumero,     // <- mantém o bruto para quem precisar
      status: proposal.status || 'rascunho',
      data_criacao: this.dateFormatter.format(new Date(proposal.created_at)),
      data_atualizacao: this.dateFormatter.format(new Date(proposal.updated_at)),
      validade: proposal.validade ? this.dateFormatter.format(new Date(proposal.validade)) : '',
      vendedor: proposal.vendedor || '',
      empresa: proposal.empresa || 'Sua Empresa'
    };
  }


  _normalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      console.warn('⚠️ Nenhum item encontrado ou formato inválido')
      return []
    }

    return items
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map(item => {
        const quantidade = this._num(item.quantidade ?? item.quantity, 1)
        const valorUn = this._num(item.valor_unitario ?? item.price, 0)
        const subtotal = this._calculateItemSubtotal(item)
        return {
          ordem: item.ordem || 0,
          codigo: item.codigo || item.code || '',
          descricao: item.descricao || item.description || item.name || '',
          quantidade,
          unidade: item.unidade || item.unit || 'un',
          valor_unitario: valorUn,
          subtotal,
          valor_unitario_formatted: this.currencyFormatter.format(valorUn),
          subtotal_formatted: this.currencyFormatter.format(subtotal)
        }
      })
  }

  _normalizeSupplies(supplies) {
    if (!Array.isArray(supplies) || supplies.length === 0) {
      console.warn('⚠️ Nenhum insumo encontrado ou formato inválido')
      return []
    }

    return supplies
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map(supply => {
        const quantidade = this._num(supply.quantidade ?? supply.quantity, 1)
        const valorUn = this._num(supply.valor_unitario ?? supply.price, 0)
        const subtotal = this._calculateItemSubtotal(supply)
        return {
          ordem: supply.ordem || 0,
          codigo: supply.codigo || supply.code || '',
          descricao: supply.descricao || supply.description || supply.name || '',
          quantidade,
          unidade: supply.unidade || supply.unit || 'un',
          valor_unitario: valorUn,
          subtotal,
          lead_time: supply.lead_time || '',
          observacoes: supply.observacoes || supply.notes || '',
          valor_unitario_formatted: this.currencyFormatter.format(valorUn),
          subtotal_formatted: this.currencyFormatter.format(subtotal)
        }
      })
  }

  _normalizeOptionals(opcionais) {
    if (!Array.isArray(opcionais) || opcionais.length === 0) {
      console.warn('⚠️ Nenhum opcional encontrado ou formato inválido')
      return []
    }

    return opcionais
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map(optional => {
        const quantidade = this._num(optional.quantidade ?? optional.quantity, 1)
        const valorUn = this._num(optional.valor_unitario ?? optional.price, 0)
        const subtotal = this._calculateItemSubtotal(optional)
        return {
          ordem: optional.ordem || 0,
          codigo: optional.codigo || optional.code || '',
          descricao: optional.descricao || optional.description || optional.name || '',
          quantidade,
          unidade: optional.unidade || optional.unit || 'un',
          valor_unitario: valorUn,
          subtotal,
          valor_unitario_formatted: this.currencyFormatter.format(valorUn),
          subtotal_formatted: this.currencyFormatter.format(subtotal)
        }
      })
  }

  // ===== Cálculos =====

  _calculateTotals(proposal) {
    const items = Array.isArray(proposal.items) ? proposal.items : []
    const supplies = Array.isArray(proposal.insumos) ? proposal.insumos : []
    const optionals = Array.isArray(proposal.optionals) ? proposal.optionals : []

    const subtotal_itens = items.reduce((sum, item) => sum + this._calculateItemSubtotal(item), 0)
    const subtotal_insumos = supplies.reduce((sum, supply) => sum + this._calculateItemSubtotal(supply), 0)
    const subtotal_opcionais = optionals
      .filter(opt => opt.selecionado || opt.selected)
      .reduce((sum, opt) => sum + this._calculateItemSubtotal(opt), 0)

    const total_sem_opcionais = subtotal_itens + subtotal_insumos
    const total_com_opcionais = total_sem_opcionais + subtotal_opcionais

    console.log('💰 Totais calculados:', {
      subtotal_itens,
      subtotal_insumos,
      subtotal_opcionais,
      total_sem_opcionais,
      total_com_opcionais
    })

    return {
      subtotal_itens,
      subtotal_insumos,
      subtotal_opcionais,
      total_sem_opcionais,
      total_com_opcionais,
      total_amount: total_com_opcionais,
      subtotal_itens_formatted: this.currencyFormatter.format(subtotal_itens),
      subtotal_insumos_formatted: this.currencyFormatter.format(subtotal_insumos),
      subtotal_opcionais_formatted: this.currencyFormatter.format(subtotal_opcionais),
      total_sem_opcionais_formatted: this.currencyFormatter.format(total_sem_opcionais),
      total_com_opcionais_formatted: this.currencyFormatter.format(total_com_opcionais),
      total_amount_formatted: this.currencyFormatter.format(total_com_opcionais)
    }
  }

  _calculateItemSubtotal(item) {
    const quantidade = this._num(item.quantidade ?? item.quantity, 1) // default 1
    const valorUn = this._num(item.valor_unitario ?? item.price ?? item.unit_price, 0)
    const descontoPerc = this._num(item.desconto ?? item.discount, 0)

    const bruto = quantidade * valorUn
    const total = bruto - (bruto * descontoPerc / 100)
    return Number.isFinite(total) ? total : 0
  }

  // ===== Texto/endereços =====

  /**
   * Formatar conteúdo de texto (condições e políticas) para exibição bonita
   */
  _formatTextContent(content) {
    if (!content) return ''

    // Se for string JSON, tentar parsear
    let parsedContent = this._parseIfString(content, content)

    // Se for array de objetos com estrutura {titulo, conteudo}
    if (Array.isArray(parsedContent)) {
      return parsedContent.map(item => ({
        titulo: item.titulo || item.title || '',
        conteudo: item.conteudo || item.content || item.texto || item.text || ''
      }))
    }

    // Se for string simples, limpar e formatar
    if (typeof parsedContent === 'string') {
      return parsedContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[\[\]"{}]/g, '') // Remove caracteres JSON
        .trim()
    }

    return ''
  }

  _formatAddress(client) {
    if (!client) return ''

    const parts = [
      client.endereco || client.address,
      client.cidade || client.city,
      client.estado || client.state,
      client.cep || client.zip_code
    ].filter(Boolean)

    return parts.join(', ')
  }

  _normalizeEventData(proposal) {
    return {
      nome: proposal.title || '',
      tipo: proposal.event_type || '',
      participantes: proposal.participants_count || '',
      local: proposal.location || '',
      data_inicio: proposal.start_date ? this.dateFormatter.format(new Date(proposal.start_date)) : '',
      data_fim: proposal.end_date ? this.dateFormatter.format(new Date(proposal.end_date)) : '',
      horario_inicio: proposal.start_time || '',
      horario_fim: proposal.end_time || '',
      empresa_contratante: proposal.contractor_name || '',
      solicitante: proposal.requester_name || '',
      telefone: proposal.phone || '',
      email: proposal.email || ''
    }
  }
}

export default new PDFDataService()
