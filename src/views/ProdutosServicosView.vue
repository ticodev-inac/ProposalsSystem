<template>
  <div class="produtos-servicos-page">
    <div class="produtos-servicos-header">
      <div class="header-content">
        <h1>Produtos e Serviços</h1>
        <p class="page-subtitle">Gerencie seus produtos e serviços</p>
      </div>
    </div>
    
    <div class="tabs-container">
      <div class="tabs-header">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'servicos' }"
          @click="activeTab = 'servicos'"
        >
          Serviços
        </button>
        
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'produtos' }"
          @click="activeTab = 'produtos'"
        >
          Produtos
        </button>

      </div>
      
      <!-- Produtos Tab -->
      <div class="tab-content" :class="{ active: activeTab === 'produtos' }" v-show="activeTab === 'produtos'">
        <div class="tab-section-header">
          <h2>Produtos</h2>
          <div class="header-actions">
            <button class="btn-secondary" @click="openCategoriesModal('produto')">
              <i class="fas fa-tags"></i>
              Gerenciar Categorias
            </button>
            <button class="btn-primary" @click="openNewProductModal">
              <i class="fas fa-plus"></i>
              Novo Produto
            </button>
          </div>
        </div>
        
        <div class="search-section">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              v-model="productSearch" 
              type="text" 
              placeholder="Buscar produtos..." 
              @input="filterProducts"
            >
          </div>
          <div class="filter-section">
            <select 
              v-model="selectedProductCategory" 
              class="form-control form-select"
              @change="filterProducts"
            >
              <option value="">Todas as categorias</option>
              <option 
                v-for="category in productCategories" 
                :key="category.id" 
                :value="category.name"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="products-grid" v-if="filteredProducts.length > 0">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id" 
            class="product-card"
          >
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p v-if="product.description">{{ product.description }}</p>
              <div class="product-meta">
                <span class="product-price" v-if="product.price">
                  {{ formatCurrency(product.price) }}
                </span>
                <span class="product-unit" v-if="product.unit">
                  {{ product.unit }}
                </span>
              </div>
              <div class="product-category" v-if="product.category">
                <span class="category-tag">{{ product.category }}</span>
              </div>
            </div>
            <div class="product-actions">
              <button class="btn-secondary" @click="openEditProductModal(product)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-danger" @click="deleteProduct(product.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <i class="fas fa-box"></i>
          <h3>Nenhum produto encontrado</h3>
          <p>Adicione seu primeiro produto clicando no botão "Novo Produto"</p>
        </div>
      </div>
      
      <!-- Serviços Tab -->
      <div class="tab-content" :class="{ active: activeTab === 'servicos' }" v-show="activeTab === 'servicos'">
        <div class="tab-section-header">
          <h2>Serviços</h2>
          <div class="header-actions">
            <button class="btn-secondary" @click="openCategoriesModal('servico')">
              <i class="fas fa-tags"></i>
              Gerenciar Categorias
            </button>
            <button class="btn-primary" @click="openNewServiceModal">
              <i class="fas fa-plus"></i>
              Novo Serviço
            </button>
          </div>
        </div>
        
        <div class="search-section">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              v-model="serviceSearch" 
              type="text" 
              placeholder="Buscar serviços..." 
              @input="filterServices"
            >
          </div>
          <div class="filter-section">
            <select 
              v-model="selectedServiceCategory" 
              class="form-control form-select"
              @change="filterServices"
            >
              <option value="">Todas as categorias</option>
              <option 
                v-for="category in serviceCategories" 
                :key="category.id" 
                :value="category.name"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="services-grid" v-if="filteredServices.length > 0">
          <div 
            v-for="service in filteredServices" 
            :key="service.id" 
            class="service-card"
          >
            <div class="service-info">
              <h3>{{ service.name }}</h3>
              <p v-if="service.description">{{ service.description }}</p>
              <div class="service-meta">
                <span class="service-price" v-if="service.price">
                  {{ formatCurrency(service.price) }}
                </span>
                <span class="service-unit" v-if="service.unit">
                  {{ service.unit }}
                </span>
              </div>
              <div class="service-category" v-if="service.category">
                <span class="category-tag">{{ service.category }}</span>
              </div>
            </div>
            <div class="service-actions">
              <button class="btn-secondary" @click="openEditServiceModal(service)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-danger" @click="deleteService(service.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <i class="fas fa-cogs"></i>
          <h3>Nenhum serviço encontrado</h3>
          <p>Adicione seu primeiro serviço clicando no botão "Novo Serviço"</p>
        </div>
      </div>
    </div>

    <!-- Modal Novo Produto -->
    <div v-if="showNewProductModal" class="modal-overlay" @click="onOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Novo Produto</h2>
          <button class="close-btn" @click="closeNewProductModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveProduct">
            <div class="form-group">
              <label for="productName">Nome *</label>
              <input 
                id="productName"
                v-model="productForm.name" 
                type="text" 
                class="form-control"
                :class="{ 'is-invalid': productErrors.name }"
                placeholder="Nome do produto"
              >
              <div v-if="productErrors.name" class="invalid-feedback">
                {{ productErrors.name }}
              </div>
            </div>

            <div class="form-group">
              <label for="productCategory">Categoria</label>
              <select 
                id="productCategory"
                v-model="productForm.category" 
                class="form-control form-select"
              >
                <option value="">Selecione uma categoria</option>
                <option 
                  v-for="category in productCategories" 
                  :key="category.id" 
                  :value="category.name"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="productDescription">Descrição</label>
              <textarea 
                id="productDescription" 
                v-model="productForm.description" 
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="productUnitPrice">Preço Unitário (R$)</label>
                <input 
                  type="number" 
                  id="productUnitPrice" 
                  v-model="productForm.unit_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="productUnit">Unidade</label>
                <input 
                  type="text" 
                  id="productUnit" 
                  v-model="productForm.unit" 
                  placeholder="ex: un, kg, m²"
                >
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="productMinPrice">Preço Mínimo (R$)</label>
                <input 
                  type="number" 
                  id="productMinPrice" 
                  v-model="productForm.min_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="productMaxPrice">Preço Máximo (R$)</label>
                <input 
                  type="number" 
                  id="productMaxPrice" 
                  v-model="productForm.max_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="productObservations">Observações</label>
              <textarea 
                id="productObservations" 
                v-model="productForm.observations" 
                rows="3"
              ></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeNewProductModal">
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn-primary" 
            @click="saveProduct"
            :disabled="saving"
          >
            <span v-if="saving" class="spinner"></span>
            Salvar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Editar Produto -->
    <div v-if="showEditProductModal" class="modal-overlay" @click="onOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Editar Produto</h2>
          <button class="close-btn" @click="closeEditProductModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="updateProduct">
            <div class="form-group">
              <label for="editProductName">Nome *</label>
              <input 
                id="editProductName"
                v-model="productForm.name" 
                type="text" 
                class="form-control"
                :class="{ 'is-invalid': productErrors.name }"
                placeholder="Nome do produto"
              >
              <div v-if="productErrors.name" class="invalid-feedback">
                {{ productErrors.name }}
              </div>
            </div>

            <div class="form-group">
              <label for="editProductCategory">Categoria</label>
              <select 
                id="editProductCategory"
                v-model="productForm.category" 
                class="form-control form-select"
              >
                <option value="">Selecione uma categoria</option>
                <option 
                  v-for="category in productCategories" 
                  :key="category.id" 
                  :value="category.name"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="editProductDescription">Descrição</label>
              <textarea 
                id="editProductDescription" 
                v-model="productForm.description" 
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="editProductUnitPrice">Preço Unitário (R$)</label>
                <input 
                  type="number" 
                  id="editProductUnitPrice" 
                  v-model="productForm.unit_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="editProductUnit">Unidade</label>
                <input 
                  type="text" 
                  id="editProductUnit" 
                  v-model="productForm.unit"
                >
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="editProductMinPrice">Preço Mínimo (R$)</label>
                <input 
                  type="number" 
                  id="editProductMinPrice" 
                  v-model="productForm.min_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="editProductMaxPrice">Preço Máximo (R$)</label>
                <input 
                  type="number" 
                  id="editProductMaxPrice" 
                  v-model="productForm.max_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="editProductObservations">Observações</label>
              <textarea 
                id="editProductObservations" 
                v-model="productForm.observations" 
                rows="3"
              ></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeEditProductModal">
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn-primary" 
            @click="updateProduct"
            :disabled="saving"
          >
            <span v-if="saving" class="spinner"></span>
            Atualizar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Novo Serviço -->
    <div v-if="showNewServiceModal" class="modal-overlay" @click="onOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Novo Serviço</h2>
          <button class="close-btn" @click="closeNewServiceModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveService">
            <div class="form-group">
              <label for="serviceName">Nome *</label>
              <input 
                id="serviceName"
                v-model="serviceForm.name" 
                type="text" 
                class="form-control"
                :class="{ 'is-invalid': serviceErrors.name }"
                placeholder="Nome do serviço"
              >
              <div v-if="serviceErrors.name" class="invalid-feedback">
                {{ serviceErrors.name }}
              </div>
            </div>

            <div class="form-group">
              <label for="serviceCategory">Categoria</label>
              <select 
                id="serviceCategory"
                v-model="serviceForm.category" 
                class="form-control form-select"
              >
                <option value="">Selecione uma categoria</option>
                <option 
                  v-for="category in serviceCategories" 
                  :key="category.id" 
                  :value="category.name"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="serviceDescription">Descrição</label>
              <textarea 
                id="serviceDescription" 
                v-model="serviceForm.description" 
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="serviceUnitPrice">Preço Unitário (R$)</label>
                <input 
                  type="number" 
                  id="serviceUnitPrice" 
                  v-model="serviceForm.unit_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="serviceUnit">Unidade</label>
                <input 
                  type="text" 
                  id="serviceUnit" 
                  v-model="serviceForm.unit" 
                  placeholder="ex: un, kg, m²"
                >
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="serviceMinPrice">Preço Mínimo (R$)</label>
                <input 
                  type="number" 
                  id="serviceMinPrice" 
                  v-model="serviceForm.min_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="serviceMaxPrice">Preço Máximo (R$)</label>
                <input 
                  type="number" 
                  id="serviceMaxPrice" 
                  v-model="serviceForm.max_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="serviceDuration">Duração (horas)</label>
              <input 
                type="number" 
                id="serviceDuration" 
                v-model="serviceForm.duration_hours" 
                min="0"
                step="0.5"
              >
            </div>
            
            <div class="form-group">
              <label for="serviceObservations">Observações</label>
              <textarea 
                id="serviceObservations" 
                v-model="serviceForm.observations" 
                rows="3"
              ></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeNewServiceModal">
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn-primary" 
            @click="saveService"
            :disabled="saving"
          >
            <span v-if="saving" class="spinner"></span>
            Salvar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Editar Serviço -->
    <div v-if="showEditServiceModal" class="modal-overlay" @click="onOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Editar Serviço</h2>
          <button class="close-btn" @click="closeEditServiceModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="updateService">
            <div class="form-group">
              <label for="editServiceName">Nome *</label>
              <input 
                id="editServiceName"
                v-model="serviceForm.name" 
                type="text" 
                class="form-control"
                :class="{ 'is-invalid': serviceErrors.name }"
                placeholder="Nome do serviço"
              >
              <div v-if="serviceErrors.name" class="invalid-feedback">
                {{ serviceErrors.name }}
              </div>
            </div>

            <div class="form-group">
              <label for="editServiceCategory">Categoria</label>
              <select 
                id="editServiceCategory"
                v-model="serviceForm.category" 
                class="form-control form-select"
              >
                <option value="">Selecione uma categoria</option>
                <option 
                  v-for="category in serviceCategories" 
                  :key="category.id" 
                  :value="category.name"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="editServiceDescription">Descrição</label>
              <textarea 
                id="editServiceDescription" 
                v-model="serviceForm.description" 
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="editServiceUnitPrice">Preço Unitário (R$)</label>
                <input 
                  type="number" 
                  id="editServiceUnitPrice" 
                  v-model="serviceForm.unit_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="editServiceUnit">Unidade</label>
                <input 
                  type="text" 
                  id="editServiceUnit" 
                  v-model="serviceForm.unit"
                >
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="editServiceMinPrice">Preço Mínimo (R$)</label>
                <input 
                  type="number" 
                  id="editServiceMinPrice" 
                  v-model="serviceForm.min_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="editServiceMaxPrice">Preço Máximo (R$)</label>
                <input 
                  type="number" 
                  id="editServiceMaxPrice" 
                  v-model="serviceForm.max_price" 
                  step="0.01" 
                  min="0"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="editServiceDuration">Duração (horas)</label>
              <input 
                type="number" 
                id="editServiceDuration" 
                v-model="serviceForm.duration_hours" 
                min="0"
                step="0.5"
              >
            </div>
            
            <div class="form-group">
              <label for="editServiceObservations">Observações</label>
              <textarea 
                id="editServiceObservations" 
                v-model="serviceForm.observations" 
                rows="3"
              ></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeEditServiceModal">
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn-primary" 
            @click="updateService"
            :disabled="saving"
          >
            <span v-if="saving" class="spinner"></span>
            Atualizar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Gerenciar Categorias -->
    <div v-if="showCategoriesModal" class="modal-overlay" @click="onOverlayClick">
      <div class="modal-content categories-modal" @click.stop>
        <div class="modal-header">
          <h2>Gerenciar Categorias</h2>
      <!-- Botão X para fechar -->
      <button
        type="button"
        class="modal-close-btn"
        @click="closeCategoriesModal"
        aria-label="Fechar"
        title="Fechar"
      >
        ×
      </button>
        </div>
        
        <div class="modal-body">
          <!-- Abas de tipo -->
          <div class="category-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: categoryTab === 'produto' }"
              @click="categoryTab = 'produto'"
            >
              Produtos
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: categoryTab === 'servico' }"
              @click="categoryTab = 'servico'"
            >
              Serviços
            </button>
          </div>

          <!-- Formulário nova categoria -->
          <div class="new-category-form">
            <div class="input-group">
              <input 
                v-model="newCategoryName" 
                type="text" 
                class="form-control"
                :placeholder="`Nome da categoria de ${categoryTab === 'produto' ? 'produto' : 'serviço'}`"
                @keyup.enter="createCategory"
              >
              <button 
                class="btn-primary" 
                @click="createCategory"
                :disabled="!newCategoryName.trim() || savingCategory"
              >
                <span v-if="savingCategory" class="spinner"></span>
                Adicionar
              </button>
            </div>
          </div>

          <!-- Lista de categorias -->
          <div class="categories-list">
            <div 
              v-for="category in filteredCategories" 
              :key="category.id"
              class="category-item"
            >
              <div v-if="editingCategory?.id === category.id" class="category-edit">
                <input 
                  v-model="editingCategory.name" 
                  type="text" 
                  class="form-control"
                  @keyup.enter="updateCategory"
                  @keyup.escape="cancelEdit"
                >
              </div>
              <span v-else class="category-name">{{ category.name }}</span>
              
              <div class="category-actions">
                <button 
                  v-if="editingCategory?.id === category.id"
                  class="btn-success"
                  @click="updateCategory"
                  :disabled="savingCategory"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  v-if="editingCategory?.id === category.id"
                  class="btn-secondary"
                  @click="cancelEdit"
                >
                  <i class="fas fa-times"></i>
                </button>
                <button 
                  v-if="editingCategory?.id !== category.id"
                  class="btn-secondary"
                  @click="startEdit(category)"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  v-if="editingCategory?.id !== category.id"
                  class="btn-danger"
                  @click="deleteCategory(category)"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div v-if="filteredCategories.length === 0" class="empty-categories">
              Nenhuma categoria de {{ categoryTab === 'produto' ? 'produto' : 'serviço' }} encontrada
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../services/supabase'
import ProductsService from '../services/ProductsService'

