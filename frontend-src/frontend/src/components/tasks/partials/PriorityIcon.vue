<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {ChevronDown, ChevronUp, ChevronsUp, Equal} from '@lucide/vue'

import {PRIORITIES} from '@/constants/priorities'

// Jira-style priority glyph: icon only, the name lives in the tooltip
const props = defineProps<{
	priority: number
}>()

const {t} = useI18n()

const config = computed(() => {
	switch (props.priority) {
		case PRIORITIES.LOW:
			return {icon: ChevronDown, color: 'tw:text-information', label: t('task.priority.low')}
		case PRIORITIES.MEDIUM:
			return {icon: Equal, color: 'tw:text-warning', label: t('task.priority.medium')}
		case PRIORITIES.HIGH:
			return {icon: ChevronUp, color: 'tw:text-destructive', label: t('task.priority.high')}
		case PRIORITIES.URGENT:
			return {icon: ChevronsUp, color: 'tw:text-destructive', label: t('task.priority.urgent')}
		case PRIORITIES.DO_NOW:
			return {icon: ChevronsUp, color: 'tw:text-destructive tw:stroke-[3]', label: t('task.priority.doNow')}
		default:
			return null
	}
})
</script>

<template>
	<span
		v-if="config"
		v-tooltip="config.label"
		class="tw:inline-flex tw:items-center"
		role="img"
		:aria-label="config.label"
	>
		<component
			:is="config.icon"
			class="tw:size-4"
			:class="[config.color]"
		/>
	</span>
</template>
