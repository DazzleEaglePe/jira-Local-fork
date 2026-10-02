<template>
	<header
		:class="{ 'has-background': background, 'menu-active': menuActive }"
		aria-label="main navigation"
		class="navbar d-print-none"
	>
		<RouterLink
			:to="{ name: 'home' }"
			class="logo-link"
			:aria-label="$t('navigation.home')"
		>
			<Logo
				width="164"
				height="48"
			/>
		</RouterLink>

		<MenuButton class="menu-button" />

		<div
			v-if="currentProject?.id"
			class="project-title-wrapper"
		>
			<Breadcrumb
				:aria-label="$t('navigation.breadcrumb')"
				class="tw:min-w-0"
			>
				<BreadcrumbList class="tw:flex-nowrap">
					<BreadcrumbItem class="tw:hidden tw:md:inline-flex">
						<BreadcrumbLink as-child>
							<RouterLink :to="{ name: 'projects.index' }">
								{{ $t('project.projects') }}
							</RouterLink>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<template
						v-for="ancestor in projectAncestors"
						:key="ancestor.id"
					>
						<BreadcrumbSeparator class="tw:hidden tw:md:block" />
						<BreadcrumbItem class="tw:hidden tw:md:inline-flex">
							<BreadcrumbLink as-child>
								<RouterLink :to="{ name: 'project.index', params: { projectId: ancestor.id } }">
									{{ getProjectTitle(ancestor) }}
								</RouterLink>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</template>
					<BreadcrumbSeparator class="tw:hidden tw:md:block" />
					<BreadcrumbItem class="tw:min-w-0">
						<BreadcrumbPage class="project-title">
							{{ currentProject.title === '' ? $t('misc.loading') : getProjectTitle(currentProject) }}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<BaseButton
				v-if="!isEditorContentEmpty(currentProject.description)"
				:to="{ name: 'project.info', params: { projectId: currentProject.id } }"
				class="project-title-button"
			>
				<span class="is-sr-only">{{ $t('project.description') }}</span>
				<Icon icon="circle-info" />
			</BaseButton>

			<ProjectSettingsDropdown
				v-if="canWriteCurrentProject && currentProject.id !== -1"
				class="project-title-dropdown"
				:project="currentProject"
			>
				<template #trigger="{ toggleOpen, open }">
					<BaseButton
						class="project-title-button"
						:aria-expanded="open"
						@click="toggleOpen"
					>
						<span class="is-sr-only">{{ $t('project.openSettingsMenu') }}</span>
						<Icon
							icon="ellipsis-h"
							class="icon"
						/>
					</BaseButton>
				</template>
			</ProjectSettingsDropdown>
		</div>

		<div
			v-else-if="pageTitle"
			class="project-title-wrapper"
		>
			<span class="project-title">{{ pageTitle }}</span>
		</div>

		<div class="navbar-end">
			<OpenQuickActions />
			<CreateMenu />
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
						class="username-dropdown-trigger"
						variant="secondary"
						:shadow="false"
						:aria-expanded="open"
						@click="toggleOpen"
					>
						<UserAvatar
							:user="authStore.info"
							:size="40"
							class="avatar"
						/>
						<span class="username">{{ authStore.userDisplayName }}</span>
						<span
							class="mis-1 dropdown-icon icon is-small"
							:style="{
								transform: open ? 'rotate(180deg)' : 'rotate(0)',
							}"
						>
							<Icon icon="chevron-down" />
						</span>
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
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { PERMISSIONS as Permissions } from '@/constants/permissions'
import { PRO_FEATURE } from '@/constants/proFeatures'

import ProjectSettingsDropdown from '@/components/project/ProjectSettingsDropdown.vue'
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
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from '@/components/ui/breadcrumb'

import { getProjectTitle } from '@/helpers/getProjectTitle'
import { isEditorContentEmpty } from '@/helpers/editorContentEmpty'

import { useBaseStore } from '@/stores/base'
import { useConfigStore } from '@/stores/config'
import { useAuthStore } from '@/stores/auth'
import {useCurrentProject} from '@/composables/useCurrentProject'
import {useColorScheme} from '@/composables/useColorScheme'
import {useProjects} from '@/composables/useProjects'