export default {
  name: 'ProdutosServicosView',
  setup() {
    const activeTab = ref('servicos')
    const products = ref([])
    const services = ref([])
    const filteredProducts = ref([])
    const filteredServices = ref([])
    const productSearch = ref('')
    const serviceSearch = ref('')
    const selectedProductCategory = ref('')
    const selectedServiceCategory = ref('')
    const loading = ref(false)
    const saving = ref(false)

    // Modal states
    const showNewProductModal = ref(false)
    const showEditProductModal = ref(false)
    const showNewServiceModal = ref(false)
    const showEditServiceModal = ref(false)

    // Form data
    const productForm = ref({
      id: null,
      name: '',
      category: '',
      description: '',
      unit_price: null,
      unit: '',
      min_price: null,
      max_price: null,
      observations: ''
    })

    const serviceForm = ref({
      id: null,
      name: '',
      category: '',
      description: '',
      unit_price: null,
      unit: '',
      min_price: null,
      max_price: null,
      duration_hours: null,
      observations: ''
    })

    // Error states
    const productErrors = ref({})
    const serviceErrors = ref({})

    // Category management
    const showCategoryModal = ref(false)
    const showCategoriesModal = ref(false)
    const categoryTab = ref('produto')
    const categories = ref([])
    const newCategoryName = ref('')
    const editingCategory = ref(null)
    const savingCategory = ref(false)
    const editingProduct = ref(null)
    const editingService = ref(null)


// se false, clicar fora NÃO fecha; se true, fecha
const allowOverlayClose = ref(false)

const onOverlayClick = () => {
  if (!allowOverlayClose.value) return
  if (showNewProductModal.value) return closeNewProductModal()
  if (showEditProductModal.value) return closeEditProductModal()
  if (showNewServiceModal.value) return closeNewServiceModal()
  if (showEditServiceModal.value) return closeEditServiceModal()
  if (showCategoriesModal.value) return closeCategoriesModal()
}


    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        products.value = data || []
        filteredProducts.value = data || []
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
      }
    }

    const loadServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        services.value = data || []
        filteredServices.value = data || []
      } catch (error) {
        console.error('Erro ao carregar serviços:', error)
      }
    }

    const filterProducts = () => {
      let filtered = products.value
      
      // Filtrar por termo de busca
      if (productSearch.value) {
        const term = productSearch.value.toLowerCase()
        filtered = filtered.filter(product => 
          product.name?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.category?.toLowerCase().includes(term)
        )
      }
      
      // Filtrar por categoria
      if (selectedProductCategory.value) {
        filtered = filtered.filter(product => 
          product.category === selectedProductCategory.value
        )
      }
      
      filteredProducts.value = filtered
    }

    const filterServices = () => {
      let filtered = services.value
      
      // Filtrar por termo de busca
      if (serviceSearch.value) {
        const term = serviceSearch.value.toLowerCase()
        filtered = filtered.filter(service => 
          service.name?.toLowerCase().includes(term) ||
          service.description?.toLowerCase().includes(term) ||
          service.category?.toLowerCase().includes(term)
        )
      }
      
      // Filtrar por categoria
      if (selectedServiceCategory.value) {
        filtered = filtered.filter(service => 
          service.category === selectedServiceCategory.value
        )
      }
      
      filteredServices.value = filtered
    }

    // Product modal functions
    const openNewProductModal = () => {
      resetProductForm()
      productErrors.value = {}
      showNewProductModal.value = true
    }

    const closeNewProductModal = () => {
      showNewProductModal.value = false
      resetProductForm()
      productErrors.value = {}
    }

