'use client'

import { useState, useEffect, useRef } from 'react'

// Types
interface Project {
  id: string
  name: string
  goal: string
  createdAt: string
  updatedAt: string
  status: 'idle' | 'researching' | 'done'
  files: FileItem[]
}

interface FileItem {
  name: string
  type: 'md' | 'txt' | 'code' | 'image' | 'other'
  content?: string
}

// Sample data
const SAMPLE_FILES: FileItem[] = [
  { name: 'goal.md', type: 'md' },
  { name: 'research-log.md', type: 'md' },
  { name: 'notes.txt', type: 'txt' },
  { name: 'game-physics.js', type: 'code' },
]

const SAMPLE_RESEARCH_OUTPUT = `# 🔬 Research Session — "2D Platformer Physics Engine"

## Iteration #1 — Initial Analysis

### What I found:
- 2D platformer physics typically uses **AABB collision detection**
- Most games use a **fixed timestep** physics loop (60fps = 16.67ms)
- Gravity constants range from 980 to 2400 pixels/s² depending on feel

### Key decisions:
- Using 1200 px/s² for gravity (good for Mario-like feel)
- Implementing **swept AABB** for reliable collision at high speeds
- Adding coyote time (100ms) for forgiving jumps

### Next steps:
- Implement basic player movement with friction
- Test collision with static platforms
- Tune jump height and arc

---
*Timestamp: ${new Date().toLocaleString()}*
*Agent: MiniMax AI | Mode: Karpathy Loop v1.0*`

// Icons (inline SVG)
const Icons = {
  logo: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  folder: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  file: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5,3 19,12 5,21"/></svg>,
  upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>,
  save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
}

