import ConfidenceTier from '../../components/ui/ConfidenceTier.jsx'
import DegradedBanner from '../../components/ui/DegradedBanner.jsx'
import WarmingUpBanner from '../../components/ui/WarmingUpBanner.jsx'
import EmptyNominal from '../../components/ui/EmptyNominal.jsx'
import CausalChainSteps from './CausalChainSteps.jsx'
import TwoDomainContrast from './TwoDomainContrast.jsx'
import EvidenceMatrix from './EvidenceMatrix.jsx'
import WhyNotSection from './WhyNotSection.jsx'
import { useAppState } from '../../core/store/AppContext.jsx'

export default function AIExplanationCard({ alert }) {
  const { agentsReady, llmAvailable } = useAppState()

  if (!agentsReady) return <WarmingUpBanner />
  if (!alert) return <EmptyNominal />
  if (!llmAvailable) return <DegradedBanner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 4 }}>
            {alert.alert_type || 'CORRELATED ALERT'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
            {alert.nlp_summary || alert.insight || '—'}
          </div>
        </div>
        <ConfidenceTier value={alert.confidence} />
      </div>

      {alert.causal_chain?.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 6 }}>CAUSAL CHAIN</div>
          <CausalChainSteps chain={alert.causal_chain} />
        </div>
      )}

      <TwoDomainContrast alert={alert} />

      <EvidenceMatrix alert={alert} />

      {alert.why_not && <WhyNotSection alternatives={alert.why_not} />}

      {alert.recommendation && (
        <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 700, marginBottom: 4 }}>RECOMMENDATION</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{alert.recommendation}</div>
        </div>
      )}
    </div>
  )
}
