import '../graphql/graphql_service.dart';
import 'job_models.dart';

class JobsRepository {
  static const String listDocument = r'''
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
  ''';

  static const String createDocument = r'''
    mutation CreateJob($input: CreateJobInput!) {
      createJob(input: $input) {
        id
        companyName
        jobTitle
        status
      }
    }
  ''';

  static const String updateDocument = r'''
    mutation UpdateJob($id: String!, $input: UpdateJobInput!) {
      updateJob(id: $id, input: $input)
    }
  ''';

  static const String deleteDocument = r'''
    mutation DeleteJob($id: String!) {
      deleteJob(id: $id)
    }
  ''';

  static const String interviewsDocument = r'''
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
  ''';

  static const String createInterviewDocument = r'''
    mutation CreateInterview($input: CreateInterviewInput!) {
      createInterview(input: $input) {
        id
        type
        round
        scheduledAt
        isCompleted
      }
    }
  ''';

  static const String updateInterviewDocument = r'''
    mutation UpdateInterview($id: String!, $input: UpdateInterviewInput!) {
      updateInterview(id: $id, input: $input)
    }
  ''';

  static const String deleteInterviewDocument = r'''
    mutation DeleteInterview($id: String!) {
      deleteInterview(id: $id)
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<PaginatedJobs> list({
    int page = 1,
    int limit = 20,
    String? status,
    String? search,
  }) async {
    final result = await _service.request(
      document: listDocument,
      variables: {
        'pagination': {
          'page': page,
          'limit': limit,
          'sortBy': 'createdAt',
          'sortOrder': 'desc',
        },
        if (status != null && status.isNotEmpty) 'status': status,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['jobs'];
    if (data is! Map) throw Exception('No result from server');
    final map = data.cast<String, dynamic>();
    final edges = (map['edges'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((m) => Job.fromJson(m.cast<String, dynamic>()))
        .toList();
    final meta = map['meta'];
    return PaginatedJobs(
      jobs: edges,
      meta: meta is Map
          ? PaginationMeta.fromJson(meta.cast<String, dynamic>())
          : PaginationMeta(total: 0, page: 1, limit: 20, totalPages: 0),
    );
  }

  Future<void> create({
    required String companyName,
    required String jobTitle,
    String? jobDescription,
    String? jobUrl,
    String? status,
    String? source,
    String? salaryRange,
    String? location,
    String? notes,
  }) async {
    final result = await _service.mutate(
      document: createDocument,
      variables: {
        'input': {
          'companyName': companyName,
          'jobTitle': jobTitle,
          if (jobDescription != null && jobDescription.isNotEmpty)
            'jobDescription': jobDescription,
          if (jobUrl != null && jobUrl.isNotEmpty) 'jobUrl': jobUrl,
          if (status != null && status.isNotEmpty) 'status': status,
          if (source != null && source.isNotEmpty) 'source': source,
          if (salaryRange != null && salaryRange.isNotEmpty)
            'salaryRange': salaryRange,
          if (location != null && location.isNotEmpty) 'location': location,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      },
    );
    if (result.hasException) throw result.exception!;
  }

  Future<void> update(
    String id, {
    String? companyName,
    String? jobTitle,
    String? jobDescription,
    String? jobUrl,
    String? status,
    String? source,
    String? salaryRange,
    String? location,
    String? notes,
  }) async {
    final input = <String, dynamic>{
      if (companyName != null && companyName.isNotEmpty)
        'companyName': companyName,
      if (jobTitle != null && jobTitle.isNotEmpty) 'jobTitle': jobTitle,
    };
    if (jobDescription != null && jobDescription.isNotEmpty) {
      input['jobDescription'] = jobDescription;
    }
    if (jobUrl != null && jobUrl.isNotEmpty) input['jobUrl'] = jobUrl;
    if (status != null && status.isNotEmpty) input['status'] = status;
    if (source != null && source.isNotEmpty) input['source'] = source;
    if (salaryRange != null && salaryRange.isNotEmpty) {
      input['salaryRange'] = salaryRange;
    }
    if (location != null && location.isNotEmpty) input['location'] = location;
    if (notes != null && notes.isNotEmpty) input['notes'] = notes;
    final result = await _service.mutate(
      document: updateDocument,
      variables: {'id': id, 'input': input},
    );
    if (result.hasException) throw result.exception!;
    if (result.data?['updateJob'] == false) {
      throw Exception('Failed to update job');
    }
  }

  Future<void> delete(String id) async {
    final result = await _service.mutate(
      document: deleteDocument,
      variables: {'id': id},
    );
    if (result.hasException) throw result.exception!;
  }

  Future<List<JobInterview>> interviews() async {
    final result = await _service.request(document: interviewsDocument);
    if (result.hasException) throw result.exception!;
    return (result.data?['interviews'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((m) => JobInterview.fromJson(m.cast<String, dynamic>()))
        .toList();
  }

  Future<void> createInterview({
    required String jobApplicationId,
    required String type,
    String? scheduledAt,
    int? durationMinutes,
    String? interviewers,
    String? location,
    String? notes,
  }) async {
    final result = await _service.mutate(
      document: createInterviewDocument,
      variables: {
        'input': {
          'type': type,
          'jobApplicationId': jobApplicationId,
          if (scheduledAt != null && scheduledAt.isNotEmpty)
            'scheduledAt': scheduledAt,
          'durationMinutes': ?durationMinutes,
          if (interviewers != null && interviewers.isNotEmpty)
            'interviewers': interviewers,
          if (location != null && location.isNotEmpty) 'location': location,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      },
    );
    if (result.hasException) throw result.exception!;
  }

  Future<void> updateInterview(String id, {bool? isCompleted}) async {
    final result = await _service.mutate(
      document: updateInterviewDocument,
      variables: {
        'id': id,
        'input': {
          'isCompleted': ?isCompleted,
        },
      },
    );
    if (result.hasException) throw result.exception!;
  }

  Future<void> deleteInterview(String id) async {
    final result = await _service.mutate(
      document: deleteInterviewDocument,
      variables: {'id': id},
    );
    if (result.hasException) throw result.exception!;
  }
}
