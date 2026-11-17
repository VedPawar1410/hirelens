import { useState } from 'react'
import { ChevronLeft, Sparkles, Plus } from 'lucide-react'
import { PrimaryButton } from '../../../../shared/components/ui/PrimaryButton'
import type { JDDraft } from '../../../../shared/types'

interface Props {
  readonly draft: JDDraft
  readonly roleDescription: string
  readonly onRoleDescriptionChange: (value: string) => void
  readonly onBack: () => void
  readonly onSubmit: () => void
  readonly isSubmitting: boolean
}

const LEVEL_LABELS: Record<JDDraft['experienceLevel'], string> = {
  intern: 'Intern',
  fresher: 'Fresher',
  experienced: 'Experienced',
}

function daysAgo(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function daysWaitingLabel(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  if (days === 0) return 'New today'
  if (days === 1) return '1d waiting'
  return `${days}d waiting`
}

interface BulletTemplate {
  readonly keywords: readonly string[]
  readonly base: readonly [string, string, string]
  readonly senior: string
  readonly junior: string
}

const BULLET_TEMPLATES: readonly BulletTemplate[] = [
  {
    keywords: ['frontend', 'react', 'ui engineer'],
    base: [
      'Build product-critical recruiter and interviewer surfaces in React + TypeScript',
      'Own performance and accessibility for a high-density UI used daily by hiring teams',
      'Partner with design on novel interactions — pipelines, AI-assisted flows, kanban',
    ],
    senior: 'Mentor 2–5 mid-level engineers, steer technical decisions across the squad',
    junior: 'Iterate fast on UI feedback, collaborate with senior engineers, and own scoped features',
  },
  {
    keywords: ['backend', 'api', 'payment', 'service'],
    base: [
      'Design and build scalable APIs and services handling real production load',
      'Own reliability and observability for critical data pipelines and endpoints',
      'Collaborate with product and frontend on API contracts and feature delivery',
    ],
    senior: 'Lead architectural decisions and drive system reliability improvements',
    junior: 'Build services under guidance and own scoped features with increasing autonomy',
  },
  {
    keywords: ['ml', 'machine learning', 'data engineer'],
    base: [
      'Build and maintain ML pipelines and data infrastructure at production scale',
      'Own model quality metrics, monitoring, and retraining workflows',
      'Partner with product and platform teams to ship ML features end-to-end',
    ],
    senior: 'Define ML platform strategy and mentor junior engineers on the team',
    junior: 'Contribute to ML experiments and iterate quickly based on production feedback',
  },
  {
    keywords: ['design', 'ux', 'product design'],
    base: [
      'Own design for one or more product areas end-to-end, from brief to shipped',
      'Partner with engineering to deliver high-quality, accessible interfaces',
      'Run user research and synthesise insights into actionable design decisions',
    ],
    senior: 'Set the design bar for the team, shape design systems, and mentor other designers',
    junior: 'Iterate quickly on designs based on feedback from engineers and stakeholders',
  },
  {
    keywords: ['devops', 'infra', 'platform', 'sre'],
    base: [
      'Own CI/CD pipelines and ensure fast, reliable delivery across all environments',
      'Build and maintain cloud infrastructure with a focus on uptime and cost efficiency',
      'Establish on-call practices, runbooks, and incident response workflows',
    ],
    senior: 'Define platform strategy and improve developer experience across engineering',
    junior: 'Automate toil, improve pipelines, and grow into owning larger system areas',
  },
]

const DEFAULT_BULLETS: BulletTemplate = {
  keywords: [],
  base: [
    'Own the day-to-day responsibilities for this role and set the quality standard',
    'Collaborate cross-functionally with stakeholders to deliver outcomes that matter',
    'Bring domain expertise to influence roadmap and technical or creative decisions',
  ],
  senior: 'Mentor junior team members and establish best practices in your area',
  junior: 'Grow fast, take ownership of scoped deliverables, and seek feedback often',
}

function generateBullets(jobTitle: string, level: JDDraft['experienceLevel']): string[] {
  const t = jobTitle.toLowerCase()
  const template = BULLET_TEMPLATES.find(({ keywords }) => keywords.some((k) => t.includes(k))) ?? DEFAULT_BULLETS
  return [...template.base, level === 'experienced' ? template.senior : template.junior]
}

export function DraftDetailView({
  draft,
  roleDescription,
  onRoleDescriptionChange,
  onBack,
  onSubmit,
  isSubmitting,
}: Props) {
  const [bulletsOpen, setBulletsOpen] = useState(true)

  const wordCount =
    roleDescription.trim() === '' ? 0 : roleDescription.trim().split(/\s+/).length
  const canSubmit = !isSubmitting && wordCount >= 1
  const bullets = generateBullets(draft.jobTitle, draft.experienceLevel)
  const waitLabel = daysWaitingLabel(draft.createdAt)
  const assignedAgo = daysAgo(draft.createdAt)

  const comp =
    draft.experienceLevel === 'intern'
      ? `₹${draft.stipendSalary} stipend`
      : `₹${draft.fulltimeOfferSalary}`

  function insertBullet(bullet: string) {
    const prefix = roleDescription.trim() === '' ? '' : '\n'
    onRoleDescriptionChange(roleDescription + prefix + '• ' + bullet)
  }

  return (
    <div className="flex flex-col">
      {/* Mobile-only back button */}
      <button
        onClick={onBack}
        className="md:hidden flex items-center gap-1.5 text-[13px] text-[#9ca3af] bg-transparent border-none cursor-pointer p-0 mb-4 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {/* JD title + badges + assigned by */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[20px] font-bold text-white m-0 mb-2 leading-tight">{draft.jobTitle}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#1e3a5f] text-[#93c5fd] rounded-full py-0.5 px-2.5 text-[11px] font-medium">
              {LEVEL_LABELS[draft.experienceLevel]}
            </span>
            <span className="bg-[rgba(245,158,11,0.15)] text-[#fbbf24] rounded-full py-0.5 px-2.5 text-[11px] font-medium">
              {waitLabel}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-[#6b7280] m-0">Assigned by {draft.createdBy}</p>
          <p className="text-[11px] text-[#6b7280] m-0 mt-0.5">{assignedAgo}</p>
        </div>
      </div>

      {/* Metadata row 1: location, mode, hours, exp */}
      <div className="flex items-center gap-3 text-[12px] text-[#9ca3af] mb-2 flex-wrap">
        <span>
          <span className="text-[#6b7280] text-[10px] uppercase tracking-wide mr-1">Location</span>
          {draft.location}
        </span>
        <span className="text-[#37373f]">|</span>
        <span>
          <span className="text-[#6b7280] text-[10px] uppercase tracking-wide mr-1">Mode</span>
          {draft.workMode}
        </span>
        <span className="text-[#37373f]">|</span>
        <span>
          <span className="text-[#6b7280] text-[10px] uppercase tracking-wide mr-1">Hours</span>
          {draft.workHours}
        </span>
        {draft.yearsOfExperience && (
          <>
            <span className="text-[#37373f]">|</span>
            <span>
              <span className="text-[#6b7280] text-[10px] uppercase tracking-wide mr-1">Exp</span>
              {draft.yearsOfExperience}
            </span>
          </>
        )}
      </div>

      {/* Metadata row 2: comp, notice */}
      <div className="flex items-center gap-3 text-[12px] text-[#9ca3af] mb-5 flex-wrap">
        {comp && (
          <span>
            <span className="text-[#6b7280] text-[10px] uppercase tracking-wide mr-1">Comp</span>
            {comp}
          </span>
        )}
        {draft.noticePeriod && (
          <>
            <span className="text-[#37373f]">|</span>
            <span>
              <span className="text-[#6b7280] text-[10px] uppercase tracking-wide mr-1">Notice</span>
              {draft.noticePeriod}
            </span>
          </>
        )}
      </div>

      <div className="border-t border-[#37373f] mb-5" />

      {/* Role Description textarea */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
            Role Description
          </span>
          <span className={`text-[11px] ${wordCount >= 50 ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
            {wordCount}/50+ words
          </span>
        </div>
        <textarea
          value={roleDescription}
          onChange={(e) => onRoleDescriptionChange(e.target.value)}
          rows={6}
          placeholder="You're the domain expert — what does this person actually do? What's hard? What's non-negotiable?"
          className="bg-[#1a1d20] border border-[#37373f] text-white rounded-xl py-3 px-4 w-full outline-none text-[13px] resize-none leading-relaxed focus:border-[#1d2ba4] transition-[border-color] duration-150 placeholder:text-[#4b5563]"
        />
      </div>

      {/* AI Starter Bullets */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden mb-5">
        <button
          onClick={() => setBulletsOpen((b) => !b)}
          className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#818cf8]" />
            <span className="text-[11px] font-semibold text-[#818cf8] tracking-widest uppercase">
              AI Starter Bullets — Click to Insert
            </span>
          </div>
          <span className="text-[10px] text-[#4b5563]">Based on JD + Role</span>
        </button>

        {bulletsOpen && (
          <div className="px-4 pb-4 flex flex-col gap-2.5">
            {bullets.map((bullet) => (
              <button
                key={bullet}
                onClick={() => insertBullet(bullet)}
                className="flex items-start gap-2.5 text-left bg-transparent border-none cursor-pointer p-0 group"
              >
                <Plus className="w-3.5 h-3.5 text-[#818cf8] shrink-0 mt-0.5 group-hover:text-[#a5b4fc] transition-colors" />
                <span className="text-[12px] text-[#9ca3af] group-hover:text-[#e5e7eb] transition-colors leading-relaxed">
                  {bullet}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <PrimaryButton
        onClick={onSubmit}
        disabled={!canSubmit}
        loading={isSubmitting}
        loadingText="Submitting..."
      >
        Submit Back to Recruitment
      </PrimaryButton>
    </div>
  )
}
