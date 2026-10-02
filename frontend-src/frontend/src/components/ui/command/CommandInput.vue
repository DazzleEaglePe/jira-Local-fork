<script setup lang="ts">
import type { ListboxFilterProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Search } from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import { ListboxFilter, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useCommand } from '.'

const props = defineProps<ListboxFilterProps & {
  class?: HTMLAttributes['class']
}>()

defineOptions({
	inheritAttrs: false,
})

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

const { filterState } = useCommand()
</script>

<template>
	<div
		data-slot="command-input-wrapper"
		class="tw:flex tw:h-9 tw:items-center tw:gap-2 tw:border-b tw:px-3"
	>
		<Search class="tw:size-4 tw:shrink-0 tw:opacity-50" />
		<ListboxFilter
			v-bind="{ ...forwardedProps, ...$attrs }"
			v-model="filterState.search"
			data-slot="command-input"
			auto-focus
			:class="cn('tw:placeholder:text-muted-foreground tw:flex tw:h-10 tw:w-full tw:rounded-md tw:bg-transparent tw:py-3 tw:text-sm tw:outline-hidden tw:disabled:cursor-not-allowed tw:disabled:opacity-50', props.class)"
		/>
	</div>
</template>
