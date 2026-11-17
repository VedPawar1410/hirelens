export const LOCATIONS = ['Hyderabad', 'Chicago', 'Columbia', 'San Jose'] as const
export const WORK_MODES = ['On-site', 'Remote', 'Hybrid'] as const
export const WORK_HOURS = ['11:00 AM – 8:00 PM', '2:00 PM – 11:00 PM'] as const
export const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '60 Days', '90 Days'] as const

// Display metadata for experience level cards and draft list icons.
export const LEVEL_META = {
  intern:     { label: 'Intern',      desc: 'Short-term internship with stipend' },
  fresher:    { label: 'Fresher',     desc: 'Entry-level, no prior experience required' },
  experienced:{ label: 'Experienced', desc: 'Candidates with specific years of experience' },
} as const