const { isDark, toggleTheme } = useColorScheme()
const baseStore = useBaseStore()
const {currentProject} = useCurrentProject()
const projectList = useProjects()
// Parents of the current project, shown in the breadcrumb before its title
const projectAncestors = computed(() =>
	currentProject.value ? projectList.getAncestors(currentProject.value).slice(0, -1) : [],
)
const background = computed(() => baseStore.background)
const canWriteCurrentProject = computed(() =>
	currentProject.value?.max_permission !== null &&
	currentProject.value?.max_permission !== undefined &&
	currentProject.value.max_permission > Permissions.READ,
)
const menuActive = computed(() => baseStore.menuActive)

// Standalone pages (no project) surface their route's title in the header.
const route = useRoute()
const { t } = useI18n()
const pageTitle = computed(() => {
	const title = route.meta.title as string | undefined
	return title ? t(title) : ''
})

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
	justify-content: space-between;
	gap: var(--navbar-gap-width);
	min-block-size: $navbar-height;

	background: var(--white);
	border-block-end: 1px solid var(--border-light);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

	@media screen and (min-width: $tablet) {
		padding-inline-start: 2rem;
		align-items: stretch;
	}

	&.menu-active {
		@media screen and (max-width: $tablet) {
			z-index: 0;
		}
	}

	// FIXME: notifications should provide a slot for the icon instead, so that we can style it as we want
	:deep() {
		.trigger-button {
			color: var(--grey-600);
			font-size: var(--navbar-icon-size);

			&:hover {
				color: var(--text-strong);
			}
		}
	}

	.theme-toggle-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--grey-600);
		font-size: var(--navbar-icon-size);
		transition: color $transition, background-color $transition;

		&:hover {
			color: var(--text-strong);
		}
	}
}

.logo-link {
	display: none;

	@media screen and (min-width: $tablet) {
		align-self: stretch;
		display: flex;
		align-items: center;
		margin-inline-end: .5rem;
	}
}

.menu-button {
	align-self: stretch;
	flex: 0 0 auto;

	@media screen and (max-width: $tablet) {
		margin-inline-start: 1rem;
	}
}

// Jira-style breadcrumb, aligned to the start right after the menu button
.project-title-wrapper {
	display: flex;
	align-items: center;

	// this makes the truncated text of the project title work
	// inside the flexbox parent
	min-inline-size: 0;
}

.project-title {
	display: block;
	font-size: .875rem;
	font-weight: 600;
	// We need the following for overflowing ellipsis to work
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}

.project-title-dropdown {
	align-self: stretch;

	.project-title-button {
		flex-grow: 1;
	}
}

.project-title-button {
	align-self: stretch;
	min-inline-size: var(--navbar-button-min-width);
	display: flex;
	place-items: center;
	justify-content: center;
	font-size: var(--navbar-icon-size);
	color: var(--grey-600);
	transition: color $transition;

	&:hover {
		color: var(--text-strong);
	}
}

.navbar-end {
	flex: 0 0 auto;
	display: flex;
	align-items: stretch;
	gap: .25rem;
	margin-inline-start: auto;

	>* {
		min-inline-size: var(--navbar-button-min-width);
	}
}

.username-dropdown-trigger {
	padding-inline-start: .75rem;
	display: inline-flex;
	align-items: center;
	font-size: .85rem;
	font-weight: 500;
	gap: .5rem;
	
	:deep(.avatar) {
		margin-inline-end: 0;
	}
	
	[dir="rtl"] & {
		flex-direction: row-reverse;
	}

	@media screen and (max-width: $tablet) {
		padding-inline-end: .5rem;
	}

	@media screen and (min-width: $tablet) {
		padding-inline-end: .75rem;
	}
}

.username {
	font-family: $vikunja-font;

	@media screen and (max-width: $tablet) {
		display: none;
	}
}

.dropdown-icon {
	transition: transform $transition;
}

.avatar {
	border-radius: 100%;
	vertical-align: middle;
	block-size: 40px;
	margin-inline-end: .5rem;
}
</style>
