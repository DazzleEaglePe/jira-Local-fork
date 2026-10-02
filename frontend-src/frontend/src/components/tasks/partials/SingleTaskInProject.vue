<template>
	<div
		:data-task-id="task.id"
		:data-project-id="task.project_id"
	>
		<div
			ref="taskRoot"
			:class="{'is-loading': isLoading}"
			class="task loader-container single-task"
			tabindex="-1"
			:data-is-overdue="isOverdue || undefined"
			@click="openTaskDetail"
			@keyup.enter="openTaskDetail"
		>
			<span
				v-tooltip="!canMarkAsDone ? $t('task.readOnlyCheckbox') : ''"
				class="is-inline-flex is-align-items-center"
			>
				<FancyCheckbox
					:model-value="task.done ?? false"
					:disabled="isArchived || disabled || !canMarkAsDone"
					:aria-label="$t('task.detail.markAsDone', {task: task.title})"
					@update:modelValue="markAsDone"
					@click.stop
				/>
			</span>

			<ColorBubble
				v-if="!showProjectSeparately && projectColor !== '' && currentProject?.id !== task.project_id"
				:color="projectColor"
				class="mie-1"
			/>

			<div
				:class="{ 'done': task.done, 'show-project': showProject && project}"
				class="tasktext"
			>
				<div class="task-title-line">
					<TaskGlanceTooltip :task="task">
						<RouterLink
							ref="taskLinkRef"
							:to="taskDetailRoute"
							class="task-link"
						>
							{{ task.title }}
						</RouterLink>
					</TaskGlanceTooltip>
				</div>

				<div class="task-meta-line">
					<RouterLink
						v-if="showProject && typeof project !== 'undefined'"
						v-tooltip="$t('task.detail.belongsToProject', {project: getProjectTitle(project)})"
						:to="{ name: 'project.index', params: { projectId: task.project_id } }"
						class="task-project"
						:class="{'mie-2': task.hex_color !== ''}"
						@click.stop
					>
						{{ getProjectTitle(project) }}
					</RouterLink>

					<ColorBubble
						v-if="task.hex_color !== ''"
						:color="getHexColor(task.hex_color)"
						class="mie-1"
					/>
	
					<PriorityLabel
						:priority="task.priority ?? 0"
						:done="task.done"
					/>

					<Labels
						v-if="(task.labels?.length ?? 0) > 0"
						class="labels"
						:labels="task.labels ?? []"
					/>

					<AssigneeList
						v-if="(task.assignees?.length ?? 0) > 0"
						:assignees="task.assignees ?? []"
						:avatar-size="20"
						:inline="true"
					/>

					<Popup
						v-if="task.due_date && +new Date(task.due_date) > 0"
						placement="bottom-start"
						:anchor="dueDateTriggerEl"
						sheet-on-mobile
						:sheet-title="$t('task.deferDueDate.title')"
					>
						<template #trigger="{toggle, isOpen}">
							<BaseButton
								ref="dueDateTrigger"
								v-tooltip="formatDateLong(task.due_date)"
								class="dueDate"
								@click.prevent.stop="toggle()"
							>	
								<time
									:datetime="formatISO(task.due_date)"
									:aria-expanded="isOpen ? 'true' : 'false'"
								>
									{{ $t('task.detail.due', {at: dueDateFormatted}) }}
								</time>
							</BaseButton>
						</template>
						<template #content="{isOpen}">
							<DeferTask
								v-if="isOpen"
								:model-value="task"
							/>
						</template>
					</Popup>

					<span class="task-icons">
						<span
							v-if="(task.attachments?.length ?? 0) > 0"
							class="project-task-icon"
							role="img"
							:aria-label="$t('task.attributes.attachment', (task.attachments?.length ?? 0))"
						>
							<Icon icon="paperclip" />
						</span>
						<span
							v-if="!isEditorContentEmpty((task.description ?? ''))"
							class="project-task-icon is-mirrored-rtl"
						>
							<Icon icon="align-left" />
						</span>
						<span
							v-if="isRepeating"
							class="project-task-icon"
						>
							<Icon icon="history" />
						</span>
						<CommentCount
							:task="task"
							class="project-task-icon"
						/>
					</span>

					<ChecklistSummary :task="task" />
				</div>
			</div>

			<ProgressBar
				v-if="(task.percent_done ?? 0) > 0"
				:value="(task.percent_done ?? 0) * 100"
				is-small
			/>

			<ColorBubble
				v-if="showProjectSeparately && projectColor !== '' && currentProject?.id !== task.project_id"
				:color="projectColor"
				class="mie-1"
			/>

			<RouterLink
				v-if="showProjectSeparately"
				v-tooltip="$t('task.detail.belongsToProject', {project: getProjectTitle(project)})"
				:to="{ name: 'project.index', params: { projectId: task.project_id } }"
				class="task-project"
				@click.stop
			>
				{{ getProjectTitle(project) }}
			</RouterLink>

			<BaseButton
				:class="{'is-favorite': task.is_favorite}"
				class="favorite"
				@click.stop="toggleFavorite"
			>
				<span class="is-sr-only">{{
					task.is_favorite ? $t('task.detail.actions.unfavorite') : $t('task.detail.actions.favorite')
				}}</span>
				<Icon
					v-if="task.is_favorite"
					icon="star"
				/>
				<Icon
					v-else
					:icon="['far', 'star']"
				/>
			</BaseButton>
			<slot />
		</div>
		<template v-if="typeof task.related_tasks?.subtask !== 'undefined'">
			<template v-for="subtask in task.related_tasks.subtask">
				<template v-if="getTaskById(subtask.id)">
					<single-task-in-project
						:key="subtask.id"
						:the-task="getTaskById(subtask.id)!"
						:disabled="disabled"
						:can-mark-as-done="canMarkAsDone"
						:all-tasks="allTasks"
						class="subtask-nested"
					/>
				</template>
			</template>
		</template>
	</div>
