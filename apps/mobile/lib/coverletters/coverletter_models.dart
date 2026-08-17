class CoverLetter {
  final String id;
  final String jobTitle;
  final String companyName;
  final String content;
  final String tone;
  final String? jobDescription;
  final bool isGenerated;
  final DateTime createdAt;

  CoverLetter({
    required this.id,
    required this.jobTitle,
    required this.companyName,
    required this.content,
    required this.tone,
    this.jobDescription,
    required this.isGenerated,
    required this.createdAt,
  });

  factory CoverLetter.fromJson(Map<String, dynamic> json) {
    return CoverLetter(
      id: json['id'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      content: json['content'] as String? ?? '',
      tone: json['tone'] as String? ?? 'professional',
      jobDescription: json['jobDescription'] as String?,
      isGenerated: json['isGenerated'] as bool? ?? false,
      createdAt: _parseDate(json['createdAt']),
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

const coverLetterTones = ['professional', 'creative', 'enthusiastic'];
