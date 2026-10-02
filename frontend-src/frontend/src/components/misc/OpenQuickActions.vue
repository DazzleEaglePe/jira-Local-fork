<script setup lang="ts">
import {Search} from '@lucide/vue'
import {useBaseStore} from '@/stores/base'
import {onBeforeUnmount, onMounted} from 'vue'
import {eventToShortcutString} from '@/helpers/shortcut'
import {isAppleDevice} from '@/helpers/isAppleDevice'

const baseStore = useBaseStore()

// See https://github.com/github/hotkey/discussions/85#discussioncomment-5214660
function openQuickActionsViaHotkey(event: KeyboardEvent) {
	const shortcutString = eventToShortcutString(event)
	if (!shortcutString) return

	// On macOS, use Cmd+K (Meta+K), on other platforms use Ctrl+K (Control+K)
	const expectedShortcut = isAppleDevice() ? 'Meta+KeyK' : 'Control+KeyK'
	if (shortcutString !== expectedShortcut) return
	
	event.preventDefault()

	openQuickActions()
}

onMounted(() => {
	document.addEventListener('keydown', openQuickActionsViaHotkey)
})

onBeforeUnmount(() => {
	document.removeEventListener('keydown', openQuickActionsViaHotkey)
})

function openQuickActions() {
	baseStore.setQuickActionsActive(true)
}

const shortcutHint = isAppleDevice() ? '⌘K' : 'Ctrl K'
</script>

<template>
	<button
		type="button"
		data-slot="search-trigger"
		class="tw:flex tw:h-8 tw:w-8 tw:items-center tw:gap-2 tw:self-center tw:rounded-md tw:border tw:border-input/40 tw:bg-background tw:px-2.5 tw:text-sm tw:text-muted-foreground tw:transition-colors tw:hover:bg-secondary tw:focus-visible:ring-3 tw:focus-visible:ring-ring/50 tw:md:w-auto"
		:title="$t('keyboardShortcuts.quickSearch')"
		:aria-label="$t('keyboardShortcuts.quickSearch')"
		@click="openQuickActions"
	>
		<Search class="tw:size-4 tw:shrink-0" />
		<span class="tw:hidden tw:flex-1 tw:text-left tw:md:inline">{{ $t('navigation.search') }}</span>
		<kbd class="tw:hidden tw:rounded tw:border tw:bg-muted tw:px-1.5 tw:font-sans tw:text-[11px] tw:font-medium tw:md:inline">{{ shortcutHint }}</kbd>
	</button>
</template>