</template>

<script setup lang="ts">
import {ref, watch, onMounted, computed} from 'vue'
import {useI18n} from 'vue-i18n'

import {getHexColor} from '@/helpers/task'
import {getProjectTitle} from '@/helpers/getProjectTitle'
import type {Task as ITask} from '@/client/generated'

import PriorityLabel from '@/components/tasks/partials/PriorityLabel.vue'
import Labels from '@/components/tasks/partials/Labels.vue'
import TaskGlanceTooltip from '@/components/tasks/partials/TaskGlanceTooltip.vue'
import DeferTask from '@/components/tasks/partials/DeferTask.vue'
import ChecklistSummary from '@/components/tasks/partials/ChecklistSummary.vue'
import CommentCount from '@/components/tasks/partials/CommentCount.vue'

import ProgressBar from '@/components/misc/ProgressBar.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import FancyCheckbox from '@/components/input/FancyCheckbox.vue'
import ColorBubble from '@/components/misc/ColorBubble.vue'
import Popup from '@/components/misc/Popup.vue'


import {formatDisplayDate, formatISO, formatDateLong} from '@/helpers/time/formatDate'
import {success} from '@/message'

import {useProjects} from '@/composables/useProjects'
import {useCurrentProject} from '@/composables/useCurrentProject'
import {useUpdateTaskMutation, useFavoriteTaskMutation} from '@/client/queries/taskMutations'
import AssigneeList from '@/components/tasks/partials/AssigneeList.vue'
import {useIntervalFn} from '@vueuse/core'
import {playPopSound} from '@/helpers/playPop'
import {isEditorContentEmpty} from '@/helpers/editorContentEmpty'
import {TASK_REPEAT_MODES} from '@/types/IRepeatMode'
import {useGlobalNow} from '@/composables/useGlobalNow'

const props = withDefaults(defineProps<{
	theTask: ITask,
	isArchived?: boolean,
	showProject?: boolean,
	disabled?: boolean,
	canMarkAsDone?: boolean,
	allTasks?: ITask[],
}>(), {
	isArchived: false,
	showProject: false,
	disabled: false,
	canMarkAsDone: true,
	allTasks: () => [],
})

const emit = defineEmits<{
	'taskUpdated': [task: ITask],
}>()

function getTaskById(taskId: number | undefined): ITask | undefined {
	if (typeof props.allTasks === 'undefined' || props.allTasks.length === 0) {
		return undefined
	}

	return props.allTasks.find(t => t.id === taskId)
}

const {t} = useI18n({useScope: 'global'})

const task = computed(() => props.theTask)

