<template>
  <div class="login-page">
    <div class="card">
      <h2>Entrar</h2>
      <form @submit.prevent="onSubmit">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input v-model="password" type="password" required />
        </div>
        <button class="btn" :disabled="auth.loading">{{ auth.loading ? 'Entrando...' : 'Entrar' }}</button>
        <p v-if="auth.error" class="error">{{ auth.error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const onSubmit = async () => {
  const ok = await auth.signIn(email.value, password.value)
  if (ok.success) {
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  }
}
</script>

<style scoped>
.login-page { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#f5f5f5; }
.card { background:#fff; padding:24px; border-radius:8px; width:100%; max-width:360px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
.form-group { margin-bottom:16px; }
label { display:block; margin-bottom:6px; }
input { width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; }
.btn { width:100%; padding:10px; background:#42b883; color:#fff; border:none; border-radius:4px; cursor:pointer; }
.btn:disabled { opacity:0.7; cursor:not-allowed; }
.error { color:#d33; margin-top:10px; }
</style>