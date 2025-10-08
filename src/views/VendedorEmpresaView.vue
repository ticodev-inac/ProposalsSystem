<template>
    <div class="vendedor-empresa-view">
        <div class="page-header">
            <h1>Vendedor/Empresa</h1>
            <button class="btn-primary" @click="openCreateModal">
                <i class="fa-solid fa-plus"></i>
                Novo Fornecedor
            </button>
        </div>

        <div class="search-section">
            <div class="search-box">
                <input
                    type="text"
                    v-model="searchTerm"
                    placeholder="Buscar fornecedores..."
                    @input="filterSuppliers"
                />
                <i class="fa-solid fa-magnifying-glass"></i>
            </div>
        </div>

        <div class="suppliers-grid" v-if="!loading">
            <div v-if="filteredSuppliers.length === 0" class="empty-state">
                <i class="fa-solid fa-building"></i>
                <h3>Nenhum fornecedor encontrado</h3>
                <p>Adicione seu primeiro fornecedor clicando no botão "Novo Fornecedor"</p>
            </div>

            <div v-else class="suppliers-list">
                <div v-for="supplier in filteredSuppliers" :key="supplier.id" class="supplier-card">
                    <div class="supplier-info">
                        <h3>{{ supplier.company_name }}</h3>
                        <p>
                            <strong>Nome do Contato:</strong>
                            {{ supplier.contact_name || 'Não informado' }}
                        </p>
                        <p>
                            <strong>CNPJ:</strong>
                            {{ formatCNPJ(supplier.cnpj) }}
                        </p>
                        <p>
                            <strong>Email:</strong>
                            {{ supplier.email || 'Não informado' }}
                        </p>
                        <p>
                            <strong>Telefone:</strong>
                            {{ formatPhone(supplier.phone) || 'Não informado' }}
                        </p>
                        <p>
                            <strong>Cargo:</strong>
                            {{ supplier.contact_position || 'Não informado' }}
                        </p>
                        <span :class="['status-badge', supplier.is_active ? 'active' : 'inactive']">
                            {{ supplier.is_active ? 'Ativo' : 'Inativo' }}
                        </span>
                    </div>
                    <div class="supplier-actions">
                        <button @click="editSupplier(supplier)" class="btn-edit" title="Editar">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                            @click="deleteSupplier(supplier.id)"
                            class="btn-delete"
                            title="Excluir"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="loading" class="loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Carregando fornecedores...</p>
        </div>

        <!-- Modal Criar/Editar -->
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
            <div class="modal" @click.stop>
                <div class="modal-header">
                    <h3>{{ isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h3>
                    <button @click="closeModal" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="saveSupplier">
                        <div class="form-group">
                            <label for="company_name">Nome da Empresa *</label>
                            <input
                                type="text"
                                id="company_name"
                                v-model="supplierForm.company_name"
                                required
                                placeholder="Nome da empresa"
                            />
                        </div>

                        <div class="form-group">
                            <label for="contact_name">Nome do Contato</label>
                            <input
                                type="text"
                                id="contact_name"
                                v-model="supplierForm.contact_name"
                                placeholder="Nome da pessoa de contato"
                            />
                        </div>

                        <div class="form-group">
                            <label for="contact_position">Cargo do Contato</label>
                            <input
                                type="text"
                                id="contact_position"
                                v-model="supplierForm.contact_position"
                                placeholder="Cargo da pessoa de contato"
                            />
                        </div>

                        <div class="form-group">
                            <label for="cnpj">CNPJ</label>
                            <input
                                type="text"
                                id="cnpj"
                                v-model="supplierForm.cnpj"
                                placeholder="00.000.000/0000-00"
                                @input="formatCNPJInput"
                            />
                        </div>

                        <div class="form-group">
                            <label for="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                v-model="supplierForm.email"
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input
                                type="text"
                                id="phone"
                                v-model="supplierForm.phone"
                                placeholder="(11) 99999-9999"
                                @input="formatPhoneInput"
                            />
                        </div>

                        <div class="form-group">
                            <label for="address">Endereço</label>
                            <textarea
                                id="address"
                                v-model="supplierForm.address"
                                placeholder="Endereço completo"
                                rows="3"
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" v-model="supplierForm.is_active" />
                                Fornecedor ativo
                            </label>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" @click="closeModal">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary" :disabled="saving">
                                {{ saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { ref, onMounted } from 'vue'
    import { supabase } from '../services/supabase'

    export default {
        name: 'VendedorEmpresaView',
        setup() {
            const suppliers = ref([])
            const filteredSuppliers = ref([])
            const searchTerm = ref('')
            const loading = ref(false)
            const saving = ref(false)
            const showModal = ref(false)
            const isEditing = ref(false)

            const supplierForm = ref({
                id: null,
                company_name: '',
                contact_name: '',
                contact_position: '',
                cnpj: '',
                email: '',
                phone: '',
                address: '',
                is_active: true,
            })

            const loadSuppliers = async () => {
                try {
                    loading.value = true
                    const { data, error } = await supabase
                        .from('suppliers')
                        .select('*')
                        .order('company_name')

                    if (error) throw error

                    suppliers.value = data || []
                    filteredSuppliers.value = data || []
                } catch (error) {
                    console.error('Erro ao carregar fornecedores:', error)
                    alert('Erro ao carregar fornecedores')
                } finally {
                    loading.value = false
                }
            }

            const filterSuppliers = () => {
                if (!searchTerm.value) {
                    filteredSuppliers.value = suppliers.value
                    return
                }

                const term = searchTerm.value.toLowerCase()
                filteredSuppliers.value = suppliers.value.filter(
                    (supplier) =>
                        supplier.company_name?.toLowerCase().includes(term) ||
                        supplier.contact_name?.toLowerCase().includes(term) ||
                        supplier.cnpj?.includes(term) ||
                        supplier.email?.toLowerCase().includes(term) ||
                        supplier.contact_position?.toLowerCase().includes(term)
                )
            }

            const openCreateModal = () => {
                isEditing.value = false
                supplierForm.value = {
                    id: null,
                    company_name: '',
                    contact_name: '',
                    contact_position: '',
                    cnpj: '',
                    email: '',
                    phone: '',
                    address: '',
                    is_active: true,
                }
                showModal.value = true
            }

            const editSupplier = (supplier) => {
                isEditing.value = true
                supplierForm.value = { ...supplier }
                showModal.value = true
            }

            const saveSupplier = async () => {
                try {
                    saving.value = true

                    const supplierData = {
                        company_name: supplierForm.value.company_name,
                        contact_name: supplierForm.value.contact_name || null,
                        contact_position: supplierForm.value.contact_position || null,
                        cnpj: supplierForm.value.cnpj || null,
                        email: supplierForm.value.email || null,
                        phone: supplierForm.value.phone || null,
                        address: supplierForm.value.address || null,
                        is_active: supplierForm.value.is_active,
                    }

                    if (isEditing.value) {
                        const { error } = await supabase
                            .from('suppliers')
                            .update(supplierData)
                            .eq('id', supplierForm.value.id)

                        if (error) throw error
                        alert('Fornecedor atualizado com sucesso!')
                    } else {
                        const { error } = await supabase.from('suppliers').insert([supplierData])

                        if (error) throw error
                        alert('Fornecedor criado com sucesso!')
                    }

                    closeModal()
                    loadSuppliers()
                } catch (error) {
                    console.error('Erro ao salvar fornecedor:', error)
                    alert('Erro ao salvar fornecedor: ' + error.message)
                } finally {
                    saving.value = false
                }
            }

            const deleteSupplier = async (id) => {
                if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return

                try {
                    const { error } = await supabase.from('suppliers').delete().eq('id', id)

                    if (error) throw error

                    alert('Fornecedor excluído com sucesso!')
                    loadSuppliers()
                } catch (error) {
                    console.error('Erro ao excluir fornecedor:', error)
                    alert('Erro ao excluir fornecedor: ' + error.message)
                }
            }

            const closeModal = () => {
                showModal.value = false
                isEditing.value = false
            }

            const formatCNPJ = (cnpj) => {
                if (!cnpj) return ''
                const cleaned = cnpj.replace(/\D/g, '')
                if (cleaned.length === 14) {
                    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                }
                return cnpj
            }

            const formatPhone = (phone) => {
                if (!phone) return ''
                const cleaned = phone.replace(/\D/g, '')
                if (cleaned.length === 10) {
                    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                } else if (cleaned.length === 11) {
                    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                }
                return phone
            }

            const formatCNPJInput = (event) => {
                let value = event.target.value.replace(/\D/g, '')
                if (value.length <= 14) {
                    value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                }
                supplierForm.value.cnpj = value
            }

            const formatPhoneInput = (event) => {
                let value = event.target.value.replace(/\D/g, '')
                if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                } else {
                    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                }
                supplierForm.value.phone = value
            }

            onMounted(() => {
                loadSuppliers()
            })

            return {
                suppliers,
                filteredSuppliers,
                searchTerm,
                loading,
                saving,
                showModal,
                isEditing,
                supplierForm,
                loadSuppliers,
                filterSuppliers,
                openCreateModal,
                editSupplier,
                saveSupplier,
                deleteSupplier,
                closeModal,
                formatCNPJ,
                formatPhone,
                formatCNPJInput,
                formatPhoneInput,
            }
        },
    }
</script>

<style scoped>
    .vendedor-empresa-view {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    .page-header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .btn-primary {
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
    }

    .btn-primary:hover {
        background: #0056b3;
        transform: translateY(-1px);
    }

    .btn-primary:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
    }

    .search-section {
        margin-bottom: 30px;
    }

    .search-box {
        position: relative;
        max-width: 400px;
    }

    .search-box i {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: #999;
        font-size: 16px;
    }

    .search-box input {
        width: 100%;
        padding: 12px 45px 12px 15px;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.2s ease;
    }

    .search-box input:focus {
        outline: none;
        border-color: #007bff;
    }

    .suppliers-grid {
        min-height: 200px;
    }

    .suppliers-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 20px;
    }

    .supplier-card {
        background: white;
        border: 1px solid #e1e5e9;
        border-radius: 12px;
        padding: 20px;
        transition: all 0.2s ease;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .supplier-card:hover {
        border-color: #007bff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    }

    .supplier-info {
        flex: 1;
    }

    .supplier-info h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .supplier-info p {
        margin: 6px 0;
        color: #666;
        font-size: 14px;
    }

    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        margin-top: 8px;
    }

    .status-badge.active {
        background: #d4edda;
        color: #155724;
    }

    .status-badge.inactive {
        background: #f8d7da;
        color: #721c24;
    }

    .supplier-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .btn-edit,
    .btn-delete {
        border: none;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn-edit {
        background: #28a745;
        color: white;
    }

    .btn-edit:hover {
        background: #218838;
    }

    .btn-delete {
        background: #dc3545;
        color: white;
    }

    .btn-delete:hover {
        background: #c82333;
    }

    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #666;
    }

    .empty-state i {
        font-size: 48px;
        color: #ccc;
        margin-bottom: 20px;
    }

    .empty-state h3 {
        margin: 0 0 10px 0;
        font-size: 20px;
        color: #333;
    }

    .empty-state p {
        margin: 0;
        font-size: 16px;
    }

    .loading {
        text-align: center;
        padding: 40px;
        color: #666;
    }

    .loading i {
        font-size: 24px;
        margin-bottom: 10px;
    }

    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e1e5e9;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: #666;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: color 0.2s ease;
    }

    .close-btn:hover {
        color: #333;
    }

    .modal-body {
        padding: 24px;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #333;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #e1e5e9;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #007bff;
    }

    .form-group textarea {
        resize: vertical;
        min-height: 80px;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }

    .checkbox-label input[type='checkbox'] {
        width: auto;
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e1e5e9;
    }

    .btn-secondary {
        background: #6c757d;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
    }

    .btn-secondary:hover {
        background: #545b62;
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
        }

        .suppliers-list {
            grid-template-columns: 1fr;
        }

        .supplier-card {
            flex-direction: column;
            gap: 15px;
        }

        .supplier-actions {
            flex-direction: row;
            align-self: flex-end;
        }

        .modal {
            width: 95%;
            margin: 20px;
        }

        .modal-actions {
            flex-direction: column;
        }

        .modal-actions button {
            width: 100%;
        }
    }
</style>
