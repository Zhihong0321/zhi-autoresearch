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
  iterations: ResearchIteration[]
}

interface FileItem {
  name: string
  type: 'md' | 'txt' | 'code' | 'image' | 'other'
  content?: string
}

interface ResearchIteration {
  number: number
  timestamp: string
  actions: string
  result: string
  verdict: 'better' | 'same' | 'worse'
  whyBetter: string
  confidence: number
  keep: boolean
  tokensUsed: number
}

// Sample data
const SAMPLE_FILES: FileItem[] = [
  { name: 'goal.md', type: 'md', content: 'Research and implement a robust 2D platformer physics engine with smooth collision detection and responsive controls.' },
]

const SAMPLE_ITERATIONS: ResearchIteration[] = [
  {
    number: 1,
    timestamp: '2026-03-30 13:05:00',
    actions: 'Searched web for "2D platformer physics engine best practices", "AABB collision detection tutorial", "Mario physics constants"',
    result: 'Found that 2D platformers typically use:\n- Fixed timestep (16.67ms for 60fps)\n- AABB collision detection\n- Gravity between 980-2400 px/s²\n- Coyote time (100ms) for forgiving jumps',
    verdict: 'better',
    whyBetter: 'Established baseline understanding of physics parameters. Discovered optimal gravity range (1200 px/s² for Mario-like feel).',
    confidence: 85,
    keep: true,
    tokensUsed: 1200,
  },
  {
    number: 2,
    timestamp: '2026-03-30 13:08:00',
    actions: 'Searched for "swept AABB collision vs discrete", "platformer jump arc formula", "variable jump height implementation"',
    result: 'Implemented:\n- Swept AABB for high-speed collision reliability\n- Variable jump height (hold button = higher jump)\n- Jump arc formula: height = v²/2g',
    verdict: 'better',
    whyBetter: 'Added swept collision which prevents tunneling at high speeds. Variable jump adds responsive feel.',
    confidence: 78,
    keep: true,
    tokensUsed: 1800,
  },
  {
    number: 3,
    timestamp: '2026-03-30 13:12:00',
    actions: 'Searched for "coyote time implementation", "game feel polish techniques", "frame perfect inputs"',
    result: 'Added polish features:\n- Coyote time (100ms grace period after leaving platform)\n- Jump buffering (queue jump before hitting ground)\n- Acceleration/friction for smooth movement',
    verdict: 'better',
    whyBetter: 'These are the "secret sauce" of great platformers. Mario and Celeste use all three. Marginal improvement now requires much more research.',
    confidence: 65,
    keep: true,
    tokensUsed: 2400,
  },
  {
    number: 4,
    timestamp: '2026-03-30 13:15:00',
    actions: 'Attempted to find advanced techniques: wall jumping, dash mechanics, custom physics debuggers',
    result: 'Found diminishing returns:\n- Wall jumping adds complexity without clear benefit for basic physics\n- Dash mechanics are separate system\n- Debug tools are implementation-specific',
    verdict: 'same',
    whyBetter: 'Next improvements would require 5x more tokens for 5% benefit. Stopping here is token-efficient.',
    confidence: 90,
    keep: false,
    tokensUsed: 3100,
  },
]

