<template>
	<div class="login-view">
		<Message
			v-if="confirmedEmailSuccess"
			variant="success"
			text-align="center"
			class="mbe-4"
		>
			{{ $t('user.auth.confirmEmailSuccess') }}
		</Message>
		<Message
			v-if="errorMessage"
			variant="danger"
			class="mbe-4"
		>
			{{ errorMessage }}
		</Message>

		<DesktopLogin v-if="isDesktop" />

		<form
			v-if="!isDesktop && (localAuthEnabled || ldapAuthEnabled)"
			id="loginform"
			class="login-form"
			@submit.prevent="submit"
		>
			<FormField
				id="username"
				ref="usernameRef"
				v-focus
				:label="$t('user.auth.usernameEmail')"
				name="username"
				:placeholder="$t('user.auth.usernamePlaceholder')"
				required
				type="text"
				autocomplete="username"
				:error="usernameValid ? null : $t('user.auth.usernameRequired')"
				@keyup.enter="submit"
				@focusout="validateUsernameField()"
				@input="handleUsernameInput"
			/>
			<div class="field">
				<div class="label-with-link">
					<label
						class="label"
						for="password"
					>{{ $t('user.auth.password') }}</label>
					<RouterLink
						v-if="localAuthEnabled"
						:to="{ name: 'user.password-reset.request' }"
						class="reset-password-link"
					>
						{{ $t('user.auth.forgotPassword') }}
					</RouterLink>
				</div>
				<Password
					v-model="password"
					:validate-initially="validatePasswordInitially"
					:validate-min-length="false"
					@submit="submit"
				/>
			</div>
			<FormField
				v-if="needsTotpPasscode"
				id="totpPasscode"
				ref="totpPasscode"
				v-focus
				:label="$t('user.auth.totpTitle')"
				autocomplete="one-time-code"
				:placeholder="$t('user.auth.totpPlaceholder')"
				required
				type="text"
				inputmode="numeric"
				@keyup.enter="submit"
			/>
			<div class="login-options">
				<FormCheckbox
					v-model="rememberMe"
					:label="$t('user.auth.remember')"
					class="remember-checkbox"
				/>
			</div>

			<XButton
				:loading="isLoading"
				class="is-fullwidth login-submit-btn"
				@click="submit"
			>
				{{ $t('user.auth.login') }}
			</XButton>
			<p
				v-if="registrationEnabled"
				class="register-prompt"
			>
				{{ $t('user.auth.noAccountYet') }}
				<RouterLink
					:to="{ name: 'user.register' }"
					class="register-link"
				>
					{{ $t('user.auth.createAccount') }}
				</RouterLink>
			</p>
		</form>

		<div
			v-if="!isDesktop && hasOpenIdProviders"
			class="openid-section mbs-4"
		>
			<div class="auth-divider">
				<span>{{ $t('misc.or') || 'o' }}</span>
			</div>
			<XButton
				v-for="(p, k) in openidConnect.providers"
				:key="k"
				variant="secondary"
				class="is-fullwidth openid-button mbs-2"
				@click="redirectToProvider(p)"
			>
				{{ $t('user.auth.loginWith', {provider: p.name}) }}
			</XButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import type {VikunjaErrorModel} from '@/client/generated'
import {computed, onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute, useRouter} from 'vue-router'
import {useDebounceFn} from '@vueuse/core'

import Message from '@/components/misc/Message.vue'
import Password from '@/components/input/Password.vue'
import FormField from '@/components/input/FormField.vue'
import FormCheckbox from '@/components/input/FormCheckbox.vue'
import DesktopLogin from '@/views/user/DesktopLogin.vue'

import {getErrorText} from '@/message'
import {getAutoRedirectProvider, redirectToProvider} from '@/helpers/redirectToProvider'
import {useRedirectToLastVisited} from '@/composables/useRedirectToLastVisited'
import {isDesktopApp} from '@/helpers/desktopAuth'
import {REDIRECT_HASH_PREFIX} from '@/constants/redirectHash'
import {ERROR_CODE_TOTP_REQUIRED} from '@/constants/auth'

