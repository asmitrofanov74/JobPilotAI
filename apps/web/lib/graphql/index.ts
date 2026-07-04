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
          status
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
