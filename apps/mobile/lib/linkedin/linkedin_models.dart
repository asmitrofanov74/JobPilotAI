import 'dart:convert';

Map<String, dynamic> _jsonMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return value.cast<String, dynamic>();
  if (value is String) {
    try {
      final decoded = jsonDecode(value);
      if (decoded is Map) return decoded.cast<String, dynamic>();
    } catch (_) {}
  }
  return const {};
}

class LinkedinOptimization {
  final String id;
  final String type;
  final Map<String, dynamic> inputData;
  final Map<String, dynamic> output;
  final DateTime createdAt;

  const LinkedinOptimization({
    required this.id,
    required this.type,
    required this.inputData,
    required this.output,
    required this.createdAt,
  });

  factory LinkedinOptimization.fromJson(Map<String, dynamic> json) {
    return LinkedinOptimization(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      inputData: _jsonMap(json['inputData']),
      output: _jsonMap(json['outputData']),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  String get typeLabel {
    return switch (type) {
      'headline' => 'Headlines',
      'about' => 'About',
      'experience_optimizer' => 'Experience',
      'profile_analysis' => 'Profile Analysis',
      'visibility_analysis' => 'Visibility',
      _ => type.replaceAll('_', ' '),
    };
  }

  num? get score => switch (type) {
        'profile_analysis' => output['overallScore'] as num?,
        'visibility_analysis' => output['visibilityScore'] as num?,
        _ => null,
      };

  Map<String, dynamic> get result {
    if (type == 'headline') {
      return {'headlines': output['headlines'] ?? const [], 'best': output['bestHeadline'], 'tips': output['seoTips'] ?? const []};
    }
    if (type == 'about') {
      return {'sections': output['aboutSections'] ?? const [], 'best': output['bestSection'], 'tips': output['writingTips'] ?? const []};
    }
    return output;
  }
}