// Main Page Component
export default function HomePage() {
  const [view, setView] = useState<'list' | 'workspace'>('list')
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'demo-1',
      name: '2D Platformer Physics',
      goal: 'Research and implement a robust 2D platformer physics engine with smooth collision detection and responsive controls.',
      createdAt: '2026-03-29',
      updatedAt: '2026-03-30',
      status: 'researching',
      files: SAMPLE_FILES,
    },
  ])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', goal: '' })
  const [researchOutput, setResearchOutput] = useState<string>('')
  const [isResearching, setIsResearching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zhi-projects')
    if (saved) {
      try {
        setProjects(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('zhi-projects', JSON.stringify(projects))
    }
  }, [projects])

  const openProject = (project: Project) => {
    setActiveProject(project)
    setSelectedFile(null)
    setResearchOutput('')
    setView('workspace')
    if (project.status === 'researching' && project.files.some(f => f.name === 'research-log.md')) {
      const log = project.files.find(f => f.name === 'research-log.md')
      if (log?.content) setResearchOutput(log.content)
    }
  }

  const goBack = () => {
    setView('list')
    setActiveProject(null)
    setSelectedFile(null)
  }

  const createProject = () => {
    if (!newProject.name.trim()) return
    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      goal: newProject.goal,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      status: 'idle',
      files: [
        { name: 'goal.md', type: 'md', content: newProject.goal },
      ],
    }
    setProjects([project, ...projects])
    setNewProject({ name: '', goal: '' })
    setShowCreate(false)
    openProject(project)
  }

  const startResearch = () => {
    if (!activeProject) return
    setIsResearching(true)
    // Update project status
    const updated = projects.map(p =>
      p.id === activeProject.id ? { ...p, status: 'researching' as const } : p
    )
    setProjects(updated)
    setActiveProject({ ...activeProject, status: 'researching' })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activeProject) return
    const files = Array.from(e.target.files)
    const newFiles: FileItem[] = files.map(file => ({
      name: file.name,
      type: file.name.endsWith('.md') ? 'md' as const
        : file.name.endsWith('.txt') ? 'txt' as const
        : file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py') ? 'code' as const
        : file.name.endsWith('.png') || file.name.endsWith('.jpg') ? 'image' as const
        : 'other' as const,
    }))
    const updatedProject = {
      ...activeProject,
      files: [...activeProject.files, ...newFiles],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setActiveProject(updatedProject)
    setProjects(projects.map(p => p.id === activeProject.id ? updatedProject : p))
  }

  const getFileIcon = (type: string) => {
    if (type === 'folder') return <Icons.folder />
    return <Icons.file />
  }

  // ── WORKSPACE VIEW ──────────────────────────────────────────────
  if (view === 'workspace' && activeProject) {
    return (
      <div>
        <header>
          <div className="container header-inner">
            <div className="logo" onClick={goBack} style={{ cursor: 'pointer' }}>
              <span>◉</span> Zhi <span style={{ fontWeight: 300 }}>/</span> AutoResearch
            </div>
            <div className="nav-links" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="status">
                <span className={`status-dot ${activeProject.status}`} />
                {activeProject.status === 'researching' ? 'Researching' : activeProject.status === 'done' ? 'Done' : 'Idle'}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={goBack}>
                <Icons.back /> Projects
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          {/* Workspace Header */}
          <div className="workspace-header">
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{activeProject.name}</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Last updated {activeProject.updatedAt}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={startResearch} disabled={isResearching}>
                {isResearching ? <><span className="spinner" /> Starting...</> : <><Icons.play /> Start Research</>}
              </button>
            </div>
          </div>

          {/* Workspace Layout */}
          <div className="workspace-layout">
            {/* Sidebar */}
            <div className="sidebar-section">
              <div className="sidebar-section">
                <h4>Research Goal</h4>
                <div className="goal-text" style={{ fontSize: '0.8rem' }}>
                  {activeProject.goal || 'No goal set'}
                </div>
              </div>

              <div className="sidebar-section">
                <h4>Files ({activeProject.files.length})</h4>
                <ul className="file-list">
                  {activeProject.files.map((file, i) => (
                    <li
                      key={i}
                      className={`file-item ${selectedFile?.name === file.name ? 'active' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <span className="file-icon">{getFileIcon(file.type)}</span>
                      {file.name}
                    </li>
                  ))}
                </ul>
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    // handle drop
                  }}
                >
                  <Icons.upload />
                  <div style={{ marginTop: '0.5rem' }}>Drop files or click</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>

              {activeProject.status === 'researching' && (
                <div className="sidebar-section">
                  <h4>Loop Status</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="status-dot researching" />
                      Iteration #1 in progress
                    </div>
                    <div>Goal → Search → Evaluate → Repeat</div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Panel */}
            <div className="main-panel">
              <div className="panel-header">
                <span>{selectedFile ? selectedFile.name : 'Research Output'}</span>
                {selectedFile && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selectedFile.type.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="panel-body">
                {selectedFile ? (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      File: {selectedFile.name}
                    </p>
                    <pre style={{
                      background: 'var(--bg-secondary)',
                      padding: '1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      overflow: 'auto',
                      maxHeight: '60vh',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {selectedFile.content || `[ ${selectedFile.name} — file content not loaded yet ]`}
                    </pre>
                  </div>
                ) : (
                  <div className="research-output">
                    {researchOutput ? (
                      <div dangerouslySetInnerHTML={{ __html: researchOutput.replace(/\n/g, '<br/>') }} />
                    ) : (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <h3>Ready to Research</h3>
                        <p>Click "Start Research" to begin the Karpathy Loop.</p>
                        <div style={{
                          background: 'var(--bg-secondary)',
                          padding: '1rem',
                          borderRadius: '8px',
                          marginTop: '1rem',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>How it works:</div>
                          <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            <li>I read your goal from goal.md</li>
                            <li>Search web for relevant information</li>
                            <li>Edit/expand files in this workspace</li>
                            <li>Evaluate quality → keep best results</li>
                            <li>Repeat until goal is achieved</li>
                          </ol>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ marginTop: '1.5rem' }}
                          onClick={startResearch}
                          disabled={isResearching}
                        >
                          <Icons.play /> {isResearching ? 'Researching...' : 'Start Research Loop'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ──────────────────────────────────────────────────
  return (
    <div>
      <header>
        <div className="container header-inner">
          <div className="logo">
            <span>◉</span> Zhi <span style={{ fontWeight: 300 }}>/</span> AutoResearch
          </div>
          <div className="nav-links">
            <a href="#">Docs</a>
            <a href="#">About</a>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Your Projects</h1>
            <p>AI-powered research workspaces built on the Karpathy Loop</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Icons.plus /> New Project
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '1rem',
          }} onClick={() => setShowCreate(false)}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '2rem',
              width: '100%',
              maxWidth: '500px',
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>New Research Project</h2>

              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Unity vs Unreal for 2D games"
                  value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Research Goal</label>
                <textarea
                  placeholder="What do you want me to research? Be specific about the outcome you want..."
                  value={newProject.goal}
                  onChange={e => setNewProject({ ...newProject, goal: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={createProject} disabled={!newProject.name.trim()}>
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Grid */}
        {projects.length > 0 ? (
          <div className="card-grid">
            {projects.map(project => (
              <div key={project.id} className="card project-card" onClick={() => openProject(project)}>
                <h3>{project.name}</h3>
                <p>{project.goal}</p>
                <div className="project-meta">
                  <span>{project.files.length} files</span>
                  <span>{project.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to start researching with AI</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Icons.plus /> New Project
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Zhi AutoResearch · Powered by the Karpathy Loop · No GPU required
          </p>
        </div>
      </div>
    </div>
  )
}