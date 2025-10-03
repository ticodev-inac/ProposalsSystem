<template>
  <div class="propostas-page">
    <div class="propostas-header">
      <div class="header-content">
        <h1>Propostas Feitas</h1>
        <p class="page-subtitle">Gerencie suas propostas comerciais</p>
        <p class="page-status">Estado: editando</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i>
        Nova Proposta
      </button>
    </div>
    
    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          placeholder="Buscar propostas por número, cliente, nome, status..." 
          v-model="searchTerm"
          @input="filterProposals"
        >
        <button 
          class="clear-search-btn" 
          @click="clearSearch" 
          v-if="searchTerm"
          title="Limpar busca"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="search-results-count" v-if="searchTerm">
        {{ filteredProposals.length }} resultado(s) encontrado(s)
      </div>
    </div>
    
    <!-- Cards de Propostas -->
    <div class="proposals-grid" v-if="filteredProposals.length > 0">
      <div 
        v-for="proposal in filteredProposals" 
        :key="proposal.id" 
        class="proposal-card"
        @click="openEditModal(proposal)"
      >
        <!-- Cabeçalho do Card (Novo layout) -->
        <div class="card-top">
          <h3 class="event-title">
            {{ proposal.title || '—' }}
            <button class="inline-icon-btn" @click.stop="editProposal(proposal)" title="Editar título">
              <i class="fas fa-pen"></i>
            </button>
          </h3>
          <div class="top-right">
            <div class="proposal-number-inline" @click.stop="editProposal(proposal)" title="Editar proposta">
              <span class="prefix">Nº</span>
              <span class="number">{{ proposal.proposal_number || proposal.id }}</span>
              <i class="fas fa-pen small"></i>
            </div>
            <div class="status-dropdown-container" @click.stop>
              <select 
                :value="normalizeStatus(proposal.status || 'draft')" 
                @change="updateProposalStatus(proposal.id, $event.target.value)"
                class="status-dropdown"
                title="Status"
              >
                <option value="draft">Rascunho</option>
                <option value="open">Aberto</option>
                <option value="negotiation">Em Negociação</option>
                <option value="closed">Fechado</option>
                <option value="lost">Perdemos</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="proposal-info">
          <!-- Cliente -->
          <h3 class="client-name">
            <i class="fas fa-building"></i>
            {{ proposal.client_name || 'Cliente não informado' }}
          </h3>

          <!-- Lista de detalhes -->
          <div class="event-details">
            <div class="detail-item">
              <i class="fas fa-calendar-plus"></i>
              <span>Criada em {{ formatDate(proposal.created_at) }}</span>
            </div>

            <div class="detail-item" v-if="proposal.participants_count">
              <i class="fas fa-users"></i>
              <span>{{ proposal.participants_count }} participantes</span>
            </div>

            <div class="detail-item" v-if="proposal.start_date && proposal.end_date">
              <i class="fas fa-clock"></i>
              <span>{{ formatDateRange(proposal.start_date, proposal.end_date) }}</span>
            </div>
            <div class="detail-item" v-else-if="proposal.start_date">
              <i class="fas fa-clock"></i>
              <span>{{ formatDate(proposal.start_date) }}</span>
            </div>

            <div class="detail-item" v-if="proposal.location">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ proposal.location }}</span>
            </div>

            <div class="detail-item" v-if="proposal.event_type">
              <i class="fas fa-briefcase"></i>
              <span>{{ proposal.event_type }}</span>
            </div>
          </div>

          <!-- Valor Total -->
          <div class="proposal-value-section" v-if="proposal.total_amount || proposal.total_geral">
            <div class="value-amount">{{ formatCurrency(proposal.total_amount || proposal.total_geral) }}</div>
            <div class="value-updated" v-if="proposal.updated_at">
              Atualizada em {{ formatDate(proposal.updated_at) }}
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="proposal-actions">
          <button 
            @click.stop="editProposal(proposal)" 
            class="action-btn edit-btn"
            title="Editar proposta"
          >
            <i class="icon-edit"></i>
            <span>Editar</span>
          </button>
          <button 
            @click.stop="exportToPDF(proposal)" 
            class="action-btn pdf-btn"
            :class="{ 'generating': isGenerating }"
            :disabled="isGenerating"
            :title="isGenerating ? 'Gerando PDF...' : 'Exportar PDF'"
          >
            <i v-if="!isGenerating" class="icon-pdf"></i>
            <i v-else class="fas fa-spinner fa-spin"></i>
            <span>{{ isGenerating ? 'Gerando...' : 'PDF' }}</span>
          </button>
          <button 
            @click.stop="copyProposalLink(proposal)" 
            class="action-btn link-btn"
            title="Copiar link"
          >
            <i class="icon-link"></i>
            <span>Link</span>
          </button>
          <button 
            @click.stop="deleteProposal(proposal.id)" 
            class="action-btn delete-btn"
            title="Excluir proposta"
          >
            <i class="icon-trash"></i>
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <i class="fas fa-file-contract"></i>
      <h3>Nenhuma proposta encontrada</h3>
      <p>Crie sua primeira proposta clicando no botão "Nova Proposta"</p>
    </div>

    <!-- Modal para adicionar/editar Item -->
    <div v-if="showItemModal" class="modal-overlay item-modal-overlay" @click.self="onOverlayClick">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h5>{{ editingItemIndex !== null ? 'Editar Item' : 'Selecionar Itens' }}</h5>
          <button @click="closeItemModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Contador de itens selecionados -->
          <div v-if="selectedItems.length > 0" class="selected-items-counter">
            <i class="fas fa-check-circle"></i>
            <span>{{ selectedItems.length }} item(s) selecionado(s)</span>
            <button @click="clearSelectedItems" class="btn-clear-selection">
              <i class="fas fa-times"></i> Limpar seleção
            </button>
          </div>

          <!-- Busca e filtros -->
          <div class="search-section">
            <div class="search-box">
              <i class="fas fa-search"></i>
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
                <i :class="isItemSelected(item) ? 'fas fa-check-circle text-success' : 'fas fa-plus'"></i>
              </div>
            </div>
          </div>

          <!-- Estado vazio -->
          <div v-else-if="!loadingItems" class="empty-state">
            <i class="fas fa-search"></i>
            <p>{{ availableItems.length === 0 ? 'Carregando itens...' : (itemSearchTerm || selectedItemType || selectedItemCategory ? 'Nenhum item encontrado com os filtros aplicados' : 'Todos os itens disponíveis estão listados acima') }}</p>
          </div>

          <!-- Loading -->
          <div v-if="loadingItems" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
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
            <i class="fas fa-save"></i>
            Salvar ({{ selectedItems.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para adicionar/editar Insumo -->
    <div v-if="showSupplyModal" class="modal-overlay supply-modal-overlay" @click.self="onOverlayClick">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h5>{{ editingSupplyIndex !== null ? 'Editar Insumo' : 'Selecionar Insumos' }}</h5>
          <button @click="closeSupplyModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Contador de insumos selecionados -->
          <div v-if="selectedSupplies.length > 0" class="selected-items-counter">
            <i class="fas fa-check-circle"></i>
            <span>{{ selectedSupplies.length }} insumo(s) selecionado(s)</span>
            <button @click="clearSelectedSupplies" class="btn-clear-selection">
              <i class="fas fa-times"></i> Limpar seleção
            </button>
          </div>

          <!-- Busca e filtros -->
          <div class="search-section">
            <div class="search-box">
              <i class="fas fa-search"></i>
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
                @change="onSupplyTypeChange"
              >
                <option value="">Todos os tipos</option>
                <option 
                  v-for="type in availableSupplyTypes" 
                  :key="type.name" 
                  :value="type.name"
                >
                  {{ type.description || type.name }}
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
            <h6>{{ supply.name || 'Nome não informado' }}</h6>
            <p v-if="supply.description">{{ supply.description }}</p>
            <div class="item-details">
              <span class="badge badge-warning">
                {{ getSupplyTypeLabel(supply.type) }}
              </span>
              <span class="item-price">{{ formatCurrency(supply.price || 0) }}</span>
              <span v-if="supply.unit" class="item-unit">{{ supply.unit }}</span>
            </div>
          </div>
          <div class="item-select-btn">
            <i :class="isSupplySelected(supply) ? 'fas fa-check-circle text-success' : 'fas fa-plus'"></i>
          </div>
        </div>
      </div>

      <!-- Estado vazio -->
      <div v-else-if="!loadingSupplies" class="empty-state">
        <i class="fas fa-search"></i>
        <p>
          {{ availableSupplies.length === 0 
            ? 'Nenhum insumo disponível' 
            : (supplySearchTerm || selectedSupplyType 
              ? 'Nenhum insumo encontrado com os filtros aplicados' 
              : 'Todos os insumos disponíveis estão listados acima') 
          }}
        </p>
      </div>

          <!-- Loading -->
          <div v-if="loadingSupplies" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
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
            <i class="fas fa-save"></i>
            Salvar ({{ selectedSupplies.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para adicionar/editar Opcional -->
    <div v-if="showOptionalModal" class="modal-overlay optional-modal-overlay" @click.self="onOverlayClick">
      <div class="modal-content large-modal expanded-modal" @click.stop>
        <div class="modal-header">
          <h5>{{ editingOptionalIndex !== null ? 'Editar Opcional' : 'Selecionar Opcionais' }}</h5>
          <button @click="closeOptionalModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Contador de opcionais selecionados -->
          <div v-if="selectedOptionals.length > 0" class="selected-items-counter">
            <i class="fas fa-check-circle"></i>
            <span>{{ selectedOptionals.length }} opcional(is) selecionado(s)</span>
            <button @click="clearSelectedOptionals" class="btn-clear-selection">
              <i class="fas fa-times"></i> Limpar seleção
            </button>
          </div>

          <!-- Busca e filtros -->
          <div class="search-section">
            <div class="search-box">
              <i class="fas fa-search"></i>
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
                <i :class="isOptionalSelected(optional) ? 'fas fa-check-circle text-success' : 'fas fa-plus'"></i>
              </div>
            </div>
          </div>

          <!-- Estado vazio -->
          <div v-else-if="!loadingOptionals" class="empty-state">
            <i class="fas fa-search"></i>
            <p>{{ availableOptionals.length === 0 ? 'Carregando opcionais...' : (optionalSearchTerm || selectedOptionalType || selectedOptionalCategory ? 'Nenhum opcional encontrado com os filtros aplicados' : 'Todos os opcionais disponíveis estão listados acima') }}</p>
          </div>

          <!-- Loading -->
          <div v-if="loadingOptionals" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
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
            <i class="fas fa-save"></i>
            Salvar ({{ selectedOptionals.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Criação/Edição de Proposta -->
    <div v-if="showModal" class="modal-overlay" @click.self="onOverlayClick">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar Proposta' : 'Criar Nova Proposta' }}</h2>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Navegação por Abas -->
        <div class="modal-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
          >
            <i :class="tab.icon"></i>
            {{ tab.label }}
          </button>
        </div>

        <div class="modal-content">
          <!-- Aba: Dados Básicos -->
          <div v-if="activeTab === 'basic'" class="tab-pane">
            <div class="form-section">
              <h5>Informações Básicas</h5>
              
              <div class="form-group">
                <label for="client">Cliente *</label>
                <div class="client-dropdown-container">
                  <div class="client-dropdown">
                    <input 
                      type="text" 
                      id="client" 
                      v-model="form.client_name" 
                      required 
                      readonly 
                      placeholder="Selecione um cliente"
                      @click="toggleClientDropdown"
                    >
                    <button type="button" class="dropdown-arrow" @click="toggleClientDropdown">
                      <i class="fas fa-chevron-down"></i>
                    </button>
                  </div>
                  <div v-if="showClientDropdown" class="client-dropdown-menu">
                    <div class="client-search">
                      <i class="fas fa-search"></i>
                      <input 
                        type="text" 
                        placeholder="Buscar cliente..." 
                        v-model="clientSearch"
                        @input="filterClients"
                      >
                    </div>
                    <div class="client-options">
                      <div 
                        v-for="client in filteredClients" 
                        :key="client.id" 
                        class="client-option"
                        @click="selectClient(client)"
                      >
                        <strong>{{ client.company_name }}</strong>
                        <span v-if="client.email">{{ client.email }}</span>
                      </div>
                      <div v-if="filteredClients.length === 0" class="no-clients">
                        Nenhum cliente encontrado
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contato do Cliente (somente para esta proposta) -->
<div class="form-row">
  <div class="form-group">
    <label for="requesterName">Nome do Contato</label>
    <input
      id="requesterName"
      type="text"
      v-model="form.requester_name"
      placeholder="Nome do contato"
    >
  </div>

  <div class="form-group">
    <label for="phone">Telefone</label>
    <input
      id="phone"
      type="text"
      v-model="form.phone"
      placeholder="(xx) xxxxx-xxxx"
    >
  </div>
</div>

<div class="form-group">
  <label for="email">E-mail</label>
  <input
    id="email"
    type="email"
    v-model="form.email"
    placeholder="contato@empresa.com"
  >
</div>

              
              <div class="form-group">
                <label for="eventName">Nome do Evento *</label>
                <input type="text" id="eventName" v-model="form.title" required>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="eventType">Tipo de Evento</label>
                  <input type="text" id="eventType" v-model="form.event_type">
                </div>
                <div class="form-group">
                  <label for="participantCount">Quantidade de Participantes</label>
                  <input type="number" id="participantCount" v-model="form.participants_count">
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="startDate">Data de Início</label>
                  <input type="date" id="startDate" v-model="form.start_date">
                </div>
                <div class="form-group">
                  <label for="endDate">Data de Fim</label>
                  <input type="date" id="endDate" v-model="form.end_date">
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="startTime">Horário de Início</label>
                  <input type="time" id="startTime" v-model="form.start_time">
                </div>
                <div class="form-group">
                  <label for="endTime">Horário de Fim</label>
                  <input type="time" id="endTime" v-model="form.end_time">
                </div>
              </div>
              
              <div class="form-group">
                <label for="location">Local</label>
                <input type="text" id="location" v-model="form.location">
              </div>
              
              <div class="form-group">
                <label for="observations">Observações</label>
                <textarea 
                  id="observations" 
                  v-model="form.observations" 
                  rows="4"
                  placeholder="Observações adicionais sobre o evento..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Aba: Itens -->
          <div v-if="activeTab === 'items'" class="tab-pane">
            <div class="section-header">
              <h5>Itens da Proposta</h5>
              <button @click="openItemModal" class="btn btn-sm btn-primary">
                <i class="fas fa-plus"></i>
                Adicionar Item
              </button>
            </div>

            <div v-if="form.items.length === 0" class="empty-section">
              <i class="fas fa-list"></i>
              <p>Nenhum item adicionado ainda</p>
              <button @click="openItemModal" class="btn btn-outline-primary">
                Adicionar Primeiro Item
              </button>
            </div>

            <div v-else class="items-list">
<div 
  v-for="(item, index) in form.items" 
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
        <i class="fas fa-minus"></i>
      </button>

      <!-- quantidade editável -->
      <input
        type="number"
        class="qty-input"
        min="1"
        v-model.number="item.quantity"
        @input="onQtyChange(item)"
      />

      <button @click="incrementItemQuantity(index)" class="qty-btn">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <button @click="removeItem(index)" class="btn-delete">
      <i class="fas fa-trash"></i>
    </button>
  </div>
</div>


            </div>
          </div>

          <!-- Aba: Insumos -->
          <div v-if="activeTab === 'supplies'" class="tab-pane">
            <div class="section-header">
              <h5>Insumos da Proposta</h5>
              <button @click="openSupplyModal" class="btn btn-sm btn-primary">
                <i class="fas fa-plus"></i>
                Adicionar Insumo
              </button>
            </div>

            <div v-if="form.insumos.length === 0" class="empty-section">
              <i class="fas fa-tools"></i>
              <p>Nenhum insumo adicionado ainda</p>
              <button @click="openSupplyModal" class="btn btn-outline-primary">
                Adicionar Primeiro Insumo
              </button>
            </div>

            <div v-else class="items-list">
<div 
  v-for="(insumo, index) in form.insumos" 
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
        <i class="fas fa-minus"></i>
      </button>

      <!-- quantidade editável -->
      <input
        type="number"
        class="qty-input"
        min="1"
        v-model.number="insumo.quantity"
        @input="onQtyChange(insumo)"
      />

      <button @click="incrementSupplyQuantity(index)" class="qty-btn">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <button @click="removeSupply(index)" class="btn-delete">
      <i class="fas fa-trash"></i>
    </button>
  </div>
</div>


            </div>
          </div>

          <!-- Aba: Opcionais -->
          <div v-if="activeTab === 'optionals'" class="tab-pane">
            <div class="section-header">
              <h5>Opcionais da Proposta</h5>
              <button @click="openOptionalModal" class="btn btn-sm btn-primary">
                <i class="fas fa-plus"></i>
                Adicionar Opcional
              </button>
            </div>

            <div v-if="form.opcionais.length === 0" class="empty-section">
              <i class="fas fa-plus-circle"></i>
              <p>Nenhum opcional adicionado ainda</p>
              <button @click="openOptionalModal" class="btn btn-outline-primary">
                Adicionar Primeiro Opcional
              </button>
            </div>

            <div v-else class="items-list">
<div 
  v-for="(opcional, index) in form.opcionais" 
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
        <i class="fas fa-minus"></i>
      </button>

      <!-- quantidade editável -->
      <input
        type="number"
        class="qty-input"
        min="1"
        v-model.number="opcional.quantity"
        @input="onQtyChange(opcional)"
      />

      <button @click="incrementOptionalQuantity(index)" class="qty-btn">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <button @click="removeOptional(index)" class="btn-delete">
      <i class="fas fa-trash"></i>
    </button>
  </div>
</div>


            </div>
          </div>

          <!-- Aba: Total Geral -->
          <div v-if="activeTab === 'total'" class="tab-pane">
            <div class="section-header">
              <h5>Resumo Financeiro</h5>
            </div>

            <div class="totals-section">
              <!-- Controle de Opcionais -->
              <div class="optional-control">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="incluirOpcionais"
                    @change="recalculateTotals"
                  >
                  <span class="checkmark"></span>
                  Incluir opcionais no total
                </label>
                
                <!-- Exibir/ocultar preços no PDF -->
                <label class="checkbox-label" style="margin-top:8px">
                  <input type="checkbox" v-model="form.exibir_precos">
                  <span class="checkmark"></span>
                  Exibir preços (Valor Unit. e Subtotal) no PDF
                </label>
              </div>


              <!-- Resumo por Categoria -->
              <div class="totals-breakdown">
                <div class="breakdown-item" v-if="totals.produtos > 0">
                  <div class="breakdown-info">
                    <span class="breakdown-label">Produtos ({{ counts.produtos }} itens)</span>
                    <span class="breakdown-value">{{ formatCurrency(totals.produtos) }}</span>
                  </div>
                </div>

                <div class="breakdown-item" v-if="totals.servicos > 0">
                  <div class="breakdown-info">
                    <span class="breakdown-label">Serviços ({{ counts.servicos }} itens)</span>
                    <span class="breakdown-value">{{ formatCurrency(totals.servicos) }}</span>
                  </div>
                </div>

                <div class="breakdown-item" v-if="totals.insumos > 0">
                  <div class="breakdown-info">
                    <span class="breakdown-label">Insumos ({{ counts.insumos }} itens)</span>
                    <span class="breakdown-value">{{ formatCurrency(totals.insumos) }}</span>
                  </div>
                </div>

                <div class="breakdown-item" v-if="totals.opcionais > 0">
                  <div class="breakdown-info">
                    <span class="breakdown-label">
                      Opcionais ({{ counts.opcionais }} itens)
                      <span v-if="!incluirOpcionais" class="excluded-note">- não incluído</span>
                    </span>
                    <span class="breakdown-value" :class="{ 'excluded': !incluirOpcionais }">
                      {{ formatCurrency(totals.opcionais) }}
                    </span>
                  </div>
                </div>

                <div class="breakdown-separator"></div>

                <div class="breakdown-item subtotal">
                  <div class="breakdown-info">
                    <span class="breakdown-label">Subtotal:</span>
                    <span class="breakdown-value">{{ formatCurrency(subtotal) }}</span>
                  </div>
                </div>

                <!-- Desconto -->
                <div class="breakdown-item">
                  <div class="breakdown-info">
                    <div class="input-with-label">
                      <label>Desconto (%):</label>
                      <input 
                        type="number" 
                        v-model="discount" 
                        min="0" 
                        max="100" 
                        step="0.01"
                        @input="recalculateTotals"
                        class="form-control small-input"
                      >
                    </div>
                    <span class="breakdown-value negative" v-if="discountAmount > 0">
                      -{{ formatCurrency(discountAmount) }}
                    </span>
                  </div>
                </div>

                <!-- Taxa -->
                <div class="breakdown-item">
                  <div class="breakdown-info">
                    <div class="input-with-label">
                      <label>Taxa (%):</label>
                      <input 
                        type="number" 
                        v-model="taxRate" 
                        min="0" 
                        step="0.01"
                        @input="recalculateTotals"
                        class="form-control small-input"
                      >
                    </div>
                    <span class="breakdown-value positive" v-if="taxAmount > 0">
                      +{{ formatCurrency(taxAmount) }}
                    </span>
                  </div>
                </div>

                <div class="breakdown-separator"></div>

                <div class="breakdown-item total">
                  <div class="breakdown-info">
                    <span class="breakdown-label">TOTAL GERAL:</span>
                    <span class="breakdown-value">{{ formatCurrency(totalGeral) }}</span>
                  </div>
                </div>
              </div>

              <!-- Observações -->
              <div class="form-group">
                <label for="totalObservations">Observações sobre o Total</label>
                <textarea 
                  id="totalObservations" 
                  v-model="totalObservations" 
                  rows="3"
                  placeholder="Observações adicionais sobre valores, descontos, etc..."
                  class="form-control"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Aba: Condições Gerais -->
          <div v-if="activeTab === 'conditions'" class="tab-pane">
            <div class="section-header">
              <h5>Condições Gerais</h5>
            </div>

            <div v-if="condicoesGerais" class="conditions-content">
              <div class="config-section">
                <div class="config-item" v-if="condicoesGerais.prazoValidadeProposta">
                  <label>Prazo de Validade da Proposta:</label>
                  <div class="config-value">{{ condicoesGerais.prazoValidadeProposta }}</div>
                </div>
                
                <div class="config-item" v-if="condicoesGerais.prazoEntregaExecucao">
                  <label>Prazo de Entrega/Execução:</label>
                  <div class="config-value">{{ condicoesGerais.prazoEntregaExecucao }}</div>
                </div>
                
                <div class="config-item" v-if="condicoesGerais.garantia">
                  <label>Garantia:</label>
                  <div class="config-value">{{ condicoesGerais.garantia }}</div>
                </div>
                
                <div class="config-item" v-if="condicoesGerais.condicoesEspeciais">
                  <label>Condições Especiais:</label>
                  <div class="config-value text-content">{{ condicoesGerais.condicoesEspeciais }}</div>
                </div>
              </div>
            </div>

            <div v-else class="empty-section">
              <i class="fas fa-file-contract"></i>
              <p>Nenhuma condição configurada</p>
              <p class="help-text">Configure as condições gerais na tela de <strong>Configurações Fixas</strong></p>
            </div>
          </div>

          <!-- Aba: Política Contratação -->
          <div v-if="activeTab === 'policies'" class="tab-pane">
            <div class="section-header">
              <h5>Política de Contratação</h5>
            </div>

            <div v-if="politicas && politicas.length > 0" class="policies-content">
              <div v-for="(politica, index) in politicas" :key="politica.id || index" class="policy-section">
                <div class="policy-header">
                  <h6>{{ politica.titulo }}</h6>
                </div>
                <div class="policy-content">
                  <p>{{ politica.conteudo }}</p>
                </div>
              </div>
            </div>

            <div v-else class="empty-section">
              <i class="fas fa-handshake"></i>
              <p>Nenhuma política configurada</p>
              <p class="help-text">Configure as políticas de contratação na tela de <strong>Configurações Fixas</strong></p>
            </div>
          </div>

          <!-- Aba: Dados Fornecedor -->
          <div v-if="activeTab === 'supplier'" class="tab-pane">
            <div class="section-header">
              <h5>Seleção do Fornecedor</h5>
            </div>

            <div class="supplier-selection">
              <div class="form-group">
                <label for="supplierSelect">Selecione o Fornecedor *</label>
<select
  id="supplierSelect"
  v-model="form.supplier_id"
  @change="onSupplierChange"
  class="form-control"
  required
>
  <option :value="null">Selecione um fornecedor</option>
  <option v-for="s in suppliers" :key="s.id" :value="s.id">
    {{ formatSupplierLabel(s) }}
  </option>
</select>



              </div>

              <div v-if="selectedSupplier" class="supplier-details">
                <div class="supplier-card">
                  <div class="supplier-header">
                    <h6>{{ selectedSupplier.company_name }}</h6>
                    <span class="supplier-cnpj">{{ formatCNPJ(selectedSupplier.cnpj) }}</span>
                  </div>
                  
                  <div class="supplier-info">
                    <div class="info-row" v-if="selectedSupplier.address">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>{{ selectedSupplier.address }}</span>
                    </div>
                    
                    <div class="info-row" v-if="selectedSupplier.phone">
                      <i class="fas fa-phone"></i>
                      <span>{{ formatPhone(selectedSupplier.phone) }}</span>
                    </div>
                    
                    <div class="info-row" v-if="selectedSupplier.email">
                      <i class="fas fa-envelope"></i>
                      <span>{{ selectedSupplier.email }}</span>
                    </div>
                    
                    <div class="info-row" v-if="selectedSupplier.contact_person">
                      <i class="fas fa-user"></i>
                      <span>{{ selectedSupplier.contact_person }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="!selectedSupplier" class="supplier-help">
                <i class="fas fa-info-circle"></i>
                <p>Selecione um fornecedor para finalizar a proposta. Esta será a última etapa do processo.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancelar</button>
          <button @click="saveProposal" class="btn btn-primary" :disabled="!form.client_name || !form.title || saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            {{ isEditing ? 'Salvar Alterações' : 'Criar Proposta' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useDatabaseStore } from '@/stores/database'
import TempProposalService from '@/services/TempProposalService'
import SuppliesService from '@/services/SuppliesService'
import SupplyTypesService from '@/services/SupplyTypesService'
import { usePDFGenerator } from '@/composables/usePDFGenerator'
import ProposalsService from '@/services/ProposalsService'
import TemplatesService from '@/services/TemplatesService'


export default {
  name: 'PropostasView',

  setup() {
    const proposals = ref([])
    const filteredProposals = ref([])
    const searchTerm = ref('')
    const loading = ref(false)
    const saving = ref(false)

    const route = useRoute()
    const database = useDatabaseStore()
    const { generateAndDownloadPDF, isGenerating, generationError, clearError } = usePDFGenerator()
    
    // Verificar se está usando um modelo
    const templateId = route.query.useTemplate
    
    // Fallback para company_id quando o cliente não tiver esse campo
    const getCompanyIdFallback = () =>
      localStorage.getItem('company_id') || import.meta.env.VITE_DEFAULT_COMPANY_ID || null
    
    // Modal state
    const showModal = ref(false)
    const isEditing = ref(false)
    const currentProposal = ref(null)
    
    // Client dropdown
    const showClientDropdown = ref(false)
    const clients = ref([])
    const filteredClients = ref([])
    const clientSearch = ref('')
    
    // Modal tabs
    const activeTab = ref('basic')
    const tabs = ref([
      { id: 'basic', label: 'Dados Básicos', icon: 'fas fa-info-circle' },
      { id: 'items', label: 'Itens', icon: 'fas fa-list' },
      { id: 'supplies', label: 'Insumos', icon: 'fas fa-tools' },
      { id: 'optionals', label: 'Opcionais', icon: 'fas fa-plus-circle' },
      { id: 'total', label: 'Total Geral', icon: 'fas fa-calculator' },
      { id: 'conditions', label: 'Condições Gerais', icon: 'fas fa-file-contract' },
      { id: 'policies', label: 'Política Contratação', icon: 'fas fa-handshake' },
      { id: 'supplier', label: 'Dados Fornecedor', icon: 'fas fa-building' }
    ])
    
    // Dados para Total Geral
    const incluirOpcionais = ref(true)
    const discount = ref(0)
    const taxRate = ref(0)
    const totalObservations = ref('')
    const totals = ref({
      produtos: 0,
      servicos: 0,
      insumos: 0,
      opcionais: 0
    })
    const counts = ref({
      produtos: 0,
      servicos: 0,
      insumos: 0,
      opcionais: 0
    })

    // Dados para Condições Gerais e Políticas
    const condicoesGerais = ref(null)
    const politicas = ref([])

    // Dados para Fornecedor
    const suppliers = ref([])
    
    // Form data
    const form = ref({
      client_id: null,
      company_id: null,
      client_name: '',
      proposal_number: '',
      title: '',
      description: '',
      observations: '',
      event_type: '',
      participants_count: null,
      location: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      contractor_name: '',
      requester_name: '',
      phone: '',
      email: '',
      status: 'draft',
      status_detalhado: '',
      total_amount: 0,
      total_geral: 0,
      items: [],
      insumos: [],
      opcionais: [],
      exibir_precos: true // NEW
    })


// impede salvar enquanto estamos carregando/mesclando dados
let initializing = false;

    // Computed para totais
    const subtotal = computed(() => {
      let base = totals.value.produtos + totals.value.servicos + totals.value.insumos
      if (incluirOpcionais.value) {
        base += totals.value.opcionais
      }
      return base
    })

    const discountAmount = computed(() => {
      return subtotal.value * (discount.value / 100)
    })

    const taxAmount = computed(() => {
      return (subtotal.value - discountAmount.value) * (taxRate.value / 100)
    })

    const totalGeral = computed(() => {
      return subtotal.value - discountAmount.value + taxAmount.value
    })

    const resetForm = () => {
      form.value = {
        client_id: null,
        company_id: null,
        client_name: '',
        proposal_number: '',
        title: '',
        description: '',
        observations: '',
        event_type: '',
        participants_count: null,
        location: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        contractor_name: '',
        requester_name: '',
        phone: '',
        email: '',
        status: 'draft',
        status_detalhado: '',
        total_amount: 0,
        total_geral: 0,
        items: [],
        insumos: [],
        opcionais: [],
        exibir_precos: true // NEW
      }
      activeTab.value = 'basic'
    }

    const loadProposals = async () => {
  try {
    loading.value = true

    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        client:clients!proposals_client_id_fkey ( id, company_name, email )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data || []).map(p => ({
      ...p,
      client_name: p.client?.company_name ?? 'Cliente não informado'
    }))

    proposals.value = rows
    filteredProposals.value = rows
  } catch (e) {
    console.error('Erro ao carregar propostas:', e)
  } finally {
    loading.value = false
  }
}


    const loadClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('company_name')
        
        if (error) throw error
        
        clients.value = data || []
        filteredClients.value = data || []
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      }
    }

    const filterProposals = () => {
      if (!searchTerm.value) {
        filteredProposals.value = proposals.value
        return
      }
      const term = searchTerm.value.toLowerCase()
      filteredProposals.value = proposals.value.filter(p => 
        p.title?.toLowerCase().includes(term) ||
        p.proposal_number?.toString().includes(term)
      )
    }

    const filterClients = () => {
      if (!clientSearch.value) {
        filteredClients.value = clients.value
        return
      }
      
      const term = clientSearch.value.toLowerCase()
      filteredClients.value = clients.value.filter(client => 
        client.company_name?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term)
      )
    }

    const clearSearch = () => {
      searchTerm.value = ''
      filteredProposals.value = proposals.value
    }

    // Métodos para Total Geral
    const recalculateTotals = () => {
      // Recalcular totais baseado nos itens, insumos e opcionais
      const items = form.value.items || []
      const supplies = form.value.insumos || []
      const optionals = form.value.opcionais || []

      // Produtos e Serviços
      const produtos = items.filter(i => (i.categoria || '').toLowerCase() === 'produto')
      const servicos = items.filter(i => (i.categoria || '').toLowerCase() === 'servico')

      totals.value.produtos = produtos.reduce((sum, it) => sum + (Number(it.valor_unitario || 0) * Number(it.quantity || 1)), 0)
      counts.value.produtos = produtos.length

      totals.value.servicos = servicos.reduce((sum, it) => sum + (Number(it.valor_unitario || 0) * Number(it.quantity || 1)), 0)
      counts.value.servicos = servicos.length

      // Insumos
      totals.value.insumos = supplies.reduce((sum, it) => sum + (Number(it.valor_unitario || it.price || 0) * Number(it.quantity || 1)), 0)
      counts.value.insumos = supplies.length

      // Opcionais
      totals.value.opcionais = optionals.reduce((sum, it) => sum + (Number(it.valor_unitario || it.price || 0) * Number(it.quantity || 1)), 0)
      counts.value.opcionais = optionals.length

      // Atualizar total no form
      form.value.total_geral = totalGeral.value
    }

    // Métodos para Condições e Políticas
    const loadCondicoesGerais = async () => {
      try {
        const { FixoService } = await import('@/services/fixoService')
        const data = await FixoService.getCondicoesGerais()
        
        if (data) {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data
          condicoesGerais.value = parsedData
        }
      } catch (error) {
        console.error('Erro ao carregar condições gerais:', error)
      }
    }

    const loadPoliticas = async () => {
      try {
        const { FixoService } = await import('@/services/fixoService')
        const data = await FixoService.getPoliticaContratacao()
        
        if (data) {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data
          politicas.value = Array.isArray(parsedData) ? parsedData : []
        }
      } catch (error) {
        console.error('Erro ao carregar políticas:', error)
      }
    }

    const normalizeId = (v) => (v === undefined || v === null || v === '') ? null : String(v);

function resetSupplierState() {
  form.value.supplier_id = null;
  suppliers.value = [];
}

const loadSuppliers = async () => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, company_name, cnpj, email, phone, address, contact_name')
      .order('company_name');

    if (error) throw error;

    // mantenha id como string para casar com o v-model
    suppliers.value = (data || []).map(s => ({ ...s, id: String(s.id) }));
  } catch (err) {
    console.error('Erro ao carregar fornecedores:', err);
    suppliers.value = [];
  }
};

const selectedSupplier = computed(() => {
  const id = form.value.supplier_id;
  if (!id) return null;
  return suppliers.value.find(s => String(s.id) === String(id)) || null;
});

const onSupplierChange = () => {
  const id = form.value.supplier_id;
  if (!id) return;
  const ok = suppliers.value.some(s => String(s.id) === String(id));
  if (!ok) form.value.supplier_id = null;
};



    const formatCNPJ = (cnpj) => {
      if (!cnpj) return ''
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }

    const formatPhone = (phone) => {
      if (!phone) return ''
      return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
    }

const openCreateModal = async () => {
  allowOverlayClose.value = false
  isEditing.value = false;
  initializing = true;              // <<< NOVO
  resetForm();
  resetSupplierState();
  currentProposal.value = null;

  if (templateId) await loadTemplateData(templateId);

  activeTab.value = 'basic';
  showModal.value = true;

  await Promise.all([
    loadClients(),
    loadCondicoesGerais(),
    loadPoliticas(),
    loadSuppliers(),
  ]);

  initializing = false;            // <<< NOVO
  recalculateTotals();
};



const openEditModal = async (proposal) => {
  allowOverlayClose.value = false
   initializing = true;            // <<< LIGA modo inicialização
   resetForm();
   resetSupplierState();
   isEditing.value = true;

  // busca o registro completo (o objeto do card pode vir sem supplier_id)
  let record = proposal;
  try {
    const full = await ProposalsService.getProposalById(proposal.id);
    if (full) record = full;
  } catch (e) {
    console.warn('Falha ao buscar proposta completa; usando o objeto do card.', e);
  }

  currentProposal.value = record;
  if (record?.id) {
    database.setCurrentProposalId(record.id);
  }

  // ===== mapeamento (igual você já tinha, mas usando `record`) =====
  form.value.client_id          = record.client_id || null;
  form.value.company_id         = record.company_id || null;
  form.value.proposal_number    = record.proposal_number || '';
  form.value.title              = record.title || '';
  form.value.observations       = record.description || '';
  form.value.event_type         = record.event_type || '';
  form.value.participants_count = record.participants_count || null;
  form.value.location           = record.location || '';
  form.value.start_date         = record.start_date || '';
  form.value.end_date           = record.end_date || '';
  form.value.start_time         = record.start_time || '';
  form.value.end_time           = record.end_time || '';
  form.value.contractor_name    = record.contractor_name || '';
  form.value.requester_name     = record.requester_name || '';
  form.value.phone              = record.phone || '';
  form.value.email              = record.email || '';
  form.value.status             = record.status || 'draft';
  form.value.status_detalhado   = record.status_detalhado || '';
  form.value.total_amount       = (record.total_amount ?? 0);
  form.value.total_geral        = (record.total_geral ?? 0);

      // Carregar nome do cliente pelo ID
      if (proposal.client_id) {
        try {
          const { data: clientData, error } = await supabase
            .from('clients')
            .select('company_name')
            .eq('id', proposal.client_id)
            .single()
          
          if (!error && clientData) {
            form.value.client_name = clientData.company_name
          }
        } catch (error) {
          console.error('Erro ao carregar cliente:', error)
          form.value.client_name = ''
        }
      } else {
        form.value.client_name = ''
      }
      
      // Parse seguro dos campos JSON
      try {
        form.value.items = proposal.items ? 
          (typeof proposal.items === 'string' ? JSON.parse(proposal.items) : proposal.items) : []
      } catch (e) {
        form.value.items = []
      }
      
      try {
        form.value.insumos = proposal.insumos ? 
          (typeof proposal.insumos === 'string' ? JSON.parse(proposal.insumos) : proposal.insumos) : []
      } catch (e) {
        form.value.insumos = []
      }
      
      try {
        form.value.opcionais = proposal.opcionais ? 
          (typeof proposal.opcionais === 'string' ? JSON.parse(proposal.opcionais) : proposal.opcionais) : []
      } catch (e) {
        form.value.opcionais = []
      }
      
      // Carregar dados de totais
      incluirOpcionais.value = proposal.incluir_opcionais || false
      totalObservations.value = proposal.total_observations || ''
      
      // Carregar condições gerais (pode ser string ou objeto JSON)
      try {
        if (proposal.condicoes_gerais) {
          condicoesGerais.value = typeof proposal.condicoes_gerais === 'string' ? 
            JSON.parse(proposal.condicoes_gerais) : proposal.condicoes_gerais
        } else {
          condicoesGerais.value = null
        }
      } catch (e) {
        console.warn('Erro ao fazer parse das condições gerais:', e)
        condicoesGerais.value = null
      }
      
      // Carregar políticas
      try {
        politicas.value = proposal.politicas ? 
          (typeof proposal.politicas === 'string' ? JSON.parse(proposal.politicas) : proposal.politicas) : []
      } catch (e) {
        politicas.value = []
      }
      
        // ===== fornecedor =====
  form.value.supplier_id = normalizeId(record.supplier_id); // <- garante string/null
  await loadSuppliers();                                     // <- garante options prontos
      loadClients()

      
 form.value.exibir_precos      = (
    record.exibir_precos ??
    record.incluir_v_un_itens ??
    record.incluir_v_un_insumos ??
    record.incluir_v_un_opcionais ??
    true
  );

  activeTab.value = 'basic';
  showModal.value = true;

  initializing = false;                // <<< NOVO
};

const closeModal = () => {
  showModal.value = false;
  allowOverlayClose.value = false
  showClientDropdown.value = false;
  clientSearch.value = '';
  activeTab.value = 'basic';
  resetSupplierState(); // limpa supplier
  resetForm();
};


// se false, clicar fora NÃO fecha; se true, fecha
const allowOverlayClose = ref(false)

const onOverlayClick = () => {
  if (!allowOverlayClose.value) return

  // prioridade: modais de seleção (ficam por cima do modal principal)
  if (showItemModal.value)        return closeItemModal()
  if (showSupplyModal.value)      return closeSupplyModal()
  if (showOptionalModal.value)    return closeOptionalModal()

  // por último, o modal principal da Proposta
  if (showModal.value)            return closeModal()
}


    const toggleClientDropdown = () => {
      showClientDropdown.value = !showClientDropdown.value
      if (showClientDropdown.value) {
        clientSearch.value = ''
        filteredClients.value = clients.value
      }
    }

const selectClient = (client) => {
  form.value.client_id   = client.id
  form.value.company_id  = client.company_id || getCompanyIdFallback()
  form.value.client_name = client.company_name

  // Preenche/atualiza os dados de contato SOMENTE nesta proposta
  form.value.requester_name = client.contact_name || ''
  form.value.email          = client.email || ''
  form.value.phone          = client.phone || ''

  // não altera nada na tabela de clientes
  showClientDropdown.value = false
  clientSearch.value = ''
}


    const loadTemplateData = async (templateId) => {
      try {
        const template = await TemplatesService.getTemplateById(templateId)
        
        if (template) {
          // Pré-preencher formulário com dados do modelo
          form.value = {
            client_id: template.client_id,
            company_id: template.company_id,
            client_name: '', // Será preenchido ao carregar cliente
            proposal_number: '', // Será gerado automaticamente
            title: template.title || '',
            description: template.description || '',
            observations: template.description || '',
            event_type: template.event_type || '',
            participants_count: template.participants_count || null,
            location: template.location || '',
            start_date: template.start_date || '',
            end_date: template.end_date || '',
            start_time: template.start_time || '',
            end_time: template.end_time || '',
            contractor_name: template.contractor_name || '',
            requester_name: template.requester_name || '',
            phone: template.phone || '',
            email: template.email || '',
            status: 'draft',
            status_detalhado: template.status_detalhado || '',
            total_amount: template.total_amount || 0,
            total_geral: template.total_geral || 0,
            items: template.items || [],
            insumos: template.insumos || [],
            opcionais: template.opcionais || []
          }

          // Armazenar dados do modelo para uso posterior
          database.setTemplateData(template)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do modelo:', error)
        alert('Erro ao carregar modelo')
      }
    }

// ===== Payload completo para INSERT/UPDATE =====
const buildDbPayload = async () => {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  return {
    client_id:            form.value.client_id,
    company_id:           form.value.company_id ?? getCompanyIdFallback(),
    title:                form.value.title,
    description:          form.value.observations || '',
    status:               form.value.status,
    status_detalhado:     form.value.status_detalhado || null,
    total_amount:         form.value.total_amount,
    total_geral:          form.value.total_geral,
    event_type:           form.value.event_type,
    participants_count:   form.value.participants_count,
    start_date:           form.value.start_date || null,
    end_date:             form.value.end_date || null,
    start_time:           form.value.start_time || null,
    end_time:             form.value.end_time || null,
    location:             form.value.location,
    contractor_name:      form.value.contractor_name,
    requester_name:       form.value.requester_name,
    phone:                form.value.phone,
    email:                form.value.email,

    // ✅ FORNECEDOR — usar SOMENTE o que está no form
    supplier_id:          normalizeId(form.value.supplier_id),

    // Campos JSON (jsonb na tabela) – ok enviar string JSON
    items:                JSON.stringify(form.value.items || []),
    insumos:              JSON.stringify(form.value.insumos || []),
    opcionais:            JSON.stringify(form.value.opcionais || []),
    opcional_nao_inclusos: JSON.stringify([]),
    dados_fornecedor:     JSON.stringify({}),
    politicas:            JSON.stringify(politicas.value || []),

    // Campo text (não JSON)
    condicoes_gerais:     condicoesGerais.value || '',

    incluir_opcionais:    incluirOpcionais.value,
    total_observations:   totalObservations.value || '',
    observations:         form.value.observations || '',

    // flags de exibição (principal + compat legada)
    exibir_precos:        !!form.value.exibir_precos,
    incluir_v_un_itens:   !!form.value.exibir_precos,
    incluir_v_un_insumos: !!form.value.exibir_precos,
    incluir_v_un_opcionais: !!form.value.exibir_precos,

    updated_at:           new Date().toISOString(),
    user_id:              userId,
  };
};

// Campos permitidos para atualização parcial
const allowedUpdateFields = [
  'client_id',
  'title',
  'description',
  'status',
  'status_detalhado',
  'event_type',
  'participants_count',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'location',
  'contractor_name',
  'requester_name',
  'phone',
  'email',
  'incluir_opcionais',
  'exibir_precos',              // principal
  'incluir_v_un_itens',         // compat
  'incluir_v_un_insumos',       // compat
  'incluir_v_un_opcionais',     // compat
  'total_amount',
  'total_geral',
  'items',
  'insumos',
  'opcionais',
  'opcional_nao_inclusos',
  'dados_fornecedor',
  'condicoes_gerais',
  'politicas',
  'supplier_id',                // ✅ garante update
  'total_observations',
  'observations',
];

// Comparação simples e segura (null/undefined/objetos)
const isSame = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Monta um update com somente os campos alterados
const buildPartialUpdate = async () => {
  const next = await buildDbPayload();
  const current = currentProposal.value || {};
  const patch = {};

  for (const key of allowedUpdateFields) {
    if (typeof next[key] !== 'undefined' && !isSame(current[key], next[key])) {
      patch[key] = next[key];
    }
  }

  patch.updated_at = new Date().toISOString();
  return patch;
};

// começa no 1212 (ou altere como quiser)
const PROPOSAL_BASE_NUMBER = 1212;

// próxima numeração GLOBAL
const getNextProposalNumber = async () => {
  const { data, error } = await supabase
    .from('proposals')
    .select('proposal_number')
    .limit(1000)            // pega um lote; aumente se precisar
    .order('updated_at', { ascending: false }); // só para trazer os mais novos primeiro

  if (error) throw error;

  let max = PROPOSAL_BASE_NUMBER - 1;
  for (const row of (data || [])) {
    const n = parseInt(row.proposal_number, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  // garante que nunca volta abaixo do base
  return String(Math.max(max + 1, PROPOSAL_BASE_NUMBER));
};

    const saveProposal = async () => {
      try {
        saving.value = true

        // Gera número se ainda não existir (numeração por cliente)
        if (!form.value.proposal_number && form.value.client_id) {
          form.value.proposal_number = await getNextProposalNumber(form.value.client_id)
        }

        let proposalId = currentProposal.value?.id || null

        if (isEditing.value && currentProposal.value?.id) {
          // Update parcial
          const patch = await buildPartialUpdate()
          const { data, error } = await supabase
            .from('proposals')
            .update(patch)
            .eq('id', currentProposal.value.id)
            .select()
            .single()
          if (error) throw error

          currentProposal.value = data
          proposalId = data.id
          
          lastSavedAt.value = new Date()

        } else {
          // Criação (rascunho com defaults do formulário)
          const proposalData = await buildDbPayload()
          delete proposalData.proposal_number;
          proposalData.created_at = new Date().toISOString()

          const { data, error } = await supabase
            .from('proposals')
            .insert([proposalData])
            .select()
            .single()
          if (error) throw error

          currentProposal.value = data
          proposalId = data?.id
        
          isEditing.value = true

          
          lastSavedAt.value = new Date()
        }

        await loadProposals()
        closeModal()
        console.log('Proposta salva com sucesso!')
      } catch (error) {
        console.error('Erro ao salvar proposta:', error)
        alert('Erro ao salvar proposta')
      } finally {
        saving.value = false
      }
    }



    // Nova função: Salvar e Sair (sem prosseguir para próxima etapa)
    // Salvar e Sair (sem navegar para a próxima etapa)
    const saveAndExit = async () => {
      try {
        saving.value = true

        if (isEditing.value && currentProposal.value?.id) {
          const patch = await buildPartialUpdate()
          const { data, error } = await supabase
            .from('proposals')
            .update(patch)
            .eq('id', currentProposal.value.id)
            .select()
            .single()
          if (error) throw error

          currentProposal.value = data

          
          lastSavedAt.value = new Date()
        } else {
          // Se ainda não existe, cria como rascunho
          const proposalData = await buildDbPayload()
          proposalData.created_at = new Date().toISOString()
          const { data, error } = await supabase
            .from('proposals')
            .insert([proposalData])
            .select()
            .single()
          if (error) throw error

          currentProposal.value = data
          isEditing.value = true
          if (data?.id) database.setCurrentProposalId(data.id)
          
          lastSavedAt.value = new Date()
        }

        await loadProposals()
        closeModal()
      } catch (error) {
        console.error('Erro ao salvar proposta:', error)
        alert(`Erro ao salvar proposta: ${error.message}`)
      } finally {
        saving.value = false
      }
    }


    const deleteProposal = async (proposalId) => {
      if (!confirm('Tem certeza que deseja excluir esta proposta?')) return
      
      try {
        const { error } = await supabase
          .from('proposals')
          .delete()
          .eq('id', proposalId)
        
        if (error) throw error
        
        await loadProposals()
      } catch (error) {
        console.error('Erro ao excluir proposta:', error)
        alert('Erro ao excluir proposta')
      }
    }

    const normalizeStatus = (status) => {
      const map = {
        draft: 'draft',
        open: 'open',
        negotiation: 'negotiation',
        closed: 'closed',
        lost: 'lost',
        // legados
        sent: 'open',
        approved: 'closed',
        rejected: 'lost',
        canceled: 'lost'
      }
      return map[status] || 'draft'
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString('pt-BR')
    }

    const formatCurrency = (value) => {
      if (!value && value !== 0) return ''
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }

    const formatDateRange = (startDate, endDate) => {
      if (!startDate || !endDate) return ''
      
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      const startFormatted = start.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      
      const endFormatted = end.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      
      if (startFormatted === endFormatted) {
        return startFormatted
      }
      
      return `${startFormatted} à ${endFormatted}`
    }


    const updateProposalStatus = async (proposalId, newStatus) => {
      try {
        // Atualizar no banco
        const { error } = await supabase
          .from('proposals')
          .update({ status: newStatus })
          .eq('id', proposalId)

        if (error) throw error

        // Atualizar localmente
        const proposalIndex = proposals.value.findIndex(p => p.id === proposalId)
        if (proposalIndex !== -1) {
          proposals.value[proposalIndex].status = newStatus
        }

        console.log('Status atualizado com sucesso!')
      } catch (error) {
        console.error('Erro ao atualizar status:', error)
        alert('Erro ao atualizar status da proposta')
      }
    }

    // Função para exportar PDF (implementação real)
    const editProposal = (proposal) => {
      openEditModal(proposal)
    }

    const copyProposalLink = (proposal) => {
      // Implementar cópia de link da proposta
      alert(`Link da proposta ${proposal.proposal_number || proposal.id} copiado!`)
    }

    const exportToPDF = async (proposal) => {
      try {
        clearError()
        
        console.log('🔄 Iniciando exportação de PDF para proposta:', proposal.id)
        
        const result = await generateAndDownloadPDF(proposal.id, {
          theme: 'default',
          includeWatermark: proposal.status === 'draft',
          watermark: proposal.status === 'draft' ? 'RASCUNHO' : null
        })
        
        console.log('✅ PDF exportado com sucesso:', result.filename)
        
      } catch (err) {
        console.error('❌ Erro ao exportar PDF:', err)
        alert(`Erro ao gerar PDF: ${err.message}`)
      }
    }

    // Verificar se está usando um modelo ao montar o componente
    const checkTemplateUsage = () => {
      const tempData = TempProposalService.getTempData()
      const templateInfo = tempData?.templateInfo
      
      if (templateInfo?.isUsingTemplate) {
        // Pré-preencher formulário com dados do modelo
        const basicInfo = tempData.basicInfo || {}
        
        form.value = {
          client_id: basicInfo.client_id || null,
          company_id: basicInfo.company_id || null,
          client_name: '', // Será preenchido ao carregar cliente
          proposal_number: '', // Sempre vazio para nova proposta
          title: basicInfo.title || '',
          description: basicInfo.description || '',
          observations: basicInfo.description || '',
          event_type: basicInfo.event_type || '',
          participants_count: basicInfo.participants_count || null,
          location: basicInfo.location || '',
          start_date: basicInfo.start_date || '',
          end_date: basicInfo.end_date || '',
          start_time: basicInfo.start_time || '',
          end_time: basicInfo.end_time || '',
          contractor_name: basicInfo.contractor_name || '',
          requester_name: basicInfo.requester_name || '',
          phone: basicInfo.phone || '',
          email: basicInfo.email || '',
          status: 'draft',
          status_detalhado: basicInfo.status_detalhado || '',
          total_amount: basicInfo.total_amount || 0,
          total_geral: basicInfo.total_geral || 0,
          items: [],
          insumos: [],
          opcionais: []
        }

        // Abrir modal automaticamente
        activeTab.value = 'basic'
        showModal.value = true
        isEditing.value = false
        
        // Limpar informação do modelo após uso
        TempProposalService.updateSection('templateInfo', {
          isUsingTemplate: false,
          templateId: null,
          templateName: null
        })
      }
    }

    onMounted(async () => {
      await loadProposals()
      await loadClients()
      
      // Se tem templateId na query, abrir modal automaticamente
      if (templateId) {
        await openCreateModal()
      } else {
        checkTemplateUsage() // Verificar uso de modelo
      }
    })
        

    // === VARIÁVEIS PARA MODAL DE ITENS ===
    const showItemModal = ref(false)
    const availableItems = ref([])
    const filteredAvailableItems = ref([])
    const loadingItems = ref(false)
    const selectedItems = ref([])
    const itemSearchTerm = ref('')
    const selectedItemType = ref('')
    const selectedItemCategory = ref('')
    const availableCategories = ref([])
    const allCategories = ref([])
    const editingItemIndex = ref(-1)

    // === VARIÁVEIS PARA MODAL DE INSUMOS ===
    const showSupplyModal = ref(false)
    const availableSupplies = ref([])
    const filteredAvailableSupplies = ref([])
    const loadingSupplies = ref(false)
    const selectedSupplies = ref([])
    const supplySearchTerm = ref('')
    const selectedSupplyType = ref('')
    const availableSupplyTypes = ref([])
    const editingSupplyIndex = ref(null)

    // === VARIÁVEIS PARA MODAL DE OPCIONAIS ===
    const showOptionalModal = ref(false)
    const availableOptionals = ref([])
    const filteredAvailableOptionals = ref([])
    const loadingOptionals = ref(false)
    const selectedOptionals = ref([])
    const optionalSearchTerm = ref('')
    const selectedOptionalType = ref('')
    const selectedOptionalCategory = ref('')
    const availableOptionalCategories = ref([])
    const allOptionalCategories = ref([])
    const editingOptionalIndex = ref(-1)

    // === MÉTODOS PARA MODAL DE ITENS ===
    const loadAvailableItems = async () => {
      try {
        loadingItems.value = true
        
        // Carregar produtos
        const { data: produtos, error: produtosError } = await supabase
          .from('products')
          .select('*')
          .order('name')
        
        if (produtosError) throw produtosError

        // Carregar serviços
        const { data: servicos, error: servicosError } = await supabase
          .from('services')
          .select('*')
          .order('name')
        
        if (servicosError) throw servicosError

        // Carregar categorias
        const { data: categorias, error: categoriasError } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        
        if (categoriasError) throw categoriasError

        // Combinar produtos e serviços
        const produtosFormatados = produtos.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.unit_price || p.price || 0,
          unit: p.unit,
          type: 'produto',
          category_name: p.category || 'Produto'
        }))

        const servicosFormatados = servicos.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.unit_price || s.price || 0,
          unit: s.unit,
          type: 'servico',
          category_name: s.category || 'Serviço'
        }))

        availableItems.value = [...produtosFormatados, ...servicosFormatados]
        
        // Carregar todas as categorias disponíveis
        allCategories.value = categorias.map(c => ({
          id: c.id,
          name: c.name
        }))
        
        // Inicializar categorias disponíveis com todas as categorias
        availableCategories.value = allCategories.value
        
        // Mostrar todos os itens inicialmente
        filteredAvailableItems.value = availableItems.value
        

      } catch (error) {
        console.error('❌ Erro ao carregar itens:', error)
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
        availableCategories.value = allCategories.value
        return
      }
      
      // Filtrar categorias baseado nos itens disponíveis do tipo selecionado
      const itemsOfSelectedType = availableItems.value.filter(item => 
        item.type === selectedItemType.value
      )
      
      // Extrair categorias únicas dos itens filtrados
      const uniqueCategories = [...new Set(itemsOfSelectedType.map(item => item.category_name))]
      
      availableCategories.value = uniqueCategories.map(categoryName => ({
        id: categoryName,
        name: categoryName
      }))
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

      // Adicionar todos os itens selecionados à proposta
      selectedItems.value.forEach(item => {
        const newItem = {
          codigo: item.name,
          descricao: item.description,
          categoria: item.type,
          unidade: item.unit || '',
          valor_unitario: item.price || 0,
          source_id: item.id,
          source_table: item.type === 'produto' ? 'products' : 'services' // Corrigido: era 'produtos' e 'servicos'
        }
        
        form.value.items.push(newItem)
      })

      closeItemModal()
    }

    const closeItemModal = () => {
      showItemModal.value = false
      allowOverlayClose.value = false
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
      allowOverlayClose.value = false
      showItemModal.value = true
    }

    // Watch para filtrar itens quando termo de busca mudar (AGORA APÓS A DEFINIÇÃO)
    watch(itemSearchTerm, () => {
      filterAvailableItems()
    })

    // Watch para atualizar categorias quando tipo mudar
    watch(selectedItemType, () => {
      selectedItemCategory.value = ''
      updateAvailableCategories()
      filterAvailableItems()
    })

    // Watch para filtrar quando categoria mudar
    watch(selectedItemCategory, () => {
      filterAvailableItems()
    })

    // === MÉTODOS PARA MODAL DE INSUMOS ===
    const loadAvailableSupplies = async () => {
      try {
        loadingSupplies.value = true
        
        // Verificar se o serviço está disponível
        if (!SuppliesService) {
          console.error('SuppliesService não está disponível')
          return
        }
        
        // Configurar cliente Supabase no serviço
        SuppliesService.setSupabaseClient(supabase)
        
        // Carregar insumos
        const suppliesData = await SuppliesService.getAllSupplies()
        availableSupplies.value = suppliesData || []
        filteredAvailableSupplies.value = availableSupplies.value
        
        console.log(`✅ ${availableSupplies.value.length} insumos carregados`)
        
      } catch (error) {
        console.error('❌ Erro ao carregar insumos:', error)
        // Não mostrar alert para não interromper a experiência do usuário
        availableSupplies.value = []
        filteredAvailableSupplies.value = []
      } finally {
        loadingSupplies.value = false
      }
    }

    const loadSupplyTypes = async () => {
      try {
        // Verificar se o serviço está disponível
        if (!SupplyTypesService) {
          console.error('SupplyTypesService não está disponível')
          // Usar tipos padrão
          availableSupplyTypes.value = [
            { name: 'material', description: 'Material' },
            { name: 'mao_obra', description: 'Mão de Obra' },
            { name: 'equipamento', description: 'Equipamento' }
          ]
          return
        }
        
        // Configurar cliente Supabase no serviço
        SupplyTypesService.setSupabaseClient(supabase)
        
        const types = await SupplyTypesService.getAllTypes()
        availableSupplyTypes.value = types || []
        
      } catch (error) {
        console.error('❌ Erro ao carregar tipos de insumos:', error)
        // Fallback para tipos padrão se houver erro
        availableSupplyTypes.value = [
          { name: 'material', description: 'Material' },
          { name: 'mao_obra', description: 'Mão de Obra' },
          { name: 'equipamento', description: 'Equipamento' }
        ]
      }
    }

    const onSupplyTypeChange = () => {
      filterAvailableSupplies()
    }

    const filterAvailableSupplies = () => {
      let filtered = availableSupplies.value
      
      // Filtrar por tipo
      if (selectedSupplyType.value) {
        filtered = filtered.filter(supply => supply.type === selectedSupplyType.value)
      }
      
      // Filtrar por termo de busca
      if (supplySearchTerm.value) {
        const term = supplySearchTerm.value.toLowerCase()
        filtered = filtered.filter(supply => 
          supply.name?.toLowerCase().includes(term) ||
          supply.description?.toLowerCase().includes(term)
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

      // Adicionar todos os insumos selecionados à proposta
      selectedSupplies.value.forEach(supply => {
        const newSupply = {
          codigo: supply.name || '',
          descricao: supply.description || '',
          tipo: supply.type || '',
          unidade: supply.unit || '',
          valor_unitario: supply.price || 0,
          quantity: 1, // Quantidade padrão
          source_id: supply.id,
          source_table: 'supplies'
        }
        
        form.value.insumos.push(newSupply)
      })

      // Recalcular totais
      recalculateTotals()
      
      closeSupplyModal()
    }

    const closeSupplyModal = () => {
      showSupplyModal.value = false
      editingSupplyIndex.value = null
      supplySearchTerm.value = ''
      selectedSupplyType.value = ''
      filteredAvailableSupplies.value = []
      selectedSupplies.value = [] // Limpar seleção ao fechar
    }

    const getSupplyTypeLabel = (typeName) => {
      const type = availableSupplyTypes.value.find(t => t.name === typeName)
      return type ? type.description || type.name : typeName
    }

    // Watch para filtrar insumos quando termo de busca mudar
    watch(supplySearchTerm, () => {
      filterAvailableSupplies()
    })

    // Watch para filtrar quando tipo mudar
    watch(selectedSupplyType, () => {
      filterAvailableSupplies()
    })

    // Watch para recalcular totais quando itens mudarem
    watch([() => form.value.items, () => form.value.insumos, () => form.value.opcionais], () => {
      recalculateTotals()
    }, { deep: true })

    // Funções para gerenciar itens, insumos e opcionais
    const editItem = (index) => {
      // TODO: Implementar edição de item
      console.log('Editar item:', index)
    }

    const removeItem = (index) => {
      if (confirm('Deseja remover este item?')) {
        form.value.items.splice(index, 1)
        recalculateTotals()
      }
    }

    const incrementItemQuantity = (index) => {
      if (!form.value.items[index].quantity) {
        form.value.items[index].quantity = 1
      }
      form.value.items[index].quantity++
      recalculateTotals()
    }

    const decrementItemQuantity = (index) => {
      if (!form.value.items[index].quantity) {
        form.value.items[index].quantity = 1
      }
      if (form.value.items[index].quantity > 1) {
        form.value.items[index].quantity--
        recalculateTotals()
      }
    }

    const openSupplyModal = async () => {
      try {
        await loadAvailableSupplies()
        await loadSupplyTypes()
        allowOverlayClose.value = false
        showSupplyModal.value = true
      } catch (error) {
        console.error('Erro ao abrir modal de insumos:', error)
        alert('Erro ao carregar dados dos insumos')
      }
    }

    const editSupply = (index) => {
      editingSupplyIndex.value = index
      // TODO: Implementar edição específica se necessário
      openSupplyModal()
    }

    const removeSupply = (index) => {
      if (confirm('Deseja remover este insumo?')) {
        form.value.insumos.splice(index, 1)
        recalculateTotals()
      }
    }

    const incrementSupplyQuantity = (index) => {
      if (!form.value.insumos[index].quantity) {
        form.value.insumos[index].quantity = 1
      }
      form.value.insumos[index].quantity++
      recalculateTotals()
    }

    const decrementSupplyQuantity = (index) => {
      if (!form.value.insumos[index].quantity) {
        form.value.insumos[index].quantity = 1
      }
      if (form.value.insumos[index].quantity > 1) {
        form.value.insumos[index].quantity--
        recalculateTotals()
      }
    }

    // === MÉTODOS PARA MODAL DE OPCIONAIS ===
    const loadAvailableOptionals = async () => {
      try {
        loadingOptionals.value = true
        
        // Carregar produtos
        const { data: produtos, error: produtosError } = await supabase
          .from('products')
          .select('*')
          .order('name')
        
        if (produtosError) throw produtosError

        // Carregar serviços
        const { data: servicos, error: servicosError } = await supabase
          .from('services')
          .select('*')
          .order('name')
        
        if (servicosError) throw servicosError

        // Carregar categorias
        const { data: categorias, error: categoriasError } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        
        if (categoriasError) throw categoriasError

        // Combinar produtos e serviços
        const produtosFormatados = produtos.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.unit_price || p.price || 0,
          unit: p.unit,
          type: 'produto',
          category_name: p.category || 'Produto'
        }))

        const servicosFormatados = servicos.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.unit_price || s.price || 0,
          unit: s.unit,
          type: 'servico',
          category_name: s.category || 'Serviço'
        }))

        availableOptionals.value = [...produtosFormatados, ...servicosFormatados]
        
        // Carregar todas as categorias disponíveis
        allOptionalCategories.value = categorias.map(c => ({
          id: c.id,
          name: c.name
        }))
        
        // Inicializar categorias disponíveis com todas as categorias
        availableOptionalCategories.value = allOptionalCategories.value
        
        // Mostrar todos os opcionais inicialmente
        filteredAvailableOptionals.value = availableOptionals.value

      } catch (error) {
        console.error('❌ Erro ao carregar opcionais:', error)
        alert('Erro ao carregar produtos e serviços para opcionais')
      } finally {
        loadingOptionals.value = false
      }
    }

    const onOptionalTypeChange = () => {
      selectedOptionalCategory.value = ''
      updateAvailableOptionalCategories()
      filterAvailableOptionals()
    }

    const updateAvailableOptionalCategories = () => {
      if (!selectedOptionalType.value) {
        availableOptionalCategories.value = allOptionalCategories.value
        return
      }
      
      // Filtrar categorias baseado nos opcionais disponíveis do tipo selecionado
      const optionalsOfSelectedType = availableOptionals.value.filter(optional => 
        optional.type === selectedOptionalType.value
      )
      
      // Extrair categorias únicas dos opcionais filtrados
      const uniqueCategories = [...new Set(optionalsOfSelectedType.map(optional => optional.category_name))]
      
      availableOptionalCategories.value = uniqueCategories.map(categoryName => ({
        id: categoryName,
        name: categoryName
      }))
    }

    const filterAvailableOptionals = () => {
      let filtered = availableOptionals.value

      // Filtrar por tipo
      if (selectedOptionalType.value) {
        filtered = filtered.filter(optional => optional.type === selectedOptionalType.value)
      }

      // Filtrar por categoria
      if (selectedOptionalCategory.value) {
        filtered = filtered.filter(optional => optional.category_name === selectedOptionalCategory.value)
      }

      // Filtrar por termo de busca
      if (optionalSearchTerm.value) {
        const term = optionalSearchTerm.value.toLowerCase()
        filtered = filtered.filter(optional => 
          optional.name.toLowerCase().includes(term) ||
          (optional.description && optional.description.toLowerCase().includes(term)) ||
          optional.category_name.toLowerCase().includes(term)
        )
      }

      filteredAvailableOptionals.value = filtered
    }

    const isOptionalSelected = (optional) => {
      return selectedOptionals.value.some(selected => 
        selected.id === optional.id && selected.type === optional.type
      )
    }

    const toggleOptionalSelection = (optional) => {
      const index = selectedOptionals.value.findIndex(selected => 
        selected.id === optional.id && selected.type === optional.type
      )
      
      if (index > -1) {
        selectedOptionals.value.splice(index, 1)
      } else {
        selectedOptionals.value.push({
          ...optional,
          codigo: optional.name,
          descricao: optional.description,
          categoria: optional.type === 'produto' ? 'Produto' : 'Serviço',
          unidade: optional.unit,
          valor_unitario: optional.price,
          quantity: 1
        })
      }
    }

    const clearSelectedOptionals = () => {
      selectedOptionals.value = []
    }

    const openOptionalModal = async () => {
      selectedOptionals.value = []
      editingOptionalIndex.value = -1
      await loadAvailableOptionals()
      allowOverlayClose.value = false
      showOptionalModal.value = true
    }

    const closeOptionalModal = () => {
      showOptionalModal.value = false
      allowOverlayClose.value = false
      selectedOptionals.value = []
      optionalSearchTerm.value = ''
      selectedOptionalType.value = ''
      selectedOptionalCategory.value = ''
      availableOptionalCategories.value = []
      filteredAvailableOptionals.value = []
      editingOptionalIndex.value = -1
    }

    const saveSelectedOptionals = () => {
      if (selectedOptionals.value.length === 0) return

      // Adicionar opcionais selecionados ao formulário
      selectedOptionals.value.forEach(optional => {
        const newOptional = {
          codigo: optional.codigo,
          descricao: optional.descricao,
          categoria: optional.categoria,
          unidade: optional.unidade,
          valor_unitario: optional.valor_unitario,
          quantity: optional.quantity || 1
        }
        
        form.value.opcionais.push(newOptional)
      })

      // Recalcular totais
      recalculateTotals()
      
      closeOptionalModal()
    }

    const editOptional = (index) => {
      // TODO: Implementar edição de opcional
      console.log('Editar opcional:', index)
    }

    const removeOptional = (index) => {
      if (confirm('Deseja remover este opcional?')) {
        form.value.opcionais.splice(index, 1)
        recalculateTotals()
      }
    }

    const incrementOptionalQuantity = (index) => {
      if (!form.value.opcionais[index].quantity) {
        form.value.opcionais[index].quantity = 1
      }
      form.value.opcionais[index].quantity++
      recalculateTotals()
    }

    const decrementOptionalQuantity = (index) => {
      if (!form.value.opcionais[index].quantity) {
        form.value.opcionais[index].quantity = 1
      }
      if (form.value.opcionais[index].quantity > 1) {
        form.value.opcionais[index].quantity--
        recalculateTotals()
      }
    }

    // Watch para filtrar opcionais quando termo de busca mudar
    watch(optionalSearchTerm, () => {
      filterAvailableOptionals()
    })

    // Watch para atualizar categorias quando tipo mudar
    watch(selectedOptionalType, () => {
      selectedOptionalCategory.value = ''
      updateAvailableOptionalCategories()
      filterAvailableOptionals()
    })

    // Watch para filtrar quando categoria mudar
    watch(selectedOptionalCategory, () => {
      filterAvailableOptionals()
    })

    const formatSupplierLabel = (s) => {
  const empresa = (s?.company_name || '').trim()
  const contato =
    (s?.contact_person || s?.contact_name || s?.responsavel || s?.contato || '').trim()
  return contato ? `${empresa} -- ${contato}` : empresa
}

