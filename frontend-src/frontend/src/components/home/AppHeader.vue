<template>
	<header
		:class="{ 'has-background': background, 'menu-active': menuActive }"
		aria-label="main navigation"
		class="navbar d-print-none"
	>
		<!-- Jira-style layout: [toggle + logo] [search + create] [actions + user] -->
		<div class="navbar-start">
			<MenuButton />
			<RouterLink
				:to="{ name: 'home' }"
				class="logo-link"
				:aria-label="$t('navigation.home')"
			>
				<Logo
					width="120"
					height="32"
				/>
			</RouterLink>
		</div>

		<div class="navbar-center">
			<OpenQuickActions />
			<CreateMenu />
		</div>

		<div class="navbar-end">
			<TimerBadge />
			<Notifications />
			<BaseButton
				v-tooltip="isDark ? $t('user.settings.appearance.colorScheme.light') : $t('user.settings.appearance.colorScheme.dark')"
				class="trigger-button theme-toggle-button"
				:aria-label="isDark ? $t('user.settings.appearance.colorScheme.light') : $t('user.settings.appearance.colorScheme.dark')"
				@click="toggleTheme"
			>
				<Icon :icon="isDark ? 'sun' : 'moon'" />
			</BaseButton>
			<Dropdown>
				<template #trigger="{ toggleOpen, open }">
					<BaseButton
						v-tooltip="authStore.userDisplayName"
						class="username-dropdown-trigger"
						:aria-label="authStore.userDisplayName"
						:aria-expanded="open"
						@click="toggleOpen"
					>
						<UserAvatar
							:user="authStore.info"
							:size="28"
							class="avatar"
						/>
					</BaseButton>
				</template>

				<DropdownItem :to="{ name: 'user.settings' }">
					{{ $t('user.settings.title') }}
				</DropdownItem>
				<DropdownItem
					v-if="adminPanelEnabled && authStore.info?.is_admin"
					:to="{ name: 'admin.overview' }"
				>
					{{ $t('admin.title') }}
				</DropdownItem>
				<DropdownItem
					v-if="imprintUrl"
					:href="imprintUrl"
				>
					{{ $t('navigation.imprint') }}
				</DropdownItem>
				<DropdownItem
					v-if="privacyPolicyUrl"
					:href="privacyPolicyUrl"
				>
					{{ $t('navigation.privacy') }}
				</DropdownItem>
				<DropdownItem @click="baseStore.setKeyboardShortcutsActive(true)">
					{{ $t('keyboardShortcuts.title') }}
				</DropdownItem>
				<DropdownItem :to="{ name: 'about' }">
					{{ $t('about.title') }}
				</DropdownItem>
				<DropdownItem @click="authStore.logout()">
					{{ $t('user.auth.logout') }}
				</DropdownItem>
			</Dropdown>
		</div>
	</header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { PRO_FEATURE } from '@/constants/proFeatures'

import Dropdown from '@/components/misc/Dropdown.vue'
import DropdownItem from '@/components/misc/DropdownItem.vue'
import Notifications from '@/components/notifications/Notifications.vue'
import TimerBadge from '@/components/time-tracking/TimerBadge.vue'
import Logo from '@/components/home/Logo.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import MenuButton from '@/components/home/MenuButton.vue'
import OpenQuickActions from '@/components/misc/OpenQuickActions.vue'
import UserAvatar from '@/components/misc/UserAvatar.vue'
import CreateMenu from '@/components/home/CreateMenu.vue'

import { useBaseStore } from '@/stores/base'
import { useConfigStore } from '@/stores/config'
import { useAuthStore } from '@/stores/auth'
import {useColorScheme} from '@/composables/useColorScheme'

const { isDark, toggleTheme } = useColorScheme()
const baseStore = useBaseStore()
const background = computed(() => baseStore.background)
const menuActive = computed(() => baseStore.menuActive)

const authStore = useAuthStore()

const configStore = useConfigStore()
const imprintUrl = computed(() => configStore.legal.imprint_url)
const privacyPolicyUrl = computed(() => configStore.legal.privacy_policy_url)
const adminPanelEnabled = computed(() => configStore.isProFeatureEnabled(PRO_FEATURE.ADMIN_PANEL))
</script>

<style lang="scss" scoped>
$user-dropdown-width-mobile: 5rem;

.navbar {
	--navbar-button-min-width: 40px;
	--navbar-gap-width: 1rem;
	--navbar-icon-size: 1.25rem;

	position: fixed;
	inset-block-start: 0;
	inset-inline-start: 0;
	inset-inline-end: 0;
	z-index: 30;

	display: flex;
	align-items: center;
	gap: var(--navbar-gap-width);
	block-size: $navbar-height;
	padding-inline: .5rem .75rem;

	background: var(--ui-background);
	border-block-end: 1px solid var(--ui-border);

	&.menu-active {
		@media screen and (max-width: $tablet) {
			z-index: 0;
		}
	}

	// FIXME: notifications should provide a slot for the icon instead, so that we can style it as we want
	:deep() {
		// Jira-style square icon buttons (notifications, timer, theme)
		.trigger-button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-inline-size: 2rem;
			block-size: 2rem;
			border-radius: 4px;
			color: var(--ui-muted-foreground);
			font-size: var(--navbar-icon-size);
			transition: color $transition, background-color $transition;

			&:hover {
				color: var(--ui-foreground);
				background: var(--ui-secondary);
			}
		}
	}
}

.navbar-start,
.navbar-end {
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	gap: .25rem;
}

// Search grows to fill the middle, with Create right next to it (as in Jira)
.navbar-center {
	flex: 1 1 auto;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: .5rem;
	min-inline-size: 0;

	:deep([data-slot='search-trigger']) {
		@media screen and (min-width: $tablet) {
			flex: 1 1 auto;
			max-inline-size: 48rem;
		}
	}
}

.logo-link {
	display: none;

	@media screen and (min-width: $tablet) {
		display: flex;
		align-items: center;
		padding-inline: .25rem;
	}
}

.username-dropdown-trigger {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	inline-size: 2rem;
	block-size: 2rem;
	border-radius: 100%;
	margin-inline-start: .25rem;

	&:hover,
	&:focus-visible {
		box-shadow: 0 0 0 2px var(--ui-secondary);
	}
}

.avatar {
	border-radius: 100%;
	vertical-align: middle;
}
</style>
