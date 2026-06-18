export const SEVERITY_COLORS = {
  healthy:  'var(--color-success)',
  warning:  'var(--color-warning)',
  critical: 'var(--color-danger)',
  info:     'var(--color-info)',
  unknown:  'var(--color-text-tertiary)',
}

export const SEMANTIC_COLORS = {
  aiCorrelation: 'var(--color-info)',
  forecast:      'var(--color-text-info)',
  causalPath:    'var(--color-coral)',
  sharedData:    'var(--color-border-primary)',
}

export const AGENT_COLORS = {
  cpu:         'var(--color-warning)',
  memory:      'var(--color-text-info)',
  storage:     'var(--color-success)',
  network_log: 'var(--color-info)',
}

export const EVENT_BLOCK_COLORS = {
  cpu_spike:            'var(--color-warning)',
  cpu_throttle:         'var(--color-warning-border)',
  memory_leak:          'var(--color-text-info)',
  pre_oom:              'var(--color-danger)',
  oomkill_detected:     'var(--color-danger)',
  io_saturation:        'var(--color-success)',
  write_burst:          'var(--color-info)',
  pvc_fill:             'var(--color-success-border)',
  network_flood:        'var(--color-info)',
  crash_loop:           'var(--color-danger)',
  log_error_surge:      'var(--color-warning)',
  data_stale:           'var(--color-border-primary)',
  pump_health_critical: 'var(--color-danger)',
  correlated_alert:     'var(--color-info)',
}

export const NAMESPACE_COLORS = {
  'pump-station': 'var(--color-info)',
  'monitoring':   'var(--color-text-info)',
  'kube-system':  'var(--color-text-tertiary)',
}
