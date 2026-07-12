export { client, setAuthToken } from './client';

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
        subscription {
          tier
          currentPeriodEnd
        }
      }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

export const REFRESH_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      firstName
      lastName
      title
      targetRole
      experienceLevel
      targetLocations
      isActive
      subscription {
        tier
        currentPeriodEnd
      }
      createdAt
    }
  }
`;

export const JOBS_QUERY = `
  query Jobs($pagination: PaginationInput, $status: JobStatus, $search: String) {
    jobs(pagination: $pagination, status: $status, search: $search) {
      edges {
        id
        companyName
        jobTitle
        jobDescription
        jobUrl
        status
        source
        salaryRange
        location
        notes
        createdAt
        updatedAt
        interviews {
          id
          type
          scheduledAt
          isCompleted
        }
      }
      meta {
        total
        totalPages
        page
        limit
      }
    }
  }
`;

export const CREATE_JOB_MUTATION = `
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) {
      id
      companyName
      jobTitle
      status
      createdAt
    }
  }
`;

export const UPDATE_JOB_MUTATION = `
  mutation UpdateJob($id: String!, $input: UpdateJobInput!) {
    updateJob(id: $id, input: $input) {
      id
      companyName
      jobTitle
      status
      updatedAt
    }
  }
`;

export const DELETE_JOB_MUTATION = `
  mutation DeleteJob($id: String!) {
    deleteJob(id: $id)
  }
`;

export const DELETE_ALL_JOBS_MUTATION = `
  mutation DeleteAllJobs {
    deleteAllJobs
  }
`;

export const IMPORT_JOBS_MUTATION = `
  mutation ImportJobs($jobs: [CreateJobInput!]!) {
    importJobs(jobs: $jobs) {
      imported
      skipped
    }
  }
