import { createContext, useContext } from 'react'
import type { RuntimeConfig } from '@/types/runtime-config'

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
  return useContext(RuntimeConfigContext)
}

export function useRuntimeConfig() {
  const state = useRuntimeConfigState()
  if (!state.config) {
    throw new Error('Runtime config is not loaded.')
  }
  return state.config
}
