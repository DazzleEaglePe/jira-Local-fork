<script setup lang="ts">
import type { ListboxItemEmits, ListboxItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useCurrentElement } from '@vueuse/core'
import { ListboxItem, useForwardPropsEmits, useId } from 'reka-ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import { useCommand, useCommandGroup } from '.'

const props = defineProps<ListboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ListboxItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const id = useId()
const { filterState, allItems, allGroups } = useCommand()
const groupContext = useCommandGroup()

const isRender = computed(() => {
	if (!filterState.search) {
		return true
	}
	else {
		const filteredCurrentItem = filterState.filtered.items.get(id)
		// If the filtered items is undefined means not in the all times map yet
		// Do the first render to add into the map
		if (filteredCurrentItem === undefined) {
			return true
		}

		// Check with filter
		return filteredCurrentItem > 0
	}
})

const itemRef = ref()
const currentElement = useCurrentElement(itemRef)
onMounted(() => {
	if (!(currentElement.value instanceof HTMLElement))
		return

	// textValue to perform filter
	allItems.value.set(id, currentElement.value.textContent ?? (props.value?.toString() ?? ''))

	const groupId = groupContext?.id
	if (groupId) {
		if (!allGroups.value.has(groupId)) {
			allGroups.value.set(groupId, new Set([id]))
		}
		else {
			allGroups.value.get(groupId)?.add(id)
		}
	}
})
onUnmounted(() => {
	allItems.value.delete(id)
})
</script>

<template>
	<ListboxItem
		v-if="isRender"
		v-bind="forwarded"
		:id="id"
		ref="itemRef"
		data-slot="command-item"
		:class="cn(`tw:data-[highlighted]:bg-accent tw:data-[highlighted]:text-accent-foreground tw:[&_svg:not([class*='text-'])]:text-muted-foreground tw:relative tw:flex tw:cursor-default tw:items-center tw:gap-2 tw:rounded-sm tw:px-2 tw:py-1.5 tw:text-sm tw:outline-hidden tw:select-none tw:data-[disabled]:pointer-events-none tw:data-[disabled]:opacity-50 tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*='size-'])]:size-4`, props.class)"
		@select="() => {
			filterState.search = ''
		}"
	>
		<slot />
	</ListboxItem>
</template>