// quantidade digitável com validação simples
const onQtyChange = (row) => {
  const n = Number(row.quantity);
  if (!Number.isFinite(n) || n < 1) row.quantity = 1;
  else row.quantity = Math.floor(n);
};


    return {
      proposals,
      filteredProposals,
      searchTerm,
      loading,
      saving,
      showModal,
      isEditing,
      showClientDropdown,
      clients,
      filteredClients,
      clientSearch,
      form,
      activeTab,
      tabs,
      filterProposals,
      filterClients,
      clearSearch,
      openCreateModal,
      openEditModal,
      closeModal,
      saveAndExit,
      onOverlayClick,
      toggleClientDropdown,
      selectClient,
      saveProposal,
      deleteProposal,
      editProposal,
      copyProposalLink,
      exportToPDF,
      isGenerating,
      generationError,
      updateProposalStatus,
      normalizeStatus,
      formatDate,
      formatCurrency,
      formatDateRange,
      loadTemplateData,
      editItem,
      removeItem,
      openSupplyModal,
      editSupply,
      removeSupply,
      openOptionalModal,
      editOptional,
      removeOptional,
      incrementOptionalQuantity,
      decrementOptionalQuantity,
      // Modal de itens
      showItemModal,
      availableItems,
      filteredAvailableItems,
      loadingItems,
      selectedItems,
      itemSearchTerm,
      selectedItemType,
      selectedItemCategory,
      availableCategories,
      editingItemIndex,
      
      // Métodos do modal de itens
      openItemModal,
      closeItemModal,
      loadAvailableItems,
      filterAvailableItems,
      onTypeChange,
      updateAvailableCategories,
      isItemSelected,
      toggleItemSelection,
      clearSelectedItems,
      saveSelectedItems,
      
      // Modal de insumos
      showSupplyModal,
      availableSupplies,
      filteredAvailableSupplies,
      loadingSupplies,
      selectedSupplies,
      supplySearchTerm,
      selectedSupplyType,
      availableSupplyTypes,
      editingSupplyIndex,
      
      // Métodos do modal de insumos
      openSupplyModal,
      closeSupplyModal,
      loadAvailableSupplies,
      loadSupplyTypes,
      onSupplyTypeChange,
      filterAvailableSupplies,
      isSupplySelected,
      toggleSupplySelection,
      clearSelectedSupplies,
      saveSelectedSupplies,
      getSupplyTypeLabel,
      editSupply,
      removeSupply,
      
      // Modal de opcionais
      showOptionalModal,
      availableOptionals,
      filteredAvailableOptionals,
      loadingOptionals,
      selectedOptionals,
      optionalSearchTerm,
      selectedOptionalType,
      selectedOptionalCategory,
      availableOptionalCategories,
      editingOptionalIndex,
      
      // Métodos do modal de opcionais
      openOptionalModal,
      closeOptionalModal,
      loadAvailableOptionals,
      filterAvailableOptionals,
      onOptionalTypeChange,
      updateAvailableOptionalCategories,
      isOptionalSelected,
      toggleOptionalSelection,
      clearSelectedOptionals,
      saveSelectedOptionals,
      editOptional,
      removeOptional,
      
      // Métodos de controle de quantidade dos opcionais
      incrementOptionalQuantity,
      decrementOptionalQuantity,
      
      // Métodos de controle de quantidade dos itens
      incrementItemQuantity,
      decrementItemQuantity,
      incrementSupplyQuantity,
      decrementSupplyQuantity,
      
      // Novos retornos
      incluirOpcionais,
      discount,
      taxRate,
      totalObservations,
      totals,
      counts,
      condicoesGerais,
      politicas,
      suppliers,
      selectedSupplier,
      subtotal,
      discountAmount,
      taxAmount,
      totalGeral,
      recalculateTotals,
      loadCondicoesGerais,
      loadPoliticas,
      loadSuppliers,
      onSupplierChange,
      formatCNPJ,
      formatPhone,
      formatSupplierLabel
    }
  }
}
</script>

