<template>
	<div class="select">
		<select
			v-model.number="selectedPercent"
			:disabled="disabled || undefined"
		>
			<option
				v-for="option in options"
				:key="option"
				:value="option"
			>
				{{ Math.round(option * 100) }}%
			</option>
		</select>
	</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'

withDefaults(defineProps<{
	disabled?: boolean
}>(), {
	disabled: false,
})

const percentDone = defineModel<number>({ required: true })

const PERCENT_OPTIONS: readonly number[] = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]

// Values set through the API (e.g. 0.95) are off the 10% grid. Round them and list them as an
// extra option, otherwise no <option> matches and the select renders empty.
const selectedPercent = computed({
	get: () => Math.round((percentDone.value ?? 0) * 100) / 100,
	set: (value: number) => {
		percentDone.value = value
	},
})

const options = computed(() => PERCENT_OPTIONS.includes(selectedPercent.value)
	? PERCENT_OPTIONS
	: [...PERCENT_OPTIONS, selectedPercent.value].sort((a, b) => a - b))
</script>
