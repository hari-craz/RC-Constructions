import { Sheet } from '../../components/SheetStack';
import { FITOUT_STAGE } from '../../data/stages';
import './StageSection.css';

const stage = FITOUT_STAGE;

export function FitoutStage() {
  return (
    <Sheet
      id={stage.sectionId}
      label={`${stage.kicker} — ${stage.name}`}
      tone={stage.tone}
      className="stage-sheet"
    >
      <div className="container stage-content">
        <h2 className="stage-title">{stage.title}</h2>
        <p className="stage-lead">{stage.copy.lead}</p>
        {/* PLACEHOLDER: Fit-out and technical installations to be finalized in Phase 7 */}
        <p className="stage-description">{stage.copy.description}</p>
        <div className="stage-metrics-grid">
          {stage.copy.metrics.map((m) => (
            <div key={m.label} className="stage-metric-card">
              <span className="stage-metric-label">{m.label}</span>
              <span className="stage-metric-value">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
