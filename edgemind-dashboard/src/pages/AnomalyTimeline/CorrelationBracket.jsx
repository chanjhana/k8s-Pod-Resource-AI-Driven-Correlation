import { useState } from 'react'
import AlertBracketPopover from './AlertBracketPopover.jsx'

export default function CorrelationBracket({ alert, xLeft, width, rowCount }) {
  const [open, setOpen] = useState(false)
  const h = rowCount * 28 + 4
  const w = Math.max(4, width)

  return (
    <>
      <div
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title={`${alert.alert_type} · click for detail`}
        style={{
          position: 'absolute',
          left: xLeft, top: 0,
          width: w, height: h,
          background: 'rgba(248,113,113,0.06)',
          border: '1px dashed rgba(248,113,113,0.4)',
          borderRadius: 4,
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: 4,
          fontSize: 9, color: 'var(--color-danger)', fontWeight: 700,
          background: 'rgba(248,113,113,0.12)', padding: '1px 4px', borderRadius: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: w - 8,
        }}>
          {alert.alert_type?.slice(0, 18)}
        </span>
      </div>
      {open && <AlertBracketPopover alert={alert} onClose={() => setOpen(false)} />}
    </>
  )
}
