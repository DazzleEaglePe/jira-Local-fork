import {describe, it, expect} from 'vitest'
import {mount} from '@vue/test-utils'
import PercentDoneSelect from './PercentDoneSelect.vue'

function selectedLabel(modelValue: number) {
	const wrapper = mount(PercentDoneSelect, {props: {modelValue}})
	const select = wrapper.find('select').element as HTMLSelectElement
	return {wrapper, label: select.options[select.selectedIndex]?.text.trim()}
}

describe('PercentDoneSelect', () => {
	it('selects a value on the 10% grid without adding options', () => {
		const {wrapper, label} = selectedLabel(0.3)
		expect(label).toBe('30%')
		expect(wrapper.findAll('option')).toHaveLength(11)
	})

	it('lists and selects a value off the 10% grid instead of rendering empty', () => {
		const {wrapper, label} = selectedLabel(0.95)
		expect(label).toBe('95%')
		expect(wrapper.findAll('option')).toHaveLength(12)
	})

	it('emits the picked value', async () => {
		const {wrapper} = selectedLabel(0.95)
		await wrapper.find('select').setValue('0.5')
		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0.5])
	})
})
