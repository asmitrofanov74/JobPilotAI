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

// French Coach
export const FRENCH_PROFILE_QUERY = `
  query FrenchProfile {
    frenchProfile {
      id
      frenchLevel
      frenchVariant
      targetMarket
      targetRole
      targetIndustry
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_FRENCH_PROFILE_MUTATION = `
  mutation UpdateFrenchProfile($input: UpdateFrenchProfileInput!) {
    updateFrenchProfile(input: $input) {
      id
      frenchLevel
      frenchVariant
      targetMarket
      targetRole
      targetIndustry
    }
  }
`;

export const FRENCH_PROGRESS_QUERY = `
  query FrenchProgress {
    frenchProgress {
      totalSessions
      completedSessions
      sessionsByType
      averageScore
      grammarAvg
      vocabularyAvg
      fluencyAvg
      scoreHistory {
        date
        grammarScore
        vocabularyScore
        fluencyScore
      }
      vocabularyCount
      masteredWords
      streakDays
      weaknesses
    }
  }
`;

export const FRENCH_SESSIONS_QUERY = `
  query FrenchSessions($type: String) {
    frenchSessions(type: $type) {
      id
      type
      status
      inputData
      outputData
      createdAt
      updatedAt
    }
  }
`;



export const FRENCH_CONVERSATIONS_QUERY = `
  query FrenchConversations {
    frenchConversations {
      id
      scenario
      jobDescription
      messages {
        id
        role
        content
        evaluation {
          id
          grammarScore
          vocabularyScore
          fluencyScore
          corrections
          improvedVersion
          quebecAlternative
        }
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const FRENCH_CONVERSATION_QUERY = `
  query FrenchConversation($id: String!) {
    frenchConversation(id: $id) {
      id
      scenario
      jobDescription
      messages {
        id
        role
        content
        evaluation {
          id
          grammarScore
          vocabularyScore
          fluencyScore
          corrections
          improvedVersion
          quebecAlternative
        }
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const SEND_FRENCH_MESSAGE_MUTATION = `
  mutation SendFrenchMessage($input: SendFrenchMessageInput!) {
    sendFrenchMessage(input: $input) {
      conversationId
      response {
        id
        role
        content
        evaluation {
          id
          grammarScore
          vocabularyScore
          fluencyScore
          corrections
          improvedVersion
          quebecAlternative
        }
        createdAt
      }
    }
  }
`;

export const DELETE_FRENCH_CONVERSATION_MUTATION = `
  mutation DeleteFrenchConversation($id: String!) {
    deleteFrenchConversation(id: $id)
  }
`;

export const GENERATE_FRENCH_CONVERSATION_HINT_MUTATION = `
  mutation GenerateFrenchConversationHint($input: GenerateConversationHintInput!) {
    generateFrenchConversationHint(input: $input) {
      hint
      keyPoints
      suggestedResponse
    }
  }
`;

export const FRENCH_VOCABULARY_QUERY = `
  query FrenchVocabulary($filter: VocabularyFilterInput) {
    frenchVocabulary(filter: $filter) {
      id
      word
      translation
      context
      note
      difficulty
      timesReviewed
      timesCorrect
      nextReviewAt
      mastered
      createdAt
      updatedAt
    }
  }
`;

export const FRENCH_VOCABULARY_STATS_QUERY = `
  query FrenchVocabularyStats {
    frenchVocabularyStats {
      total
      mastered
      dueForReview
      difficultyBreakdown
    }
  }
`;

export const ADD_FRENCH_VOCABULARY_WORD_MUTATION = `
  mutation AddFrenchVocabularyWord($input: AddVocabularyWordInput!) {
    addFrenchVocabularyWord(input: $input) {
      id
      word
      translation
      context
      note
      difficulty
      mastered
    }
  }
`;

export const REVIEW_FRENCH_VOCABULARY_WORD_MUTATION = `
  mutation ReviewFrenchVocabularyWord($input: ReviewVocabularyWordInput!) {
    reviewFrenchVocabularyWord(input: $input) {
      id
      word
      difficulty
      timesReviewed
      timesCorrect
      nextReviewAt
      mastered
    }
  }
`;

export const DELETE_FRENCH_VOCABULARY_WORD_MUTATION = `
  mutation DeleteFrenchVocabularyWord($wordId: String!) {
    deleteFrenchVocabularyWord(wordId: $wordId)
  }
`;

export const EXTRACT_FRENCH_VOCABULARY_MUTATION = `
  mutation ExtractFrenchVocabulary($conversationId: String!) {
    extractFrenchVocabulary(conversationId: $conversationId) {
      id
      word
      translation
      context
      difficulty
    }
  }
`;

export const FRENCH_CULTURAL_TIP_QUERY = `
  query FrenchCulturalTip($topic: String) {
    frenchCulturalTip(topic: $topic) {
      id
      topic
      tip
      translation
      category
      region
      createdAt
    }
  }
`;

export const FRENCH_CULTURAL_TIP_HISTORY_QUERY = `
  query FrenchCulturalTipHistory {
    frenchCulturalTipHistory {
      id
      topic
      tip
      translation
      category
      region
      createdAt
    }
  }
`;

// Vocabulary Tracker


export const FRENCH_TODAY_VOCABULARY_QUERY = `
  query FrenchTodayVocabulary {
    frenchTodayVocabulary {
      date
      words {
        id
        word
        translation
        learned
        difficult
        reviewCount
        lastReviewAt
      }
      totalCount
      learnedCount
      difficultCount
    }
  }
`;

export const FRENCH_VOCABULARY_TRACKER_STATS_QUERY = `
  query FrenchVocabularyTrackerStats {
    frenchVocabularyTrackerStats {
      total
      learned
      difficult
    }
  }
`;



export const MARK_VOCABULARY_LEARNED_MUTATION = `
  mutation MarkVocabularyLearned($id: String!) {
    markVocabularyLearned(id: $id) {
      id
      word
      learned
      reviewCount
      lastReviewAt
    }
  }
`;

export const MARK_VOCABULARY_DIFFICULT_MUTATION = `
  mutation MarkVocabularyDifficult($id: String!, $difficult: Boolean!) {
    markVocabularyDifficult(id: $id, difficult: $difficult) {
      id
      word
      difficult
      reviewCount
      lastReviewAt
    }
  }
`;



// Interview Coach
export const FRENCH_INTERVIEWS_QUERY = `
  query FrenchInterviews {
    frenchInterviews {
      id
      scenario
      questionCount
      status
      questions
      answers
      evaluations
      overallScore
      createdAt
      updatedAt
    }
  }
`;

export const FRENCH_INTERVIEW_QUERY = `
  query FrenchInterview($id: String!) {
    frenchInterview(id: $id) {
      id
      scenario
      questionCount
      status
      questions
      answers
      evaluations
      overallScore
      createdAt
      updatedAt
    }
  }
`;

export const GENERATE_FRENCH_INTERVIEW_QUESTIONS_MUTATION = `
  mutation GenerateFrenchInterviewQuestions($input: GenerateInterviewQuestionsInput!) {
    generateFrenchInterviewQuestions(input: $input) {
      questions {
        id
        question
        category
      }
      interview {
        id
        scenario
        questionCount
        status
        questions
        overallScore
      }
    }
  }
`;

export const EVALUATE_FRENCH_INTERVIEW_ANSWER_MUTATION = `
  mutation EvaluateFrenchInterviewAnswer($input: EvaluateInterviewAnswerInput!) {
    evaluateFrenchInterviewAnswer(input: $input) {
      evaluation {
        questionId
        grammarScore
        confidenceScore
        technicalScore
        feedback
        improvedAnswer
        corrections
      }
      interview {
        id
        status
        overallScore
        answers
        evaluations
      }
    }
  }
`;

export const GENERATE_FRENCH_INTERVIEW_HINT_MUTATION = `
  mutation GenerateFrenchInterviewHint($input: GenerateInterviewHintInput!) {
    generateFrenchInterviewHint(input: $input) {
      hint
      keyPoints
      exampleAnswer
    }
  }
`;

export const EVALUATE_FRENCH_PRONUNCIATION_MUTATION = `
  mutation EvaluateFrenchPronunciation($input: EvaluatePronunciationInput!) {
    evaluateFrenchPronunciation(input: $input) {
      overallScore
      clarityScore
      accuracyScore
      fluencyScore
      feedback
      improvements {
        text
        suggestion
      }
    }
  }
`;

// --- English Interview Practice ---

export const ENGLISH_INTERVIEWS_QUERY = `
  query EnglishInterviews {
    englishInterviews {
      id
      scenario
      questionCount
      status
      questions
      answers
      evaluations
      overallScore
      createdAt
      updatedAt
    }
  }
`;

export const ENGLISH_INTERVIEW_QUERY = `
  query EnglishInterview($id: String!) {
    englishInterview(id: $id) {
      id
      scenario
      questionCount
      status
      questions
      answers
      evaluations
      overallScore
      createdAt
      updatedAt
    }
  }
`;

export const GENERATE_ENGLISH_INTERVIEW_QUESTIONS_MUTATION = `
  mutation GenerateEnglishInterviewQuestions($input: GenerateEnglishInterviewInput!) {
    generateEnglishInterviewQuestions(input: $input) {
      questions {
        id
        question
        category
      }
      interview {
        id
        scenario
        questionCount
        status
        questions
        overallScore
      }
    }
  }
`;

export const EVALUATE_ENGLISH_INTERVIEW_ANSWER_MUTATION = `
  mutation EvaluateEnglishInterviewAnswer($input: EvaluateEnglishAnswerInput!) {
    evaluateEnglishInterviewAnswer(input: $input) {
      evaluation {
        questionId
        grammarScore
        confidenceScore
        technicalScore
        feedback
        improvedAnswer
        corrections
      }
      interview {
        id
        status
        overallScore
        answers
        evaluations
      }
    }
  }
`;

export const GENERATE_ENGLISH_INTERVIEW_HINT_MUTATION = `
  mutation GenerateEnglishInterviewHint($input: GenerateEnglishHintInput!) {
    generateEnglishInterviewHint(input: $input) {
      hint
      keyPoints
      exampleAnswer
    }
  }
`;

