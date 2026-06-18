import { useState } from 'react'
import { SEVERITY_COLORS } from '../../core/constants/colors.js'
import EventPopover from './EventPopover.jsx'

export default function EventBlock({ finding, xLeft, width }) {
  const [open, setOpen] = useState(false)
  const color = SEVERITY_COLORS[finding.severity] || 'var(--color-info)'
  const w = Math.max(8, width)

  return (
    <>
      <div
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title={`${finding.pod} · ${finding.anomaly_type} · ${finding.severity}`}
        style={{
          position: 'absolute',
          left: xLeft,
          top: 4,
          width: w,
          height: 20,
          background: color,
          borderRadius: 3,
          opacity: 0.85,
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', paddingLeft: 3,
        }}
      >
        {w > 40 && (
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {finding.anomaly_type?.slice(0, 14)}
          </span>
        )}
      </div>
      {open && (
        <EventPopover finding={finding} onClose={() => setOpen(false)} xLeft={xLeft} />
      )}
    </>
  )
}