const openEditProductModal = (product) => {
  productForm.value = {
    id: product.id ?? null,
    name: product.name ?? '',
    category: product.category ?? '',
    description: product.description ?? '',
    unit_price: product.price ?? null,     // 👈 mapeia do banco
    unit: product.unit ?? '',
    min_price: product.min_price ?? null,
    max_price: product.max_price ?? null,
    observations: product.observations ?? ''
  }
  productErrors.value = {}
  showEditProductModal.value = true
}


    const closeEditProductModal = () => {
      showEditProductModal.value = false
      resetProductForm()
      productErrors.value = {}
    }

    const resetProductForm = () => {
      productForm.value = {
        id: null,
        name: '',
        category: '',
        description: '',
        unit_price: null,
        unit: '',
        min_price: null,
        max_price: null,
        observations: ''
      }
    }

    // Service modal functions
    const openNewServiceModal = () => {
      resetServiceForm()
      serviceErrors.value = {}
      showNewServiceModal.value = true
    }

    const closeNewServiceModal = () => {
      showNewServiceModal.value = false
      resetServiceForm()
      serviceErrors.value = {}
    }

const openEditServiceModal = (service) => {
  serviceForm.value = {
    id: service.id ?? null,
    name: service.name ?? '',
    category: service.category ?? '',
    description: service.description ?? '',
    unit_price: service.price ?? null,     // 👈 mapeia do banco
    unit: service.unit ?? '',
    min_price: service.min_price ?? null,
    max_price: service.max_price ?? null,
    duration_hours: service.duration_hours ?? null,
    observations: service.observations ?? ''
  }
  serviceErrors.value = {}
  showEditServiceModal.value = true
}


    const closeEditServiceModal = () => {
      showEditServiceModal.value = false
      resetServiceForm()
      serviceErrors.value = {}
    }

    const resetServiceForm = () => {
      serviceForm.value = {
        id: null,
        name: '',
        category: '',
        description: '',
        unit_price: null,
        unit: '',
        min_price: null,
        max_price: null,
        duration_hours: null,
        observations: ''
      }
    }

    // Validation functions
    const validateProductForm = () => {
      const errors = {}
      
      if (!productForm.value.name?.trim()) {
        errors.name = 'Nome é obrigatório'
      }
      
      productErrors.value = errors
      return Object.keys(errors).length === 0
    }

    const validateServiceForm = () => {
      const errors = {}
      
      if (!serviceForm.value.name?.trim()) {
        errors.name = 'Nome é obrigatório'
      }
      
      serviceErrors.value = errors
      return Object.keys(errors).length === 0
    }

    // CRUD functions
    const saveProduct = async () => {
      if (!validateProductForm()) return
      
      saving.value = true
      try {
const productData = {
  name: productForm.value.name.trim(),
  category: productForm.value.category?.trim() || null,
  description: productForm.value.description?.trim() || null,
  price: productForm.value.unit_price || null,
  unit: productForm.value.unit?.trim() || null,
  min_price: productForm.value.min_price || null,
  max_price: productForm.value.max_price || null,
  observations: productForm.value.observations?.trim() || null   // 👈
}

        const { error } = await supabase
          .from('products')
          .insert([productData])
        
        if (error) throw error
        
        await loadProducts()
        closeNewProductModal()
        alert('Produto criado com sucesso!')
      } catch (error) {
        console.error('Erro ao criar produto:', error)
        alert('Erro ao criar produto: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    const updateProduct = async () => {
      if (!validateProductForm()) return
      
      saving.value = true
      try {
        const productData = {
          name: productForm.value.name.trim(),
          category: productForm.value.category?.trim() || null,
          description: productForm.value.description?.trim() || null,
          price: productForm.value.unit_price || null,
          unit: productForm.value.unit?.trim() || null,
          min_price: productForm.value.min_price || null,
          max_price: productForm.value.max_price || null
        }

        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productForm.value.id)
        
        if (error) throw error
        
        await loadProducts()
        closeEditProductModal()
        alert('Produto atualizado com sucesso!')
      } catch (error) {
        console.error('Erro ao atualizar produto:', error)
        alert('Erro ao atualizar produto: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    const deleteProduct = async (productId) => {
      if (!confirm('Tem certeza que deseja excluir este produto?')) return
      
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
        
        if (error) throw error
        
        await loadProducts()
        alert('Produto excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
        alert('Erro ao excluir produto: ' + error.message)
      }
    }

    const saveService = async () => {
      if (!validateServiceForm()) return
      
      saving.value = true
      try {
// saveService -> inclua observations
const serviceData = {
  name: serviceForm.value.name.trim(),
  category: serviceForm.value.category?.trim() || null,
  description: serviceForm.value.description?.trim() || null,
  price: serviceForm.value.unit_price || null,
  unit: serviceForm.value.unit?.trim() || null,
  duration_hours: serviceForm.value.duration_hours || null,
  min_price: serviceForm.value.min_price || null,
  max_price: serviceForm.value.max_price || null,
  observations: serviceForm.value.observations?.trim() || null    // 👈
}

        const { error } = await supabase
          .from('services')
          .insert([serviceData])
        
        if (error) throw error
        
        await loadServices()
        closeNewServiceModal()
        alert('Serviço criado com sucesso!')
      } catch (error) {
        console.error('Erro ao criar serviço:', error)
        alert('Erro ao criar serviço: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    const updateService = async () => {
      if (!validateServiceForm()) return
      
      saving.value = true
      try {
        const serviceData = {
          name: serviceForm.value.name.trim(),
          category: serviceForm.value.category?.trim() || null,
          description: serviceForm.value.description?.trim() || null,
          price: serviceForm.value.unit_price || null,
          unit: serviceForm.value.unit?.trim() || null,
          min_price: serviceForm.value.min_price || null,
          max_price: serviceForm.value.max_price || null,
          duration_hours: serviceForm.value.duration_hours || null,
          observations: serviceForm.value.observations?.trim() || null
        }

        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', serviceForm.value.id)
        
        if (error) throw error
        
        await loadServices()
        closeEditServiceModal()
        alert('Serviço atualizado com sucesso!')
      } catch (error) {
        console.error('Erro ao atualizar serviço:', error)
        alert('Erro ao atualizar serviço: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    const deleteService = async (serviceId) => {
      if (!confirm('Tem certeza que deseja excluir este serviço?')) return
      
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId)
        
        if (error) throw error
        
        await loadServices()
        alert('Serviço excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir serviço:', error)
        alert('Erro ao excluir serviço: ' + error.message)
      }
    }

    const formatCurrency = (value) => {
      if (!value) return ''
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }

    // Category management functions
    const loadCategories = async () => {
      try {
        categories.value = await ProductsService.getAllCategories()
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }

    const filteredCategories = computed(() => {
      return categories.value.filter(cat => cat.type === categoryTab.value)
    })

    const productCategories = computed(() => {
      return categories.value.filter(cat => cat.type === 'produto')
    })

    const serviceCategories = computed(() => {
      return categories.value.filter(cat => cat.type === 'servico')
    })

    const openCategoryModal = () => {
      showCategoryModal.value = true
      loadCategories()
    }

    const closeCategoryModal = () => {
      showCategoryModal.value = false
      newCategoryName.value = ''
      editingCategory.value = null
    }

    const openCategoriesModal = (type = 'produto') => {
      categoryTab.value = type
      showCategoriesModal.value = true
      loadCategories()
    }

    const closeCategoriesModal = () => {
      showCategoriesModal.value = false
      newCategoryName.value = ''
      editingCategory.value = null
    }

    const createCategory = async () => {
      if (!newCategoryName.value.trim()) return
      
      savingCategory.value = true
      try {
        await ProductsService.createCategory(newCategoryName.value, categoryTab.value)
        newCategoryName.value = ''
        await loadCategories()
        alert('Categoria criada com sucesso!')
      } catch (error) {
        console.error('Erro ao criar categoria:', error)
        alert('Erro ao criar categoria')
      } finally {
        savingCategory.value = false
      }
    }

    const startEdit = (category) => {
      editingCategory.value = { ...category }
    }

    const cancelEdit = () => {
      editingCategory.value = null
    }

    const updateCategory = async () => {
      if (!editingCategory.value?.name?.trim()) return
      
      savingCategory.value = true
      try {
        await ProductsService.updateCategory(
          editingCategory.value.id, 
          editingCategory.value.name, 
          editingCategory.value.type
        )
        editingCategory.value = null
        await loadCategories()
        alert('Categoria atualizada com sucesso!')
      } catch (error) {
        console.error('Erro ao atualizar categoria:', error)
        alert('Erro ao atualizar categoria')
      } finally {
        savingCategory.value = false
      }
    }

    const deleteCategory = async (category) => {
      if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) return
      
      try {
        await ProductsService.deleteCategory(category.id)
        await loadCategories()
        alert('Categoria excluída com sucesso!')
      } catch (error) {
        console.error('Erro ao deletar categoria:', error)
        alert('Erro ao deletar categoria')
      }
    }

    onMounted(() => {
      loadProducts()
      loadServices()
      loadCategories()
    })

    return {
      activeTab,
      products,
      services,
      filteredProducts,
      filteredServices,
      productSearch,
      serviceSearch,
      selectedProductCategory,
      selectedServiceCategory,
      loading,
      saving,
      showNewProductModal,
      showEditProductModal,
      showNewServiceModal,
      showEditServiceModal,
      productForm,
      serviceForm,
      productErrors,
      serviceErrors,
      onOverlayClick,
      filterProducts,
      filterServices,
      openNewProductModal,
      closeNewProductModal,
      openEditProductModal,
      closeEditProductModal,
      openNewServiceModal,
      closeNewServiceModal,
      openEditServiceModal,
      closeEditServiceModal,
      saveProduct,
      updateProduct,
      deleteProduct,
      saveService,
      updateService,
      deleteService,
      formatCurrency,
      showCategoryModal,
      showCategoriesModal,
      categoryTab,
      categories,
      filteredCategories,
      newCategoryName,
      editingCategory,
      savingCategory,
      editingProduct,
      editingService,
      openCategoryModal,
      closeCategoryModal,
      openCategoriesModal,
      closeCategoriesModal,
      createCategory,
      startEdit,
      cancelEdit,
      updateCategory,
      deleteCategory,
      productCategories,
      serviceCategories
    }
  }
}
</script>

<style scoped>
.produtos-servicos-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.produtos-servicos-header {
  margin-bottom: 30px;
}

.header-content h1 {
  margin: 0 0 5px 0;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
}

.page-subtitle {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.tabs-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e1e5e9;
}

.tabs-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
}

.tab-button {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
}

.tab-button.active {
  color: #007bff;
  background: white;
  border-bottom-color: #007bff;
}

.tab-button:hover:not(.active) {
  background: #e9ecef;
}

.tab-content {
  padding: 30px;
}

.tab-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.me-2 {
  margin-right: 0.5rem;
}

.tab-section-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
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
  margin-bottom: 25px;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.filter-section {
  min-width: 200px;
}

.filter-section select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  background: white;
}

.filter-section select:focus {
  outline: none;
  border-color: #007bff;
}

.search-box i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
}

