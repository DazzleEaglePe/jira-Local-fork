<template>
	<aside
		:class="{'is-active': baseStore.menuActive, 'is-resizing': isResizing}"
		class="menu-container"
		:style="{'--sidebar-width': sidebarWidthStyle}"
	>
		<nav
			class="menu top-menu"
			:aria-label="$t('navigation.main')"
		>
			<RouterLink
				:to="{name: 'home'}"
				class="logo"
				:aria-label="$t('navigation.home')"
			>
				<Logo
					width="164"
					height="48"
				/>
			</RouterLink>
			<menu class="menu-list other-menu-items">
				<li>
					<RouterLink
						v-shortcut="SHORTCUTS.navigation.overview"
						:to="{ name: 'home'}"
					>
						<span class="menu-item-icon icon">
							<LayoutDashboard />
						</span>
						{{ $t('navigation.overview') }}
					</RouterLink>
				</li>
				<li>
					<RouterLink
						v-shortcut="SHORTCUTS.navigation.upcoming"
						:to="{ name: 'tasks.range'}"
					>
						<span class="menu-item-icon icon">
							<CalendarDays />
						</span>
						{{ $t('navigation.upcoming') }}
					</RouterLink>
				</li>
				<li>
					<RouterLink
						v-shortcut="SHORTCUTS.navigation.labels"
						:to="{ name: 'labels.index'}"
					>
						<span class="menu-item-icon icon">
							<Tag />
						</span>
						{{ $t('label.title') }}
					</RouterLink>
				</li>
				<li>
					<RouterLink
						v-shortcut="SHORTCUTS.navigation.teams"
						:to="{ name: 'teams.index'}"
					>
						<span class="menu-item-icon icon">
							<Users />
						</span>
						{{ $t('team.title') }}
					</RouterLink>
				</li>
				<li v-if="timeTrackingEnabled">
					<RouterLink :to="{ name: 'time-tracking'}">
						<span class="menu-item-icon icon">
							<Clock />
						</span>
						{{ $t('timeTracking.title') }}
					</RouterLink>
				</li>
			</menu>
		</nav>

		<Loading
			v-if="projectList.isLoading"
			variant="small"
		/>
		<template v-else>
			<nav
				v-if="favoriteProjects.length"
				class="menu"
				:aria-label="$t('project.pseudo.favorites.title')"
			>
				<p class="menu-section-sublabel">
					{{ $t('project.pseudo.favorites.title') }}
				</p>
				<ProjectsNavigation
					:model-value="favoriteProjects"
					:can-edit-order="false"
					:can-collapse="false"
				/>
			</nav>
			
			<nav
				v-if="savedFilterProjects.length"
				class="menu"
				:aria-label="$t('navigation.savedFilters')"
			>
				<p class="menu-section-sublabel">
					{{ $t('navigation.savedFilters') }}
				</p>
				<ProjectsNavigation
					:model-value="savedFilterProjects"
					:can-edit-order="false"
					:can-collapse="false"
				/>
			</nav>

			<nav
				class="menu"
				:aria-label="$t('project.projects')"
			>
				<!-- Jira's "Espacio  +" row: link to all projects with a quick create action -->
				<div class="menu-section-heading">
					<RouterLink
						v-shortcut="SHORTCUTS.navigation.projects"
						:to="{name: 'projects.index'}"
						class="menu-section-link"
					>
						<span class="menu-item-icon icon">
							<Orbit />
						</span>
						{{ $t('project.projects') }}
					</RouterLink>
					<RouterLink
						v-tooltip="$t('project.create.header')"
						:to="{name: 'project.create'}"
						:aria-label="$t('project.create.header')"
						class="menu-section-action"
					>
						<Plus />
					</RouterLink>
				</div>
				<ProjectsNavigation
					:model-value="projects"
					:can-edit-order="true"
					:can-collapse="true"
				/>
			</nav>
		</template>

		<PoweredByLink
			class="mbs-auto"
			utm-medium="navigation"
		/>

		<div
			v-if="!isMobile"
			class="resize-handle"
			@mousedown="startResize"
			@touchstart="startResize"
		/>
	</aside>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {CalendarDays, Clock, LayoutDashboard, Orbit, Plus, Tag, Users} from '@lucide/vue'

import {SHORTCUTS} from '@/constants/shortcuts'
import PoweredByLink from '@/components/home/PoweredByLink.vue'
import Logo from '@/components/home/Logo.vue'
import Loading from '@/components/misc/Loading.vue'