<style scoped>
/* 1) Deixa a página ocupar toda a largura disponível */
.propostas-page {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.propostas-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  gap: 20px;
}

.header-content h1 {
  margin: 0 0 5px 0;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
}

.page-subtitle {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 16px;
}

.page-status {
  margin: 0;
  color: #28a745;
  font-size: 14px;
  font-weight: 500;
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
  margin-bottom: 10px;
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
  padding: 12px 50px 12px 45px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #007bff;
}

.clear-search-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.clear-search-btn:hover {
  color: #666;
}

.search-results-count {
  color: #666;
  font-size: 14px;
  margin-left: 5px;
}

/* 2) Grade: coloca o máximo possível por linha */
.proposals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* antes: 400px */
  gap: 16px;                         /* antes: 24px */
  margin-top: 16px;                  /* antes: 24px */
}

/* 3) Card mais compacto (pra caber mais) */
.proposal-card {
  padding: 14px 16px;      /* já tinha */
  border-radius: 8px;      /* já tinha */
  background: #fff;        /* <= aqui */
  border: 1px solid #eaeaea;      /* opcional, dá contorno */
  box-shadow: 0 1px 6px rgba(0,0,0,.06); /* opcional */
}


.proposal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}


.status-dropdown-container {
  position: relative;
}

