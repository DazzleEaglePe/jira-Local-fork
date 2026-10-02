<template>
	<BaseButton
		v-shortcut="SHORTCUTS.toggleMenu"
		class="menu-show-button"
		:title="$t('keyboardShortcuts.toggleMenu')"
		:aria-label="menuActive ? $t('misc.hideMenu') : $t('misc.showMenu')"
		:aria-expanded="menuActive"
		@click="baseStore.toggleMenu()"
		@shortkey="() => baseStore.toggleMenu()"
	>
		<component
			:is="menuActive ? PanelLeftClose : PanelLeftOpen"
			class="menu-show-icon"
		/>
	</BaseButton>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {PanelLeftClose, PanelLeftOpen} from '@lucide/vue'

import {SHORTCUTS} from '@/constants/shortcuts'
import {useBaseStore} from '@/stores/base'

import BaseButton from '@/components/base/BaseButton.vue'

const baseStore = useBaseStore()
const menuActive = computed(() => baseStore.menuActive)
</script>

<style lang="scss" scoped>
// Jira-style sidebar toggle: a square icon button
.menu-show-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	align-self: center;
	inline-size: 2rem;
	block-size: 2rem;
	border-radius: 4px;
	color: var(--ui-muted-foreground);
	transition: background-color $transition, color $transition;

	&:hover,
	&:focus-visible {
		background: var(--ui-secondary);
		color: var(--ui-foreground);
	}
}

.menu-show-icon {
	inline-size: 1.125rem;
	block-size: 1.125rem;
}
</style>
