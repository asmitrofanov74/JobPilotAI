class InterviewScenarioInfo {
  final String value;
  final String label;
  final String description;

  const InterviewScenarioInfo({
    required this.value,
    required this.label,
    required this.description,
  });
}

const List<InterviewScenarioInfo> englishInterviewScenarios = [
  InterviewScenarioInfo(
    value: 'FRONTEND_DEVELOPER',
    label: 'Frontend Developer',
    description: 'React, CSS, web performance',
  ),
  InterviewScenarioInfo(
    value: 'FULL_STACK_DEVELOPER',
    label: 'Full Stack Developer',
    description: 'APIs, databases, architecture',
  ),
  InterviewScenarioInfo(
    value: 'TEAM_LEAD',
    label: 'Team Lead',
    description: 'Leadership, management, mentoring',
  ),
  InterviewScenarioInfo(
    value: 'BEHAVIORAL',
    label: 'Behavioral',
    description: 'STAR method, soft skills, scenarios',
  ),
  InterviewScenarioInfo(
    value: 'CUSTOM_JOB',
    label: 'Custom Job',
    description: 'Paste a job description for tailored questions',
  ),
];

const List<InterviewScenarioInfo> frenchInterviewScenarios = [
  InterviewScenarioInfo(
    value: 'FRONTEND_DEVELOPER',
    label: 'Frontend Developer',
    description: 'React, CSS, performance web',
  ),
  InterviewScenarioInfo(
    value: 'FULL_STACK_DEVELOPER',
    label: 'Full Stack Developer',
    description: 'API, bases de données, architecture',
  ),
  InterviewScenarioInfo(
    value: 'TEAM_LEAD',
    label: 'Team Lead',
    description: 'Leadership, gestion, mentorat',
  ),
  InterviewScenarioInfo(
    value: 'CUSTOM_JOB',
    label: 'Custom Job',
    description: 'Collez une offre demploi pour des questions sur mesure',
  ),
];

class PracticeQuestion {
  final String id;
  final String question;
  final String category;

  const PracticeQuestion({
    required this.id,
    required this.question,
    required this.category,
  });

  factory PracticeQuestion.fromJson(Map<String, dynamic> json) {
    return PracticeQuestion(
      id: json['id'] as String? ?? '',
      question: json['question'] as String? ?? '',
      category: json['category'] as String? ?? '',
    );
  }
}

class PracticeAnswer {
  final String questionId;
  final String answer;

  const PracticeAnswer({required this.questionId, required this.answer});

  factory PracticeAnswer.fromJson(Map<String, dynamic> json) {
    return PracticeAnswer(
      questionId: json['questionId'] as String? ?? '',
      answer: json['answer'] as String? ?? '',
    );
  }
}

class Correction {
  final String original;
  final String corrected;
  final String explanation;

  const Correction({
    required this.original,
    required this.corrected,
    required this.explanation,
  });

  factory Correction.fromJson(Map<String, dynamic> json) {
    return Correction(
      original: json['original'] as String? ?? '',
      corrected: json['corrected'] as String? ?? '',
      explanation: json['explanation'] as String? ?? '',
    );
  }
}

class PracticeEvaluation {
  final String questionId;
  final int grammarScore;
  final int confidenceScore;
  final int technicalScore;
  final String feedback;
  final String improvedAnswer;
  final List<Correction> corrections;

  const PracticeEvaluation({
    required this.questionId,
    required this.grammarScore,
    required this.confidenceScore,
    required this.technicalScore,
    required this.feedback,
    required this.improvedAnswer,
    required this.corrections,
  });

  factory PracticeEvaluation.fromJson(Map<String, dynamic> json) {
    return PracticeEvaluation(
      questionId: json['questionId'] as String? ?? '',
      grammarScore: (json['grammarScore'] as num?)?.toInt() ?? 0,
      confidenceScore: (json['confidenceScore'] as num?)?.toInt() ?? 0,
      technicalScore: (json['technicalScore'] as num?)?.toInt() ?? 0,
      feedback: json['feedback'] as String? ?? '',
      improvedAnswer: json['improvedAnswer'] as String? ?? '',
      corrections: (json['corrections'] as List<dynamic>? ?? [])
          .map((c) => Correction.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }

  int get average =>
      ((grammarScore + confidenceScore + technicalScore) / 3).round();
}

class PracticeInterview {
  final String id;
  final String scenario;
  final int questionCount;
  final String status;
  final List<PracticeQuestion> questions;
  final List<PracticeAnswer> answers;
  final List<PracticeEvaluation> evaluations;
  final int? overallScore;
  final DateTime createdAt;
  final bool french;

  PracticeInterview({
    required this.id,
    required this.scenario,
    required this.questionCount,
    required this.status,
    required this.questions,
    required this.answers,
    required this.evaluations,
    this.overallScore,
    required this.createdAt,
    this.french = true,
  });

  factory PracticeInterview.fromJson(Map<String, dynamic> json) {
    return PracticeInterview(
      id: json['id'] as String? ?? '',
      scenario: json['scenario'] as String? ?? '',
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'in_progress',
      questions: (json['questions'] as List<dynamic>? ?? [])
          .map((q) => PracticeQuestion.fromJson(q as Map<String, dynamic>))
          .toList(),
      answers: (json['answers'] as List<dynamic>? ?? [])
          .map((a) => PracticeAnswer.fromJson(a as Map<String, dynamic>))
          .toList(),
      evaluations: (json['evaluations'] as List<dynamic>? ?? [])
          .map((e) => PracticeEvaluation.fromJson(e as Map<String, dynamic>))
          .toList(),
      overallScore: (json['overallScore'] as num?)?.toInt(),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      french: true,
    );
  }

  PracticeInterview copyWith({bool? french}) {
    return PracticeInterview(
      id: id,
      scenario: scenario,
      questionCount: questionCount,
      status: status,
      questions: questions,
      answers: answers,
      evaluations: evaluations,
      overallScore: overallScore,
      createdAt: createdAt,
      french: french ?? this.french,
    );
  }

  bool get isCompleted => status == 'completed';
}

class PracticeHint {
  final String hint;
  final String keyPoints;
  final String exampleAnswer;

  const PracticeHint({
    required this.hint,
    required this.keyPoints,
    required this.exampleAnswer,
  });

  factory PracticeHint.fromJson(Map<String, dynamic> json) {
    return PracticeHint(
      hint: json['hint'] as String? ?? '',
      keyPoints: json['keyPoints'] as String? ?? '',
      exampleAnswer: json['exampleAnswer'] as String? ?? '',
    );
  }
}