import {useAuthStore, JUST_LOGGED_OUT_KEY} from '@/stores/auth'
import {useConfigStore} from '@/stores/config'

import {useTitle} from '@/composables/useTitle'

const {t} = useI18n({useScope: 'global'})
useTitle(() => t('user.auth.login'))

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const configStore = useConfigStore()
const {redirectIfSaved} = useRedirectToLastVisited()

const registrationEnabled = computed(() => configStore.auth.local.registration_enabled)
const localAuthEnabled = computed(() => configStore.auth.local.enabled)
const ldapAuthEnabled = computed(() => configStore.auth.ldap.enabled)

const openidConnect = computed(() => configStore.auth.openid_connect)
const hasOpenIdProviders = computed(() => openidConnect.value.enabled && openidConnect.value.providers?.length > 0)

const isLoading = computed(() => authStore.isLoading)
const isDesktop = isDesktopApp()

const confirmedEmailSuccess = ref(false)
const errorMessage = ref('')
const password = ref('')
const validatePasswordInitially = ref(false)
const rememberMe = ref(false)

const authenticated = computed(() => authStore.authenticated)

onBeforeMount(() => {
	authStore.verifyEmail().then((confirmed) => {
		confirmedEmailSuccess.value = confirmed
	}).catch((e: Error) => {
		errorMessage.value = e.message
	})

	if (authenticated.value) {
		router.push({name: 'home'})
		return
	}

	const justLoggedOut = sessionStorage.getItem(JUST_LOGGED_OUT_KEY) !== null
	if (justLoggedOut) {
		sessionStorage.removeItem(JUST_LOGGED_OUT_KEY)
	}

	const autoRedirectProvider = getAutoRedirectProvider({
		localAuthEnabled: localAuthEnabled.value,
		ldapAuthEnabled: ldapAuthEnabled.value,
		openIdEnabled: openidConnect.value.enabled,
		providers: openidConnect.value.providers ?? [],
		isDesktopApp: isDesktop,
		justLoggedOut,
		hasCopyableRedirect: route.hash.startsWith(REDIRECT_HASH_PREFIX),
	})
	if (autoRedirectProvider) {
		redirectToProvider(autoRedirectProvider)
	}
})

const usernameTouched = ref(false)
const usernameValid = ref(true)
const usernameRef = ref<HTMLInputElement | null>(null)
const validateUsernameField = useDebounceFn(() => {
	if (!usernameTouched.value && (usernameRef.value?.value === '' || !usernameRef.value)) {
		return
	}
	usernameValid.value = usernameRef.value?.value !== ''
}, 100)

function handleUsernameInput() {
	usernameTouched.value = true
	validateUsernameField()
}

const needsTotpPasscode = computed(() => authStore.needsTotpPasscode)
const totpPasscode = ref<HTMLInputElement | null>(null)

async function submit() {
	errorMessage.value = ''
	usernameTouched.value = true
	
	const credentials: Parameters<typeof authStore.login>[0] = {
		username: usernameRef.value?.value,
		password: password.value,
		longToken: rememberMe.value,
	}

	if (credentials.username === '' || credentials.password === '') {
		usernameValid.value = credentials.username !== ''
		validatePasswordInitially.value = true
		return
	}

	if (needsTotpPasscode.value) {
		credentials.totpPasscode = totpPasscode.value?.value
	}

	try {
		await authStore.login(credentials)
		authStore.setNeedsTotpPasscode(false)

		redirectIfSaved()
	} catch (e) {
		if ((e as VikunjaErrorModel)?.code === ERROR_CODE_TOTP_REQUIRED && !credentials.totpPasscode) {
			return
		}

		errorMessage.value = getErrorText(e)
	}
}
</script>