const isRepeating = computed(() => (task.value.repeat_after ?? 0) > 0
	|| ((task.value.repeat_after ?? 0) === 0
		&& task.value.repeat_mode === TASK_REPEAT_MODES.REPEAT_MODE_MONTH))

const projectList = useProjects()
const updateTask = useUpdateTaskMutation(true)
const favoriteTask = useFavoriteTaskMutation()
const isLoading = computed(() => updateTask.isPending.value || favoriteTask.isPending.value)

const project = computed(() => projectList.projects[task.value.project_id ?? 0])
const projectColor = computed(() => project.value?.hex_color ?? '')

const showProjectSeparately = computed(() => !props.showProject
	&& currentProject.value?.id !== task.value.project_id
	&& project.value)

const {currentProject} = useCurrentProject()

const taskDetailRoute = computed(() => ({
	name: 'task.detail',
	params: {id: task.value.id},
	// TODO: re-enable opening task detail in modal
	// state: { backdropView: router.currentRoute.value.fullPath },
}))

function updateDueDate() {
	if (!task.value.due_date) {
		return
	}

	dueDateFormatted.value = formatDisplayDate(task.value.due_date)
}

const dueDateFormatted = ref('')
useIntervalFn(updateDueDate, 60_000, {
	immediateCallback: true,
})
onMounted(updateDueDate)

watch(() => task.value.due_date, updateDueDate)

const {now} = useGlobalNow()
const isOverdue = computed(() => (
	!task.value.done &&
	task.value.due_date !== null &&
	new Date(task.value.due_date ?? 0).getTime() > 0 &&
	new Date(task.value.due_date ?? 0).getTime() <= now.value.getTime()
))

let oldTask: ITask

async function markAsDone(checked: boolean, wasReverted: boolean = false) {
	if (!wasReverted) oldTask = {...task.value}

	// Fire the request immediately and with the intended done value snapshotted, so a re-render or
	// teardown during the animation delay can neither drop the save nor make it send a stale state.
	const source = wasReverted && isRepeating.value ? oldTask : task.value
	const updatePromise = updateTask.mutateAsync({
		...source,
		id: source.id!,
		done: checked,
	}).catch(() => undefined)

	const finish = async () => {
		const newTask = await updatePromise
		if (!newTask) return

		updateDueDate()

		if (wasReverted) {
			return
		}

		if (checked) {
			playPopSound()
		}
		emit('taskUpdated', newTask)

		let message = t('task.doneSuccess')
		if (!task.value.done && !isRepeating.value) {
			message = t('task.undoneSuccess')
		}

		success({message}, [{
			title: t('task.undo'),
			callback: () => undoDone(checked),
		}])
	}

	if (checked) {
		setTimeout(finish, 300) // Delay only the follow-up to show the animation when marking a task as done
	} else {
		await finish() // Don't delay it when un-marking it as it doesn't have an animation the other way around
	}
}

function undoDone(checked: boolean) {
	markAsDone(!checked, true)
}

async function toggleFavorite() {
	const updated = await favoriteTask.mutateAsync({...task.value, id: task.value.id!})
	emit('taskUpdated', updated)
}

const taskRoot = ref<HTMLElement | null>(null)
const dueDateTrigger = ref<InstanceType<typeof BaseButton> | null>(null)
const dueDateTriggerEl = computed<HTMLElement | null>(() => dueDateTrigger.value?.$el ?? null)
const taskLinkRef = ref<InstanceType<typeof BaseButton> | null>(null)

function hasTextSelected() {
	const isTextSelected = window.getSelection()?.toString()
	return !(typeof isTextSelected === 'undefined' || isTextSelected === '' || isTextSelected === '\n')
}

function openTaskDetail(event: MouseEvent | KeyboardEvent) {
	if (event.target instanceof HTMLElement) {
		const isInteractiveElement = event.target.closest('a, button, label, input[type="checkbox"], .favorite, [role="button"]')
		if (isInteractiveElement || hasTextSelected()) {
			return
		}
	}

	taskLinkRef.value?.$el.click()
}

defineExpose({
	focus: () => taskRoot.value?.focus(),
	click: (e: MouseEvent | KeyboardEvent) => openTaskDetail(e),
})
</script>

