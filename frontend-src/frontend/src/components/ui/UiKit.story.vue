<script lang="ts" setup>
import {ArrowDown, ArrowUp, Equal, Filter, MoreHorizontal, Plus, Search} from '@lucide/vue'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from '@/components/ui/breadcrumb'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'

type Priority = 'high' | 'medium' | 'low'

interface Issue {
	key: string
	title: string
	priority: Priority
	assignee: string
	labels: string[]
}

interface Column {
	title: string
	lozenge: string
	issues: Issue[]
}

const priorityIcon = {high: ArrowUp, medium: Equal, low: ArrowDown}
const priorityClass = {
	high: 'tw:text-destructive',
	medium: 'tw:text-warning',
	low: 'tw:text-information',
}

const avatarClass: Record<string, string> = {
	BC: 'tw:bg-information tw:text-white',
	JC: 'tw:bg-discovery tw:text-white',
	MR: 'tw:bg-success tw:text-white',
}

const columns: Column[] = [
	{
		title: 'Por hacer',
		lozenge: 'tw:bg-secondary tw:text-secondary-foreground',
		issues: [
			{key: 'CI-101', title: 'Diseñar top nav con botón Crear y búsqueda global', priority: 'high', assignee: 'BC', labels: ['UX']},
			{key: 'CI-102', title: 'Sidebar colapsable con vistas del proyecto', priority: 'medium', assignee: 'JC', labels: ['UI']},
		],
	},
	{
		title: 'En curso',
		lozenge: 'tw:bg-accent tw:text-accent-foreground',
		issues: [
			{key: 'CI-098', title: 'Tokens de diseño y tema oscuro', priority: 'high', assignee: 'BC', labels: ['Tokens']},
		],
	},
	{
		title: 'Hecho',
		lozenge: 'tw:bg-success/15 tw:text-success',
		issues: [
			{key: 'CI-090', title: 'Instalar shadcn-vue con prefijo tw', priority: 'low', assignee: 'JC', labels: ['Setup']},
		],
	},
]
</script>

<template>
	<Story title="UI / Tablero estilo Jira">
		<Variant title="Tablero">
			<TooltipProvider>
				<div class="tw:bg-background tw:text-foreground tw:p-6 tw:min-h-screen">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="#">
									Proyectos
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink href="#">
									Modernización UX/UI
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Tablero</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>

					<div class="tw:mt-2 tw:flex tw:items-center tw:justify-between">
						<h1 class="tw:text-2xl tw:font-semibold">
							Tablero CI
						</h1>
						<Dialog>
							<DialogTrigger as-child>
								<Button>
									<Plus />Crear
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Crear tarea</DialogTitle>
									<DialogDescription>Los campos marcados son obligatorios.</DialogDescription>
								</DialogHeader>
								<div class="tw:grid tw:gap-2">
									<Label for="summary">Resumen</Label>
									<Input
										id="summary"
										placeholder="¿Qué hay que hacer?"
									/>
								</div>
								<DialogFooter>
									<Button variant="ghost">
										Cancelar
									</Button>
									<Button>Crear</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					<div class="tw:mt-4 tw:flex tw:items-center tw:gap-2">
						<div class="tw:relative tw:w-64">
							<Search class="tw:absolute tw:left-2.5 tw:top-2.5 tw:size-4 tw:text-muted-foreground" />
							<Input
								class="tw:pl-8"
								placeholder="Buscar en el tablero"
							/>
						</div>
						<div class="tw:flex tw:-space-x-2">
							<Avatar
								v-for="initials in ['BC', 'JC', 'MR']"
								:key="initials"
								class="tw:size-8 tw:border-2 tw:border-background"
							>
								<AvatarFallback
									class="tw:text-xs tw:font-semibold"
									:class="[avatarClass[initials]]"
								>
									{{ initials }}
								</AvatarFallback>
							</Avatar>
						</div>
						<Button
							variant="outline"
							size="sm"
						>
							<Filter />Filtros
						</Button>
					</div>

					<div class="tw:mt-6 tw:grid tw:grid-cols-3 tw:gap-3">
						<section
							v-for="column in columns"
							:key="column.title"
							class="tw:bg-muted tw:rounded-lg tw:p-2"
						>
							<h2 class="tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:uppercase tw:text-muted-foreground">
								{{ column.title }} {{ column.issues.length }}
							</h2>
							<div class="tw:mt-1 tw:flex tw:flex-col tw:gap-2">
								<Card
									v-for="issue in column.issues"
									:key="issue.key"
									class="tw:gap-0 tw:py-0 tw:shadow-sm tw:hover:bg-secondary tw:cursor-pointer"
								>
									<CardContent class="tw:p-3">
										<div class="tw:flex tw:items-start tw:justify-between tw:gap-2">
											<p class="tw:text-sm">
												{{ issue.title }}
											</p>
											<DropdownMenu>
												<DropdownMenuTrigger as-child>
													<Button
														variant="ghost"
														size="icon-xs"
														aria-label="Acciones"
													>
														<MoreHorizontal />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem>
														Editar<DropdownMenuShortcut>E</DropdownMenuShortcut>
													</DropdownMenuItem>
													<DropdownMenuItem>Mover a…</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem variant="destructive">
														Eliminar
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
										<div class="tw:mt-2 tw:flex tw:flex-wrap tw:gap-1">
											<Badge
												v-for="label in issue.labels"
												:key="label"
												variant="outline"
											>
												{{ label }}
											</Badge>
										</div>
										<div class="tw:mt-3 tw:flex tw:items-center tw:justify-between">
											<div class="tw:flex tw:items-center tw:gap-2">
												<span
													class="tw:rounded-sm tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-bold tw:uppercase"
													:class="[column.lozenge]"
												>
													{{ column.title }}
												</span>
												<span class="tw:text-xs tw:font-medium tw:text-muted-foreground">{{ issue.key }}</span>
											</div>
											<div class="tw:flex tw:items-center tw:gap-2">
												<Tooltip>
													<TooltipTrigger as-child>
														<component
															:is="priorityIcon[issue.priority]"
															class="tw:size-4"
															:class="[priorityClass[issue.priority]]"
														/>
													</TooltipTrigger>
													<TooltipContent>Prioridad {{ issue.priority }}</TooltipContent>
												</Tooltip>
												<Avatar class="tw:size-6">
													<AvatarFallback
														class="tw:text-[10px] tw:font-semibold"
														:class="[avatarClass[issue.assignee]]"
													>
														{{ issue.assignee }}
													</AvatarFallback>
												</Avatar>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</section>
					</div>
				</div>
			</TooltipProvider>
		</Variant>
	</Story>
</template>
