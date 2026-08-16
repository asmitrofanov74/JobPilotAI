class FrenchVocabWord {
  final String id;
  final String word;
  final String translation;
  final String? context;
  final String? note;
  final String difficulty;
  final int timesReviewed;
  final int timesCorrect;
  final DateTime? nextReviewAt;
  final bool mastered;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const FrenchVocabWord({
    required this.id,
    required this.word,
    required this.translation,
    this.context,
    this.note,
    this.difficulty = 'medium',
    this.timesReviewed = 0,
    this.timesCorrect = 0,
    this.nextReviewAt,
    this.mastered = false,
    this.createdAt,
    this.updatedAt,
  });

  factory FrenchVocabWord.fromJson(Map<String, dynamic> json) {
    return FrenchVocabWord(
      id: json['id'] as String,
      word: json['word'] as String,
      translation: json['translation'] as String,
      context: json['context'] as String?,
      note: json['note'] as String?,
      difficulty: json['difficulty'] as String? ?? 'medium',
      timesReviewed: json['timesReviewed'] as int? ?? 0,
      timesCorrect: json['timesCorrect'] as int? ?? 0,
      nextReviewAt: DateTime.tryParse(json['nextReviewAt'] as String? ?? ''),
      mastered: json['mastered'] as bool? ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? ''),
    );
  }
}

class VocabularyStats {
  final int total;
  final int mastered;
  final int dueForReview;
  final Map<String, int> difficultyBreakdown;

  const VocabularyStats({
    this.total = 0,
    this.mastered = 0,
    this.dueForReview = 0,
    this.difficultyBreakdown = const {},
  });

  factory VocabularyStats.fromJson(Map<String, dynamic> json) {
    final breakdown = json['difficultyBreakdown'] as Map<String, dynamic>? ?? {};
    return VocabularyStats(
      total: json['total'] as int? ?? 0,
      mastered: json['mastered'] as int? ?? 0,
      dueForReview: json['dueForReview'] as int? ?? 0,
      difficultyBreakdown: breakdown.map(
        (k, v) => MapEntry(k, (v as num?)?.toInt() ?? 0),
      ),
    );
  }
}
