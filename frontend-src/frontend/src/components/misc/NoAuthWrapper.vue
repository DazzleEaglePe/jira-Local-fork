<template>
	<div class="no-auth-wrapper">
		<div
			class="auth-bg-ambient"
			aria-hidden="true"
		/>

		<!-- Floating theme toggle button -->
		<BaseButton
			v-tooltip="isDark ? $t('user.settings.appearance.colorScheme.light') : $t('user.settings.appearance.colorScheme.dark')"
			class="auth-theme-toggle"
			:aria-label="isDark ? $t('user.settings.appearance.colorScheme.light') : $t('user.settings.appearance.colorScheme.dark')"
			@click="toggleTheme"
		>
			<Icon :icon="isDark ? 'sun' : 'moon'" />
		</BaseButton>

		<div class="noauth-card">
			<div class="logo-wrapper">
				<Logo
					class="logo"
					width="180"
					height="50"
				/>
			</div>
			<main
				id="main-content"
				tabindex="-1"
				class="content"
			>
				<h2
					v-if="title"
					class="title"
				>
					{{ title }}
				</h2>
				<p
					v-if="authSubtitle"
					class="auth-subtitle"
				>
					{{ authSubtitle }}
				</p>
				<ApiConfig v-if="shouldShowApiConfig" />
				<Message
					v-if="motd !== ''"
					class="mbe-4"
				>
					{{ motd }}
				</Message>
				<slot />
			</main>
			<Legal class="legal" />
			<div class="creator-credit">
				Creado por Jacn_159
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import Logo from '@/components/home/Logo.vue'
import Message from '@/components/misc/Message.vue'
import Legal from '@/components/misc/Legal.vue'
import ApiConfig from '@/components/misc/ApiConfig.vue'
import BaseButton from '@/components/base/BaseButton.vue'

import { useColorScheme } from '@/composables/useColorScheme'
import { useTitle } from '@/composables/useTitle'
import { useConfigStore } from '@/stores/config'
import { isDesktopApp } from '@/helpers/desktopAuth'

const props = withDefaults(
	defineProps<{
		showApiConfig?: boolean;
	}>(),
	{
		showApiConfig: false,
	},
)

const isDesktop = isDesktopApp()
const hasStoredApiUrl = isDesktop && localStorage.getItem('API_URL') !== null
const shouldShowApiConfig = computed(() => props.showApiConfig && (!isDesktop || hasStoredApiUrl))

const configStore = useConfigStore()
const motd = computed(() => configStore.motd)

const { isDark, toggleTheme } = useColorScheme()

const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const title = computed(() =>
	route.meta?.title ? t(route.meta.title as string) : '',
)

const authSubtitle = computed(() => {
	if (route.name === 'user.login') {
		return 'Tu espacio de trabajo y productividad'
	}
	if (route.name === 'user.register') {
		return 'Crea tu cuenta para comenzar'
	}
	return ''
})

useTitle(() => title.value)
</script>

<style lang="scss" scoped>
.no-auth-wrapper {
	min-block-size: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2.5rem 1.25rem;
	position: relative;
	overflow: hidden;
	background-color: var(--site-background);
}

.auth-bg-ambient {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;
	z-index: 0;
	background: radial-gradient(circle at 50% 0%, hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.08) 0%, transparent 65%);
}

.auth-theme-toggle {
	position: absolute;
	inset-block-start: 1.5rem;
	inset-inline-end: 1.5rem;
	z-index: 10;
	inline-size: 2.5rem;
	block-size: 2.5rem;
	border-radius: 9999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: var(--white);
	border: 1px solid var(--border-light);
	color: var(--text);
	cursor: pointer;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
	transition: all $transition;

	&:hover {
		color: var(--primary);
		background: var(--white);
		transform: scale(1.05);
		border-color: var(--primary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}
}

.noauth-card {
	position: relative;
	z-index: 1;
	inline-size: 100%;
	max-inline-size: 430px;
	padding: 2.75rem 2.25rem 2.25rem;
	border-radius: 20px;
	background: var(--white);
	border: 1px solid var(--border-light);
	box-shadow:
		0 20px 40px -15px rgba(15, 23, 42, 0.08),
		0 0 0 1px rgba(15, 23, 42, 0.04),
		0 2px 4px rgba(15, 23, 42, 0.02);
	transition: all 0.25s ease-out;
}

.logo-wrapper {
	display: flex;
	justify-content: center;
	margin-block-end: 1.5rem;

	.logo {
		display: flex;
		justify-content: center;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.02);
		}
	}
}

.title {
	text-align: center;
	font-size: 1.625rem;
	font-weight: 700;
	letter-spacing: -0.025em;
	color: var(--text-strong);
	margin-block-end: 0.35rem;
}

.auth-subtitle {
	text-align: center;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--text-muted);
	margin-block-end: 1.35rem;
}

:deep(.api-config) {
	margin-block-end: 1.35rem;
	display: flex;
	justify-content: center;

	.api-url-info {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		text-align: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		background: var(--grey-100);
		padding: 0.35rem 0.9rem;
		border-radius: 12px;
		border: 1px solid var(--border-light);
		line-height: 1.3;

		.url {
			font-weight: 600;
			color: var(--text-strong);
		}

		br {
			display: none;
		}

		.api-config__change-button {
			color: var(--primary);
			font-weight: 600;
			margin-inline-start: 0.25rem;
			text-decoration: underline;
			text-underline-offset: 2px;
			cursor: pointer;

			&:hover {
				color: var(--text-strong);
			}
		}
	}
}

.legal {
	margin-block-start: 1.75rem;
	text-align: center;
	font-size: 0.75rem;
	color: var(--text-muted);

	:deep(a), :deep(.button) {
		color: var(--text-muted);
		transition: color $transition;

		&:hover {
			color: var(--primary);
		}
	}
}

.creator-credit {
	margin-block-start: 1rem;
	text-align: center;
	font-size: 0.8rem;
	font-weight: 600;
	color: var(--text-muted);
	letter-spacing: 0.02em;
}
</style>
