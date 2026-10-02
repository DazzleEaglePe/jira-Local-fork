<template>
	<div
		v-if="isDone"
		class="is-done"
		:class="{ 'is-done--small': variant === 'small' }"
	>
		{{ $t('task.attributes.done') }}
	</div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
	isDone?: boolean
	variant?: 'default' | 'small'
}>(), {
	isDone: false,
	variant: 'default',
})
</script>


<style lang="scss" scoped>
.is-done {
  // Tinted chip like the labels; the text lightness per theme keeps it readable
  background: hsla(var(--success-h), var(--success-s), var(--success-l), .15);
  color: var(--success);
  color: oklch(from var(--success) var(--label-text-l) c h);
  padding: .3rem .6rem;
  font-size: .75rem;
  font-weight: 600;
  line-height: 1;
  border-radius: 999px;
  text-align: center;
}

.is-done--small {
	padding: .2rem .45rem;
}
</style>
