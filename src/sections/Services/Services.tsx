import { useRef } from 'react';
import { Sheet } from '../../components/SheetStack';
import { SERVICES_CONTENT } from '../../content/services';
import { STRUCTURE_STAGE } from '../../data/stages';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import './Services.css';

const stage = STRUCTURE_STAGE;
const content = SERVICES_CONTENT;

export function Services() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const { reducedMotion } = useScroll();

  useGSAP(
    () => {
      if (reducedMotion || !tableRef.current) return;

      const rows = tableRef.current.querySelectorAll<HTMLTableRowElement>('.services-row');
      if (rows.length === 0) return;

      gsap.fromTo(
        rows,
        { '--rule-scale': 0 },
        {
          '--rule-scale': 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: `#${stage.sectionId}`,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    },
    { scope: containerRef, dependencies: [reducedMotion] },
  );

  return (
    <Sheet id={stage.sectionId} label={content.kicker} tone={stage.tone} className="services-sheet">
      <div ref={containerRef} className="container services-content">
        <header className="services-header">
          <div className="services-kicker-row">
            <span className="services-kicker">{content.kicker}</span>
            <span className="services-code">{content.scheduleCode}</span>
          </div>
          <h2 className="services-title">{content.title}</h2>
        </header>

        <div className="services-schedule-container">
          <table
            ref={tableRef}
            className="services-table"
            aria-label="Services and Construction Schedule"
          >
            <thead className="services-table-header">
              <tr>
                <th scope="col" className="services-th services-th-num">
                  Item
                </th>
                <th scope="col" className="services-th services-th-name">
                  Trade / Sector
                </th>
                <th scope="col" className="services-th">
                  Scope & Typical Deliverables
                </th>
              </tr>
            </thead>
            <tbody>
              {content.services.map((service) => (
                <tr
                  key={service.id}
                  className="services-row"
                  tabIndex={0}
                  aria-label={`Service ${service.number}: ${service.name}`}
                >
                  <td className="services-td">
                    <span className="services-num">{service.number}</span>
                  </td>
                  <td className="services-td">
                    <span className="services-name-cell">{service.name}</span>
                  </td>
                  <td className="services-td">
                    <div className="services-desc-cell">
                      <span className="services-scope">{service.scope}</span>
                      <span className="services-typical">{service.typicalWork}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Sheet>
  );
}
