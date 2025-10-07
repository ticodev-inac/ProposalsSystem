<template>
  <div class="modelos-container">
    <!-- Header -->
    <div class="header-section">
      <h1>Modelos de Proposta</h1>
      <p class="subtitle">Gerencie seus modelos para agilizar a criação de propostas</p>
    </div>

    <!-- Controles -->
    <div class="controls-section">
      <div class="search-container">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input 
            v-model="searchTerm" 
            type="text" 
            placeholder="Buscar modelos..."
            @input="filterModels"
          >
          <button 
            v-if="searchTerm" 
            @click="clearSearch" 
            class="clear-btn"
          >
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <button @click="openCreateModal" class="btn btn-primary">
          <i class="fa-solid fa-plus"></i>
          Criar Modelo
        </button>
      </div>
      
      <div class="results-info">
        <span>{{ filteredModels.length }} modelo(s) encontrado(s)</span>
      </div>
    </div>

    <!-- Grid de Modelos -->
    <div class="models-grid" v-if="!loading && filteredModels.length > 0">
      <div 
        v-for="model in filteredModels" 
        :key="model.id" 
        class="model-card"
      >
        <div class="model-header">
          <div class="model-color" :style="{ backgroundColor: model.color }"></div>
          <h3>{{ model.name }}</h3>
        </div>
        
        <div class="model-content">
          <p class="model-description">{{ model.description || 'Sem descrição' }}</p>
          <div class="model-stats">
            <span class="stat-item">
              <i class="fa-solid fa-list"></i>
              {{ (model.items || []).length }} itens
            </span>
            <span class="stat-item">
              <i class="fa-solid fa-screwdriver-wrench"></i>
              {{ (model.insumos || []).length }} insumos
            </span>
            <span class="stat-item">
              <i class="fa-solid fa-circle-plus"></i>
              {{ (model.opcionais || []).length }} opcionais
            </span>
          </div>
          <div class="model-info">
            <small class="text-muted">
              <i class="fa-solid fa-calendar"></i>
              Criado em {{ formatDate(model.created_at) }}
            </small>
          </div>
        </div>
        
        <div class="model-actions">
          <button 
            @click="useTemplate(model)" 
            class="btn btn-success btn-sm"
            title="Usar este modelo"
          >
            <i class="fa-solid fa-play"></i>
            Usar
          </button>
          <button 
            @click="openEditModal(model)" 
            class="btn btn-outline-primary btn-sm"
            title="Editar modelo"
          >
            <i class="fa-solid fa-pen-to-square"></i>
            Editar
          </button>
          <button 
            @click="deleteModel(model)" 
            class="btn btn-outline-danger btn-sm"
            title="Excluir modelo"
          >
            <i class="fa-solid fa-trash"></i>
            Apagar
          </button>
        </div>
      </div>
    </div>

    <!-- Estado vazio -->
    <div v-else-if="!loading && filteredModels.length === 0" class="empty-state">
      <i class="fa-solid fa-file-lines"></i>
      <h3>{{ searchTerm ? 'Nenhum modelo encontrado' : 'Nenhum modelo criado ainda' }}</h3>
      <p>{{ searchTerm ? 'Tente ajustar sua busca' : 'Crie seu primeiro modelo para agilizar a criação de propostas' }}</p>
      <button v-if="!searchTerm" @click="openCreateModal" class="btn btn-primary">
        <i class="fa-solid fa-plus"></i>
        Criar Primeiro Modelo
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Carregando modelos...</p>
    </div>

    <!-- Modal de Criação/Edição Completo -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h4>{{ isEditing ? 'Editar Modelo' : 'Criar Novo Modelo' }}</h4>
          <button @click="closeModal" class="close-btn">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <!-- Navegação por abas -->
          <div class="tabs-nav">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="['tab-btn', { active: activeTab === tab.id }]"
            >
              <i :class="tab.icon"></i>
              {{ tab.label }}
            </button>
          </div>

          <!-- Conteúdo das abas -->
          <div class="tab-content">
            <!-- Aba: Dados Básicos -->
            <div v-if="activeTab === 'basic'" class="tab-pane">
              <h5>Informações Básicas do Modelo</h5>
              <div class="form-row">
                <div class="form-group col-md-8">
                  <label for="modelName">Nome do Modelo *</label>
                  <input 
                    id="modelName"
                    v-model="modelForm.name" 
                    type="text" 
                    class="form-control"
                    placeholder="Ex: Evento Corporativo"
                    required
                  >
                </div>
                <div class="form-group col-md-4">
                  <label for="modelColor">Cor</label>
                  <div class="color-input-group">
                    <input 
                      id="modelColor"
                      v-model="modelForm.color" 
                      type="color" 
                      class="form-control color-input"
                    >
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="modelDescription">Descrição</label>
                <textarea 
                  id="modelDescription"
                  v-model="modelForm.description" 
                  class="form-control"
                  rows="3"
                  placeholder="Descreva quando usar este modelo..."
                ></textarea>
              </div>

              <!-- Dados da Proposta Template -->
              <h5>Dados Padrão da Proposta</h5>
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label for="title">Título Padrão</label>
                  <input 
                    id="title"
                    v-model="modelForm.title" 
                    type="text" 
                    class="form-control"
                    placeholder="Título padrão para propostas"
                  >
                </div>
                <div class="form-group col-md-6">
                  <label for="event_type">Tipo de Evento</label>
                  <select v-model="modelForm.event_type" class="form-control">
                    <option value="">Selecione...</option>
                    <option value="corporativo">Corporativo</option>
                    <option value="social">Social</option>
                    <option value="institucional">Institucional</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col-md-4">
                  <label for="participants_count">Nº Participantes</label>
                  <input 
                    id="participants_count"
                    v-model.number="modelForm.participants_count" 
                    type="number" 
                    class="form-control"
                    min="1"
                  >
                </div>
                <div class="form-group col-md-4">
                  <label for="start_time">Horário Início</label>
                  <input 
                    id="start_time"
                    v-model="modelForm.start_time" 
                    type="time" 
                    class="form-control"
                  >
                </div>
                <div class="form-group col-md-4">
                  <label for="end_time">Horário Fim</label>
                  <input 
                    id="end_time"
                    v-model="modelForm.end_time" 
                    type="time" 
                    class="form-control"
                  >
                </div>
              </div>

              <div class="form-group">
                <label for="observations">Observações Padrão</label>
                <textarea 
                  id="observations"
                  v-model="modelForm.observations" 
                  class="form-control"
                  rows="3"
                  placeholder="Observações que aparecerão por padrão nas propostas..."
                ></textarea>
              </div>
            </div>

            <!-- Aba: Itens -->
            <div v-if="activeTab === 'items'" class="tab-pane">
              <div class="section-header">
                <h5>Itens do Modelo</h5>
                <button @click="openItemModal" class="btn btn-sm btn-primary">
                  <i class="fa-solid fa-plus"></i>
                  Adicionar Item
                </button>
              </div>

              <div v-if="modelForm.items.length === 0" class="empty-section">
                <i class="fa-solid fa-list"></i>
                <p>Nenhum item adicionado ainda</p>
                <button @click="openItemModal" class="btn btn-outline-primary">
                  Adicionar Primeiro Item
                </button>
              </div>

              <div v-else class="items-list">
                <div 
                  v-for="(item, index) in modelForm.items" 
                  :key="index"
                  class="item-card"
                >
                  <div class="item-info">
                    <h6>{{ item.codigo }}</h6>
                    <p>{{ item.descricao }}</p>
                    <div class="item-details">
                      <span class="badge badge-info">{{ item.categoria }}</span>
                      <span class="item-price">{{ formatCurrency(item.valor_unitario) }}</span>
                    </div>
                  </div>
                  <div class="item-controls">
                    <div class="quantity-switch">
                      <button @click="decrementItemQuantity(index)" class="qty-btn">
                        <i class="fa-solid fa-minus"></i>
                      </button>
                      <span class="qty-display">{{ item.quantity || 1 }}</span>
                      <button @click="incrementItemQuantity(index)" class="qty-btn">
                        <i class="fa-solid fa-plus"></i>
                      </button>
                    </div>
                    <button @click="removeItem(index)" class="btn-delete">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Aba: Insumos -->
            <div v-if="activeTab === 'supplies'" class="tab-pane">
              <div class="section-header">
                <h5>Insumos do Modelo</h5>
                <button @click="openSupplyModal" class="btn btn-sm btn-primary">
                  <i class="fa-solid fa-plus"></i>
                  Adicionar Insumo
                </button>
              </div>

              <div v-if="modelForm.insumos.length === 0" class="empty-section">
                <i class="fa-solid fa-screwdriver-wrench"></i>
                <p>Nenhum insumo adicionado ainda</p>
                <button @click="openSupplyModal" class="btn btn-outline-primary">
                  Adicionar Primeiro Insumo
                </button>
              </div>

              <div v-else class="items-list">
                <div 
                  v-for="(insumo, index) in modelForm.insumos" 
                  :key="index"
                  class="item-card"
                >
                  <div class="item-info">
                    <h6>{{ insumo.codigo }}</h6>
                    <p>{{ insumo.descricao }}</p>
                    <div class="item-details">
                      <span class="badge badge-warning">{{ insumo.tipo }}</span>
                      <span class="item-price">{{ formatCurrency(insumo.valor_unitario) }}</span>
                    </div>
                  </div>
                  <div class="item-controls">
                    <div class="quantity-switch">
                      <button @click="decrementSupplyQuantity(index)" class="qty-btn">
                        <i class="fa-solid fa-minus"></i>
                      </button>
                      <span class="qty-display">{{ insumo.quantity || 1 }}</span>
                      <button @click="incrementSupplyQuantity(index)" class="qty-btn">
                        <i class="fa-solid fa-plus"></i>
                      </button>
                    </div>
                    <button @click="removeSupply(index)" class="btn-delete">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Aba: Opcionais -->
            <div v-if="activeTab === 'optionals'" class="tab-pane">
              <div class="section-header">
                <h5>Opcionais do Modelo</h5>
                <button @click="openOptionalModal" class="btn btn-sm btn-primary">
                  <i class="fa-solid fa-plus"></i>
                  Adicionar Opcional
                </button>
              </div>

              <div v-if="modelForm.opcionais.length === 0" class="empty-section">
                <i class="fa-solid fa-circle-plus"></i>
                <p>Nenhum opcional adicionado ainda</p>
                <button @click="openOptionalModal" class="btn btn-outline-primary">
                  Adicionar Primeiro Opcional
                </button>
              </div>

              <div v-else class="items-list">
                <div 
                  v-for="(opcional, index) in modelForm.opcionais" 
                  :key="index"
                  class="item-card"
                >
                  <div class="item-info">
                    <h6>{{ opcional.codigo }}</h6>
                    <p>{{ opcional.descricao }}</p>
                    <div class="item-details">
                      <span class="badge badge-success">Opcional</span>
                      <span class="item-price">{{ formatCurrency(opcional.valor_unitario) }}</span>
                    </div>
                  </div>
                  <div class="item-controls">
                    <div class="quantity-switch">
                      <button @click="decrementOptionalQuantity(index)" class="qty-btn">
                        <i class="fa-solid fa-minus"></i>
                      </button>
                      <span class="qty-display">{{ opcional.quantity || 1 }}</span>
                      <button @click="incrementOptionalQuantity(index)" class="qty-btn">
                        <i class="fa-solid fa-plus"></i>
                      </button>
                    </div>
                    <button @click="removeOptional(index)" class="btn-delete">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancelar</button>
          <button @click="saveModel" class="btn btn-primary" :disabled="!modelForm.name || saving">
            <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
            {{ isEditing ? 'Salvar Alterações' : 'Criar Modelo' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para adicionar/editar Item -->
    <div v-if="showItemModal" class="modal-overlay" @click="closeItemModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h5>{{ editingItemIndex !== null ? 'Editar Item' : 'Selecionar Itens' }}</h5>
          <button @click="closeItemModal" class="close-btn">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Contador de itens selecionados -->
          <div v-if="selectedItems.length > 0" class="selected-items-counter">
            <i class="fa-solid fa-circle-check"></i>
            <span>{{ selectedItems.length }} item(s) selecionado(s)</span>
            <button @click="clearSelectedItems" class="btn-clear-selection">
              <i class="fa-solid fa-times"></i> Limpar seleção
            </button>
          </div>

          <!-- Busca e filtros -->
          <div class="search-section">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input 
                v-model="itemSearchTerm" 
                type="text" 
                placeholder="Buscar produtos e serviços..." 
                @input="filterAvailableItems"
              >
            </div>
            <div class="filter-section">
              <select 
                v-model="selectedItemType" 
                class="form-control form-select"
                @change="onTypeChange"
              >
                <option value="">Todos os tipos</option>
                <option value="produto">Produtos</option>
                <option value="servico">Serviços</option>
              </select>
              <select 
                v-model="selectedItemCategory" 
                class="form-control form-select"
                @change="filterAvailableItems"
                :disabled="!selectedItemType"
              >
                <option value="">Todas as categorias</option>
                <option 
                  v-for="category in availableCategories" 
                  :key="category.id" 
                  :value="category.name"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Lista de itens disponíveis -->
          <div class="items-selection-list" v-if="filteredAvailableItems.length > 0">
            <div 
              v-for="item in filteredAvailableItems" 
              :key="`${item.type}-${item.id}`"
              class="item-selection-card"
              :class="{ 'selected': isItemSelected(item) }"
              @click="toggleItemSelection(item)"
            >
              <div class="item-info">
                <h6>{{ item.name }}</h6>
                <p v-if="item.description">{{ item.description }}</p>
                <div class="item-details">
                  <span class="badge" :class="item.type === 'produto' ? 'badge-info' : 'badge-success'">
                    {{ item.type === 'produto' ? 'Produto' : 'Serviço' }}
                  </span>
                  <span v-if="item.category_name" class="category-badge">
                    {{ item.category_name }}
                  </span>
                  <span class="item-price">{{ formatCurrency(item.price) }}</span>
                  <span v-if="item.unit" class="item-unit">{{ item.unit }}</span>
                </div>
              </div>
              <div class="item-select-btn">
                <i :class="isItemSelected(item) ? 'fas fa-circle-check text-success' : 'fas fa-plus'"></i>
              </div>
            </div>
          </div>

          <!-- Estado vazio -->
          <div v-else-if="!loadingItems" class="empty-state">
            <i class="fa-solid fa-magnifying-glass"></i>
            <p>{{ availableItems.length === 0 ? 'Carregando itens...' : (itemSearchTerm || selectedItemType || selectedItemCategory ? 'Nenhum item encontrado com os filtros aplicados' : 'Todos os itens disponíveis estão listados acima') }}</p>
          </div>

          <!-- Loading -->
          <div v-if="loadingItems" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Carregando itens...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeItemModal" class="btn btn-secondary">Cancelar</button>
          <button 
            @click="saveSelectedItems" 
            class="btn btn-primary"
            :disabled="selectedItems.length === 0"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            Salvar ({{ selectedItems.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para adicionar/editar Insumo -->
    <div v-if="showSupplyModal" class="modal-overlay" @click="closeSupplyModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h5>{{ editingSupplyIndex !== null ? 'Editar Insumo' : 'Selecionar Insumos' }}</h5>
          <button @click="closeSupplyModal" class="close-btn">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Contador de insumos selecionados -->
          <div v-if="selectedSupplies.length > 0" class="selected-items-counter">
            <i class="fa-solid fa-circle-check"></i>
            <span>{{ selectedSupplies.length }} insumo(s) selecionado(s)</span>
            <button @click="clearSelectedSupplies" class="btn-clear-selection">
              <i class="fa-solid fa-times"></i> Limpar seleção
            </button>
          </div>

          <!-- Busca e filtros -->
          <div class="search-section">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input 
                v-model="supplySearchTerm" 
                type="text" 
                placeholder="Buscar insumos..." 
                @input="filterAvailableSupplies"
              >
            </div>
            <div class="filter-section">
              <select 
                v-model="selectedSupplyType" 
                class="form-control form-select"
                @change="filterAvailableSupplies"
              >
                <option value="">Todos os tipos</option>
                <option 
                  v-for="type in availableSupplyTypes" 
                  :key="type.id || type.name"
                  :value="type.name"
                >
                  {{ getSupplyTypeLabel(type.name) }}
                </option>
              </select>
            </div>
          </div>

          <!-- Lista de insumos disponíveis -->
          <div class="items-selection-list" v-if="filteredAvailableSupplies.length > 0">
            <div 
              v-for="supply in filteredAvailableSupplies" 
              :key="supply.id"
              class="item-selection-card"
              :class="{ 'selected': isSupplySelected(supply) }"
              @click="toggleSupplySelection(supply)"
            >
              <div class="item-info">
                <h6>{{ supply.name || supply.codigo }}</h6>
                <p v-if="supply.description || supply.descricao">{{ supply.description || supply.descricao }}</p>
                <div class="item-details">
                  <span class="badge badge-warning">
                    {{ getSupplyTypeLabel(supply.type || supply.tipo) }}
                  </span>
                  <span class="item-price">{{ formatCurrency(supply.price || supply.valor_unitario) }}</span>
                  <span v-if="supply.unit || supply.unidade" class="item-unit">{{ supply.unit || supply.unidade }}</span>
                </div>
              </div>
              <div class="item-select-btn">
                <i :class="isSupplySelected(supply) ? 'fas fa-circle-check text-success' : 'fas fa-plus'"></i>
              </div>
            </div>
          </div>

          <!-- Estado vazio -->
          <div v-else-if="!loadingSupplies" class="empty-state">
            <i class="fa-solid fa-magnifying-glass"></i>
            <p>{{ availableSupplies.length === 0 ? 'Carregando insumos...' : (supplySearchTerm || selectedSupplyType ? 'Nenhum insumo encontrado com os filtros aplicados' : 'Todos os insumos disponíveis estão listados acima') }}</p>
          </div>

          <!-- Loading -->
          <div v-if="loadingSupplies" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Carregando insumos...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeSupplyModal" class="btn btn-secondary">Cancelar</button>
          <button 
            @click="saveSelectedSupplies" 
            class="btn btn-primary"
            :disabled="selectedSupplies.length === 0"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            Salvar ({{ selectedSupplies.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para adicionar/editar Opcional -->
    <div v-if="showOptionalModal" class="modal-overlay" @click="closeOptionalModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h5>{{ editingOptionalIndex !== null ? 'Editar Opcional' : 'Selecionar Opcionais' }}</h5>
          <button @click="closeOptionalModal" class="close-btn">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Contador de opcionais selecionados -->
          <div v-if="selectedOptionals.length > 0" class="selected-items-counter">
            <i class="fa-solid fa-circle-check"></i>
            <span>{{ selectedOptionals.length }} opcional(is) selecionado(s)</span>
            <button @click="clearSelectedOptionals" class="btn-clear-selection">
              <i class="fa-solid fa-times"></i> Limpar seleção
            </button>
          </div>

          <!-- Busca e filtros -->
          <div class="search-section">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input 
                v-model="optionalSearchTerm" 
                type="text" 
                placeholder="Buscar produtos e serviços..." 
                @input="filterAvailableOptionals"
              >
            </div>
            <div class="filter-section">
              <select 
                v-model="selectedOptionalType" 
                class="form-control form-select"
                @change="onOptionalTypeChange"
              >
                <option value="">Todos os tipos</option>
                <option value="produto">Produtos</option>
                <option value="servico">Serviços</option>
              </select>
              <select 
                v-model="selectedOptionalCategory" 
                class="form-control form-select"
                @change="filterAvailableOptionals"
                :disabled="!selectedOptionalType"
              >
                <option value="">Todas as categorias</option>
                <option 
                  v-for="category in availableOptionalCategories" 
                  :key="category.id"
                  :value="category.name"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Lista de opcionais disponíveis -->
          <div class="items-selection-list" v-if="filteredAvailableOptionals.length > 0">
            <div 
              v-for="optional in filteredAvailableOptionals" 
              :key="`${optional.type}-${optional.id}`"
              class="item-selection-card"
              :class="{ 'selected': isOptionalSelected(optional) }"
              @click="toggleOptionalSelection(optional)"
            >
              <div class="item-info">
                <h6>{{ optional.name }}</h6>
                <p v-if="optional.description">{{ optional.description }}</p>
                <div class="item-details">
                  <span class="badge" :class="optional.type === 'produto' ? 'badge-info' : 'badge-success'">
                    {{ optional.type === 'produto' ? 'Produto' : 'Serviço' }}
                  </span>
                  <span v-if="optional.category_name" class="category-badge">
                    {{ optional.category_name }}
                  </span>
                  <span class="item-price">{{ formatCurrency(optional.price) }}</span>
                  <span v-if="optional.unit" class="item-unit">{{ optional.unit }}</span>
                </div>
              </div>
              <div class="item-select-btn">
                <i :class="isOptionalSelected(optional) ? 'fas fa-circle-check text-success' : 'fas fa-plus'"></i>
              </div>
            </div>
          </div>

          <!-- Estado vazio -->
          <div v-else-if="!loadingOptionals" class="empty-state">
            <i class="fa-solid fa-magnifying-glass"></i>
            <p>{{ availableOptionals.length === 0 ? 'Carregando opcionais...' : (optionalSearchTerm || selectedOptionalType || selectedOptionalCategory ? 'Nenhum opcional encontrado com os filtros aplicados' : 'Todos os opcionais disponíveis estão listados acima') }}</p>
          </div>

          <!-- Loading -->
          <div v-if="loadingOptionals" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Carregando opcionais...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeOptionalModal" class="btn btn-secondary">Cancelar</button>
          <button 
            @click="saveSelectedOptionals" 
            class="btn btn-primary"
            :disabled="selectedOptionals.length === 0"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            Salvar ({{ selectedOptionals.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import TemplatesService from '@/services/TemplatesService'
import SupplyTypesService from '@/services/SupplyTypesService'
import ProductsService from '@/services/ProductsService'
import { useDatabaseStore } from '@/stores/database'

export default {
  name: 'ModelosView',
  setup() {
    const router = useRouter()
    const database = useDatabaseStore()
    
    // Estado reativo
    const models = ref([])
    const filteredModels = ref([])
    const searchTerm = ref('')
    const loading = ref(false)
    const saving = ref(false)
    const showModal = ref(false)
    const isEditing = ref(false)
    const activeTab = ref('basic')
    
    // Modais para itens
    const showItemModal = ref(false)
    const showSupplyModal = ref(false)
    const showOptionalModal = ref(false)
    const editingItemIndex = ref(null)
    const editingSupplyIndex = ref(null)
    const editingOptionalIndex = ref(null)
    
    // Dados para busca de itens
    const availableItems = ref([])
    const filteredAvailableItems = ref([])
    const itemSearchTerm = ref('')
    const selectedItemType = ref('')
    const selectedItemCategory = ref('')
    const loadingItems = ref(false)
    const availableCategories = ref([])
    const allCategories = ref([])
    const selectedItems = ref([])
    
    // Dados para busca de insumos
    const availableSupplies = ref([])
    const filteredAvailableSupplies = ref([])
    const supplySearchTerm = ref('')
    const selectedSupplyType = ref('')
    const loadingSupplies = ref(false)
    const selectedSupplies = ref([])
    
    // Dados para busca de opcionais
    const availableOptionals = ref([])
    const filteredAvailableOptionals = ref([])
    const optionalSearchTerm = ref('')
    const selectedOptionalType = ref('')
    const selectedOptionalCategory = ref('')
    const loadingOptionals = ref(false)
    const selectedOptionals = ref([])
    const availableOptionalCategories = ref([])
    
    // Dados para tipos dinâmicos
    const availableSupplyTypes = ref([])
    const loadingSupplyTypes = ref(false)
    
    const modelForm = ref({
      name: '',
      description: '',
      color: '#007bff',
      // Dados da proposta
      title: '',
      event_type: '',
      participants_count: null,
      start_time: '',
      end_time: '',
      observations: '',
      // Arrays para itens, insumos e opcionais
      items: [],
      insumos: [],
      opcionais: []
    })

    // Formulários para itens
    const itemForm = ref({
      codigo: '',
      descricao: '',
      categoria: '',
      unidade: '',
      valor_unitario: 0
    })

    const supplyForm = ref({
      codigo: '',
      descricao: '',
      tipo: '',
      unidade: '',
      valor_unitario: 0
    })

    const optionalForm = ref({
      codigo: '',
      descricao: '',
      valor_unitario: 0,
      nao_inclusos: ''
    })

    // Configuração das abas
    const tabs = [
      { id: 'basic', label: 'Dados Básicos', icon: 'fas fa-circle-info' },
      { id: 'items', label: 'Itens', icon: 'fas fa-list' },
      { id: 'supplies', label: 'Insumos', icon: 'fas fa-screwdriver-wrench' },
      { id: 'optionals', label: 'Opcionais', icon: 'fas fa-circle-plus' }
    ]

    // Configurar os serviços
    TemplatesService.setSupabaseClient(supabase)
    SupplyTypesService.setSupabaseClient(supabase)
    ProductsService.setSupabaseClient(supabase)

    // Computed
    const currentModelId = ref(null)

    // Métodos principais
    const loadModels = async () => {
      try {
        loading.value = true
        const data = await TemplatesService.getAllTemplates()
        models.value = data
        filteredModels.value = data
      } catch (error) {
        console.error('Erro ao carregar modelos:', error)
        alert('Erro ao carregar modelos')
      } finally {
        loading.value = false
      }
    }

    const filterModels = () => {
      if (!searchTerm.value) {
        filteredModels.value = models.value
        return
      }
      
      const term = searchTerm.value.toLowerCase()
      filteredModels.value = models.value.filter(model => 
        model.name.toLowerCase().includes(term) ||
        (model.description && model.description.toLowerCase().includes(term))
      )
    }

    const clearSearch = () => {
      searchTerm.value = ''
      filteredModels.value = models.value
    }

    const openCreateModal = () => {
      isEditing.value = false
      currentModelId.value = null
      activeTab.value = 'basic'
      modelForm.value = {
        name: '',
        description: '',
        color: '#007bff',
        title: '',
        event_type: '',
        participants_count: null,
        start_time: '',
        end_time: '',
        observations: '',
        items: [],
        insumos: [],
        opcionais: []
      }
      showModal.value = true
    }

    const openEditModal = (model) => {
      isEditing.value = true
      currentModelId.value = model.id
      activeTab.value = 'basic'
      modelForm.value = {
        name: model.name,
        description: model.description || '',
        color: model.color || '#007bff',
        title: model.title || '',
        event_type: model.event_type || '',
        participants_count: model.participants_count || null,
        start_time: model.start_time || '',
        end_time: model.end_time || '',
        observations: model.observations || '',
        items: model.items || [],
        insumos: model.insumos || [],
        opcionais: model.opcionais || []
      }
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      isEditing.value = false
      currentModelId.value = null
      activeTab.value = 'basic'
      modelForm.value = {
        name: '',
        description: '',
        color: '#007bff',
        title: '',
        event_type: '',
        participants_count: null,
        start_time: '',
        end_time: '',
        observations: '',
        items: [],
        insumos: [],
        opcionais: []
      }
    }

    const saveModel = async () => {
      try {
        saving.value = true
        if (isEditing.value) {
          await TemplatesService.updateTemplate(currentModelId.value, modelForm.value)
        } else {
          await TemplatesService.createTemplate(modelForm.value)
        }
        
        await loadModels()
        closeModal()
        alert(isEditing.value ? 'Modelo atualizado com sucesso!' : 'Modelo criado com sucesso!')
      } catch (error) {
        console.error('Erro ao salvar modelo:', error)
        alert('Erro ao salvar modelo')
      } finally {
        saving.value = false
      }
    }

    const deleteModel = async (model) => {
      if (!confirm(`Tem certeza que deseja excluir o modelo "${model.name}"?`)) {
        return
      }
      
      try {
        await TemplatesService.deleteTemplate(model.id)
        await loadModels()
        alert('Modelo excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir modelo:', error)
        alert('Erro ao excluir modelo')
      }
    }

    const useTemplate = async (template) => {
      try {
        // Armazenar dados do modelo no store para uso na criação da proposta
        database.setTemplateData(template)
        
        // Navegar para a tela de propostas com flag de uso de modelo
        router.push({ 
          name: 'propostas', 
          query: { useTemplate: template.id } 
        })
      } catch (error) {
        console.error('Erro ao usar modelo:', error)
        alert('Erro ao usar modelo')
      }
    }

    // Funções para gerenciar itens
    const resetItemForm = () => {
      itemForm.value = {
        codigo: '',
        descricao: '',
        categoria: '',
        unidade: '',
        valor_unitario: 0
      }
    }

    // Funções para carregar produtos e serviços
    const loadAvailableItems = async () => {
      try {
        loadingItems.value = true
        
        // Carregar produtos sem join
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('name')
        
        // Carregar serviços
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .order('name')
        
        // Carregar todas as categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        
        if (productsError) throw productsError
        if (servicesError) throw servicesError
        if (categoriesError) throw categoriesError
        
        // Criar mapa de categorias para lookup rápido
        const categoriesMap = {}
        if (categoriesData) {
          categoriesData.forEach(cat => {
            categoriesMap[cat.id] = cat
          })
        }
        
        // Mapear produtos
        const products = (productsData || []).map(p => ({
          ...p,
          type: 'produto',
          price: p.unit_price || p.price || 0,
          category_name: p.category_id && categoriesMap[p.category_id] 
            ? categoriesMap[p.category_id].name 
            : 'Sem categoria'
        }))
        
        // Mapear serviços
        const services = (servicesData || []).map(s => ({
          ...s,
          type: 'servico',
          price: s.unit_price || s.price || 0,
          category_name: s.category || 'Serviço'
        }))
        
        availableItems.value = [...products, ...services]
        allCategories.value = categoriesData || []
        
        // Mostrar todos os itens inicialmente
        filteredAvailableItems.value = availableItems.value
        
      } catch (error) {
        console.error('Erro ao carregar itens:', error)
        alert('Erro ao carregar produtos e serviços')
      } finally {
        loadingItems.value = false
      }
    }

    const onTypeChange = () => {
      selectedItemCategory.value = ''
      updateAvailableCategories()
      filterAvailableItems()
    }

    const updateAvailableCategories = () => {
      if (!selectedItemType.value) {
        availableCategories.value = []
        return
      }
      
      // Filtrar categorias pelo tipo selecionado
      availableCategories.value = allCategories.value.filter(cat => 
        cat.type === selectedItemType.value
      )
    }

    const filterAvailableItems = () => {
      let filtered = availableItems.value
      
      // Filtrar por tipo
      if (selectedItemType.value) {
        filtered = filtered.filter(item => item.type === selectedItemType.value)
      }
      
      // Filtrar por categoria
      if (selectedItemCategory.value) {
        filtered = filtered.filter(item => 
          item.category_name === selectedItemCategory.value
        )
      }
      
      // Filtrar por termo de busca
      if (itemSearchTerm.value) {
        const term = itemSearchTerm.value.toLowerCase()
        filtered = filtered.filter(item => 
          item.name?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.category_name?.toLowerCase().includes(term)
        )
      }
      
      filteredAvailableItems.value = filtered
    }

    const selectItem = (item) => {
      const newItem = {
        codigo: item.name,
        descricao: item.description || item.name,
        categoria: item.type,
        unidade: item.unit || '',
        valor_unitario: item.price || 0,
        source_id: item.id,
        source_table: item.type === 'produto' ? 'products' : 'services'
      }
      
      modelForm.value.items.push(newItem)
      closeItemModal()
    }

    const isItemSelected = (item) => {
      return selectedItems.value.some(selected => 
        selected.id === item.id && selected.type === item.type
      )
    }

    const toggleItemSelection = (item) => {
      const index = selectedItems.value.findIndex(selected => 
        selected.id === item.id && selected.type === item.type
      )
      
      if (index > -1) {
        // Item já selecionado, remover da seleção
        selectedItems.value.splice(index, 1)
      } else {
        // Item não selecionado, adicionar à seleção
        selectedItems.value.push(item)
      }
    }

    const clearSelectedItems = () => {
      selectedItems.value = []
    }

    const saveSelectedItems = () => {
      if (selectedItems.value.length === 0) {
        alert('Selecione pelo menos um item')
        return
      }

      // Adicionar todos os itens selecionados ao modelo
      selectedItems.value.forEach(item => {
        const newItem = {
          codigo: item.name,
          descricao: item.description || item.name,
          categoria: item.type,
          unidade: item.unit || '',
          valor_unitario: item.price || 0,
          quantity: 1,
          source_id: item.id,
          source_table: item.type === 'produto' ? 'products' : 'services'
        }
        
        modelForm.value.items.push(newItem)
      })

      closeItemModal()
    }

    // Funções para gerenciar itens (modificadas)
    const closeItemModal = () => {
      showItemModal.value = false
      editingItemIndex.value = null
      itemSearchTerm.value = ''
      selectedItemType.value = ''
      selectedItemCategory.value = ''
      availableCategories.value = []
      filteredAvailableItems.value = []
      selectedItems.value = [] // Limpar seleção ao fechar
    }

    const openItemModal = async () => {
      await loadAvailableItems()
      showItemModal.value = true
    }

    const editItem = (index) => {
      editingItemIndex.value = index
      showItemModal.value = true
      loadAvailableItems()
    }

    const saveItem = () => {
      if (!itemForm.value.codigo || !itemForm.value.descricao || !itemForm.value.categoria) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      if (editingItemIndex.value !== null) {
        // Editando item existente
        modelForm.value.items[editingItemIndex.value] = { ...itemForm.value }
      } else {
        // Adicionando novo item
        modelForm.value.items.push({ ...itemForm.value })
      }
      
      closeItemModal()
    }

    const removeItem = (index) => {
      if (confirm('Tem certeza que deseja remover este item?')) {
        modelForm.value.items.splice(index, 1)
      }
    }

    const incrementItemQuantity = (index) => {
      if (!modelForm.value.items[index].quantity) {
        modelForm.value.items[index].quantity = 1
      }
      modelForm.value.items[index].quantity++
    }

    const decrementItemQuantity = (index) => {
      if (!modelForm.value.items[index].quantity) {
        modelForm.value.items[index].quantity = 1
      }
      if (modelForm.value.items[index].quantity > 1) {
        modelForm.value.items[index].quantity--
      }
    }

    // Funções para gerenciar insumos
    const resetSupplyForm = () => {
      supplyForm.value = {
        codigo: '',
        descricao: '',
        tipo: '',
        unidade: '',
        valor_unitario: 0
      }
    }

    const loadAvailableSupplies = async () => {
      try {
        loadingSupplies.value = true
        
        const { data: suppliesData, error: suppliesError } = await supabase
          .from('supplies')
          .select('*')
          .order('name')
        
        if (suppliesError) throw suppliesError
        
        availableSupplies.value = suppliesData || []
        filteredAvailableSupplies.value = availableSupplies.value
        
      } catch (error) {
        console.error('Erro ao carregar insumos:', error)
        alert('Erro ao carregar insumos')
      } finally {
        loadingSupplies.value = false
      }
    }

    const filterAvailableSupplies = () => {
      let filtered = availableSupplies.value

      // Filtro por termo de busca
      if (supplySearchTerm.value) {
        const term = supplySearchTerm.value.toLowerCase()
        filtered = filtered.filter(supply => 
          (supply.name || supply.codigo || '').toLowerCase().includes(term) ||
          (supply.description || supply.descricao || '').toLowerCase().includes(term)
        )
      }

      // Filtro por tipo
      if (selectedSupplyType.value) {
        filtered = filtered.filter(supply => 
          (supply.type || supply.tipo) === selectedSupplyType.value
        )
      }
      
      filteredAvailableSupplies.value = filtered
    }

    const isSupplySelected = (supply) => {
      return selectedSupplies.value.some(selected => selected.id === supply.id)
    }

    const toggleSupplySelection = (supply) => {
      const index = selectedSupplies.value.findIndex(selected => selected.id === supply.id)
      
      if (index > -1) {
        // Insumo já selecionado, remover da seleção
        selectedSupplies.value.splice(index, 1)
      } else {
        // Insumo não selecionado, adicionar à seleção
        selectedSupplies.value.push(supply)
      }
    }

    const clearSelectedSupplies = () => {
      selectedSupplies.value = []
    }

    const saveSelectedSupplies = () => {
      if (selectedSupplies.value.length === 0) {
        alert('Selecione pelo menos um insumo')
        return
      }

      // Adicionar todos os insumos selecionados ao modelo
      selectedSupplies.value.forEach(supply => {
        const newSupply = {
          codigo: supply.name || supply.codigo,
          descricao: supply.description || supply.descricao,
          tipo: supply.type || supply.tipo || '',
          unidade: supply.unit || supply.unidade || '',
          valor_unitario: supply.price || supply.valor_unitario || 0,
          source_id: supply.id,
          source_table: 'supplies'
        }
        
        modelForm.value.insumos.push(newSupply)
      })

      closeSupplyModal()
    }

    // Carregar tipos de insumos dinamicamente
    const loadSupplyTypes = async () => {
      try {
        loadingSupplyTypes.value = true
        const types = await SupplyTypesService.getAllTypes()
        availableSupplyTypes.value = types
      } catch (error) {
        console.error('Erro ao carregar tipos de insumos:', error)
        // Fallback para tipos padrão se houver erro
        availableSupplyTypes.value = [
          { name: 'material', description: 'Material' },
          { name: 'mao_obra', description: 'Mão de Obra' },
          { name: 'equipamento', description: 'Equipamento' }
        ]
      } finally {
        loadingSupplyTypes.value = false
      }
    }

    const getSupplyTypeLabel = (typeName) => {
      const type = availableSupplyTypes.value.find(t => t.name === typeName)
      return type ? type.description || type.name : typeName
    }

    const closeSupplyModal = () => {
      showSupplyModal.value = false
      editingSupplyIndex.value = null
      supplySearchTerm.value = ''
      selectedSupplyType.value = ''
      selectedSupplies.value = []
      filteredAvailableSupplies.value = []
    }

    const openSupplyModal = async () => {
      await loadAvailableSupplies()
      showSupplyModal.value = true
    }

    const editSupply = (index) => {
      editingSupplyIndex.value = index
      showSupplyModal.value = true
      loadAvailableSupplies()
    }

    const saveSupply = () => {
      if (!supplyForm.value.codigo || !supplyForm.value.descricao) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      if (editingSupplyIndex.value !== null) {
        // Editando insumo existente
        modelForm.value.insumos[editingSupplyIndex.value] = { ...supplyForm.value }
      } else {
        // Adicionando novo insumo
        modelForm.value.insumos.push({ ...supplyForm.value })
      }
      
      closeSupplyModal()
    }

    const removeSupply = (index) => {
      if (confirm('Tem certeza que deseja remover este insumo?')) {
        modelForm.value.insumos.splice(index, 1)
      }
    }

    const incrementSupplyQuantity = (index) => {
      if (!modelForm.value.insumos[index].quantity) {
        modelForm.value.insumos[index].quantity = 1
      }
      modelForm.value.insumos[index].quantity++
    }

    const decrementSupplyQuantity = (index) => {
      if (!modelForm.value.insumos[index].quantity) {
        modelForm.value.insumos[index].quantity = 1
      }
      if (modelForm.value.insumos[index].quantity > 1) {
        modelForm.value.insumos[index].quantity--
      }
    }

    // Funções para gerenciar opcionais
    const resetOptionalForm = () => {
      optionalForm.value = {
        codigo: '',
        descricao: '',
        valor_unitario: 0,
        nao_inclusos: ''
      }
    }

    const loadAvailableOptionals = async () => {
      try {
        loadingOptionals.value = true
        
        // Carregar produtos e serviços diretamente do Supabase
        const [productsRes, servicesRes] = await Promise.all([
          supabase.from('products').select('*').order('name'),
          supabase.from('services').select('*').order('name')
        ])

        if (productsRes.error) {
          console.error('Erro ao carregar produtos:', productsRes.error)
          throw productsRes.error
        }

        if (servicesRes.error) {
          console.error('Erro ao carregar serviços:', servicesRes.error)
          throw servicesRes.error
        }

        // Combinar e padronizar formato
        const allOptionals = [
          ...(productsRes.data || []).map(product => ({
            ...product,
            type: 'produto',
            codigo: product.name,
            descricao: product.description,
            valor_unitario: product.unit_price || product.price || 0,
            category: product.category || 'Produto'
          })),
          ...(servicesRes.data || []).map(service => ({
            ...service,
            type: 'servico',
            codigo: service.name,
            descricao: service.description,
            valor_unitario: service.unit_price || service.price || 0,
            category: service.category || 'Serviço'
          }))
        ]

        availableOptionals.value = allOptionals
        filteredAvailableOptionals.value = allOptionals
      } catch (error) {
        console.error('Erro ao carregar opcionais:', error)
        // Fallback para array vazio em caso de erro
        availableOptionals.value = []
        filteredAvailableOptionals.value = []
      } finally {
        loadingOptionals.value = false
      }
    }

    const onOptionalTypeChange = () => {
      updateAvailableOptionalCategories()
      selectedOptionalCategory.value = ''
      filterAvailableOptionals()
    }

    const updateAvailableOptionalCategories = () => {
      if (!selectedOptionalType.value) {
        availableOptionalCategories.value = []
        return
      }

      const categories = availableOptionals.value
        .filter(optional => optional.type === selectedOptionalType.value)
        .map(optional => optional.category)
        .filter((category, index, self) => category && self.indexOf(category) === index)
        .map(category => ({ id: category, name: category }))

      availableOptionalCategories.value = categories
    }

    const filterAvailableOptionals = () => {
      let filtered = availableOptionals.value

      // Filtro por termo de busca
      if (optionalSearchTerm.value) {
        const term = optionalSearchTerm.value.toLowerCase()
        filtered = filtered.filter(optional => 
          (optional.name || optional.codigo || '').toLowerCase().includes(term) ||
          (optional.description || optional.descricao || '').toLowerCase().includes(term)
        )
      }

      // Filtro por tipo
      if (selectedOptionalType.value) {
        filtered = filtered.filter(optional => optional.type === selectedOptionalType.value)
      }

      // Filtro por categoria
      if (selectedOptionalCategory.value) {
        filtered = filtered.filter(optional => optional.category === selectedOptionalCategory.value)
      }
      
      filteredAvailableOptionals.value = filtered
    }

    const isOptionalSelected = (optional) => {
      return selectedOptionals.value.some(selected => selected.id === optional.id)
    }

    const toggleOptionalSelection = (optional) => {
      const index = selectedOptionals.value.findIndex(selected => selected.id === optional.id)
      
      if (index > -1) {
        selectedOptionals.value.splice(index, 1)
      } else {
        selectedOptionals.value.push(optional)
      }
    }

    const clearSelectedOptionals = () => {
      selectedOptionals.value = []
    }

    const saveSelectedOptionals = () => {
      if (selectedOptionals.value.length === 0) {
        alert('Selecione pelo menos um opcional')
        return
      }

      // Adicionar todos os opcionais selecionados ao modelo
      selectedOptionals.value.forEach(optional => {
        const newOptional = {
          codigo: optional.name || optional.codigo,
          descricao: optional.description || optional.descricao,
          valor_unitario: optional.unit_price || optional.valor_unitario,
          nao_inclusos: '',
          source_id: optional.id,
          source_table: optional.type === 'produto' ? 'products' : 'services'
        }
        
        modelForm.value.opcionais.push(newOptional)
      })

      closeOptionalModal()
    }

    const closeOptionalModal = () => {
      showOptionalModal.value = false
      editingOptionalIndex.value = null
      optionalSearchTerm.value = ''
      selectedOptionalType.value = ''
      selectedOptionalCategory.value = ''
      availableOptionalCategories.value = []
      filteredAvailableOptionals.value = []
      selectedOptionals.value = []
    }

    const openOptionalModal = async () => {
      await loadAvailableOptionals()
      showOptionalModal.value = true
    }

    const editOptional = (index) => {
      editingOptionalIndex.value = index
      showOptionalModal.value = true
      loadAvailableOptionals()
    }

    const saveOptional = () => {
      if (!optionalForm.value.codigo || !optionalForm.value.descricao) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      if (editingOptionalIndex.value !== null) {
        // Editando opcional existente
        modelForm.value.opcionais[editingOptionalIndex.value] = { ...optionalForm.value }
      } else {
        // Adicionando novo opcional
        modelForm.value.opcionais.push({ ...optionalForm.value })
      }
      
      closeOptionalModal()
    }

    const removeOptional = (index) => {
      if (confirm('Tem certeza que deseja remover este opcional?')) {
        modelForm.value.opcionais.splice(index, 1)
      }
    }

    const incrementOptionalQuantity = (index) => {
      if (!modelForm.value.opcionais[index].quantity) {
        modelForm.value.opcionais[index].quantity = 1
      }
      modelForm.value.opcionais[index].quantity++
    }

    const decrementOptionalQuantity = (index) => {
      if (!modelForm.value.opcionais[index].quantity) {
        modelForm.value.opcionais[index].quantity = 1
      }
      if (modelForm.value.opcionais[index].quantity > 1) {
        modelForm.value.opcionais[index].quantity--
      }
    }

    // Função utilitária
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0)
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString('pt-BR')
    }

    // Lifecycle
    onMounted(async () => {
      await Promise.all([
        loadModels(),
        loadSupplyTypes()
      ])
    })

    return {
      // Estados
      models,
      filteredModels,
      searchTerm,
      loading,
      saving,
      showModal,
      isEditing,
      activeTab,
      modelForm,
      
      // Modais de itens
      showItemModal,
      showSupplyModal,
      showOptionalModal,
      editingItemIndex,
      editingSupplyIndex,
      editingOptionalIndex,
      itemForm,
      supplyForm,
      optionalForm,
      
      // Dados para busca de itens
      availableItems,
      filteredAvailableItems,
      availableCategories,
      itemSearchTerm,
      selectedItemType,
      selectedItemCategory,
      loadingItems,
      selectedItems,
      
      // Dados para busca de insumos
      availableSupplies,
      filteredAvailableSupplies,
      supplySearchTerm,
      selectedSupplyType,
      loadingSupplies,
      selectedSupplies,
      
      // Dados para busca de opcionais
      availableOptionals,
      filteredAvailableOptionals,
      optionalSearchTerm,
      selectedOptionalType,
      selectedOptionalCategory,
      loadingOptionals,
      selectedOptionals,
      availableOptionalCategories,
      
      // Novos dados para tipos dinâmicos
      availableSupplyTypes,
      loadingSupplyTypes,
      
      // Configurações
      tabs,
      
      // Métodos principais
      loadModels,
      filterModels,
      clearSearch,
      openCreateModal,
      openEditModal,
      closeModal,
      saveModel,
      deleteModel,
      useTemplate,
      
      // Métodos para itens (atualizados)
      openItemModal,
      closeItemModal,
      loadAvailableItems,
      filterAvailableItems,
      onTypeChange,
      updateAvailableCategories,
      selectItem,
      editItem,
      saveItem,
      removeItem,
      selectedItems,
      isItemSelected,
      toggleItemSelection,
      clearSelectedItems,
      saveSelectedItems,
      incrementItemQuantity,
      decrementItemQuantity,
      
      // Métodos para insumos
      loadAvailableSupplies,
      filterAvailableSupplies,
      isSupplySelected,
      toggleSupplySelection,
      clearSelectedSupplies,
      saveSelectedSupplies,
      loadSupplyTypes,
      getSupplyTypeLabel,
      openSupplyModal,
      closeSupplyModal,
      editSupply,
      saveSupply,
      removeSupply,
      incrementSupplyQuantity,
      decrementSupplyQuantity,
      
      // Métodos para opcionais
      loadAvailableOptionals,
      filterAvailableOptionals,
      onOptionalTypeChange,
      updateAvailableOptionalCategories,
      isOptionalSelected,
      toggleOptionalSelection,
      clearSelectedOptionals,
      saveSelectedOptionals,
      openOptionalModal,
      closeOptionalModal,
      editOptional,
      saveOptional,
      removeOptional,
      
      // Métodos de controle de quantidade
      incrementItemQuantity,
      decrementItemQuantity,
      incrementSupplyQuantity,
      decrementSupplyQuantity,
      incrementOptionalQuantity,
      decrementOptionalQuantity,
      
      // Utilitários
      formatCurrency,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Container principal */
.modelos-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Header Section */
.header-section {
  margin-bottom: 32px;
  text-align: center;
}

.header-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0;
}

/* Controls Section */
.controls-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.search-container {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-box i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 16px;
}

.search-box input {
  width: 100%;
  padding: 14px 50px 14px 48px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.results-info {
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
}

/* Botões */
.btn {
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 12px;
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-outline-primary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline-primary:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 2px solid #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Grid de Modelos */
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.model-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.model-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.model-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.model-color {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.model-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.model-content {
  flex: 1;
  margin-bottom: 20px;
}

.model-description {
  color: #6c757d;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  min-height: 42px;
}

.model-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.text-muted {
  color: #6c757d;
  font-size: 12px;
}

.text-muted i {
  margin-right: 4px;
}

.model-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.model-actions .btn {
  flex: 1;
  justify-content: center;
}

/* Estados especiais */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-state i {
  font-size: 64px;
  color: #dee2e6;
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 12px;
}

.empty-state p {
  color: #6c757d;
  font-size: 16px;
  margin-bottom: 24px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.loading-state i {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 16px;
}

.loading-state p {
  color: #6c757d;
  font-size: 16px;
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.color-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-input {
  width: 60px !important;
  height: 44px;
  padding: 4px;
  cursor: pointer;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  border-radius: 0 0 16px 16px;
}

/* Modal grande para criação completa */
.large-modal {
  max-width: 900px;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

/* Navegação por abas */
.tabs-nav {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 24px;
  gap: 4px;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: none;
  color: #6c757d;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.tab-btn.active {
  color: #667eea;
  background-color: white;
  border-bottom: 2px solid #667eea;
  margin-bottom: -2px;
}

/* Conteúdo das abas */
.tab-content {
  min-height: 400px;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Seções dentro das abas */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h5 {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

/* Estado vazio das seções */
.empty-section {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-section i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-section p {
  margin-bottom: 20px;
  font-size: 16px;
}

/* Lista de itens */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 12px;
  background: white;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
}

.item-info {
  flex: 1;
}

.item-info h6 {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-weight: 600;
}

.item-info p {
  margin: 0 0 8px 0;
  color: #6c757d;
  font-size: 14px;
}

.item-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-price {
  font-weight: 600;
  color: #28a745;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #e9ecef;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #495057;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.qty-btn:hover {
  background: #1976d2;
  color: white;
  transform: translateY(-1px);
}

.qty-display {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: #495057;
}

.btn-delete {
  width: 36px;
  height: 36px;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.btn-delete:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
}

.item-actions {
  display: flex;
  gap: 8px;
}

/* Badges */
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-info {
  background-color: #d1ecf1;
  color: #0c5460;
}

.badge-warning {
  background-color: #fff3cd;
  color: #856404;
}

.badge-success {
  background-color: #d4edda;
  color: #155724;
}

/* Estatísticas do modelo */
.model-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.stat-item i {
  font-size: 10px;
}

/* Formulários */
.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group.col-md-4 {
  flex: 0 0 calc(33.333% - 11px);
}

.form-group.col-md-6 {
  flex: 0 0 calc(50% - 8px);
}

.form-group.col-md-8 {
  flex: 0 0 calc(66.667% - 11px);
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25);
}

.color-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 50px;
  height: 38px;
  padding: 2px;
  border-radius: 6px;
}

/* Estilos para seleção de itens */
.search-section {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-section {
  display: flex;
  gap: 12px;
  min-width: 400px;
}

.filter-section select {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-width: 150px;
}

.items-selection-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.item-selection-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.item-selection-card:hover {
  background-color: #f8f9fa;
}

.item-selection-card:last-child {
  border-bottom: none;
}

.item-info h6 {
  margin: 0 0 4px 0;
  font-weight: 600;
  color: #333;
}

.item-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.item-details {
  display: flex;
  gap: 12px;
  align-items: center;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-info {
  background-color: #e3f2fd;
  color: #1976d2;
}

.badge-success {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.item-price {
  font-weight: 600;
  color: #2e7d32;
}

.item-unit {
  color: #666;
  font-size: 12px;
}

.category-badge {
  background-color: #f8f9fa;
  color: #495057;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #dee2e6;
}

.item-select-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-state i, .empty-state i {
  font-size: 24px;
  margin-bottom: 12px;
  display: block;
}

/* Contador de itens selecionados */
.selected-items-counter {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-items-counter i {
  color: #2196f3;
}

.selected-items-counter span {
  font-weight: 500;
  color: #1976d2;
}

.btn-clear-selection {
  background: none;
  border: none;
  color: #f44336;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: auto;
  transition: background-color 0.2s;
}

.btn-clear-selection:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

/* Item selecionado */
.item-selection-card.selected {
  border-color: #4caf50;
  background-color: #f1f8e9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.item-selection-card.selected .item-select-btn {
  background-color: #4caf50;
  color: white;
}

.text-success {
  color: #4caf50 !important;
}

.modal-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-footer .btn-primary {
  background-color: #2196f3;
  border-color: #2196f3;
}

.modal-footer .btn-primary:hover:not(:disabled) {
  background-color: #1976d2;
  border-color: #1976d2;
}

/* Responsividade */
@media (max-width: 768px) {
  .search-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-section {
    flex-direction: column;
    min-width: auto;
  }
  
  .filter-section select {
    width: 100%;
  }
  
  .item-selection-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .item-select-btn {
    align-self: flex-end;
  }
  
  .selected-items-counter {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .btn-clear-selection {
    margin-left: 0;
    align-self: flex-end;
  }
}

@media (max-width: 768px) {
  .modelos-container {
    padding: 16px;
  }
  
  .header-section h1 {
    font-size: 2rem;
  }
  
  .search-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .models-grid {
    grid-template-columns: 1fr;
  }
  
  .model-actions {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-group.col-md-4,
  .form-group.col-md-6,
  .form-group.col-md-8 {
    flex: none;
  }
  
  .tabs-nav {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .large-modal {
    width: 95vw;
    max-height: 95vh;
  }
  
  .item-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .item-actions {
    align-self: flex-end;
  }
  
  .model-stats {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-section h1 {
    font-size: 1.75rem;
  }
  
  .controls-section {
    padding: 16px;
  }
  
  .model-card {
    padding: 20px;
  }
}
</style>
