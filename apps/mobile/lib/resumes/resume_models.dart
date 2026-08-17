class Resume {
  final String id;
  final String title;
  final String? fileUrl;
  final String? fileKey;
  final int? fileSize;
  final String? mimeType;
  final bool isPrimary;
  final String? parsedSkills;
  final String? parsedExperience;
  final String? parsedEducation;
  final DateTime createdAt;
  final DateTime updatedAt;

  Resume({
    required this.id,
    required this.title,
    this.fileUrl,
    this.fileKey,
    this.fileSize,
    this.mimeType,
    required this.isPrimary,
    this.parsedSkills,
    this.parsedExperience,
    this.parsedEducation,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Resume.fromJson(Map<String, dynamic> json) {
    return Resume(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Untitled',
      fileUrl: json['fileUrl'] as String?,
      fileKey: json['fileKey'] as String?,
      fileSize: (json['fileSize'] as num?)?.toInt(),
      mimeType: json['mimeType'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
      parsedSkills: json['parsedSkills'] as String?,
      parsedExperience: json['parsedExperience'] as String?,
      parsedEducation: json['parsedEducation'] as String?,
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
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

String formatFileSize(int? bytes) {
  if (bytes == null) return '';
  if (bytes >= 1048576) return '${(bytes / 1048576).toStringAsFixed(1)} MB';
  if (bytes >= 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
  return '$bytes B';
}
