<script setup lang="ts">
import type {Component} from 'vue'
import type {RouteLocationRaw} from 'vue-router'
import {useRouter} from 'vue-router'
import {ChevronDown, Filter, FolderPlus, Plus, SquareCheck, Tag, Users} from '@lucide/vue'

import {Button} from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {useBaseStore} from '@/stores/base'

interface CreateOption {
	label: string
	icon: Component
	to: RouteLocationRaw
}

const router = useRouter()
const baseStore = useBaseStore()

const options: CreateOption[] = [
	{label: 'navigation.createProject', icon: FolderPlus, to: {name: 'project.create'}},
	{label: 'navigation.createFilter', icon: Filter, to: {name: 'filters.create'}},
	{label: 'navigation.createLabel', icon: Tag, to: {name: 'labels.create'}},
	{label: 'navigation.createTeam', icon: Users, to: {name: 'teams.create'}},
]

// Quick actions already handles task creation (type a title and pick "create task")
function createTask() {
	baseStore.setQuickActionsActive(true)
}
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button
				size="sm"
				class="tw:self-center"
			>
				<Plus />
				<span class="tw:hidden tw:sm:inline">{{ $t('navigation.create') }}</span>
				<ChevronDown class="tw:hidden tw:opacity-80 tw:sm:block" />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent
			align="end"
			class="tw:w-48"
		>
			<DropdownMenuItem @select="createTask">
				<SquareCheck />{{ $t('navigation.createTask') }}
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				v-for="option in options"
				:key="option.label"
				@select="router.push(option.to)"
			>
				<component :is="option.icon" />{{ $t(option.label) }}
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
