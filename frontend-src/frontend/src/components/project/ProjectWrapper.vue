<template>
	<div
		class="loader-container"
		:class="{
			'is-loading': isLoadingProject,
			'is-archived': currentProject.is_archived,
		}"
	>
		<!-- Jira-style page header: project title above the view tabs -->
		<div class="project-page-header">
			<span
				v-if="projectColor"
				class="project-page-color"
				:style="{'background-color': projectColor}"
			/>
			<h1 class="project-page-title">
				{{ getProjectTitle(currentProject) }}
			</h1>
		</div>

		<div
			ref="switchViewContainerRef"
			class="switch-view-container d-print-none"
			:class="{'is-justify-content-flex-end': views.length === 1}"
		>
			<!-- Dropdown mode when buttons overflow -->
			<Dropdown
				v-if="isOverflowing && views.length > 1"
				class="switch-view-dropdown"
			>
				<template #trigger="{ toggleOpen, open }">
					<BaseButton
						class="switch-view switch-view-dropdown-trigger"
						:aria-expanded="open"
						@click="toggleOpen"
					>
						{{ activeViewTitle }}
						<Icon
							icon="chevron-down"
							class="dropdown-icon"
						/>
					</BaseButton>
				</template>
				<template #default="{ close }">
					<div @click="close">
						<DropdownItem
							v-for="view in views"
							:key="view.id"
							:to="getViewRoute(view)"
							:class="{'is-active': view.id === viewId}"
						>
							{{ getViewTitle(view) }}
						</DropdownItem>
					</div>
				</template>
			</Dropdown>

			<!-- Inline buttons, hidden when overflowing but kept in DOM for width measurement -->
			<div
				v-if="views.length > 1"
				ref="switchViewRef"
				class="switch-view"
				:class="{'switch-view--hidden': isOverflowing || !overflowChecked}"
				:aria-hidden="isOverflowing || undefined"
			>
				<BaseButton
					v-for="view in views"
					:key="view.id"
					class="switch-view-button"
					:class="{'is-active': view.id === viewId}"
					:to="getViewRoute(view)"
					:tabindex="isOverflowing ? -1 : undefined"
				>
					<component
						:is="getViewIcon(view)"
						class="switch-view-icon"
					/>
					{{ getViewTitle(view) }}
				</BaseButton>
			</div>
		</div>
		<div class="project-toolbar d-print-none">
			<slot name="header" />
		</div>
		<CustomTransition name="fade">
			<Message
				v-if="currentProject.is_archived"
				variant="warning"
				class="mbe-4"
			>
				{{ $t('project.archivedMessage') }}
			</Message>
		</CustomTransition>

		<slot v-if="!isLoadingProject" />
	</div>
</template>

<script setup lang="ts">
import {computed, ref, watch, nextTick, onMounted} from 'vue'
import {useResizeObserver} from '@vueuse/core'
import {useI18n} from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import Dropdown from '@/components/misc/Dropdown.vue'
import DropdownItem from '@/components/misc/DropdownItem.vue'
import Icon from '@/components/misc/Icon'
import Message from '@/components/misc/Message.vue'
import CustomTransition from '@/components/misc/CustomTransition.vue'

import {ChartGantt, LayoutGrid, List, SquareKanban, Table} from '@lucide/vue'

import {getProjectTitle} from '@/helpers/getProjectTitle'
import {getHexColor} from '@/helpers/task'
import {useTitle} from '@/composables/useTitle'

import {useViewFiltersStore} from '@/stores/viewFilters'
import {useCurrentProject} from '@/composables/useCurrentProject'

import type {ProjectView} from '@/client/generated'
import {normalizeProject} from '@/client/queries/projects'

const props = defineProps<{
	isLoadingProject: boolean,
	projectId: number,
	viewId: number,
}>()

const {t} = useI18n()

const viewFiltersStore = useViewFiltersStore()
const {currentProject: queriedProject} = useCurrentProject()

const switchViewContainerRef = ref<HTMLElement>()
const switchViewRef = ref<HTMLElement>()
const isOverflowing = ref(false)
const overflowChecked = ref(false)