.search-box input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #007bff;
}

.form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: 40px;
  appearance: none;
}

.products-grid, .services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.product-card, .service-card {
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.product-card:hover, .service-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.product-info h3, .service-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.product-info p, .service-info p {
  margin: 4px 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.product-meta, .service-meta {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 8px;
}

.product-price, .service-price {
  color: #28a745;
  font-weight: 600;
  font-size: 14px;
}

.product-unit, .service-unit {
  color: #999;
  font-size: 12px;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
}

.product-category, .service-category {
  margin-top: 8px;
}

.category-tag {
  background: #007bff;
  color: white;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.product-actions, .service-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary, .btn-danger {
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e1e5e9;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #666;
}

.modal-form {
  padding: 30px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
}

.form-group input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
}

.modal-actions .btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-actions .btn-secondary:hover {
  background: #545b62;
}

.modal-actions .btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-actions .btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.modal-actions .btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* Category Modal Styles */
.modal-body {
  padding: 30px;
}

/* Modal de Categorias */
.categories-modal {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-btn:hover {
  color: #007bff;
}

.new-category-form {
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group .form-control {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.input-group .form-control:focus {
  outline: none;
  border-color: #007bff;
}

.input-group .btn-primary {
  padding: 12px 20px;
  white-space: nowrap;
}

.categories-list {
  max-height: 300px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f8f9fa;
}

.category-name {
  font-weight: 500;
  flex: 1;
}

.category-edit {
  flex: 1;
  margin-right: 10px;
}

.category-edit .form-control {
  padding: 8px 12px;
  border: 1px solid #007bff;
  border-radius: 6px;
  font-size: 14px;
}

.category-actions {
  display: flex;
  gap: 5px;
}

.category-actions button {
  padding: 5px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-success:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.empty-categories {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsividade */
@media (max-width: 768px) {
  .tab-section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .products-grid, .services-grid {
    grid-template-columns: 1fr;
  }
  
  .product-card, .service-card {
    flex-direction: column;
    gap: 15px;
  }
  
  .product-actions, .service-actions {
    align-self: flex-end;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }

  .modal-form {
    padding: 20px;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .categories-modal {
    width: 95%;
    margin: 20px;
  }

  .input-group {
    flex-direction: column;
  }

  .category-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .category-actions {
    justify-content: center;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .search-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: auto;
  }

  .filter-section {
    min-width: auto;
  }

  /* Modal de Categorias: botão X */
.categories-modal { position: relative; }

.categories-modal .modal-close-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: #6c757d;
  cursor: pointer;
  border-radius: 6px;
}
.categories-modal .modal-close-btn:hover {
  background: #f1f3f5;
  color: #343a40;
}

}
</style>