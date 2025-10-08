import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { setupPDFAssets } from './pdf-assets.js'
import { registerRobotoFonts } from '../assets/roboto-font.js'

class PDFGenerator {
    constructor() {
        this.doc = null
        this.assets = null
        this.currentY = 20
        this.pageHeight = 297 // será recalculado
        this.showPrices = true // NEW
        this.HEADER = { y: 6, height: 18, gapAfter: 8, maxWidthRatio: 0.65 }
        this.bottomMargin = 25 // margem inferior usada nos cálculos
        this.WIDOW = { minBottomLines: 3 } // não deixar menos que 3 linhas no fim da página

        // Constantes de layout (mm) - conforme especificação
        this.LAYOUT = {
            row: 4.6, // altura padrão por linha
            rowTight: 3.8, // linhas mais "juntas" (endereço/local)
            labelW: { left: 32, right: 32 }, // largura FIXA do rótulo por coluna
            valueGap: 1.6, // respiro após o rótulo
            colPadX: 5, // padding interno da coluna
            wrap: 60, // quebra padrão
            wrapWide: 90, // quebra p/ campos longos (Endereço/Local)
        }

        // 🎯 TOKENS DE LAYOUT (mm) - Centralizados para fácil ajuste
        this.SPACE = {
            marginX: 20,
            sectionTop: 2,
            sectionBottom: 4,
            titleHeight: 8,
            row: 4.6,
            rowTight: 3.8,
            rowLoose: 5.0,
            gutter: 18,
            labelGap: 16,
            wrapWidth: 90,
            afterTitle: 4,
            titleTextOffset: 0.26,
        }

        // Inicialização padrão - será recalculado em _recomputeLayout
        this.margin = 20
        this.contentWidth = 170
        this.COL = {
            leftX: 25,
            rightX: 110,
            width: 85,
        }
    }

    _recomputeLayout() {
        if (!this.doc) return
        const pageW = this.doc.internal.pageSize.getWidth()
        const pageH = this.doc.internal.pageSize.getHeight()
        this.pageHeight = pageH
        this.contentWidth = pageW - this.margin * 2
        this.COL = {
            leftX: this.margin + this.LAYOUT.colPadX,
            rightX: this.margin + this.contentWidth / 2 + this.LAYOUT.colPadX,
            width: this.contentWidth / 2,
        }
    }

    // Desenha (ou redesenha) o cabeçalho em todas as páginas já geradas
    _applyHeaderToAllPages() {
        if (!this.doc) return
        const total = this.doc.internal.getNumberOfPages()
        const { pageNumber } = this.doc.internal.getCurrentPageInfo() // para restaurar depois

        for (let i = 1; i <= total; i++) {
            this.doc.setPage(i)
            this._drawHeaderImageOnPage() // usa o mesmo cálculo/altura do seu header
        }

        this.doc.setPage(pageNumber)
    }

    // retorna Y onde o conteúdo pode começar abaixo do cabeçalho
    _headerContentStartY() {
        const headerH = this._lastHeaderH || this.HEADER.height
        return this.HEADER.y + headerH + this.HEADER.gapAfter
    }

    // tenta achar o número em vários caminhos comuns
    _getProposalNumber(pdfData) {
        const c = [
            pdfData?.metadata?.proposal_number, // 1º: bruto vindo do serviço
            pdfData?.metadata?.numero, // 2º: o “display” já montado
            pdfData?.proposal_number,
            pdfData?.proposal?.proposal_number,
            pdfData?.proposal?.numero,
            pdfData?.numero_proposta,
            pdfData?.metadata?.numero_proposta,
        ]
        for (const v of c) {
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
        }
        return null
    }

    _drawHeaderImageOnPage() {
        const doc = this.doc
        const pageW = doc.internal.pageSize.getWidth()
        const M = this.SPACE.marginX
        const img = this.assets?.header || this.assets?.logo
        if (!img) return 0

        // Propriedades naturais da imagem (para manter proporção)
        const props = doc.getImageProperties(img)
        const ratio = props?.width && props?.height ? props.width / props.height : 4 // fallback

        // Queremos respeitar margens laterais e a altura alvo (this.HEADER.height)
        const maxW = pageW - M * 2
        const maxH = this.HEADER.height

        // Escala preservando aspecto
        let w = maxW
        let h = w / ratio
        if (h > maxH) {
            h = maxH
            w = h * ratio
        }

        // Centraliza horizontalmente
        const x = (pageW - w) / 2
        const y = this.HEADER.y

        // Use um alias e compressão melhor que FAST para evitar perda de nitidez
        doc.addImage(img, 'PNG', x, y, w, h, 'hdr', 'MEDIUM')

        // guarde a última altura real usada para posicionar o conteúdo abaixo
        this._lastHeaderH = h
        return h
    }

    // 🔧 HELPERS REUTILIZÁVEIS
    _moveY(mm) {
        this.currentY += mm
    }

    // Largura de um espaço na fonte/tamanho atuais
    _getSpaceW() {
        return this.doc.getTextWidth(' ')
    }