function checkOverflow() {
	if (!switchViewRef.value || !switchViewContainerRef.value) {
		return
	}
	const buttonsWidth = switchViewRef.value.scrollWidth
	const containerWidth = switchViewContainerRef.value.clientWidth
	isOverflowing.value = buttonsWidth > containerWidth
	overflowChecked.value = true
}

onMounted(() => {
	checkOverflow()
})

useResizeObserver(switchViewContainerRef, () => {
	requestAnimationFrame(() => checkOverflow())
})

const currentProject = computed(() => queriedProject.value ?? normalizeProject({id: 0}))
useTitle(() => currentProject.value?.id ? getProjectTitle(currentProject.value) : '')

const views = computed(() => currentProject.value.views)

const activeViewTitle = computed(() => {
	const activeView = views.value.find((view: ProjectView) => view.id === props.viewId)
	return activeView ? getViewTitle(activeView) : ''
})

// Re-check overflow when views change
watch(views, () => {
	nextTick(() => checkOverflow())
})

function getViewTitle(view: ProjectView) {
	switch (view.title) {
		case 'List':
			return t('project.list.title')
		case 'Gantt':
			return t('project.gantt.title')
		case 'Table':
			return t('project.table.title')
		case 'Kanban':
			return t('project.kanban.title')
	}

	return view.title ?? ''
}

const projectColor = computed(() => getHexColor(currentProject.value.hex_color))

const VIEW_ICONS = {list: List, gantt: ChartGantt, table: Table, kanban: SquareKanban}

function getViewIcon(view: ProjectView) {
	return view.view_kind ? VIEW_ICONS[view.view_kind] : LayoutGrid
}

function getViewRoute(view: ProjectView) {
	const viewId = view.id ?? 0
	const storedQuery = viewFiltersStore.getViewQuery(viewId)
	return {
		name: 'project.view',
		params: {projectId: props.projectId, viewId},
		query: storedQuery,
	}
}
</script>

<style lang="scss" scoped>
.project-page-header {
	display: flex;
	align-items: center;
	gap: .5rem;
	margin-block-end: .75rem;
}

.project-page-color {
	flex: 0 0 auto;
	inline-size: 1.5rem;
	block-size: 1.5rem;
	border-radius: 4px;
}

.project-page-title {
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	line-height: 1.25;
	color: var(--ui-foreground);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

// Jira-style view tabs with a full-width divider underneath
.switch-view-container {
	position: relative;
	min-block-size: $switch-view-height;
	margin-block-end: 1rem;
	border-block-end: 1px solid var(--ui-border);

	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 1rem;
}

.project-toolbar {
	display: flex;
	align-items: center;
	gap: .5rem;
	margin-block-end: 1rem;

	&:empty {
		display: none;
	}
}

.switch-view {
	display: inline-flex;
	gap: 1rem;
	font-size: .875rem;
}

.switch-view-icon {
	inline-size: 1rem;
	block-size: 1rem;
}

.switch-view--hidden {
	position: absolute;
	visibility: hidden;
	pointer-events: none;
	white-space: nowrap;
	inset-inline-start: 0;
	inset-inline-end: 0;
	overflow: hidden;
}

.switch-view-dropdown-trigger {
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: .25rem;
	font-weight: bold;
	color: var(--switch-view-color);
	background: var(--switch-view-active-background);
}

.dropdown-icon {
	font-size: .6rem;
}

.switch-view-button {
	display: inline-flex;
	align-items: center;
	gap: .375rem;
	padding: .5rem .125rem;
	white-space: nowrap;
	color: var(--ui-muted-foreground);
	font-weight: 500;
	border-block-end: 2px solid transparent;
	margin-block-end: -1px;
	transition: color 100ms, border-color 100ms;

	&:hover {
		color: var(--ui-foreground);
		border-block-end-color: var(--ui-border);
	}

	&.is-active {
		color: var(--ui-accent-foreground);
		border-block-end-color: var(--ui-accent-foreground);
	}
}

// FIXME: this should be in notification and set via a prop
.is-archived .notification.is-warning {
	margin-block-end: 1rem;
}

</style>