// Icons
const Icons = {
  logo: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  folder: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  file: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5,3 19,12 5,21"/></svg>,
  upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>,
  x: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  minus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>,
  brain: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l8-8"/><circle cx="12" cy="12" r="4"/></svg>,
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
      status: 'done',
      files: SAMPLE_FILES,
      iterations: SAMPLE_ITERATIONS,
    },
  ])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', goal: '' })
  const [isResearching, setIsResearching] = useState(false)
  const [showIterations, setShowIterations] = useState(true)
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
    setView('workspace')
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
      iterations: [],
    }
    setProjects([project, ...projects])
    setNewProject({ name: '', goal: '' })
    setShowCreate(false)
    openProject(project)
  }

  const startResearch = () => {
    if (!activeProject) return
    setIsResearching(true)
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

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'better') return 'var(--success)'
    if (verdict === 'worse') return 'var(--error)'
    return 'var(--text-secondary)'
  }

  const getVerdictIcon = (verdict: string, keep: boolean) => {
    if (verdict === 'better' && keep) return <span style={{ color: 'var(--success)' }}>✓</span>
    if (verdict === 'worse' || !keep) return <span style={{ color: 'var(--error)' }}>✗</span>
    return <span style={{ color: 'var(--text-secondary)' }}>−</span>
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
          <div className="workspace-header">
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{activeProject.name}</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {activeProject.iterations.length} iterations · {activeProject.status === 'done' ? 'Research complete' : 'In progress'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={startResearch} disabled={isResearching}>
                {isResearching ? <><span className="spinner" /> Researching...</> : <><Icons.play /> Start Research</>}
              </button>
            </div>
          </div>

          <div className="workspace-layout">
            <div className="sidebar-section">
              <div className="sidebar-section">
                <h4>Research Goal</h4>
                <div className="goal-text">
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
                      <span className="file-icon"><Icons.file /></span>
                      {file.name}
                    </li>
                  ))}
                </ul>
                <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                  <Icons.upload />
                  <div style={{ marginTop: '0.5rem' }}>Drop files</div>
                </div>
                <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
              </div>
            </div>

            <div className="main-panel">
              <div className="panel-header">
                <span>Evolution History</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {activeProject.iterations.length} iterations
                </span>
              </div>
              <div className="panel-body">
                {activeProject.iterations.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '3rem', opacity: 0.3 }}>🧠</div>
                    <h3>Ready to Research</h3>
                    <p>Click "Start Research" to begin the Karpathy Loop</p>
                    <div style={{ marginTop: '1.5rem' }}>
                      <button className="btn btn-primary" onClick={startResearch}>
                        <Icons.play /> Start Research
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {activeProject.iterations.map((iter, idx) => (
                      <div key={iter.number} style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.75rem',
                          paddingBottom: '0.5rem',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                              background: iter.keep ? 'var(--success)' : 'var(--bg-secondary)',
                              color: iter.keep ? '#000' : 'var(--text-secondary)',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}>
                              #{iter.number}
                            </span>
                            <span style={{ color: getVerdictColor(iter.verdict), fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {getVerdictIcon(iter.verdict, iter.keep)}
                              {iter.verdict.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {iter.tokensUsed.toLocaleString()} tokens · {iter.confidence}% confidence
                          </span>
                        </div>

                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            What I did
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                            {iter.actions}
                          </div>
                        </div>

                        {iter.whyBetter && (
                          <div style={{
                            background: iter.verdict === 'better' ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-secondary)',
                            borderLeft: `3px solid ${getVerdictColor(iter.verdict)}`,
                            padding: '0.75rem',
                            borderRadius: '0 8px 8px 0',
                            marginBottom: '0.75rem',
                          }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              Verdict: Why {iter.verdict === 'better' ? 'better' : 'not improved'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {iter.whyBetter}
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Result
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            background: 'var(--bg-secondary)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '150px',
                            overflowY: 'auto',
                            lineHeight: 1.5,
                          }}>
                            {iter.result}
                          </div>
                        </div>

                        {idx < activeProject.iterations.length - 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0', color: 'var(--text-secondary)' }}>
                            ↓
                          </div>
                        )}
                      </div>
                    ))}
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

        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={() => setShowCreate(false)}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>New Research Project</h2>
              <div className="form-group">
                <label>Project Name</label>
                <input type="text" placeholder="e.g. Unity vs Unreal for 2D games" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Research Goal</label>
                <textarea placeholder="What do you want me to research?" value={newProject.goal} onChange={e => setNewProject({ ...newProject, goal: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={createProject} disabled={!newProject.name.trim()}>Create Project</button>
              </div>
            </div>
          </div>
        )}

        {projects.length > 0 ? (
          <div className="card-grid">
            {projects.map(project => (
              <div key={project.id} className="card project-card" onClick={() => openProject(project)}>
                <h3>{project.name}</h3>
                <p>{project.goal}</p>
                <div className="project-meta">
                  <span>{project.iterations.length} iterations</span>
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

        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Zhi AutoResearch · Powered by the Karpathy Loop · No GPU required
          </p>
        </div>
      </div>
    </div>
  )
}