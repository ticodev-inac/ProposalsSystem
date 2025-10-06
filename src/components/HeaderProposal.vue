<!-- src/components/HeaderProposal.vue -->
<template>
  <div class="page-header">
    <div class="page-header-left">
      <h2 class="page-title">{{ title }}</h2>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>

    <div class="page-header-right">
      <slot name="actions" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'HeaderProposal',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;       /* ações ficam alinhadas ao topo */
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px 8px;        /* espaço para o subtítulo */
  background: #fff;
  border-bottom: 1px solid #eee;
}

.page-header-left {
  display: flex;
  flex-direction: column;        /* 👈 título em cima, subtítulo embaixo */
  gap: 6px;
}

.page-title {
  margin: 0;
  color: #1f2937;
  font-weight: 700;
  font-size: 28px;
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.4;
}

.page-header-right :deep(.btn) {
  /* só para os botões do slot não “grudarem” */
  margin-left: 8px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .page-header-right {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>