.status-dropdown {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: white;
  cursor: pointer;
  min-width: 100px;
}

.status-dropdown:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.status-dropdown option {
  padding: 4px 8px;
}

.proposal-info {
  flex: 1;
  margin-bottom: 15px;
}

.client-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.client-name i {
  color: #007bff;
  font-size: 16px;
}

.event-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-name i {
  color: #28a745;
  font-size: 14px;
}

.event-type {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-type i {
  color: #ffc107;
  font-size: 14px;
}

.event-details {
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #666;
}

.detail-item i {
  color: #6c757d;
  font-size: 12px;
  width: 14px;
  text-align: center;
}

.proposal-value-section {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-top: 12px;
}

.value-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.value-amount {
  font-size: 18px;
  font-weight: 600;
  color: #28a745;
  margin-bottom: 4px;
}

.value-updated {
  font-size: 11px;
  color: #999;
}

.proposal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.proposal-actions button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proposal-actions button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
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
}

/* Modais de seleção ficam acima do modal principal e com fundo mais escuro */
.item-modal-overlay,
.supply-modal-overlay,
.optional-modal-overlay {
  z-index: 10000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

/* Modal expandido (compat) */
.large-modal.expanded-modal {
  height: 95vh !important;
  max-height: 95vh !important;
  overflow: hidden;
}

.expanded-modal {
  width: 95vw;
  max-width: 1400px;
  max-height: 95vh;
}

/* ========= BASE (todas as abas comuns: Dados Básicos, Total Geral, etc.) ========= */
.modal {
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,.1), 0 10px 10px -5px rgba(0,0,0,.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;     /* o scroll acontece no body */
  margin: auto;
}

.modal-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;        /* ESSENCIAL para permitir scroll no filho */
    overflow-y: auto;

}

