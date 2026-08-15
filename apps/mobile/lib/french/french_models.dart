class FrenchEvaluation {
  final String? id;
  final num? grammarScore;
  final num? vocabularyScore;
  final num? fluencyScore;
  final List<dynamic>? corrections;
  final String? improvedVersion;
  final String? quebecAlternative;

  const FrenchEvaluation({
    this.id,
    this.grammarScore,
    this.vocabularyScore,
    this.fluencyScore,
    this.corrections,
    this.improvedVersion,
    this.quebecAlternative,
  });

  factory FrenchEvaluation.fromJson(Map<String, dynamic> json) {
    return FrenchEvaluation(
      id: json['id'] as String?,
      grammarScore: json['grammarScore'] as num?,
      vocabularyScore: json['vocabularyScore'] as num?,
      fluencyScore: json['fluencyScore'] as num?,
      corrections: json['corrections'] as List<dynamic>?,
      improvedVersion: json['improvedVersion'] as String?,
      quebecAlternative: json['quebecAlternative'] as String?,
    );
  }
}

class FrenchMessage {
  final String id;
  final String role;
  final String content;
  final FrenchEvaluation? evaluation;
  final DateTime? createdAt;

  const FrenchMessage({
    required this.id,
    required this.role,
    required this.content,
    this.evaluation,
    this.createdAt,
  });

  bool get isUser => role == 'user';

  factory FrenchMessage.fromJson(Map<String, dynamic> json) {
    final evaluation = json['evaluation'] as Map<String, dynamic>?;
    return FrenchMessage(
      id: json['id'] as String,
      role: json['role'] as String,
      content: json['content'] as String,
      evaluation: evaluation != null
          ? FrenchEvaluation.fromJson(evaluation)
          : null,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
    );
  }
}

class FrenchConversation {
  final String id;
  final String scenario;
  final String? jobDescription;
  final List<FrenchMessage> messages;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const FrenchConversation({
    required this.id,
    required this.scenario,
    this.jobDescription,
    this.messages = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory FrenchConversation.fromJson(Map<String, dynamic> json) {
    final messages = (json['messages'] as List<dynamic>? ?? [])
        .map((m) => FrenchMessage.fromJson(m as Map<String, dynamic>))
        .toList();
    return FrenchConversation(
      id: json['id'] as String,
      scenario: json['scenario'] as String,
      jobDescription: json['jobDescription'] as String?,
      messages: messages,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? ''),
    );
  }
}

class SendMessageResult {
  final String conversationId;
  final FrenchMessage response;

  const SendMessageResult({
    required this.conversationId,
    required this.response,
  });

  factory SendMessageResult.fromJson(Map<String, dynamic> json) {
    return SendMessageResult(
      conversationId: json['conversationId'] as String,
      response: FrenchMessage.fromJson(json['response'] as Map<String, dynamic>),
    );
  }
}
