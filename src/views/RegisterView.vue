<template>
    <div class="auth-container">
        <div class="auth-card">
            <h2>Criar conta (Teste)</h2>

            <form @submit.prevent="onSubmit">
                <div class="form-group">
                    <label for="email">E-mail</label>
                    <input
                        id="email"
                        type="email"
                        v-model="email"
                        required
                        placeholder="seuemail@exemplo.com"
                    />
                </div>

                <div class="form-group">
                    <label for="password">Senha</label>
                    <input
                        id="password"
                        type="password"
                        v-model="password"
                        required
                        minlength="6"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <div class="form-group">
                    <label for="confirm">Confirmar senha</label>
                    <input id="confirm" type="password" v-model="confirm" required minlength="6" />
                </div>

                <p v-if="error" class="error">{{ error }}</p>
                <p v-if="info" class="info">{{ info }}</p>

                <button class="btn" type="submit" :disabled="loading">
                    {{ loading ? 'Criando...' : 'Cadastrar' }}
                </button>
            </form>

            <p class="alt">
                Já tem conta?
                <router-link to="/login">Entrar</router-link>
            </p>
        </div>
    </div>
</template>

<script setup>
    import { ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { supabase } from '@/services/supabase'

    const router = useRouter()
    const email = ref('')
    const password = ref('')
    const confirm = ref('')
    const loading = ref(false)
    const error = ref('')
    const info = ref('')

    const onSubmit = async () => {
        error.value = ''
        info.value = ''

        if (password.value !== confirm.value) {
            error.value = 'As senhas não conferem.'
            return
        }

        loading.value = true
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email.value,
                password: password.value,
            })
            if (signUpError) throw signUpError

            // Se sua política de confirmação estiver ativa, session virá null
            if (data.session) {
                // Sessão criada, enviar para o dashboard
                router.push({ name: 'dashboard' })
            } else {
                info.value = 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
            }
        } catch (e) {
            error.value = e.message || 'Erro ao cadastrar.'
        } finally {
            loading.value = false
        }
    }
</script>

<style scoped>
    .auth-container {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 20px;
    }
    .auth-card {
        width: 100%;
        max-width: 420px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        padding: 28px;
    }
    h2 {
        margin-bottom: 16px;
        color: #2c3e50;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 12px;
    }
    label {
        font-size: 0.9rem;
        color: #555;
        margin-bottom: 6px;
    }
    input {
        padding: 10px 12px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        font-size: 1rem;
    }
    .btn {
        width: 100%;
        padding: 10px 12px;
        background: #007bff;
        color: #fff;
        border: 0;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 8px;
    }
    .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    .error {
        color: #d9534f;
        margin: 6px 0;
    }
    .info {
        color: #2a7a2a;
        margin: 6px 0;
    }
    .alt {
        margin-top: 14px;
        text-align: center;
    }
</style>
