import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { ensureSession } from './shared/lib/session'
import LoginPage from './features/auth/pages/LoginPage'
import RecruitmentLayout from './shared/components/layout/RecruitmentLayout'
import InterviewerLayout from './shared/components/layout/InterviewerLayout'
import DashboardPage from './features/recruiter/dashboard/pages/DashboardPage'
import JDCreationPage from './features/recruiter/jd-creation/pages/JDCreationPage'
import JobsPage from './features/recruiter/job-folders/pages/JobsPage'
import JobFolderDetailPage from './features/recruiter/job-folders/pages/JobFolderDetailPage'
import CandidatesPage from './features/recruiter/candidates/pages/CandidatesPage'
import CandidateDetailPage from './features/recruiter/candidates/pages/CandidateDetailPage'
import InterviewerDashboard from './features/interviewer/dashboard/pages/DashboardPage'
import InterviewerJDCreationPage from './features/interviewer/jd-creation/pages/JDCreationPage'
import InterviewerCandidatesPage from './features/interviewer/candidates/pages/MyCandidatesPage'

const VALID_STAGES = new Set<string>(['under_review', 'filtered', 'shortlisted', 'interviewing', 'selected', 'rejected'])

// The root route is just a shell — all it does is render child routes via <Outlet />.
// Layout and auth guarding happen in the child routes (recruitmentRoute, interviewerRoute).
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  staticData: { title: 'Login' },
  component: LoginPage,
})

const recruitmentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recruitment',
  beforeLoad: async () => {
    const user = await ensureSession()
    if (user?.role !== 'recruitment') throw redirect({ to: '/login' })
  },
  component: () => <RecruitmentLayout />,
})

// /recruitment with no sub-path → redirect to the default tab
const recruitmentIndexRoute = createRoute({
  getParentRoute: () => recruitmentRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/recruitment/jd-creation' }) },
})

const recruitmentDashboardRoute = createRoute({
  getParentRoute: () => recruitmentRoute,
  path: 'dashboard',
  staticData: { title: 'Dashboard' },
  component: DashboardPage,
})

const recruitmentJobPostingRoute = createRoute({
  getParentRoute: () => recruitmentRoute,
  path: 'jd-creation',
  staticData: { title: 'JD Creation' },
  component: JDCreationPage,
})

const recruitmentJobsRoute = createRoute({
  getParentRoute: () => recruitmentRoute,
  path: 'jobs',
  staticData: { title: 'Jobs' },
  component: JobsPage,
})

const recruitmentJobDetailRoute = createRoute({
  getParentRoute: () => recruitmentRoute,
  path: 'jobs/$jobId',
  staticData: { title: 'Job Details' },
  validateSearch: (search: Record<string, unknown>) => ({
    stage: typeof search.stage === 'string' && VALID_STAGES.has(search.stage) ? search.stage : undefined,
  }),
  component: JobFolderDetailPage,
})

const recruitmentCandidatesRoute = createRoute({
  getParentRoute: () => recruitmentRoute,
  path: 'candidates',
  staticData: { title: 'Candidates' },
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === 'string' && (search.status === '' || VALID_STAGES.has(search.status)) ? search.status : undefined,
    filter: search.filter === 'topAts' ? 'topAts' as const : undefined,
  }),
  component: CandidatesPage,
})

const recruitmentCandidateDetailRoute = createRoute({
  getParentRoute: () => recruitmentRoute,
  path: 'candidates/$candidateId',
  staticData: { title: 'Candidate Profile' },
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: typeof search.jobId === 'string' ? search.jobId : undefined,
    fromJobFolder: search.fromJobFolder === true || search.fromJobFolder === 'true' ? true : undefined,
    stage: typeof search.stage === 'string' && VALID_STAGES.has(search.stage) ? search.stage : undefined,
    prevId: typeof search.prevId === 'string' ? search.prevId : undefined,
    nextId: typeof search.nextId === 'string' ? search.nextId : undefined,
  }),
  component: CandidateDetailPage,
})

const interviewerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/interviewer',
  beforeLoad: async () => {
    const user = await ensureSession()
    if (user?.role !== 'interviewer') throw redirect({ to: '/login' })
  },
  component: () => <InterviewerLayout />,
})

// /interviewer with no sub-path → redirect to the default tab
const interviewerIndexRoute = createRoute({
  getParentRoute: () => interviewerRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/interviewer/dashboard' }) },
})

const interviewerDashboardRoute = createRoute({
  getParentRoute: () => interviewerRoute,
  path: 'dashboard',
  staticData: { title: 'Dashboard' },
  component: InterviewerDashboard,
})

const interviewerCandidatesRoute = createRoute({
  getParentRoute: () => interviewerRoute,
  path: 'candidates',
  staticData: { title: 'My Candidates' },
  component: InterviewerCandidatesPage,
})

const interviewerJDCreationRoute = createRoute({
  getParentRoute: () => interviewerRoute,
  path: 'jd-creation',
  staticData: { title: 'JD Creation' },
  component: InterviewerJDCreationPage,
})

// Explicit index route — TanStack Router's '*' wildcard does not match '/'
const rootIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/login' }) },
})

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => { throw redirect({ to: '/login' }) },
})

const routeTree = rootRoute.addChildren([
  rootIndexRoute,
  loginRoute,
  recruitmentRoute.addChildren([
    recruitmentIndexRoute,
    recruitmentDashboardRoute,
    recruitmentJobPostingRoute,
    recruitmentJobsRoute,
    recruitmentJobDetailRoute,
    recruitmentCandidatesRoute,
    recruitmentCandidateDetailRoute,
  ]),
  interviewerRoute.addChildren([
    interviewerIndexRoute,
    interviewerDashboardRoute,
    interviewerCandidatesRoute,
    interviewerJDCreationRoute,
  ]),
  catchAllRoute,
])

export const router = createRouter({ routeTree })

router.subscribe('onResolved', () => {
  const deepest = [...router.state.matches].reverse().find(m => m.staticData?.title)
  document.title = deepest?.staticData?.title
    ? `${deepest.staticData.title} · HireLens`
    : 'HireLens'
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
  interface StaticDataRouteOption {
    title?: string
  }
}