.modal .modal-header,
.modal .modal-footer {
  flex: 0 0 auto;
}

.modal .modal-body {     /* <- antes estava .modal > .modal-body (não pegava) */
  flex: 1 1 auto;
  min-height: 0;        /* ESSENCIAL com flex */
  overflow: auto;       /* reativa o scroll das telas comuns */
}

/* ========= SELEÇÃO (itens / insumos / opcionais) – mantém comportamento especial ========= */
.item-modal-overlay,
.supply-modal-overlay,
.optional-modal-overlay {
  overflow: hidden !important;     /* sem scroll no overlay, evita scroll duplo */
}

.item-modal-overlay .modal-content,
.supply-modal-overlay .modal-content,
.optional-modal-overlay .modal-content {
  width: 95vw;
  max-width: 1400px;
  height: 92vh;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  background: #fff;
  box-shadow: 0 30px 80px rgba(0,0,0,.35);
}

.item-modal-overlay .modal-header,
.item-modal-overlay .modal-footer,
.supply-modal-overlay .modal-header,
.supply-modal-overlay .modal-footer,
.optional-modal-overlay .modal-header,
.optional-modal-overlay .modal-footer {
  flex: 0 0 auto;
  margin: 0;
}

.item-modal-overlay .modal-body,
.supply-modal-overlay .modal-body,
.optional-modal-overlay .modal-body {
  display: grid !important;
  grid-template-rows: auto auto 1fr;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow: hidden !important;     /* quem rola é a lista */
  background: #fff !important;
  padding: 16px 20px;
}