import {useBaseStore} from '@/stores/base'
import {useProjects} from '@/composables/useProjects'
import {useConfigStore} from '@/stores/config'
import {PRO_FEATURE} from '@/constants/proFeatures'
import ProjectsNavigation from '@/components/home/ProjectsNavigation.vue'
import {useSidebarResize} from '@/composables/useSidebarResize'

const baseStore = useBaseStore()
const projectList = useProjects()
const configStore = useConfigStore()

const timeTrackingEnabled = computed(() => configStore.isProFeatureEnabled(PRO_FEATURE.TIME_TRACKING))

const {sidebarWidthStyle, isResizing, startResize, isMobile} = useSidebarResize()

const projects = computed(() => projectList.notArchivedRootProjects)
const favoriteProjects = computed(() => projectList.favoriteProjects)
const savedFilterProjects = computed(() => projectList.savedFilterProjects)
</script>

<style lang="scss" scoped>
.logo {
	display: block;

	padding-inline-start: 1rem;
	margin-inline-end: 1rem;
	margin-block-end: 1rem;

	@media screen and (min-width: $tablet) {
		display: none;
	}
}

.menu-container {
	--sidebar-width: #{$navbar-width};

	display: flex;
	flex-direction: column;
	background: var(--ui-background);
	border-inline-end: 1px solid var(--ui-border);
	color: var(--ui-foreground);
	padding: .75rem 0;
	transition: transform $transition-duration ease-in;
	position: fixed;
	inset-block-start: $navbar-height;
	inset-block-end: 0;
	inset-inline-start: 0;
	transform: translateX(-100%);
	inline-size: var(--sidebar-width);
	overflow-y: auto;

	[dir="rtl"] & {
		transform: translateX(100%);
	}

	@media screen and (max-width: $tablet) {
		inset-block-start: 0;
		inline-size: 70vw;
		z-index: 20;
	}

	&.is-active {
		transform: translateX(0);
		transition: transform $transition-duration ease-out;
	}

	&.is-resizing {
		transition: none;
	}
}

.resize-handle {
	position: absolute;
	inset-block-start: 0;
	inset-block-end: 0;
	inset-inline-end: 0;
	inline-size: 4px;
	cursor: ew-resize;
	background: transparent;
	transition: background-color $transition-duration ease;
	touch-action: none;

	&:hover,
	&:active {
		background-color: var(--ui-ring);
	}
}

.top-menu .menu-list {
	li {
		font-family: $vikunja-font;
	}

	.list-menu-link,
	li > a {
		padding-inline-start: .75rem;
		gap: .75rem;
	}
}

.menu + .menu {
	padding-block-start: .5rem;
}

// Jira's "Espacio  +" row: a regular nav row whose + appears on hover
.menu-section-heading {
	display: flex;
	align-items: center;
	block-size: 32px;
	margin-inline: .5rem;
	padding-inline-end: .25rem;
	border-radius: 4px;

	&:hover {
		background: var(--ui-secondary);
	}

	@media (hover: hover) and (pointer: fine) {
		.menu-section-action {
			opacity: 0;
		}

		&:hover .menu-section-action,
		.menu-section-action:focus-visible {
			opacity: 1;
		}
	}
}

.menu-section-link {
	flex: 1 1 auto;
	display: flex;
	align-items: center;
	gap: .75rem;
	block-size: 100%;
	padding-inline-start: .75rem;
	font-size: .875rem;
	color: var(--ui-foreground);

	.menu-item-icon {
		display: inline-flex;
		color: var(--ui-muted-foreground);
	}

	svg {
		inline-size: 1rem;
		block-size: 1rem;
	}

	&.router-link-exact-active {
		color: var(--ui-accent-foreground);
		font-weight: 600;
	}
}

// Jira's small bold group label ("Recientes")
.menu-section-sublabel {
	margin: .25rem 0 .125rem;
	padding-inline: 1.25rem;
	font-size: .75rem;
	font-weight: 600;
	color: var(--ui-muted-foreground);
}

.menu-section-action {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 1.5rem;
	block-size: 1.5rem;
	border-radius: 4px;
	color: var(--ui-muted-foreground);

	svg {
		inline-size: 1rem;
		block-size: 1rem;
	}

	&:hover {
		background: var(--ui-secondary);
		color: var(--ui-foreground);
	}
}
</style>