<style lang="scss" scoped>
.login-form {
	display: flex;
	flex-direction: column;
}

:deep(.field) {
	margin-block-end: 1.15rem;

	.label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-strong);
		margin-block-end: 0.35rem;
		letter-spacing: -0.01em;
	}

	.input {
		height: 2.75rem;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		padding-inline: 0.875rem;
		background: var(--input-background-color, var(--white));
		border: 1px solid var(--border);
		color: var(--text-strong);
		caret-color: var(--primary);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		transition: all 0.15s ease;

		&::placeholder {
			color: var(--input-placeholder-color, var(--grey-400));
			opacity: 0.85;
		}

		&:hover {
			border-color: var(--border-hover, var(--grey-400));
		}

		&:focus {
			background: var(--input-background-color, var(--white));
			border-color: var(--primary);
			box-shadow: 0 0 0 3px hsla(var(--primary-hsl), 0.2), 0 1px 2px rgba(0, 0, 0, 0.05) !important;
			outline: none;
		}

		&:-webkit-autofill,
		&:-webkit-autofill:hover,
		&:-webkit-autofill:focus {
			-webkit-text-fill-color: var(--text-strong);
			-webkit-box-shadow: 0 0 0px 1000px var(--input-background-color, var(--white)) inset;
			transition: background-color 5000s ease-in-out 0s;
		}

		&[aria-invalid="true"] {
			border-color: var(--danger) !important;
			box-shadow: 0 0 0 3px hsla(var(--danger-h), var(--danger-s), var(--danger-l), 0.2) !important;
		}
	}

	.password-field .input {
		padding-inline-end: 2.75rem;
	}

	.help.is-danger {
		font-size: 0.775rem;
		color: var(--danger-text) !important;
		font-weight: 500;
		margin-block-start: 0.35rem;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
}

.label-with-link {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-block-end: 0.35rem;

	.label {
		margin-block-end: 0;
	}
}

.reset-password-link {
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--primary);
	text-decoration: none;
	transition: color 0.15s ease;

	&:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
}

.login-options {
	margin-block: 0.5rem 1.35rem;

	:deep(.checkbox) {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text);
		user-select: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;

		input[type="checkbox"] {
			accent-color: var(--primary);
			inline-size: 1rem;
			block-size: 1rem;
			cursor: pointer;
		}
	}
}

.login-submit-btn {
	height: 2.75rem !important;
	border-radius: 8px !important;
	font-size: 0.95rem !important;
	font-weight: 600 !important;
	letter-spacing: 0.01em !important;
	background: var(--primary-fill) !important;
	color: #ffffff !important;
	border: none !important;
	box-shadow: 0 2px 8px rgba(227, 6, 19, 0.3) !important;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;

	&:hover {
		background: hsl(var(--primary-h), var(--primary-s), 40%) !important;
		box-shadow: 0 4px 14px rgba(227, 6, 19, 0.45) !important;
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}
}

.register-prompt {
	margin-block-start: 1.35rem;
	font-size: 0.875rem;
	color: var(--text-muted);
	text-align: center;

	.register-link {
		color: var(--primary);
		font-weight: 600;
		text-decoration: none;
		margin-inline-start: 0.25rem;
		transition: color 0.15s ease;

		&:hover {
			text-decoration: underline;
			text-underline-offset: 2px;
		}
	}
}

.openid-section {
	.auth-divider {
		display: flex;
		align-items: center;
		text-align: center;
		margin-block: 1.25rem 1rem;
		color: var(--text-muted);
		font-size: 0.8rem;

		&::before, &::after {
			content: '';
			flex: 1;
			border-bottom: 1px solid var(--card-border-color);
		}

		span {
			padding-inline: 0.75rem;
			text-transform: lowercase;
		}
	}

	.openid-button {
		height: 2.5rem;
		border-radius: 10px;
		font-weight: 500;
		font-size: 0.875rem;
		backdrop-filter: blur(8px);
	}
}
</style>
