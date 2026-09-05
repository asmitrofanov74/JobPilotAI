class PipelineJobResult {
  final String id;
  final String companyName;
  final String jobTitle;
  final String? jobDescription;
  final String status;
  final String? source;
  final String? location;

  PipelineJobResult({
    required this.id,
    required this.companyName,
    required this.jobTitle,
    this.jobDescription,
    required this.status,
    this.source,
    this.location,
  });

  factory PipelineJobResult.fromJson(Map<String, dynamic> json) {
    return PipelineJobResult(
      id: json['id'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      jobDescription: json['jobDescription'] as String?,
      status: json['status'] as String? ?? 'SAVED',
      source: json['source'] as String?,
      location: json['location'] as String?,
    );
  }
}

class PipelineCoverLetter {
  final String id;
  final String jobTitle;
  final String companyName;
  final String tone;
  final bool isGenerated;

  PipelineCoverLetter({
    required this.id,
    required this.jobTitle,
    required this.companyName,
    required this.tone,
    required this.isGenerated,
  });

  factory PipelineCoverLetter.fromJson(Map<String, dynamic> json) {
    return PipelineCoverLetter(
      id: json['id'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      tone: json['tone'] as String? ?? 'professional',
      isGenerated: json['isGenerated'] as bool? ?? false,
    );
  }
}

class PipelineSkillGap {
  final String id;
  final String jobTitle;
  final String companyName;
  final num matchScore;

  PipelineSkillGap({
    required this.id,
    required this.jobTitle,
    required this.companyName,
    required this.matchScore,
  });

  factory PipelineSkillGap.fromJson(Map<String, dynamic> json) {
    return PipelineSkillGap(
      id: json['id'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      matchScore: json['matchScore'] as num? ?? 0,
    );
  }
}

class PipelineInterview {
  final String id;
  final String type;
  final int? round;
  final String? scheduledAt;
  final String jobApplicationId;

  PipelineInterview({
    required this.id,
    required this.type,
    this.round,
    this.scheduledAt,
    required this.jobApplicationId,
  });

  factory PipelineInterview.fromJson(Map<String, dynamic> json) {
    return PipelineInterview(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      round: (json['round'] as num?)?.toInt(),
      scheduledAt: json['scheduledAt'] as String?,
      jobApplicationId: json['jobApplicationId'] as String? ?? '',
    );
  }
}

class PipelinePractice {
  final String id;
  final String language;
  final String scenario;
  final int questionCount;

  PipelinePractice({
    required this.id,
    required this.language,
    required this.scenario,
    required this.questionCount,
  });

  factory PipelinePractice.fromJson(Map<String, dynamic> json) {
    return PipelinePractice(
      id: json['id'] as String? ?? '',
      language: json['language'] as String? ?? 'ENGLISH',
      scenario: json['scenario'] as String? ?? '',
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class PipelineResult {
  final PipelineJobResult job;
  final PipelineCoverLetter coverLetter;
  final PipelineSkillGap? skillGapReport;
  final PipelineInterview interview;
  final PipelinePractice? practice;

  PipelineResult({
    required this.job,
    required this.coverLetter,
    this.skillGapReport,
    required this.interview,
    this.practice,
  });

  factory PipelineResult.fromJson(Map<String, dynamic> json) {
    return PipelineResult(
      job: PipelineJobResult.fromJson(
          (json['job'] as Map? ?? {}).cast<String, dynamic>()),
      coverLetter: PipelineCoverLetter.fromJson(
          (json['coverLetter'] as Map? ?? {}).cast<String, dynamic>()),
      skillGapReport: json['skillGapReport'] is Map
          ? PipelineSkillGap.fromJson(
              (json['skillGapReport'] as Map).cast<String, dynamic>())
          : null,
      interview: PipelineInterview.fromJson(
          (json['interview'] as Map? ?? {}).cast<String, dynamic>()),
      practice: json['practice'] is Map
          ? PipelinePractice.fromJson(
              (json['practice'] as Map).cast<String, dynamic>())
          : null,
    );
  }
}

class PipelineConfig {
  final String tone;
  final String interviewType;
  final String practiceLanguage;
  final String? scheduledAt;
  final int questionCount;

  const PipelineConfig({
    this.tone = 'professional',
    this.interviewType = 'PHONE',
    this.practiceLanguage = 'ENGLISH',
    this.scheduledAt,
    this.questionCount = 5,
  });

  Map<String, dynamic> toInput({
    String? jobId,
    Map<String, dynamic>? scrapedJob,
    String? userSkills,
  }) {
    final sa = scheduledAt;
    return {
      'tone': tone,
      'interviewType': interviewType,
      'practiceLanguage': practiceLanguage,
      'questionCount': questionCount,
      if (jobId != null && jobId.isNotEmpty) 'jobId': jobId,
      'scrapedJob': ?scrapedJob,
      if (userSkills != null && userSkills.isNotEmpty)
        'userSkills': userSkills,
      if (sa != null && sa.isNotEmpty) 'scheduledAt': sa,
    };
  }
}

const pipelineTones = [
  'professional',
  'enthusiastic',
  'confident',
  'concise',
];

const pipelineLanguages = ['ENGLISH', 'FRENCH'];

String pipelineLanguageLabel(String language) {
  return language == 'FRENCH' ? 'French' : 'English';
}