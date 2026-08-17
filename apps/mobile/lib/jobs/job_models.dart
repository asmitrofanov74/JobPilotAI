class JobInterviewBrief {
  final String id;
  final String type;
  final String? scheduledAt;
  final bool isCompleted;

  JobInterviewBrief({
    required this.id,
    required this.type,
    this.scheduledAt,
    required this.isCompleted,
  });

  factory JobInterviewBrief.fromJson(Map<String, dynamic> json) {
    return JobInterviewBrief(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      scheduledAt: json['scheduledAt'] as String?,
      isCompleted: json['isCompleted'] as bool? ?? false,
    );
  }
}

class Job {
  final String id;
  final String companyName;
  final String jobTitle;
  final String? jobDescription;
  final String? jobUrl;
  final String status;
  final String? source;
  final String? salaryRange;
  final String? location;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<JobInterviewBrief> interviews;

  Job({
    required this.id,
    required this.companyName,
    required this.jobTitle,
    this.jobDescription,
    this.jobUrl,
    required this.status,
    this.source,
    this.salaryRange,
    this.location,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.interviews = const [],
  });

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['id'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      jobDescription: json['jobDescription'] as String?,
      jobUrl: json['jobUrl'] as String?,
      status: json['status'] as String? ?? 'SAVED',
      source: json['source'] as String?,
      salaryRange: json['salaryRange'] as String?,
      location: json['location'] as String?,
      notes: json['notes'] as String?,
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      interviews: (json['interviews'] as List<dynamic>? ?? [])
          .whereType<Map>()
          .map((m) => JobInterviewBrief.fromJson(m.cast<String, dynamic>()))
          .toList(),
    );
  }

  static DateTime _parseDate(dynamic value) {
    if (value is String) {
      return DateTime.tryParse(value)?.toLocal() ??
          DateTime.fromMillisecondsSinceEpoch(0);
    }
    return DateTime.fromMillisecondsSinceEpoch(0);
  }
}

class PaginationMeta {
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  PaginationMeta({
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      total: (json['total'] as num?)?.toInt() ?? 0,
      page: (json['page'] as num?)?.toInt() ?? 1,
      limit: (json['limit'] as num?)?.toInt() ?? 20,
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 0,
    );
  }
}

class PaginatedJobs {
  final List<Job> jobs;
  final PaginationMeta meta;

  PaginatedJobs({required this.jobs, required this.meta});
}

const jobStatuses = [
  'SAVED',
  'APPLIED',
  'PHONE_SCREEN',
  'TECHNICAL',
  'ONSITE',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'ACCEPTED',
];

String jobStatusLabel(String status) {
  return status.replaceAll('_', ' ');
}

class JobInterview {
  final String id;
  final String type;
  final int? round;
  final String? scheduledAt;
  final int? durationMinutes;
  final String? interviewers;
  final String? location;
  final String? notes;
  final String? feedback;
  final int? rating;
  final bool isCompleted;
  final String jobApplicationId;

  JobInterview({
    required this.id,
    required this.type,
    this.round,
    this.scheduledAt,
    this.durationMinutes,
    this.interviewers,
    this.location,
    this.notes,
    this.feedback,
    this.rating,
    required this.isCompleted,
    required this.jobApplicationId,
  });

  factory JobInterview.fromJson(Map<String, dynamic> json) {
    return JobInterview(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      round: (json['round'] as num?)?.toInt(),
      scheduledAt: json['scheduledAt'] as String?,
      durationMinutes: (json['durationMinutes'] as num?)?.toInt(),
      interviewers: json['interviewers'] as String?,
      location: json['location'] as String?,
      notes: json['notes'] as String?,
      feedback: json['feedback'] as String?,
      rating: (json['rating'] as num?)?.toInt(),
      isCompleted: json['isCompleted'] as bool? ?? false,
      jobApplicationId: json['jobApplicationId'] as String? ?? '',
    );
  }
}

const interviewTypes = [
  'PHONE',
  'TECHNICAL',
  'BEHAVIORAL',
  'SYSTEM_DESIGN',
  'CODING',
  'ONSITE',
  'PANEL',
  'TAKE_HOME',
];
