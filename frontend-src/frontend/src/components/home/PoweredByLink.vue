<template>
	<div class="menu-bottom-link">
		<span>Caja Ica</span> &bull; <span class="creator-name">Creado por Jacn_159</span>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	utmMedium?: string;
}>()
</script>

<style lang="scss">
.menu-bottom-link {
	color: var(--grey-500);
	text-align: center;
	display: block;
	padding-block-start: 1rem;
	padding-block-end: 1rem;
	font-size: .8rem;
	font-weight: 500;
	user-select: none;

	.creator-name {
		color: var(--text-muted);
		font-weight: 600;
	}
}
</style>