`;

export const RESUMES_QUERY = `
  query Resumes {
    resumes {
      id
      title
      fileUrl
      fileKey
      fileSize
      mimeType
      isPrimary
      parsedSkills
      parsedExperience
      parsedEducation
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_RESUME_MUTATION = `
  mutation CreateResume($input: CreateResumeInput!) {
    createResume(input: $input) {
      id
      title
      fileUrl
      isPrimary
      createdAt
    }
  }
`;

export const DELETE_RESUME_MUTATION = `
  mutation DeleteResume($id: String!) {
    deleteResume(id: $id)
  }
`;

export const SET_PRIMARY_RESUME_MUTATION = `
  mutation SetPrimaryResume($id: String!) {
    setPrimaryResume(id: $id) {
      id
      title
      isPrimary
    }
  }
`;

export const COVER_LETTERS_QUERY = `
  query CoverLetters {
    coverLetters {
      id
      jobTitle
      companyName
      content
      tone
      jobDescription
      isGenerated
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_COVER_LETTER_MUTATION = `
  mutation CreateCoverLetter($input: CreateCoverLetterInput!) {
    createCoverLetter(input: $input) {
      id
      jobTitle
      companyName
      content
      createdAt
    }
  }
`;

export const DELETE_COVER_LETTER_MUTATION = `
  mutation DeleteCoverLetter($id: String!) {
    deleteCoverLetter(id: $id)
  }
`;

export const INTERVIEWS_QUERY = `
  query Interviews {
    interviews {
      id
      type
      round
      scheduledAt
      durationMinutes
      interviewers
      location
      notes
      feedback
      rating
      isCompleted
      jobApplicationId
      createdAt
    }
  }
`;

export const CREATE_INTERVIEW_MUTATION = `
  mutation CreateInterview($input: CreateInterviewInput!) {
    createInterview(input: $input) {
      id
      type
      round
      scheduledAt
      isCompleted
    }
  }
`;

export const UPDATE_INTERVIEW_MUTATION = `
  mutation UpdateInterview($id: String!, $input: UpdateInterviewInput!) {
    updateInterview(id: $id, input: $input)
  }
`;

export const DELETE_INTERVIEW_MUTATION = `
  mutation DeleteInterview($id: String!) {
    deleteInterview(id: $id)
  }
`;

export const INTERVIEW_QUESTIONS_QUERY = `
  query InterviewQuestionsByUser {
    interviewQuestionsByUser {
      id
      question
      answer
      type
      category
      difficulty
      source
      isFavorite
      createdAt
      updatedAt
    }
  }
`;

export const TOGGLE_FAVORITE_QUESTION_MUTATION = `
  mutation ToggleFavoriteQuestion($id: String!) {
    toggleFavoriteQuestion(id: $id) {
      id
      isFavorite
    }
  }
`;

export const SKILL_GAP_REPORTS_QUERY = `
  query SkillGapReports {
    skillGapReports {
      id
      jobDescription
      jobTitle
      companyName
      requiredSkills
      userSkills
      missingSkills
      matchScore
      recommendations
      createdAt
    }
  }
`;

export const GENERATE_COVER_LETTER_MUTATION = `
  mutation GenerateCoverLetter($input: GenerateCoverLetterInput!) {
    generateCoverLetter(input: $input) {
      coverLetter {
        id
        jobTitle
        companyName
        content
        tone
        isGenerated
        createdAt
      }
      content
    }
  }
`;

export const ANALYZE_SKILL_GAP_MUTATION = `
  mutation AnalyzeSkillGap($input: SkillGapInput!) {
    analyzeSkillGap(input: $input) {
      report {
        id
        jobTitle
        companyName
        matchScore
        requiredSkills
        missingSkills
        recommendations
        createdAt
      }
      requiredSkills
      missingSkills
      matchScore
      recommendations
    }
  }
`;

export const GENERATE_INTERVIEW_QUESTIONS_MUTATION = `
  mutation GenerateInterviewQuestions($input: InterviewQuestionsInput!) {
    generateInterviewQuestions(input: $input) {
      questions {
        id
        question
        answer
        type
        category
        difficulty
      }
    }
  }
`;

export const FUNNEL_ANALYTICS_QUERY = `
  query FunnelAnalytics {
    funnelAnalytics {
      saved
      applied
      phoneScreen
      technical
      onsite
      offer
      rejected
      accepted
    }
  }
`;

export const MONTHLY_STATS_QUERY = `
  query MonthlyStats($from: DateTime!, $to: DateTime!) {
    monthlyStats(from: $from, to: $to) {
      month
      applications
      interviews
    }
  }
`;

export const SCRAPE_JOBS_MUTATION = `
  mutation ScrapeJobs($input: ScrapeJobsInput!) {
    scrapeJobs(input: $input) {
      total
      imported
      jobs {
        companyName
        jobTitle
        jobDescription
        jobUrl
        location
        salaryRange
        source
        employmentType
        workMode
        postedDate
      }
      stats {
        linkedin
        indeed
        workopolis
        ziprecruiter
        greenhouse
        lever
        workday
      }
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      firstName
      lastName
      title
      targetRole
      experienceLevel
      targetLocations
    }
  }
`;

// LinkedIn Optimizer
export const LINKEDIN_OPTIMIZATIONS_QUERY = `
  query LinkedinOptimizations($type: String) {
    linkedinOptimizations(type: $type) {
      id
      type
      inputData
      outputData
      createdAt
    }
  }
`;

export const ANALYZE_LINKEDIN_PROFILE_MUTATION = `
  mutation AnalyzeLinkedinProfile($input: AnalyzeProfileInput!) {
    analyzeLinkedinProfile(input: $input) {
      optimization {
        id
        type
        outputData
        createdAt
      }
      output
    }
  }
`;

export const GENERATE_LINKEDIN_HEADLINES_MUTATION = `
  mutation GenerateLinkedinHeadlines($input: GenerateHeadlineInput!) {
    generateLinkedinHeadlines(input: $input) {
      optimization {
        id
        type
        outputData
        createdAt
      }
      output
    }
  }
`;

export const GENERATE_LINKEDIN_ABOUT_MUTATION = `
  mutation GenerateLinkedinAbout($input: GenerateAboutInput!) {
    generateLinkedinAbout(input: $input) {
      optimization {
        id
        type
        outputData
        createdAt
      }
      output
    }
  }
`;

export const OPTIMIZE_LINKEDIN_EXPERIENCE_MUTATION = `
  mutation OptimizeLinkedinExperience($input: OptimizeExperienceInput!) {
    optimizeLinkedinExperience(input: $input) {
      optimization {
        id
        type
        outputData
        createdAt
      }
      output
    }
  }
`;

export const COMPARE_RESUME_LINKEDIN_MUTATION = `
  mutation CompareResumeWithLinkedin($input: CompareResumeInput!) {
    compareResumeWithLinkedin(input: $input) {
      optimization {
        id
        type
        outputData
        createdAt
      }
      output
    }
  }
`;

export const ANALYZE_LINKEDIN_VISIBILITY_MUTATION = `
  mutation AnalyzeLinkedinVisibility($input: AnalyzeVisibilityInput!) {
    analyzeLinkedinVisibility(input: $input) {
      optimization {
        id
        type
        outputData
        createdAt
      }
      output
    }
  }
`;