<style lang="scss" scoped>
.task {
	display: flex;
	align-items: center;
	gap: .75rem;
	padding: .75rem .875rem;
	transition: background-color $transition;
	cursor: pointer;
	border-radius: $radius;
	border: 2px solid transparent;

	&:hover {
		background-color: var(--grey-100);
	}

	&:has(*:focus-visible), &:focus {
		box-shadow: 0 0 0 2px hsla(var(--primary-hsl), 0.5);

		a.task-link {
			box-shadow: none;
		}
	}

	@supports not selector(:focus-within) {
		:focus {
			box-shadow: 0 0 0 2px hsla(var(--primary-hsl), 0.5);

			a.task-link {
				box-shadow: none;
			}
		}
	}

	.tasktext {
		display: flex;
		flex-direction: column;
		gap: .375rem;
		flex: 1 1 auto;
		min-inline-size: 0;
	}

	.task-title-line {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-word;
		hyphens: auto;
	}

	a.task-link {
		font-size: .9375rem;
		font-weight: 500;
		line-height: 1.4;
		color: var(--text-strong);
	}

	.task-meta-line {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: .375rem .875rem;
		font-size: .8125rem;
		line-height: 1.25;
		color: var(--text-muted);
	}

	.dueDate {
		color: inherit;

		&:focus-visible {
			box-shadow: none;

			time {
				box-shadow: 0 0 0 1px hsla(var(--primary-hsl), 0.5);
				border-radius: 3px;
			}
		}
	}

	&[data-is-overdue] .dueDate {
		color: var(--danger-text);
	}

	a.task-project {
		max-inline-size: 16rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-muted);
		font-weight: 500;
	}

	.task-icons {
		display: inline-flex;
		align-items: center;
		gap: .625rem;
		color: var(--grey-500);

		&:empty {
			display: none;
		}
	}

	:deep(.progress-bar.is-small) {
		--progress-height: .375rem;
		flex: 0 0 4.5rem;
		inline-size: 4.5rem;
		min-inline-size: 0;
		margin: 0;
		order: 0;
	}

	a {
		color: var(--text);
		transition: color ease $transition-duration;

		&:hover {
			color: var(--primary);
		}
	}

	.favorite {
		opacity: 1;
		text-align: center;
		inline-size: 27px;
		transition: opacity $transition, color $transition;
		border-radius: $radius;

		&:hover {
			color: var(--warning);
		}

		&.is-favorite {
			opacity: 1;
			color: var(--warning);
		}
	}

	@media(hover: hover) and (pointer: fine) {
		& .favorite {
			opacity: 0;
		}

		&:hover .favorite {
			opacity: 1;
		}
	}

	.favorite:focus {
		opacity: 1;
	}

	:deep(.fancy-checkbox) {
		block-size: 18px;
		padding-block-start: 0;
		padding-inline-end: 0;

		span {
			display: none;
		}

		// Extend the hit target to >=44x44 without affecting layout (WCAG 2.5.5).
		.base-checkbox__label {
			position: relative;

			&::before {
				content: '';
				position: absolute;
				inset-block-start: 50%;
				inset-inline-start: 50%;
				min-block-size: 44px;
				min-inline-size: 44px;
				block-size: 100%;
				inline-size: 100%;
				transform: translate(-50%, -50%);
			}
		}
	}

	.tasktext.done a.task-link {
		text-decoration: line-through;
		color: var(--grey-500);
	}

	span.parent-tasks {
		color: var(--grey-500);
		inline-size: auto;
	}

	.show-project .parent-tasks {
		padding-inline-start: .25rem;
	}

	.remove {
		color: var(--danger);
	}

	input[type='checkbox'] {
		vertical-align: middle;
	}

	.settings {
		float: inline-end;
		inline-size: 24px;
		cursor: pointer;
	}

	&.loader-container.is-loading:after {
		inset-block-start: calc(50% - 1rem);
		inset-inline-start: calc(50% - 1rem);
		inline-size: 2rem;
		block-size: 2rem;
		border-inline-start-color: var(--grey-300);
		border-block-end-color: var(--grey-300);
	}
}

.subtask-nested {
	margin-inline-start: 1.75rem;
}

:deep(.popup) {
	border-radius: $radius;
	background-color: var(--white);
	box-shadow: var(--shadow-lg);
	color: var(--text);

	&.is-open {
		padding: 1rem;
		border: 1px solid var(--grey-200);
	}
}
</style>