.item-modal-overlay .items-selection-list,
.supply-modal-overlay .items-selection-list,
.optional-modal-overlay .items-selection-list {
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
  overflow-y: auto !important;     /* a lista rola */
  margin: 0 !important;
  padding-right: 6px;
  background: #fff;
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
  padding: 18px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-header h5,
.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close,
.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #6c757d;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-close:hover,
.close-btn:hover {
  color: #495057;
  background-color: #e9ecef;
}

.modal-body {
  padding: 20px;
}

.modal-description {
  margin: 0 0 20px 0;
  color: #6c757d;
  font-size: 13px;
  line-height: 1.4;
}

/* Form Groups - Otimizado */
.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #495057;
  font-size: 13px;
}

.form-group input,
.form-group textarea,
.form-group select,
.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus,
.form-control:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

/* Client Dropdown - Compacto */
.client-dropdown-container {
  position: relative;
}

.client-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}

.client-dropdown input {
  padding-right: 40px;
  cursor: pointer;
}

.dropdown-arrow {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.dropdown-arrow:hover {
  color: #333;
}

.client-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e1e5e9;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 10;
}

.client-search {
  position: relative;
  padding: 8px;
  border-bottom: 1px solid #e1e5e9;
}

.client-search i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 12px;
}

.client-search input {
  width: 100%;
  padding: 6px 12px 6px 30px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  font-size: 12px;
}

