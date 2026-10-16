import { lazy, Suspense } from 'react';

// The six drawings are one lazy chunk, fetched on the first hover or focus of a project row
const importDrawings = () => import('./drawings');
const ProjectDrawing = lazy(importDrawings);

export function prefetchProjectDrawings() {
  void importDrawings();
}

export function ProjectPreview({ slug }: { slug: string }) {
  return (
    <Suspense fallback={null}>
      <ProjectDrawing slug={slug} />
    </Suspense>
  );
}
