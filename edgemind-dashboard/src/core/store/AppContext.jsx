import { createContext, useContext, useReducer } from 'react'
import reducer, { initialState } from './reducer.js'

export const AppContext  = createContext(null)
export const DispatchCtx = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <DispatchCtx.Provider value={dispatch}>
      <AppContext.Provider value={state}>
        {children}
      </AppContext.Provider>
    </DispatchCtx.Provider>
  )
}

export function useAppState()    { return useContext(AppContext) }
export function useDispatch()    { return useContext(DispatchCtx) }
