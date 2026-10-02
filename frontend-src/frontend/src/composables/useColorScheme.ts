import {ref, computed, watch, readonly} from 'vue'
import {createSharedComposable, usePreferredColorScheme, tryOnMounted} from '@vueuse/core'
import type {BasicColorSchema} from '@vueuse/core'
import {useAuthStore} from '@/stores/auth'
import {useUpdateFrontendSettingsMutation} from '@/client/queries/account'

const DEFAULT_COLOR_SCHEME_SETTING: BasicColorSchema = 'light'

const CLASS_DARK = 'dark'
const CLASS_LIGHT = 'light'

// This is built upon the vueuse useDark
// Main differences:
// - usePreferredColorScheme
// - doesn't allow setting via the `isDark` ref.
// - instead the store is exposed
// - value is synced via `createSharedComposable`
// https://github.com/vueuse/vueuse/blob/main/packages/core/useDark/index.ts
export const useColorScheme = createSharedComposable(() => {
	const authStore = useAuthStore()
	const updateFrontendSettings = useUpdateFrontendSettingsMutation()
	// Applied right away on toggle while the account setting is saved
	const initialGuestScheme = typeof window !== 'undefined' ? localStorage.getItem('color_scheme_guest') as BasicColorSchema | null : null
	const pendingScheme = ref<BasicColorSchema | null>(initialGuestScheme)
	const store = computed(() => pendingScheme.value ?? authStore.settings.frontend_settings.color_schema)

	const preferredColorScheme = usePreferredColorScheme()

	const isDark = computed<boolean>(() => {
		if (store.value !== 'auto') {
			return store.value === 'dark'
		}

		const autoColorScheme = preferredColorScheme.value === 'no-preference'
			? DEFAULT_COLOR_SCHEME_SETTING
			: preferredColorScheme.value
		return autoColorScheme === 'dark'
	})

	function onChanged(v: boolean) {
		const el = window?.document.querySelector('html')
		el?.classList.toggle(CLASS_DARK, v)
		el?.classList.toggle(CLASS_LIGHT, !v)
	}

	watch(isDark, onChanged, { flush: 'post' })

	tryOnMounted(() => onChanged(isDark.value))

	// Saved to the account like the settings page does, so the choice follows the user across devices
	async function toggleTheme() {
		const next: BasicColorSchema = isDark.value ? 'light' : 'dark'
		pendingScheme.value = next
		if (typeof window !== 'undefined') {
			localStorage.setItem('color_scheme_guest', next)
		}

		const session = authStore.session
		if (!session || authStore.isLinkShareAuth) {
			return
		}

		try {
			await updateFrontendSettings.mutateAsync({
				id: session.id,
				type: session.type,
				frontendSettings: {color_schema: next},
			})
		} catch {
			// the mutation reports the error; the scheme falls back to the stored one
			return
		} finally {
			pendingScheme.value = null
		}
	}

	return {
		store,
		isDark: readonly(isDark),
		toggleTheme,
	}
})