    /**
     * Desenha um parágrafo justificado.
     * - text: string do parágrafo
     * - opts: { x, maxWidth, lineHeight, firstLineIndent, after }
     */
    _drawJustifiedParagraph(text, opts = {}) {
        const doc = this.doc
        const x0 = opts.x ?? this.SPACE.marginX
        const maxW = opts.maxWidth ?? this.contentWidth
        const lineH = opts.lineHeight ?? 5.0
        const indent = opts.firstLineIndent ?? 0 // mm na 1ª linha
        const after = opts.after ?? 2.0

        const words = String(text || '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
        const spaceW = this._getSpaceW()

        let i = 0
        let first = true

        while (i < words.length) {
            // espaço útil desta linha
            const avail = maxW - (first ? indent : 0)

            // escolhe palavras que cabem
            let j = i,
                width = 0
            while (j < words.length) {
                const w = doc.getTextWidth(words[j])
                const add = width === 0 ? w : spaceW + w
                if (width + add > avail) break
                width += add
                j++
            }

            const lineWords = words.slice(i, j)
            const isLast = j >= words.length
            const gaps = Math.max(0, lineWords.length - 1)

            this._checkPageBreak(lineH)
            let x = x0 + (first ? indent : 0)
            const y = this.currentY

            if (gaps === 0 || isLast) {
                // sem justificação (uma palavra ou última linha)
                doc.text(lineWords.join(' '), x, y)
            } else {
                // distribui sobra entre os espaços
                const base = lineWords.reduce(
                    (acc, w, k) => acc + doc.getTextWidth(w) + (k ? spaceW : 0),
                    0
                )
                const extra = Math.max(0, avail - base)
                const addPerGap = extra / gaps

                for (let k = 0; k < lineWords.length; k++) {
                    const w = lineWords[k]
                    doc.text(w, x, y)
                    if (k < lineWords.length - 1) {
                        x += doc.getTextWidth(w) + spaceW + addPerGap
                    }
                }
            }

            this.currentY += lineH
            i = j
            first = false
        }

        this.currentY += after // respiro após o parágrafo
    }

    _drawTitleBar(text, color = [66, 133, 244]) {
        this._checkPageBreak(this.SPACE.sectionTop + this.SPACE.titleHeight + 2)
        this._moveY(this.SPACE.sectionTop)

        // faixa azul
        this.doc.setFillColor(...color)
        this.doc.rect(
            this.SPACE.marginX,
            this.currentY,
            this.contentWidth,
            this.SPACE.titleHeight,
            'F'
        )

        // TÍTULO padronizado (preto, bold, CAIXA-ALTA, alinhado à esquerda)
        const title = String(text || '').toUpperCase()
        this.doc.setTextColor(0, 0, 0)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setFontSize(11)

        const leftX = this.SPACE.marginX + 6
        const midY = this.currentY + this.SPACE.titleHeight / 2
        this.doc.text(title, leftX, midY, { baseline: 'middle' })

        // respiro e volta para fonte normal do corpo
        this._moveY(this.SPACE.titleHeight + this.SPACE.afterTitle)
        this.doc.setTextColor(0, 0, 0)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setFontSize(9)
    }

    // === Banner reutilizável (TOTAL / SUBTOTAIS) ===
    _drawTotalBanner(label, value, color = [76, 175, 80]) {
        const isNum = typeof value === 'number'
        const amount = isNum ? this._formatCurrency(value) : String(value || 'R$ 0,00')
        const text = `${label.toUpperCase()}: ${amount}`

        const H = 7.2 // retângulo baixo (estilo antigo)
        this._checkPageBreak(H + 6)

        const x = this.SPACE.marginX
        const w = this.contentWidth
        const y = this.currentY + 2 // pouco respiro acima

        // fundo retangular (sem cantos arredondados)
        this.doc.setFillColor(...color)
        this.doc.rect(x, y, w, H, 'F')

        // texto à direita, centralizado verticalmente
        this.doc.setFont('Arial', 'bold')
        this.doc.setFontSize(12)
        this.doc.setTextColor(0, 0, 0)
        this.doc.text(text, x + w - 8, y + H / 2, { align: 'right', baseline: 'middle' })

        this.currentY = y + H + 4
    }

    // Cores dos banners (ajuste se quiser)
    _drawBanner(
        text,
        fillColor,
        {
            align = 'right', // 'right' | 'left' | 'center'
            height = 12, // altura do banner (mm)
            radius = 6, // cantos arredondados
            marginTop = 2, // espaço antes
            marginBottom = 4, // espaço depois
            fontSize = 13,
            fontStyle = 'bold',
        } = {}
    ) {
        const doc = this.doc
        const M = this.SPACE.marginX
        const W = doc.internal.pageSize.getWidth() - M * 2

        // margens superiores
        this.currentY += marginTop

        // retângulo
        doc.setFillColor(...fillColor)
        doc.roundedRect(M, this.currentY, W, height, radius, radius, 'F')

        // texto (preto, alinhado à direita por padrão)
        doc.setTextColor(0, 0, 0)
        doc.setFont('Arial', fontStyle)
        doc.setFontSize(fontSize)

        const cx = align === 'center' ? M + W / 2 : align === 'right' ? M + W - 8 : M + 8
        const opts = { align: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left' }

        // centralização vertical “na mão”
        const yText = this.currentY + height / 2 + 3.2
        doc.text(String(text), cx, yText, opts)

        // avança o cursor depois do banner
        this.currentY += height + marginBottom
    }

    _drawSubtotalBanner(label, value, fillColor, opts = {}) {
        const txt = `${label}: ${value}`
        this._drawBanner(txt, fillColor, {
            align: 'right',
            height: 12,
            marginTop: 2,
            marginBottom: 6,
            fontSize: 12,
            ...opts,
        })
    }

    // Linha "Rótulo: valor" fluida (sem alinhamento forçado por coluna)
    _textRowFluid(label, value, x, y, maxWidth, lineHeight = this.SPACE.row) {
        if (value === undefined || value === null || value === '') return y

        // rótulo
        this.doc.setFont('Arial', 'bold')
        const labelTxt = `${label}:`
        this.doc.text(labelTxt, x, y)
        const labelW = this.doc.getTextWidth(labelTxt)

        // valor começa depois do rótulo + gap pequeno
        const valueX = x + labelW + this.LAYOUT.valueGap // ex.: 1.6mm
        const avail = Math.max(
            20,
            (maxWidth ?? this.contentWidth) - (labelW + this.LAYOUT.valueGap)
        )

        // valor (quebrando se precisar)
        this.doc.setFont('Arial', 'normal')
        this.doc.setFontSize(9)
        const lines = Array.isArray(value) ? value : this.doc.splitTextToSize(String(value), avail)
        this.doc.text(lines, valueX, y)

        const h = Math.max(lineHeight, lines.length * (lineHeight - 1))
        return y + h
    }

    _estimateBlockHeight(text, lineHeight = this.SPACE.row, wrapWidth = this.SPACE.wrapWidth) {
        if (!text) return lineHeight
        const lines = this.doc.splitTextToSize(String(text), wrapWidth)
        return Math.max(lineHeight, lines.length * (lineHeight - 1))
    }

    async initialize() {
        try {
            this.doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            })

            this._recomputeLayout()
            registerRobotoFonts(this.doc)
            this.assets = await setupPDFAssets(this.doc)

            return true
        } catch (error) {
            console.error('❌ Erro ao inicializar PDF Generator:', error)
            this.assets = { logo: null, fontsLoaded: false }
            return false
        }
    }

