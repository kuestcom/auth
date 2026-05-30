import type { RuntimeConfig } from '@/types/runtime-config'
import { createContext, use } from 'react'

export interface RuntimeConfigState {
  config: RuntimeConfig | null
  loading: boolean
  error: string | null
}

export const RuntimeConfigContext = createContext<RuntimeConfigState>({
  config: null,
  loading: true,
  error: null,
})

export function useRuntimeConfigState() {
  return use(RuntimeConfigContext)
}

export function useRuntimeConfig() {
  const state = useRuntimeConfigState()
  if (!state.config) {
    throw new Error('Runtime config is not loaded.')
  }
  return state.config
}
