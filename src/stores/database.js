import { defineStore } from 'pinia'
import { createClient } from '@supabase/supabase-js'
import ClientsService from '../services/clientsService.js'
import SuppliersService from '../services/SuppliersService.js'
import ProposalsService from '../services/ProposalsService.js'
import ProductsService from '../services/ProductsService.js'

export const useDatabaseStore = defineStore('database', {
    state: () => ({
        supabase: null,
        isConnected: false,
        empresaData: {
            nome: 'Sua Empresa',
            endereco: 'Endereço da empresa',
            telefone: '(11) 99999-9999',
            email: 'contato@empresa.com',
            cnpj: '00.000.000/0001-00',
        },
        // Cache dos dados reais do banco
        clients: [],
        suppliers: [],
        proposals: [],
        products: [],
        // ID da proposta atualmente em edição (persistido)
        // Estado da aplicação
        currentProposalId: null,

        // Dados do modelo sendo usado
        templateData: null,

        setCurrentProposalId(id) {
            this.currentProposalId = id || null
            if (id) {
                localStorage.setItem('current_proposal_id', id)
                console.log('✅ Proposta definida para edição:', id)
            } else {
                localStorage.removeItem('current_proposal_id')
                console.log('✅ Estado de edição limpo')
            }
        },

        // Nova função para limpar completamente o estado de edição
        clearEditingState() {
            this.currentProposalId = null
            localStorage.removeItem('current_proposal_id')
            localStorage.removeItem('selected_supplier_id')
            console.log('✅ Estado de edição completamente limpo')
        },

        // Função para inicializar o estado a partir do localStorage
        initializeFromStorage() {
            const savedProposalId = localStorage.getItem('current_proposal_id')
            if (savedProposalId) {
                this.currentProposalId = savedProposalId
                console.log('✅ Estado de edição restaurado:', savedProposalId)
            }
        },

        // Função para inicializar contexto apenas quando necessário
        initializeProposalContext() {
            const savedProposalId = localStorage.getItem('current_proposal_id')
            if (savedProposalId) {
                this.currentProposalId = savedProposalId
                return savedProposalId
            }
            return null
        },

        // Função para limpar completamente o contexto
        clearProposalContext() {
            this.currentProposalId = null
            localStorage.removeItem('current_proposal_id')
            localStorage.removeItem('selected_supplier_id')
        },
        // Alias de compatibilidade para views antigas
        clearCurrentProposal() {
            this.clearEditingState()
        },
    }),

    getters: {
        isSupabaseReady: (state) => !!state.supabase && state.isConnected,
    },

    actions: {
        async initializeSupabase() {
            try {
                // Credenciais reais do Supabase
                const supabaseUrl = 'https://kmwxjhqtqhpznhxwwjcf.supabase.co'
                const supabaseKey =
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3hqaHF0cWhwem5oeHd3amNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODQyMDgsImV4cCI6MjA3MzI2MDIwOH0.GTrvSxzV_mcE88m2fYw5pX3Ag78oicHoL1x11VP8tiI'

                this.supabase = createClient(supabaseUrl, supabaseKey)

                // Configurar os serviços com o cliente Supabase
                ClientsService.setSupabaseClient(this.supabase)
                SuppliersService.setSupabaseClient(this.supabase)
                ProposalsService.setSupabaseClient(this.supabase)
                ProductsService.setSupabaseClient(this.supabase)

                // Testar conexão real
                await this.testConnection()

                this.isConnected = true
                console.log('✅ Supabase inicializado com sucesso')

                return true
            } catch (error) {
                console.error('❌ Erro ao inicializar Supabase:', error)
                this.isConnected = false
                throw error
            }
        },

        async testConnection() {
            try {
                if (!this.supabase) {
                    throw new Error('Supabase não inicializado')
                }

                // Tenta tabela suppliers
                let test = await this.supabase
                    .from('suppliers')
                    .select('*', { count: 'exact', head: true })

                // Se der erro (tabela não existe), tenta clients
                if (test.error) {
                    test = await this.supabase
                        .from('clients')
                        .select('*', { count: 'exact', head: true })
                }

                if (test.error) {
                    throw new Error(`Erro de conexão: ${test.error.message}`)
                }

                console.log('✅ Conexão com banco testada com sucesso')
                return true
            } catch (error) {
                console.error('❌ Erro ao testar conexão:', error)
                this.isConnected = false
                throw error
            }
        },

        // Ações para Empresa
        loadEmpresaData() {
            // Carregar dados da empresa (pode vir do localStorage ou banco)
            const savedData = localStorage.getItem('empresaData')
            if (savedData) {
                this.empresaData = { ...this.empresaData, ...JSON.parse(savedData) }
            }
        },

        updateEmpresaData(newData) {
            this.empresaData = { ...this.empresaData, ...newData }
            localStorage.setItem('empresaData', JSON.stringify(this.empresaData))
        },

        // Ações para Clientes - usando dados reais
        async loadClients() {
            try {
                if (!this.isSupabaseReady) {
                    await this.initializeSupabase()
                }

                this.clients = await ClientsService.getAllClients()
                console.log(`✅ ${this.clients.length} clientes carregados do banco`)
                return this.clients
            } catch (error) {
                console.error('❌ Erro ao carregar clientes:', error)
                throw error
            }
        },

        async createClient(clientData) {
            try {
                const newClient = await ClientsService.createClient(clientData)
                this.clients.push(newClient)
                console.log('✅ Cliente criado:', newClient.nome)
                return newClient
            } catch (error) {
                console.error('❌ Erro ao criar cliente:', error)
                throw error
            }
        },

        async updateClient(id, clientData) {
            try {
                const updatedClient = await ClientsService.updateClient(id, clientData)
                const index = this.clients.findIndex((c) => c.id === id)
                if (index !== -1) {
                    this.clients[index] = updatedClient
                }
                console.log('✅ Cliente atualizado:', updatedClient.nome)
                return updatedClient
            } catch (error) {
                console.error('❌ Erro ao atualizar cliente:', error)
                throw error
            }
        },

        async deleteClient(id) {
            try {
                await ClientsService.deleteClient(id)
                this.clients = this.clients.filter((c) => c.id !== id)
                console.log('✅ Cliente excluído')
                return true
            } catch (error) {
                console.error('❌ Erro ao excluir cliente:', error)
                throw error
            }
        },

        // Ações para Fornecedores - usando dados reais
        async loadSuppliers() {
            try {
                if (!this.isSupabaseReady) {
                    await this.initializeSupabase()
                }

                this.suppliers = await SuppliersService.getAllSuppliers()
                console.log(`✅ ${this.suppliers.length} fornecedores carregados do banco`)
                return this.suppliers
            } catch (error) {
                console.error('❌ Erro ao carregar fornecedores:', error)
                throw error
            }
        },

        async createSupplier(supplierData) {
            try {
                const newSupplier = await SuppliersService.createSupplier(supplierData)
                this.suppliers.push(newSupplier)
                console.log('✅ Fornecedor criado:', newSupplier.nome)
                return newSupplier
            } catch (error) {
                console.error('❌ Erro ao criar fornecedor:', error)
                throw error
            }
        },

        async updateSupplier(id, supplierData) {
            try {
                const updatedSupplier = await SuppliersService.updateSupplier(id, supplierData)
                const index = this.suppliers.findIndex((s) => s.id === id)
                if (index !== -1) {
                    this.suppliers[index] = updatedSupplier
                }
                console.log('✅ Fornecedor atualizado:', updatedSupplier.nome)
                return updatedSupplier
            } catch (error) {
                console.error('❌ Erro ao atualizar fornecedor:', error)
                throw error
            }
        },

        async deleteSupplier(id) {
            try {
                await SuppliersService.deleteSupplier(id)
                this.suppliers = this.suppliers.filter((s) => s.id !== id)
                console.log('✅ Fornecedor excluído')
                return true
            } catch (error) {
                console.error('❌ Erro ao excluir fornecedor:', error)
                throw error
            }
        },

        // Ações para Propostas - usando dados reais
        async loadProposals() {
            try {
                if (!this.isSupabaseReady) {
                    await this.initializeSupabase()
                }

                this.proposals = await ProposalsService.getAllProposals()
                console.log(`✅ ${this.proposals.length} propostas carregadas do banco`)
                return this.proposals
            } catch (error) {
                console.error('❌ Erro ao carregar propostas:', error)
                throw error
            }
        },

        async createProposal(proposalData) {
            try {
                const newProposal = await ProposalsService.createProposal(proposalData)
                this.proposals.push(newProposal)
                console.log('✅ Proposta criada:', newProposal.numero)
                return newProposal
            } catch (error) {
                console.error('❌ Erro ao criar proposta:', error)
                throw error
            }
        },

        async updateProposal(id, proposalData) {
            try {
                const updatedProposal = await ProposalsService.updateProposal(id, proposalData)
                const index = this.proposals.findIndex((p) => p.id === id)
                if (index !== -1) {
                    this.proposals[index] = updatedProposal
                }
                console.log('✅ Proposta atualizada:', updatedProposal.numero)
                return updatedProposal
            } catch (error) {
                console.error('❌ Erro ao atualizar proposta:', error)
                throw error
            }
        },

        async deleteProposal(id) {
            try {
                await ProposalsService.deleteProposal(id)
                this.proposals = this.proposals.filter((p) => p.id !== id)
                console.log('✅ Proposta excluída')
                return true
            } catch (error) {
                console.error('❌ Erro ao excluir proposta:', error)
                throw error
            }
        },

        // Produtos (dados reais)
        async loadProducts() {
            try {
                if (!this.isSupabaseReady) {
                    await this.initializeSupabase()
                }

                this.products = await ProductsService.getAllProducts()
                console.log(`✅ ${this.products.length} produtos carregados do banco`)
                return this.products
            } catch (error) {
                console.error('❌ Erro ao carregar produtos:', error)
                throw error
            }
        },

        async createProduct(productData) {
            try {
                const newProduct = await ProductsService.createProduct(productData)
                this.products.push(newProduct)
                console.log('✅ Produto criado:', newProduct.nome)
                return newProduct
            } catch (error) {
                console.error('❌ Erro ao criar produto:', error)
                throw error
            }
        },

        async updateProduct(id, productData) {
            try {
                const updatedProduct = await ProductsService.updateProduct(id, productData)
                const index = this.products.findIndex((p) => p.id === id)
                if (index !== -1) {
                    this.products[index] = updatedProduct
                }
                console.log('✅ Produto atualizado:', updatedProduct.nome)
                return updatedProduct
            } catch (error) {
                console.error('❌ Erro ao atualizar produto:', error)
                throw error
            }
        },

        // Métodos para gerenciar dados do template
        setTemplateData(template) {
            this.templateData = template
        },

        clearTemplateData() {
            this.templateData = null
        },

        getTemplateData() {
            return this.templateData
        },

        async deleteProduct(id) {
            try {
                console.log('🗑️ Excluindo produto:', id)
                await ProductsService.deleteProduct(id)

                // Remove do cache local
                this.products = this.products.filter((product) => product.id !== id)

                console.log('✅ Produto excluído com sucesso')
            } catch (error) {
                console.error('❌ Erro ao excluir produto:', error)
                throw error
            }
        },
    },
})