    async generateProposalPDF(pdfData, options = {}) {
        if (!this.doc) {
            await this.initialize()
        }

        try {
            // resiliente a 'false' string
            const sp = pdfData?.display?.show_prices
            this.showPrices = !(
                sp === false ||
                (typeof sp === 'string' && sp.toLowerCase() === 'false') ||
                sp === 0 ||
                sp === '0'
            )

            // LOG TEMPORÁRIO PARA DEBUG
            console.log('🔍 DEBUG this.showPrices:', this.showPrices)
            console.log('🔍 DEBUG pdfData.display.show_prices:', pdfData?.display?.show_prices)

            // Cabeçalho
            this._addHeader(pdfData)

            if (pdfData.event && pdfData.event.nome) {
                this._addEventSection(pdfData.event)
            }

            // Itens (sempre renderiza)
            this._addItemsSection(
                pdfData.items || [],
                'Prestações de Serviço',
                'SUBTOTAL PRESTAÇÕES DE SERVIÇO',
                pdfData.totals?.subtotal_itens_formatted
            )

            // Insumos (só renderiza se houver)
            const supplies = Array.isArray(pdfData.supplies) ? pdfData.supplies : []
            if (supplies.length > 0) {
                this._addItemsSection(
                    supplies,
                    'Insumos',
                    'SUBTOTAL INSUMOS',
                    pdfData.totals?.subtotal_insumos_formatted
                )
            }

            // Opcionais (já era condicional)
            const optionals = Array.isArray(pdfData.optionals) ? pdfData.optionals : []
            if (optionals.length > 0) {
                this._addItemsSection(
                    optionals,
                    'Opcionais Não Inclusos',
                    'SUBTOTAL OPCIONAIS NÃO INCLUSOS',
                    pdfData.totals?.subtotal_opcionais_formatted,
                    { forceShowPrices: true, hideSubtotalCol: true, hideSubtotalBanner: true }
                )
            }

            // TOTAL GERAL (apenas o banner)
            this._addDetailedTotalsSection(pdfData.totals, pdfData.optionals)

            if (pdfData.texts?.conditions) {
                this._addConditionsSection(pdfData.texts.conditions)
            }

            if (pdfData.texts?.policy) {
                this._addGreySection('Política de Contratação', pdfData.texts.policy)
            }

            if (pdfData.supplier && pdfData.supplier.nome) {
                this._addSupplierSection(pdfData.supplier)
            }
            // Faixa de aceite/assinatura
            this._addAcceptanceBand(
                pdfData.supplier?.nome,
                `São Paulo, dia ${pdfData.metadata?.data_criacao || ''}`
            )

            this._applyHeaderToAllPages()
            this._addFooter(pdfData)

            return this.doc
        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error)
            throw error
        }
    }

    _addHeader(pdfData) {
        this._drawHeaderImageOnPage() // logo menor no topo

        const pageW = this.doc.internal.pageSize.getWidth()
        const numero = this._getProposalNumber(pdfData)
        const title = `PROPOSTA COMERCIAL Nº ${numero ?? '?'}`

        this.doc.setFontSize(18) // um pouco menor
        this.doc.setFont('Arial', 'bold')
        this.doc.text(title, pageW / 2, this._headerContentStartY() + 4, { align: 'center' })

        this.currentY = this._headerContentStartY() + 12 // menos respiro
    }

    _addClientSection(client) {
        this._checkPageBreak(60)
        this.doc.setFillColor(76, 175, 80)
        this.doc.setTextColor(255, 255, 255)
        this.doc.setFont('Arial', 'bold')
        this.doc.setFontSize(12)
        this.doc.rect(20, this.currentY, 170, 8, 'F')
        this.doc.text('DADOS DO CLIENTE', 22, this.currentY + 5.5)

        this.currentY += 12

        this.doc.setTextColor(0, 0, 0)
        this.doc.setFont('Arial', 'normal')
        this.doc.setFontSize(10)

        const leftColumn = 22
        const rightColumn = 110
        let currentRow = this.currentY

        if (client?.nome) {
            this.doc.setFont('Arial', 'bold')
            this.doc.text('Nome:', leftColumn, currentRow)
            this.doc.setFont('Arial', 'normal')
            this.doc.text(client.nome, leftColumn + 15, currentRow)
            currentRow += 6
        }

        if (client?.cnpj_cpf) {
            this.doc.setFont('Arial', 'bold')
            this.doc.text('CNPJ/CPF:', leftColumn, currentRow)
            this.doc.setFont('Arial', 'normal')
            this.doc.text(client.cnpj_cpf, leftColumn + 25, currentRow)
            currentRow += 6
        }

        if (client?.endereco) {
            this.doc.setFont('Arial', 'bold')
            this.doc.text('Endereço:', leftColumn, currentRow)
            this.doc.setFont('Arial', 'normal')
            const enderecoLines = this.doc.splitTextToSize(client.endereco, 65)
            this.doc.text(enderecoLines, leftColumn + 22, currentRow)
            currentRow += enderecoLines.length * 5
        }

        currentRow = this.currentY

        if (client?.telefone) {
            this.doc.setFont('Arial', 'bold')
            this.doc.text('Telefone:', rightColumn, currentRow)
            this.doc.setFont('Arial', 'normal')
            this.doc.text(client.telefone, rightColumn + 22, currentRow)
            currentRow += 6
        }

        if (client?.email) {
            this.doc.setFont('Arial', 'bold')
            this.doc.text('E-mail:', rightColumn, currentRow)
            this.doc.setFont('Arial', 'normal')
            this.doc.text(client.email, rightColumn + 18, currentRow)
            currentRow += 6
        }

        this.currentY = Math.max(this.currentY + 30, currentRow + 10)
    }

    _addSupplierSection(supplier) {
        const fornecedorRows = [
            {
                left: { label: 'Empresa', value: supplier.nome },
                right: { label: 'Responsável', value: supplier.vendedor?.nome },
            },
            {
                left: { label: 'Endereço', value: supplier.endereco, line: this.LAYOUT.rowTight },
                right: { label: 'CNPJ', value: supplier.cnpj, line: this.LAYOUT.rowTight },
            },
            {
                left: { label: 'Telefone', value: supplier.telefone },
                right: { label: 'E-mail', value: supplier.email },
            },
        ]
        this.addDataSectionPairs('DADOS DO FORNECEDOR', [66, 133, 244], fornecedorRows)
    }

    _addEventSection(event) {
        const eventoRows = [
            {
                left: { label: 'Evento', value: event.nome, line: this.LAYOUT.rowTight },
                right: { label: 'Local', value: event.local, line: this.LAYOUT.rowTight },
            },
            {
                left: { label: 'Participantes', value: event.participantes },
                right: { label: 'Tipo de evento', value: event.tipo },
            },
            {
                left: { label: 'Data de Início', value: event.data_inicio },
                right: { label: 'Data de Fim', value: event.data_fim },
            },
            {
                left: { label: 'Horário de Início', value: event.horario_inicio },
                right: { label: 'Horário de Fim', value: event.horario_fim },
            },
            {
                left: { label: 'Empresa', value: event.empresa_contratante },
                right: { label: 'Telefone', value: event.telefone },
            },
            {
                left: { label: 'Solicitante', value: event.solicitante },
                right: { label: 'E-mail', value: event.email },
            },
        ]
        this.addDataSectionPairs('DADOS DO EVENTO', [66, 133, 244], eventoRows)
    }

    // helper: corta texto para caber em uma única linha (com "…")
    _fitOneLine(text, maxWidth) {
        const doc = this.doc
        let s = String(text || '').trim()
        if (!s) return ''
        while (doc.getTextWidth(s) > maxWidth && s.length > 1) {
            s = s.slice(0, -1)
        }
        return s !== String(text).trim() ? s.slice(0, -1) + '…' : s
    }

    _addItemsSection(items, title, subtotalLabel, subtotalValue, opts = {}) {
        this._checkPageBreak(28)

        const doc = this.doc
        const M = this.SPACE.marginX
        const pageW = doc.internal.pageSize.getWidth()
        const tableW = pageW - M * 2

        // >>> NOVO: controla preços por seção
        const showPriceCols = opts.forceShowPrices === true ? true : this.showPrices
        const unitOnly = !!opts.hideSubtotalCol && showPriceCols // Qtd + Valor Unit.

        // estilos
        const SUB_H = 7.2,
            BANNER_FS = 11,
            ROW_H = 10.2,
            HEAD_H = 8.6
        const PAD_X = 2,
            PAD_Y = 1.2
        const NAME_FS = 9.6,
            DESC_FS = 8.7,
            DESC_COLOR = [100, 100, 100]
        const titleColor = [66, 133, 244],
            subtotalColor = [214, 124, 28],
            headColor = [10, 42, 102]

        // reserva espaço p/ título + cabeçalho + 1 linha
        const MIN_FOR_SECTION =
            this.SPACE.sectionTop +
            this.SPACE.titleHeight +
            this.SPACE.afterTitle +
            HEAD_H +
            ROW_H +
            4
        this._checkPageBreak(MIN_FOR_SECTION)

        // título
        this._drawTitleBar(String(title).toUpperCase(), titleColor)
        const desiredGap = 1.0
        this.currentY -= Math.max(0, this.SPACE.afterTitle - desiredGap)

        if (!items || items.length === 0) {
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(10)
            doc.text(`Nenhum item em ${title.toLowerCase()}`, M, this.currentY)
            this._moveY(8)
            return
        }

        // >>> NOVO: cabeçalho & colunas com/sem subtotal
        const head = !showPriceCols
            ? [['Item', 'Qtd']]
            : unitOnly
              ? [['Item', 'Qtd', 'Valor Unit.']]
              : [['Item', 'Qtd', 'Valor Unit.', 'Subtotal']]

        const columnStyles = !showPriceCols
            ? {
                  0: { cellWidth: tableW * 0.82, halign: 'left', valign: 'middle' },
                  1: { cellWidth: tableW * 0.18, halign: 'center', valign: 'middle' },
              }
            : unitOnly
              ? {
                    0: { cellWidth: tableW * 0.62, halign: 'left', valign: 'middle' },
                    1: { cellWidth: tableW * 0.14, halign: 'center', valign: 'middle' },
                    2: { cellWidth: tableW * 0.24, halign: 'right', valign: 'middle' }, // use 'center' se preferir
                }
              : {
                    0: { cellWidth: tableW * 0.5, halign: 'left', valign: 'middle' },
                    1: { cellWidth: tableW * 0.11, halign: 'center', valign: 'middle' },
                    2: { cellWidth: tableW * 0.195, halign: 'right', valign: 'middle' },
                    3: { cellWidth: tableW * 0.195, halign: 'right', valign: 'middle' },
                }

        // dados
        let subtotalSum = 0
        const tableData = items.map((it) => {
            const name = String(
                it.codigo || it.name || it.product_name || it.titulo || it.item_name || '-'
            ).trim()
            const desc = String(
                it.descricao || it.description || it.product_description || ''
            ).trim()
            const qty = Number(it.quantidade ?? it.qtd ?? it.qtde ?? 0) || 0

            if (!showPriceCols) {
                const unitRaw = it.valor_unitario ?? it.price ?? it.unit_price ?? 0
                const unitNum = this._parseCurrencyToNumber(unitRaw)
                subtotalSum += qty * (Number.isFinite(unitNum) ? unitNum : 0)
                return [{ name, desc }, String(qty)]
            }

            if (unitOnly) {
                const unitRaw =
                    it.valor_unitario ??
                    it.unitario ??
                    it.preco_unitario ??
                    it.valor ??
                    it.valor_unitario_value ??
                    it.unit_value ??
                    it.valorUnitario
                const unitNum = this._parseCurrencyToNumber(unitRaw)
                subtotalSum += qty * (Number.isFinite(unitNum) ? unitNum : 0)
                const unitDisplay =
                    it.valor_unitario_formatted ??
                    (typeof unitRaw === 'string' && unitRaw.trim()
                        ? unitRaw
                        : this._formatCurrency(unitNum))
                return [{ name, desc }, String(qty), unitDisplay]
            }

            const unitRaw =
                it.valor_unitario ??
                it.unitario ??
                it.preco_unitario ??
                it.valor ??
                it.valor_unitario_value ??
                it.unit_value ??
                it.valorUnitario
            const unitNum = this._parseCurrencyToNumber(unitRaw)

            const subtotalProvided =
                it.subtotal ?? it.sub_total ?? it.subtotal_value ?? it.total ?? it.total_value

            const subtotalNum =
                subtotalProvided != null && subtotalProvided !== ''
                    ? this._parseCurrencyToNumber(subtotalProvided)
                    : qty * unitNum

            subtotalSum += Number.isFinite(subtotalNum) ? subtotalNum : 0

            const unitDisplay =
                it.valor_unitario_formatted ??
                (typeof unitRaw === 'string' && unitRaw.trim()
                    ? unitRaw
                    : this._formatCurrency(unitNum))
            const subtotalDisplay = it.subtotal_formatted ?? this._formatCurrency(subtotalNum)

            return [{ name, desc }, String(qty), unitDisplay, subtotalDisplay]
        })

        // tabela
        doc.autoTable({
            startY: this.currentY,
            head,
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 8,
                lineWidth: 0.1,
                cellPadding: { top: PAD_Y, right: PAD_X, bottom: PAD_Y, left: PAD_X },
                minCellHeight: ROW_H,
                valign: 'middle',
            },
            headStyles: {
                fillColor: headColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                cellPadding: { top: 1.0, right: 1.4, bottom: 1.0, left: 1.4 },
                minCellHeight: HEAD_H,
            },
            columnStyles,
            margin: {
                top: this._headerContentStartY(),
                left: M,
                right: M,
                bottom: this.bottomMargin,
            },
            pageBreak: 'auto',
            rowPageBreak: 'avoid',
            showHead: 'everyPage',
            didParseCell: (data) => {
                if (
                    data.section === 'body' &&
                    data.column.index === 0 &&
                    typeof data.cell.raw === 'object'
                ) {
                    data.cell.text = ''
                    data.cell.styles.minCellHeight = ROW_H
                }
            },
            didDrawCell: (data) => {
                if (
                    data.section !== 'body' ||
                    data.column.index !== 0 ||
                    typeof data.cell.raw !== 'object'
                )
                    return
                const { x, y, width, height } = data.cell
                const { name, desc } = data.cell.raw
                const maxW = width - PAD_X * 2

                doc.setFont('helvetica', 'bold')
                doc.setFontSize(NAME_FS)
                doc.setTextColor(0, 0, 0)
                doc.text(this._fitOneLine(name, maxW), x + PAD_X, y + PAD_Y + 3)

                if (desc) {
                    doc.setFont('helvetica', 'normal')
                    doc.setFontSize(DESC_FS)
                    doc.setTextColor(...DESC_COLOR)
                    doc.text(this._fitOneLine(desc, maxW), x + PAD_X, y + height - PAD_Y + 0.2)
                    doc.setTextColor(0, 0, 0)
                }
            },
            didDrawPage: () => this._drawHeaderImageOnPage(),
        })

        this.currentY = doc.lastAutoTable.finalY + 2

        // >>> NOVO: banner opcional
        if (!opts.hideSubtotalBanner) {
            const subY = this.currentY
            doc.setFillColor(...subtotalColor)
            doc.rect(M, subY, tableW, SUB_H, 'F')

            const valor = this._formatCurrency(subtotalSum)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(BANNER_FS)
            doc.setTextColor(0, 0, 0)
            doc.text(`${subtotalLabel}: ${valor}`, M + tableW - 8, subY + SUB_H / 2, {
                align: 'right',
                baseline: 'middle',
            })

            this.currentY = subY + SUB_H + 8
        } else {
            this.currentY += 8
        }
    }

    // === TOTAL GERAL: apenas o banner ===
    _addDetailedTotalsSection(totals, optionals) {
        if (!totals) return
        const hasSelected = optionals && optionals.some((o) => o.selecionado)
        const totalFinal = hasSelected
            ? totals.total_com_opcionais_formatted || 'R$ 0,00'
            : totals.total_sem_opcionais_formatted || 'R$ 0,00'

        // só o banner verde
        this._drawTotalBanner('Total Geral', totalFinal, [76, 175, 80])
    }

    // ===== Texto com barra cinza =====
    _normalizeToLines(content) {
        if (!content) return []
        const splitLines = (s) =>
            String(s)
                .split('\n')
                .map((t) => t.trim())
                .filter(Boolean)

        if (Array.isArray(content)) {
            return content.flatMap((v) =>
                typeof v === 'string'
                    ? splitLines(v)
                    : v && typeof v === 'object'
                      ? Object.values(v).flatMap((x) =>
                            typeof x === 'string' ? splitLines(x) : []
                        )
                      : []
            )
        }

        if (typeof content === 'object') {
            const prefer = ['titulo', 'title', 'heading', 'conteudo', 'content', 'texto', 'text']
            const vals = prefer
                .map((k) => content[k])
                .filter((v) => typeof v === 'string' && v.trim())
            if (vals.length) return vals.flatMap(splitLines)
            return Object.values(content).flatMap((v) =>
                typeof v === 'string' ? splitLines(v) : []
            )
        }

        return splitLines(content)
    }

    _addGreySection(title, content) {
        // barra/título
        this._drawTitleBar(String(title).toUpperCase(), [66, 133, 244])

        const doc = this.doc
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)

        // ⬅️ alinhar pelo mesmo recuo do texto do banner (o título usa +6)
        const left = this.SPACE.marginX + 6
        const width = this.contentWidth - 6

        const lines = this._normalizeToLines(content)

        // heurísticas
        const isUpperHeading = (s) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s\-]+:\s*$/u.test(String(s).trim())

        const normalize = (s) =>
            String(s)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')

        const isCondEspeciais = (s) => /^condicoes especiais:\s*$/i.test(normalize(s))

        const isSpecialLead = (s) => /^itens\s+nao\s+inclusos.*contratante:\s*$/i.test(normalize(s))

        // novo: garantir título + N linhas
        const MIN = this.WIDOW?.minBottomLines ?? 3
        const headingH = 5.2,
            lineH = 5.0
        const ensureHeadingBlock = () => {
            if (this._remainingSpace() < headingH + MIN * lineH) this._safeAddPage()
        }

        // helpers locais já com alinhamento do banner
        const drawParagraph = (txt) => {
            this._drawJustifiedParagraph(txt, {
                x: left,
                maxWidth: width,
                lineHeight: 5.0,
                firstLineIndent: 2.5,
                after: 1.5,
            })
        }

        const drawBullet = (txt) => {
            const lead = 5.0
            if (this._remainingSpace() < lead * this.WIDOW.minBottomLines) {
                this._safeAddPage()
            }
            const cy = this.currentY - 1.0 + 1.5
            doc.circle(left + 2.2, cy, 0.8, 'F')
            this._drawJustifiedParagraph(txt, {
                x: left + 6,
                maxWidth: width - 6,
                lineHeight: 5.0,
                firstLineIndent: 0,
                after: 1.5,
            })
        }

        let inSpecialList = false

        for (const raw of lines) {
            if (!raw) continue
            const txt = String(raw).trim()

            // linha que já vem com marcador
            const m = txt.match(/^[-•]\s*(.*)$/)
            if (m) {
                inSpecialList = true
                drawBullet(m[1])
                continue
            }

            // subtítulos (CAIXA-ALTA + ":")
            if (isUpperHeading(txt)) {
                ensureHeadingBlock()
                if (isCondEspeciais(txt)) inSpecialList = true // depois disso vira lista
                this._checkPageBreak(5.2)
                doc.setFont('helvetica', 'bold')
                doc.text(txt, left, this.currentY)
                this.currentY += 5.2
                doc.setFont('helvetica', 'normal')
                continue
            }

            // "Itens não inclusos..." em negrito e abre a lista
            if (isSpecialLead(txt)) {
                ensureHeadingBlock()
                this._checkPageBreak(5.2)
                doc.setFont('helvetica', 'bold')
                doc.text(txt, left, this.currentY)
                this.currentY += 5.2
                doc.setFont('helvetica', 'normal')
                inSpecialList = true
                continue
            }

            // se estamos dentro de "Condições Especiais", tudo vira bullet
            if (inSpecialList) {
                drawBullet(txt)
                continue
            }

            // parágrafo normal (alinhado ao banner)
            drawParagraph(txt)
        }

        this._moveY(2)
    }

    // Parágrafo solto (usado em outros pontos) com viúva/órfã protegida
    _paragraph(text, lead = 5.0) {
        if (!text) return
        const lines = this.doc.splitTextToSize(text, this.contentWidth)
        const MIN = this.WIDOW?.minBottomLines ?? 3

        // quebra antes se não couber o mínimo
        if (this._remainingSpace() < lead * MIN) this._safeAddPage()

        for (let i = 0; i < lines.length; i++) {
            if (this._remainingSpace() < lead * MIN) this._safeAddPage()
            this.doc.text(lines[i], this.SPACE.marginX, this.currentY)
            this._moveY(lead)
        }
    }

    // Bullet solto (usado em outros pontos) com viúva/órfã protegida
    _bullet(text, lead = 5.0) {
        if (!text) return
        const bulletX = this.SPACE.marginX + 2.2
        const lines = this.doc.splitTextToSize(text, this.contentWidth - 8)
        const MIN = this.WIDOW?.minBottomLines ?? 3

        // precisa caber pelo menos MIN linhas do bullet atual
        const need = Math.min(lines.length, MIN) * lead + 2.6
        if (this._remainingSpace() < need) this._safeAddPage()

        // primeira linha com bolinha
        this.doc.circle(bulletX, this.currentY - 1.5 + 1.5, 0.8, 'F')
        this.doc.text(lines[0], this.SPACE.marginX + 6, this.currentY)
        this._moveY(lead)

        // demais linhas
        for (let i = 1; i < lines.length; i++) {
            if (this._remainingSpace() < lead * MIN) this._safeAddPage()
            this.doc.text(lines[i], this.SPACE.marginX + 6, this.currentY)
            this._moveY(lead)
        }
    }

    // faixa de aceite/assinatura
    _addAcceptanceBand(companyName, placeDateText) {
        this._checkPageBreak(14)
        const h = 8
        const y = this.currentY + 6
        const x = this.SPACE.marginX
        const w = this.contentWidth

        this.doc.setFillColor(220, 220, 220)
        this.doc.rect(x, y, w, h, 'F')

        this.doc.setFont('Arial', 'normal')
        this.doc.setFontSize(9)
        this.doc.text(` ${companyName || '-'}`, x + 4, y + 5.5)

        const right = placeDateText || ''
        const tw = this.doc.getTextWidth(right)
        this.doc.text(right, x + w - tw - 4, y + 5.5)

        this.currentY = y + h + 2
    }

    _addFormattedTextSection(title, content) {
        if (!content) return

        const estimatedHeight = this._estimateBlockHeight(
            content,
            this.SPACE.row,
            this.SPACE.wrapWidth
        )
        this._checkPageBreak(estimatedHeight + this.SPACE.sectionTop + this.SPACE.titleHeight)

        this._moveY(this.SPACE.sectionTop)

        this.doc.setFontSize(14)
        this.doc.setFont('Arial', 'bold')
        this.doc.text(title, this.SPACE.marginX, this.currentY)
        this._moveY(this.SPACE.titleHeight + 2)

        this.doc.setFontSize(10)
        this.doc.setFont('Arial', 'normal')

        if (Array.isArray(content)) {
            content.forEach((item) => {
                if (item.titulo) {
                    this._checkPageBreak(this.SPACE.rowLoose)
                    this.doc.setFont('Arial', 'bold')
                    this.doc.text(item.titulo, this.SPACE.marginX, this.currentY)
                    this._moveY(this.SPACE.rowLoose)
                    this.doc.setFont('Arial', 'normal')
                }

                if (item.conteudo) {
                    const contentHeight = this._estimateBlockHeight(
                        item.conteudo,
                        this.SPACE.rowTight,
                        this.SPACE.wrapWidth
                    )
                    this._checkPageBreak(contentHeight)
                    const lines = this.doc.splitTextToSize(item.conteudo, this.SPACE.wrapWidth)
                    lines.forEach((line) => {
                        this._checkPageBreak(this.SPACE.rowTight)
                        this.doc.text(line, this.SPACE.marginX, this.currentY)
                        this._moveY(this.SPACE.rowTight)
                    })
                    this._moveY(this.SPACE.rowTight)
                }
            })
        } else {
            const cleanText = content.toString().trim()
            if (cleanText) {
                const paragraphs = cleanText.split('\n').filter((p) => p.trim())

                paragraphs.forEach((paragraph) => {
                    if (paragraph.trim()) {
                        const paragraphHeight = this._estimateBlockHeight(
                            paragraph,
                            this.SPACE.rowTight,
                            this.SPACE.wrapWidth
                        )
                        this._checkPageBreak(paragraphHeight)
                        const lines = this.doc.splitTextToSize(paragraph, this.SPACE.wrapWidth)
                        lines.forEach((line) => {
                            this._checkPageBreak(this.SPACE.rowTight)
                            this.doc.text(line, this.SPACE.marginX, this.currentY)
                            this._moveY(this.SPACE.rowTight)
                        })
                        this._moveY(this.SPACE.rowTight)
                    }
                })
            }
        }

        this._moveY(this.SPACE.sectionBottom)
    }

    _addFooter(pdfData) {
        const pageCount = this.doc.internal.getNumberOfPages()

        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i)
            this.doc.setFontSize(8)
            this.doc.setFont('Arial', 'normal')
            this.doc.text(
                `Página ${i} de ${pageCount}`,
                this.doc.internal.pageSize.width - this.SPACE.marginX - 20,
                this.doc.internal.pageSize.height - 10
            )
        }
    }

    _checkPageBreak(requiredSpace) {
        const bottomMargin = 25
        if (this.currentY + requiredSpace > this.pageHeight - bottomMargin) {
            this.doc.addPage()
            // desenha a imagem do cabeçalho nesta página
            this._drawHeaderImageOnPage()
            // reposiciona o cursor para abaixo do cabeçalho
            this.currentY = this._headerContentStartY()
        }
    }
    _remainingSpace() {
        // quanto espaço ainda resta na página atual (em mm)
        return this.pageHeight - this.bottomMargin - this.currentY
    }

    _safeAddPage() {
        // quebra de página que já redesenha o cabeçalho e posiciona o cursor
        this.doc.addPage()
        this._drawHeaderImageOnPage()
        this.currentY = this._headerContentStartY()
    }

    _formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value || 0)
    }
    _parseCurrencyToNumber(val) {
        if (val == null || val === '') return 0
        if (typeof val === 'number') return val
        // ex: "R$ 2.800,00" -> 2800.00
        const n = parseFloat(
            String(val)
                .replace(/\s/g, '')
                .replace(/[R$\u00A0]/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
        )
        return isNaN(n) ? 0 : n
    }

    // Helpers para renderização em pares de linhas
    _drawPairRowFixed(leftCfg, rightCfg, y) {
        const lh = this._measureFixed(leftCfg, 'left')
        const rh = this._measureFixed(rightCfg, 'right')
        const h = Math.max(lh, rh, this.LAYOUT.row)

        this._drawFixed(this.margin + this.LAYOUT.colPadX, leftCfg, 'left', y)
        const rightX = this.margin + this.contentWidth / 2 + this.LAYOUT.colPadX
        this._drawFixed(rightX, rightCfg, 'right', y)

        return y + h
    }

    _measureFixed({ label, value, wrap, line }, side) {
        const lineH = line || this.LAYOUT.row
        if (value == null || value === '') return 0

        const colW = this.contentWidth / 2
        const labelText = `${label}:`
        this.doc.setFont('Arial', 'bold')
        const labelWidth = this.doc.getTextWidth(labelText)
        const avail = colW - (labelWidth + this.LAYOUT.valueGap + this.LAYOUT.colPadX)

        const width = Math.min(wrap || this.LAYOUT.wrap, avail)
        const lines = this.doc.splitTextToSize(String(value), width)

        return Math.max(lineH, lines.length * lineH)
    }

    drawAlignedBar(colorRGB, y, height = 8) {
        if (!this.contentWidth || !this.margin) {
            this._recomputeLayout?.()
            this.margin = this.margin ?? this.SPACE?.marginX ?? 20
        }

        const [r, g, b] = Array.isArray(colorRGB) ? colorRGB : [colorRGB.r, colorRGB.g, colorRGB.b]

        this.doc.setFillColor(r, g, b)
        this.doc.rect(this.margin, y, this.contentWidth, height, 'F')
    }

    _drawFixed(x, { label, value, wrap, line }, side, y) {
        const lineH = line || this.LAYOUT.row

        this.doc.setFont('Arial', 'bold')
        const labelText = `${label}:`
        this.doc.text(labelText, x, y)
        const labelWidth = this.doc.getTextWidth(labelText)
        const valueX = x + labelWidth + this.LAYOUT.valueGap

        this.doc.setFont('Arial', 'normal')

        const colW = this.contentWidth / 2
        const avail = colW - (labelWidth + this.LAYOUT.valueGap + this.LAYOUT.colPadX)
        const width = Math.min(wrap || this.LAYOUT.wrap, avail)
        const lines = this.doc.splitTextToSize(String(value ?? ''), width)

        this.doc.text(lines, valueX, y)

        return y + Math.max(lineH, lines.length * lineH)
    }

    addDataSectionPairs(title, colorRGB, rows) {
        this._drawTitleBar(
            title,
            Array.isArray(colorRGB) ? colorRGB : [colorRGB.r, colorRGB.g, colorRGB.b]
        )
        this.doc.setFontSize(10)
        this.doc.setFont('Arial', 'normal')

        let y = this.currentY + 0.8
        for (const row of rows) y = this._drawPairRowFixed(row.left, row.right, y)
        this.currentY = y + this.SPACE.sectionBottom
    }

    // Garante espaço mínimo para começar um bloco com título
    _ensureBlockStart(
        minLines = 2,
        lead = 5.0,
        headingH = this.SPACE.sectionTop + this.SPACE.titleHeight + this.SPACE.afterTitle
    ) {
        const need = headingH + minLines * lead
        if (this._remainingSpace() < need) this._safeAddPage()
    }

    // Mede a altura de uma linha "rótulo: valor" em addDataSectionList
    _measureFluidRowHeight(label, value, maxW, lineHeight = this.SPACE.row) {
        if (value == null || value === '') return 0
        this.doc.setFont('Arial', 'bold')
        const labelTxt = `${label}:`
        const labelW = this.doc.getTextWidth(labelTxt)
        const avail = Math.max(20, (maxW ?? this.contentWidth) - (labelW + this.LAYOUT.valueGap))
        this.doc.setFont('Arial', 'normal')
        const lines = this.doc.splitTextToSize(String(value), avail)
        // usa mesma “regra” do _textRowFluid
        return Math.max(lineHeight, lines.length * (lineHeight - 1))
    }

    // Lista simples (uma coluna): cada linha mede o rótulo e desenha o valor logo após
    // Lista simples (uma coluna) com proteção de viúva/órfã
    addDataSectionList(title, items) {
        const lead = this.SPACE.row
        const MIN = this.WIDOW?.minBottomLines ?? 3

        // precisa caber: título + pelo menos 2 linhas do conteúdo
        this._ensureBlockStart(2, lead)

        this._drawTitleBar(String(title).toUpperCase(), [66, 133, 244])
        this.doc.setFont('Arial', 'normal')
        this.doc.setFontSize(10)

        const x = this.SPACE.marginX + 6 // alinha com texto do banner
        const maxW = this.contentWidth - 6

        let y = this.currentY

        for (const { label, value, line } of items) {
            if (value == null || value === '') continue
            const lh = line || lead

            // mede quantas “linhas” esse item vai consumir
            const h = this._measureFluidRowHeight(label, value, maxW, lh)
            // para a proteção, exigimos que caibam pelo menos MIN linhas do item atual
            const need = Math.min(Math.ceil(h / lh), MIN) * lh + 2

            if (this._remainingSpace() < need) {
                this._safeAddPage()
                y = this.currentY
            }

            y = this._textRowFluid(label, value, x, y, maxW, lh)
        }

        this.currentY = y + this.SPACE.sectionBottom
    }

    _addConditionsSection(cond) {
        if (!cond) return

        // 1) Bloco empilhado, alinhado com "Condições Especiais"
        const flat = [
            { label: 'Forma de Pagamento', value: cond.forma_pagamento },
            { label: 'Validade', value: cond.validade },
            { label: 'Execução', value: cond.execucao },
            { label: 'Garantia', value: cond.garantia },
        ]
        // 👉 NÃO chame _drawTitleBar aqui; a própria lista já desenha a barra
        this.addDataSectionList('Condições Gerais', flat, { indent: 6, drawTitle: true })

        // 2) Condições Especiais (mantém o mesmo alinhamento)
        const especiais = String(cond.especiais || '').trim()
        if (!especiais) return

        // evita título órfão: precisa caber TÍTULO + 3 linhas
        const MIN = this.WIDOW?.minBottomLines ?? 3
        const headingH = 5.2,
            lineH = 5.0
        if (this._remainingSpace() < headingH + MIN * lineH) this._safeAddPage()

        const left = this.SPACE.marginX + 6
        const width = this.contentWidth - 6

        this.doc.setFont('helvetica', 'bold')
        this.doc.setFontSize(10)
        this.doc.text('Condições Especiais:', left, this.currentY)
        this.currentY += headingH
        this.doc.setFont('helvetica', 'normal')

        const drawBullet = (txt) => {
            if (this._remainingSpace() < MIN * lineH) this._safeAddPage()
            const cy = this.currentY - 1.0 + 1.5
            this.doc.circle(left + 2.2, cy, 0.8, 'F')
            this._drawJustifiedParagraph(txt, {
                x: left + 6,
                maxWidth: width - 6,
                lineHeight: lineH,
                firstLineIndent: 0,
                after: 1.5,
            })
        }
        const drawPara = (txt) => {
            this._drawJustifiedParagraph(txt, {
                x: left,
                maxWidth: width,
                lineHeight: lineH,
                firstLineIndent: 2.5,
                after: 1.5,
            })
        }

        especiais.split('\n').forEach((t) => {
            const s = t.trim()
            if (!s) return
            if (/^[-•]\s*/.test(s)) drawBullet(s.replace(/^[-•]\s*/, ''))
            else drawPara(s)
        })

        this._moveY(2)
    }
}

// Função de conveniência para gerar PDF
export async function generatePDF(proposalData, options = {}) {
    const generator = new PDFGenerator()
    await generator.initialize()
    return await generator.generateProposalPDF(proposalData, options)
}

export default PDFGenerator
