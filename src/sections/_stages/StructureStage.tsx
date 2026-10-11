import { Sheet } from '../../components/SheetStack';
import { STRUCTURE_STAGE } from '../../data/stages';
import './StageSection.css';

const stage = STRUCTURE_STAGE;

export function StructureStage() {
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
        {/* PLACEHOLDER: Superstructure framing narrative to be finalized in Phase 7 */}
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
