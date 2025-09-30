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
  _num(v, def = 0) {
    if (v === undefined || v === null || v === '') return def
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const s = v
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(,|$))/g, '')
        .replace(',', '.')
      const n = parseFloat(s)
      return Number.isFinite(n) ? n : def
    }
    return def
  }

  // --- DATE SAFE: evita o "menos um dia" causado por UTC ---
  _formatDateLocal(value) {
    if (!value) return '';
    // 1) Já em dd/mm/aaaa
    const mBr = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (mBr) return `${mBr[1]}/${mBr[2]}/${mBr[3]}`;

    // 2) ISO DATE (aaaa-mm-dd) vindo do Postgres
    const mIso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (mIso) return `${mIso[3]}/${mIso[2]}/${mIso[1]}`;

    // 3) Qualquer outra coisa -> cria Date LOCAL e formata
    try {
      const d0 = new Date(value);
      const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()); // local
      return this.dateFormatter.format(d);
    } catch {
      return String(value);
    }
  }


  _parseIfString(value, defaultValue = []) {
    if (typeof value === 'string') {
      try { return JSON.parse(value) } catch { return defaultValue }
    }
    return value || defaultValue
  }

  // ===== Carregamento principal =====
  async loadProposalData(proposalId) {
    try {
      const proposal = await ProposalsService.getProposalById(proposalId)
      if (!proposal) throw new Error(`Proposta ${proposalId} não encontrada`)

      // 🔧 carrega o cliente pelo client_id da proposta
      const [clientData, supplierData] = await Promise.all([
        this._loadClientData(proposal.client_id),
        this._loadSupplierData(proposal.supplier_id, proposal.dados_fornecedor)
      ])

      const parsedItems = this._parseIfString(proposal.items, [])
      const parsedSupplies = this._parseIfString(proposal.insumos, [])
      const parsedOptionals = this._parseIfString(proposal.opcionais, [])

      // --- Política (mantém como está) ---
      let policy = this._formatTextContent(proposal.politica);
      if (!policy) {
        try {
          const fixoPolicies = await FixoService.getPoliticaContratacao();
          policy = this._formatTextContent(fixoPolicies) || '';
        } catch {
          policy = '';
        }
      }

      // --- Condições Gerais + Forma de Pagamento vindas do FIXO ---
      let fixoConditionsRaw = await FixoService.getCondicoesGerais();
      let fixoPaymentRaw = await FixoService.getFormasPagamento?.(); // se já criou no seu FixoService

      const fixoCond = typeof fixoConditionsRaw === 'string'
        ? (JSON.parse(fixoConditionsRaw || '{}') || {})
        : (fixoConditionsRaw || {});

      const fixoPay = typeof fixoPaymentRaw === 'string'
        ? (JSON.parse(fixoPaymentRaw || '{}') || {})
        : (fixoPaymentRaw || {});

      // 1ª preferência: o que vier salvo na proposta (se você tiver esses campos)
      // 2ª preferência: o que está no FIXO – aba Formas de Pagamento
      const formaPagamentoText =
        (proposal.formas_pagamento && String(proposal.formas_pagamento).trim()) ||
        fixoPay.personalizada || fixoPay.formaPersonalizada || fixoPay.opcaoRapida || '';

      // Monta objeto para a seção “Condições Gerais”
      const conditions = {
        forma_pagamento: formaPagamentoText || '—',
        validade: proposal.prazo_validade || fixoCond.prazoValidadeProposta || '—',
        execucao: proposal.prazo_execucao || fixoCond.prazoEntregaExecucao || '—',
        garantia: proposal.garantia || fixoCond.garantia || '—',
        especiais: fixoCond.condicoesEspeciais || '' // texto livre (linhas/bullets)
      };


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

      const normalizedData = {
        // ✅ passa clientData para os normalizadores
        metadata: this._normalizeMetadata(proposal, clientData),
        client: clientData,
        event: this._normalizeEventData(proposal, clientData),
        supplier: supplierData,

        items: this._normalizeItems(parsedItems),
        supplies: this._normalizeSupplies(parsedSupplies),
        optionals: this._normalizeOptionals(parsedOptionals),

        totals: this._calculateTotals({
          items: parsedItems,
          insumos: parsedSupplies,
          optionals: parsedOptionals
        }),


        texts: {
          policy,
          conditions // agora é objeto com as 5 chaves acima
        },


        display: {
          show_prices: (() => {
            const main = toBool(proposal.exibir_precos, undefined)
            if (main !== undefined) return main
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
      const client = await ClientsService.getClientById(clientId)
      if (!client) return { nome: 'Cliente não encontrado' }

      return {
        // ✅ mantém os dois por conveniência
        company_name: client.company_name || client.nome || client.name || '',
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
    if (!supplierId) return { nome: 'Fornecedor não informado' }

    try {
      const supplier = await SuppliersService.getSupplierById(supplierId)
      const vendedorData = await this._loadVendedorData()

      if (!supplier) return { nome: 'Fornecedor não encontrado', vendedor: vendedorData }

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
        return { nome: 'Vendedor não identificado', email: '', telefone: '', cargo: 'Vendedor' }
      }
      return {
        nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Vendedor',
        email: user.email || '',
        telefone: user.user_metadata?.phone || user.phone || '',
        cargo: user.user_metadata?.position || 'Vendedor'
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do vendedor:', error)
      return { nome: 'Erro ao carregar vendedor', email: '', telefone: '', cargo: 'Vendedor' }
    }
  }

  // ===== Normalizadores =====
  _normalizeMetadata(proposal, client) {
    const rawNumero = proposal.proposal_number ?? proposal.numero ?? null
    const displayNumero =
      (rawNumero !== null && rawNumero !== undefined && String(rawNumero).trim() !== '')
        ? String(rawNumero)
        : `PROP-${proposal.id}`

    return {
      id: proposal.id,
      numero: displayNumero,
      proposal_number: rawNumero,
      status: proposal.status || 'rascunho',
      data_criacao: this.dateFormatter.format(new Date(proposal.created_at)),
      data_atualizacao: this.dateFormatter.format(new Date(proposal.updated_at)),
      validade: proposal.validade ? this.dateFormatter.format(new Date(proposal.validade)) : '',
      vendedor: proposal.vendedor || '',
      // ✅ empresa exibida sempre a partir do cliente
      empresa: client?.company_name || client?.nome || 'Sua Empresa'
    }
  }

  _normalizeEventData(proposal, client) {
    return {
      nome: proposal.title || '',
      tipo: proposal.event_type || '',
      participantes: proposal.participants_count || '',
      local: proposal.location || '',
      data_inicio: this._formatDateLocal(proposal.start_date),
      data_fim: this._formatDateLocal(proposal.end_date),
      horario_inicio: proposal.start_time || '',
      horario_fim: proposal.end_time || '',
      // ✅ usa company_name do cliente (via client_id)
      empresa_contratante: client?.company_name || client?.nome || '',
      solicitante: proposal.requester_name || '',
      telefone: proposal.phone || '',
      email: proposal.email || ''
    }
  }

  // ===== Normalizações de listas / Cálculos / Texto (inalterados) =====
  _normalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) return []
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
    if (!Array.isArray(supplies) || supplies.length === 0) return []
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
    if (!Array.isArray(opcionais) || opcionais.length === 0) return []
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
    const quantidade = this._num(item.quantidade ?? item.quantity, 1)
    const valorUn = this._num(item.valor_unitario ?? item.price ?? item.unit_price, 0)
    const descontoPerc = this._num(item.desconto ?? item.discount, 0)
    const bruto = quantidade * valorUn
    const total = bruto - (bruto * descontoPerc / 100)
    return Number.isFinite(total) ? total : 0
  }

  _formatTextContent(content) {
    if (!content) return ''
    let parsedContent = this._parseIfString(content, content)
    if (Array.isArray(parsedContent)) {
      return parsedContent.map(item => ({
        titulo: item.titulo || item.title || '',
        conteudo: item.conteudo || item.content || item.texto || item.text || ''
      }))
    }
    if (typeof parsedContent === 'string') {
      return parsedContent
        .replace(/<[^>]*>/g, '')
        .replace(/[\[\]"{}]/g, '')
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
}

export default new PDFDataService()
