class SkillRequirement {
  final String skill;
  final String importance;

  SkillRequirement({required this.skill, required this.importance});

  factory SkillRequirement.fromJson(Map<String, dynamic> json) {
    return SkillRequirement(
      skill: json['skill'] as String? ?? '',
      importance: json['importance'] as String? ?? '',
    );
  }
}

class MissingSkill {
  final String skill;
  final String importance;
  final String recommendation;

  MissingSkill({
    required this.skill,
    required this.importance,
    required this.recommendation,
  });

  factory MissingSkill.fromJson(Map<String, dynamic> json) {
    return MissingSkill(
      skill: json['skill'] as String? ?? '',
      importance: json['importance'] as String? ?? '',
      recommendation: json['recommendation'] as String? ?? '',
    );
  }
}

class SkillGapReport {
  final String id;
  final String jobTitle;
  final String companyName;
  final String? jobDescription;
  final List<SkillRequirement> requiredSkills;
  final List<MissingSkill> missingSkills;
  final double? matchScore;
  final List<String> recommendations;
  final DateTime createdAt;

  SkillGapReport({
    required this.id,
    required this.jobTitle,
    required this.companyName,
    this.jobDescription,
    this.requiredSkills = const [],
    this.missingSkills = const [],
    this.matchScore,
    this.recommendations = const [],
    required this.createdAt,
  });

  factory SkillGapReport.fromJson(Map<String, dynamic> json) {
    return SkillGapReport(
      id: json['id'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      jobDescription: json['jobDescription'] as String?,
      requiredSkills: _parseSkills(json['requiredSkills']),
      missingSkills: _parseMissing(json['missingSkills']),
      matchScore: (json['matchScore'] as num?)?.toDouble(),
      recommendations: _parseStrings(json['recommendations']),
      createdAt: _parseDate(json['createdAt']),
    );
  }

  static List<SkillRequirement> _parseSkills(dynamic raw) {
    if (raw is! List) return [];
    return raw.whereType<Map>().map((m) {
      final map = m.cast<String, dynamic>();
      return SkillRequirement(
        skill: (map['skill'] as String?) ?? (map['name'] as String?) ?? '',
        importance: (map['importance'] as String?) ?? '',
      );
    }).toList();
  }

  static List<MissingSkill> _parseMissing(dynamic raw) {
    if (raw is! List) return [];
    return raw.whereType<Map>().map((m) {
      final map = m.cast<String, dynamic>();
      return MissingSkill(
        skill: (map['skill'] as String?) ?? (map['name'] as String?) ?? '',
        importance: (map['importance'] as String?) ?? '',
        recommendation: (map['recommendation'] as String?) ?? '',
      );
    }).toList();
  }

  static List<String> _parseStrings(dynamic raw) {
    if (raw is! List) return [];
    return raw.map((r) {
      if (r is String) return r;
      if (r is Map) {
        final map = r.cast<String, dynamic>();
        return (map['recommendation'] as String?) ??
            (map['text'] as String?) ??
            (map.values.isNotEmpty ? map.values.first.toString() : '');
      }
      return r.toString();
    }).toList();
  }

  static DateTime _parseDate(dynamic value) {
    if (value is String) {
      return DateTime.tryParse(value)?.toLocal() ??
          DateTime.fromMillisecondsSinceEpoch(0);
    }
    return DateTime.fromMillisecondsSinceEpoch(0);
  }
}
