import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface ProjectPreviewValue {
  /** Id of the project whose drawing the site window previews; null shows the finished building. */
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

const ProjectPreviewContext = createContext<ProjectPreviewValue>({
  activeProjectId: null,
  setActiveProjectId: () => {},
});

export function ProjectPreviewProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const value = useMemo(() => ({ activeProjectId, setActiveProjectId }), [activeProjectId]);
  return <ProjectPreviewContext.Provider value={value}>{children}</ProjectPreviewContext.Provider>;
}

export function useProjectPreview(): ProjectPreviewValue {
  return useContext(ProjectPreviewContext);
}
