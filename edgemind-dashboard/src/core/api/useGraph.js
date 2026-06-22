import { useEffect, useRef } from 'react'
import { useDispatch } from '../store/AppContext.jsx'
import { apiFetch } from './client.js'
import { GRAPH_UPDATE } from '../store/actions.js'

const POLL_INTERVAL = 5 * 60 * 1000

export function useGraph() {
  const dispatch = useDispatch()
  const timer = useRef(null)

  useEffect(() => {
    async function fetchGraph() {
      try {
        const data = await apiFetch('/api/graph')
        dispatch({ type: GRAPH_UPDATE, payload: data })
      } catch (e) {
        console.warn('[Graph] fetch failed:', e)
      }
    }

    fetchGraph()
    timer.current = setInterval(fetchGraph, POLL_INTERVAL)
    return () => clearInterval(timer.current)
  }, [dispatch])
}