.client-options {
  max-height: 120px;
  overflow-y: auto;
}

.client-option {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s ease;
}

.client-option:hover {
  background: #f8f9fa;
}

.client-option strong {
  display: block;
  color: #333;
  font-size: 13px;
}

.client-option span {
  color: #666;
  font-size: 11px;
}

.no-clients {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.creation-date {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.date-label {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
  font-weight: 400;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 65px;
  justify-content: center;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.edit-btn {
  color: #007bff;
  border-color: #007bff;
}

.edit-btn:hover {
  background: #007bff;
  color: white;
}

.pdf-btn {
  color: #dc3545;
  border-color: #dc3545;
}

.pdf-btn:hover {
  background: #dc3545;
  color: white;
}

.link-btn {
  color: #28a745;
  border-color: #28a745;
}

.link-btn:hover {
  background: #28a745;
  color: white;
}

.delete-btn {
  color: #6c757d;
  border-color: #6c757d;
}

.delete-btn:hover {
  background: #6c757d;
  color: white;
}

/* Ícones usando pseudo-elementos */
.icon-edit::before { content: "✏️"; }
.icon-pdf::before { content: "📄"; }
.icon-link::before { content: "🔗"; }
.icon-trash::before { content: "🗑️"; }

/* Responsividade Melhorada */
@media (max-width: 1024px) {
  .modal-content {
    width: 98%;
    max-width: 800px;
  }
  
  .modal {
    max-width: 600px;
  }
}

@media (max-width: 768px) {
  .propostas-header {
    flex-direction: column;
    align-items: stretch;
  }
  

  
  .proposal-card {
    margin: 0 10px;
  }
  
  .proposal-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .proposal-value,
  .proposal-date {
    align-items: center;
  }

  .card-footer {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    min-width: 70px;
  }

  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    width: 98%;
    max-height: 90vh;
  }
  
  .modal {
    width: 95%;
    max-width: none;
    margin: 10px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 14px 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .modal-header h5,
  .modal-header h2 {
    font-size: 1rem;
  }
  
  .form-group {
    margin-bottom: 14px;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select,
  .form-control {
    padding: 8px 12px;
    font-size: 14px;
  }

}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0;
  }
  
  .modal-content {
    width: 100%;
    border-radius: 0;
    max-height: 100vh;
  }
  
  .modal {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    margin: 0;
    border-radius: 0;
  }
  
  .modal-header {
    border-radius: 0;
    padding: 12px 14px;
  }
  
  .modal-body {
    padding: 14px;
  }
  
  .modal-footer {
    border-radius: 0;
    flex-direction: column;
    padding: 12px 14px;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select,
  .form-control {
    padding: 10px 12px;
    font-size: 16px; /* Evita zoom no iOS */
  }
  
  .modal-header h5,
  .modal-header h2 {
    font-size: 0.95rem;
  }
}

@media (max-width: 360px) {
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 10px 12px;
  }
  
  .form-group {
    margin-bottom: 12px;
  }
  
  .form-group label {
    font-size: 12px;
    margin-bottom: 4px;
  }
}

/* Melhorias para telas muito pequenas */
@media (max-height: 600px) {
  .modal-content,
  .modal {
    max-height: 98vh;
  }
  
  .modal-body {
    padding: 12px 16px;
  }
  
  .form-group {
    margin-bottom: 10px;
  }
  
  .form-group textarea {
    min-height: 60px;
  }
}
/* ====== NOVO LAYOUT DO CARD ====== */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 8px;
}

.event-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.inline-icon-btn {
  margin-left: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #888;
  padding: 2px 4px;
  border-radius: 4px;
}
.inline-icon-btn:hover { color: #555; }

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.proposal-number-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0d6efd;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.proposal-number-inline .prefix {
  font-size: 12px; 
  color: #7a7a7a;
  font-weight: 500;
}
.proposal-number-inline .number {
  font-size: 14px;
  color: #0d6efd;
}
.proposal-number-inline .small {
  font-size: 12px;
  color: #7a7a7a;
}

/* Status dropdown (mantém values do banco, muda rótulos visuais) */
.status-dropdown {
  padding: 6px 10px;
  border: 1px solid #dedede;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
  cursor: pointer;
  min-width: 120px;
  color: #333;
}

/* Seção de valor total estilo caixa verde */
.proposal-value-section {
  margin-top: 14px;
  background: #f6fff8;
  border: 1px solid #d6f5df;
  border-left: 5px solid #28a745;
  border-radius: 8px;
  padding: 12px 14px;
}
.proposal-value-section .value-amount {
  color: #28a745;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 6px 0;
}
.proposal-value-section .value-updated {
  font-size: 12px;
  color: #6c757d;
}

/* Ações no rodapé do card */
.proposal-actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #e6e6e6;
  background: #fff;
  color: #444;
  font-size: 12px;
  cursor: pointer;
  transition: all .15s ease;
}
.action-btn:hover {
  background: #f7f7f7;
  transform: translateY(-1px);
}
.edit-btn .icon-edit { color: #0d6efd; }
.pdf-btn .icon-pdf { color: #dc3545; }
.link-btn .icon-link { color: #0d6efd; }
.delete-btn .icon-trash { color: #6c757d; }

.pdf-btn.generating {
  opacity: 0.7;
  cursor: not-allowed;
}

.pdf-btn .fa-spinner {
  color: #dc3545;
}

/* Estilos das Abas */
.modal-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  margin: 0;
  padding: 0;
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: #e9ecef;
  color: #333;
}

.tab-btn.active {
  color: #007bff;
  background: white;
  border-bottom-color: #007bff;
}

.tab-btn i {
  font-size: 16px;
}

/* Estilos das Seções */
.tab-pane {
  padding: 20px;
  min-height: 400px;
}

.form-section h5 {
  margin-bottom: 20px;
  color: #333;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h5 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

/* Estilos dos Itens */
.empty-section {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-section i {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 15px;
}

.empty-section p {
  margin-bottom: 20px;
  font-size: 16px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  margin: 0 0 5px 0;
  color: #333;
  font-weight: 600;
}

.item-info p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.item-details {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-info {
  background: #d1ecf1;
  color: #0c5460;
}

.badge-warning {
  background: #fff3cd;
  color: #856404;
}

.badge-success {
  background: #d4edda;
  color: #155724;
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

.btn {
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}

.btn-primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.btn-outline-primary {
  background: transparent;
  border-color: #007bff;
  color: #007bff;
}

.btn-outline-primary:hover {
  background: #007bff;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  border-color: #dc3545;
  color: #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  border-color: #545b62;
}

/* Modal Footer - Compacto */
.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

/* Botões otimizados */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5a6fd8;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-outline-secondary {
  background-color: transparent;
  color: #6c757d;
  border: 2px solid #6c757d;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  transform: none;
}

/* Estilos para Total Geral */
.totals-section {
  padding: 20px 0;
}

.optional-control {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 10px;
}

.totals-breakdown {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.breakdown-item {
  padding: 10px 0;
}

.breakdown-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breakdown-label {
  font-weight: 500;
  color: #333;
}

.breakdown-value {
  font-weight: 600;
  color: #28a745;
}

.breakdown-value.negative {
  color: #dc3545;
}

.breakdown-value.positive {
  color: #007bff;
}

.breakdown-value.excluded {
  color: #6c757d;
  text-decoration: line-through;
}

.excluded-note {
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
}

.breakdown-separator {
  height: 1px;
  background: #e0e0e0;
  margin: 15px 0;
}

.breakdown-item.subtotal .breakdown-label,
.breakdown-item.subtotal .breakdown-value {
  font-size: 16px;
  font-weight: 600;
}

.breakdown-item.total {
  background: #f8f9fa;
  padding: 15px;
  margin: 10px -20px -20px -20px;
  border-radius: 0 0 8px 8px;
}

.breakdown-item.total .breakdown-label,
.breakdown-item.total .breakdown-value {
  font-size: 18px;
  font-weight: 700;
  color: #007bff;
}

.input-with-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-with-label label {
  margin: 0;
  white-space: nowrap;
}

.small-input {
  width: 80px;
  padding: 5px 8px;
  font-size: 14px;
}

/* Estilos para Condições Gerais */
.conditions-content {
  padding: 20px 0;
}

.config-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.config-item {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.config-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.config-item label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.config-value {
  color: #666;
  line-height: 1.5;
}

.config-value.text-content {
  white-space: pre-wrap;
}

/* Estilos para Políticas */
.policies-content {
  padding: 20px 0;
}

.policy-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.policy-header {
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.policy-header h6 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.policy-content {
  padding: 20px;
}

.policy-content p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

/* Estilos para Fornecedor */
.supplier-selection {
  padding: 20px 0;
}

.supplier-details {
  margin-top: 20px;
}

.supplier-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.supplier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.supplier-header h6 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.supplier-cnpj {
  color: #666;
  font-family: monospace;
}

.supplier-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
}

.info-row i {
  width: 16px;
  color: #007bff;
}

.supplier-help {
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #0066cc;
}

.supplier-help i {
  font-size: 24px;
  margin-bottom: 10px;
  display: block;
}

.help-text {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

/* Modal de seleção de itens */
.large-modal {
  width: 90vw;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.search-section {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.filter-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 300px;
}

.filter-section select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 140px;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-select:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

.items-selection-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
}

.item-selection-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.item-selection-card:hover {
  border-color: #007bff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.item-selection-card.selected {
  border-color: #4caf50;
  background-color: #f1f8e9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.item-info {
  flex: 1;
}

.item-info h6 {
  margin: 0 0 4px 0;
  font-weight: 600;
  color: #2c3e50;
}

.item-info p {
  margin: 0 0 8px 0;
  color: #6c757d;
  font-size: 14px;
}

.item-details {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* Selecionar Itens + Selecionar Insumos */
.item-modal-overlay .item-info h6,
.supply-modal-overlay .item-info h6 {
  font-size: 16px;      /* ↑ maior que a descrição */
  font-weight: 600;
  line-height: 1.25;
  margin: 0 0 4px;
  color: #2c3e50;
}

.item-modal-overlay .item-info p,
.supply-modal-overlay .item-info p {
  font-size: 13px;      /* ↓ menor que o título */
  line-height: 1.35;
  margin: 0 0 8px;
  color: #6c757d;
}

/* (Opcional) em telas grandes, sobe 1px no título */
@media (min-width: 1280px) {
  .item-modal-overlay .item-info h6,
  .supply-modal-overlay .item-info h6 {
    font-size: 17px;
  }
}

/* Editar Proposta -> abas Itens/Insumos (lista já adicionada na proposta) */
.edit-proposal-modal .item-info h6 {
  font-size: 16px;     /* maior que a descrição */
  font-weight: 600;
  line-height: 1.25;
  margin: 0 0 4px;
  color: #2c3e50;
}

.edit-proposal-modal .item-info p {
  font-size: 13px;     /* menor que o título */
  line-height: 1.35;
  margin: 0 0 8px;
  color: #6c757d;
}

/* (opcional) em telas grandes sobe 1px no título */
@media (min-width: 1280px) {
  .edit-proposal-modal .item-info h6 {
    font-size: 17px;
  }
}

/* ================================
   TIPOGRAFIA PADRÃO DOS CARDS
   (título > descrição)
   ================================ */

/* Seletores dos MODAIS de seleção (itens/insumos/opcionais) */
.item-modal-overlay .item-info h6,
.supply-modal-overlay .item-info h6,
.optional-modal-overlay .item-info h6,
.modal-content .items-selection-list .item-selection-card .item-info h6 {
  font-size: 16px;      /* título maior */
  font-weight: 600;
  line-height: 1.25;
  margin: 0 0 4px;
  color: #2c3e50;
}

.item-modal-overlay .item-info p,
.supply-modal-overlay .item-info p,
.optional-modal-overlay .item-info p,
.modal-content .items-selection-list .item-selection-card .item-info p {
  font-size: 13px;      /* descrição menor */
  line-height: 1.35;
  margin: 0 0 8px;
  color: #6c757d;
}

/* Listas nas ABAS do modal de proposta (Itens / Insumos / Opcionais) */
.tab-pane .items-list .item-card .item-info h6 {
  font-size: 16px;      /* título maior */
  font-weight: 600;
  line-height: 1.25;
  margin: 0 0 4px;
  color: #2c3e50;
}

.tab-pane .items-list .item-card .item-info p {
  font-size: 13px;      /* descrição menor */
  line-height: 1.35;
  margin: 0 0 8px;
  color: #6c757d;
}

/* Opcional: em telas grandes, sobe 1px no título */
@media (min-width: 1280px) {
  .item-modal-overlay .item-info h6,
  .supply-modal-overlay .item-info h6,
  .optional-modal-overlay .item-info h6,
  .modal-content .items-selection-list .item-selection-card .item-info h6,
  .tab-pane .items-list .item-card .item-info h6 {
    font-size: 17px;
  }
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

.category-badge {
  background-color: #f5f5f5;
  color: #666;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.item-price {
  font-weight: 600;
  color: #2e7d32;
}

.item-unit {
  color: #6c757d;
  font-size: 12px;
}

.item-select-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: #6c757d;
  transition: all 0.2s ease;
}

.item-selection-card.selected .item-select-btn {
  background-color: #4caf50;
  color: white;
}

.selected-items-counter {
  background-color: #e3f2fd;
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

.text-success {
  color: #4caf50 !important;
}

.empty-state, .loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-state i, .loading-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.loading-state i {
  color: #007bff;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* Container principal do formulário */
.form-container {
  padding: 24px 32px;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px; /* Espaço para barra fixa */
}

/* Grid responsivo */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
/* 4) Em telas grandes, fique ainda mais denso (opcional) */
.proposals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); /* antes 400px/320px */
  gap: 20px;
}



@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  
  .form-container {
    padding: 32px 40px;
  }
}

/* Campos que ocupam linha inteira */
.form-grid-full {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .form-grid-full {
    gap: 24px;
  }
}

/* Campo que ocupa 2 colunas no desktop */
.col-span-full {
  grid-column: 1 / -1;
}

/* Seções do formulário */
.form-section {
  margin-bottom: 32px;
}

.form-section h5 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f3f4f6;
}

/* Grupos de campos */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea,
.form-group select,
.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: #ffffff;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus,
.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Textarea específico */
.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

/* Barra de ações fixa */
.modal-footer-fixed {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e5e7eb;
  padding: 16px 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  z-index: 10;
  margin-top: auto;
}

@media (min-width: 768px) {
  .modal-footer-fixed {
    padding: 20px 40px;
    gap: 16px;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .modal-tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1 1 50%;
    font-size: 12px;
    padding: 12px 15px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .item-card {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .item-actions {
    justify-content: center;
  }
  
  .large-modal {
    width: 95%;
    margin: 10px;
  }
  
  .filter-section {
    flex-direction: column;
    min-width: auto;
  }
  
  .items-selection-list {
    gap: 8px;
  }
  
  .item-selection-card {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .item-select-btn {
    margin-left: 0;
    margin-top: 12px;
    align-self: center;
  }
}


/* mantém o tamanho do campo de quantidade semelhante ao número anterior */
.quantity-switch .qty-input {
  width: 48px;
  text-align: center;
}

</style>