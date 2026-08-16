import 'dart:convert';

import '../graphql/graphql_service.dart';
import 'linkedin_models.dart';

class LinkedinOptimizerRepository {
  static const String listDocument = r'''
    query LinkedinOptimizations($type: String) {
      linkedinOptimizations(type: $type) {
        id
        type
        inputData
        outputData
        createdAt
      }
    }
  ''';

  static const String analyzeProfileDocument = r'''
    mutation AnalyzeLinkedinProfile($input: AnalyzeProfileInput!) {
      analyzeLinkedinProfile(input: $input) {
        optimization {
          id
          type
          outputData
          createdAt
        }
        output
      }
    }
  ''';

  static const String headlinesDocument = r'''
    mutation GenerateLinkedinHeadlines($input: GenerateHeadlineInput!) {
      generateLinkedinHeadlines(input: $input) {
        optimization {
          id
          type
          outputData
          createdAt
        }
        output
      }
    }
  ''';

  static const String aboutDocument = r'''
    mutation GenerateLinkedinAbout($input: GenerateAboutInput!) {
      generateLinkedinAbout(input: $input) {
        optimization {
          id
          type
          outputData
          createdAt
        }
        output
      }
    }
  ''';

  static const String experienceDocument = r'''
    mutation OptimizeLinkedinExperience($input: OptimizeExperienceInput!) {
      optimizeLinkedinExperience(input: $input) {
        optimization {
          id
          type
          outputData
          createdAt
        }
        output
      }
    }
  ''';

  static const String visibilityDocument = r'''
    mutation AnalyzeLinkedinVisibility($input: AnalyzeVisibilityInput!) {
      analyzeLinkedinVisibility(input: $input) {
        optimization {
          id
          type
          outputData
          createdAt
        }
        output
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<List<LinkedinOptimization>> list({String? type}) async {
    final result = await _service.request(
      document: listDocument,
      variables: {'type': ?type},
    );
    if (result.hasException) throw result.exception!;
    return (result.data?['linkedinOptimizations'] as List<dynamic>? ?? [])
        .map((dynamic o) {
      dynamic item = o;
      if (item is String) {
        try {
          item = jsonDecode(item);
        } catch (_) {}
      }
      return LinkedinOptimization.fromJson(
          item is Map ? item.cast<String, dynamic>() : const {});
    }).toList();
  }

  Future<Map<String, dynamic>> _run(String document, Map<String, dynamic> variables) async {
    final result = await _service.mutate(document: document, variables: variables);
    if (result.hasException) throw result.exception!;
    final dynamic firstValue =
        (result.data?.values.isNotEmpty ?? false) ? result.data!.values.first : null;
    Map<String, dynamic>? data;
    if (firstValue is Map) {
      data = firstValue.cast<String, dynamic>();
    } else if (firstValue is String) {
      try {
        final decoded = jsonDecode(firstValue);
        if (decoded is Map) data = decoded.cast<String, dynamic>();
      } catch (_) {}
    }
    if (data == null && result.data != null) {
      for (final value in result.data!.values) {
        if (value is Map) {
          data = value.cast<String, dynamic>();
          break;
        }
        if (value is String) {
          try {
            final decoded = jsonDecode(value);
            if (decoded is Map) {
              data = decoded.cast<String, dynamic>();
              break;
            }
          } catch (_) {}
        }
      }
    }
    if (data == null) throw Exception('No result from server');
    final raw = data['output'];
    if (raw is String) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map) return decoded.cast<String, dynamic>();
      } catch (_) {}
    }
    if (raw is Map) return raw.cast<String, dynamic>();
    throw Exception('Unexpected output from server: $raw');
  }

  Future<Map<String, dynamic>> analyzeProfile({
    String? profileUrl,
    String? headline,
    String? about,
    String? currentRole,
    String? currentCompany,
    String? industry,
    String? location,
    String? experienceLevel,
    List<String>? skills,
  }) {
    return _run(analyzeProfileDocument, {
      'input': {
        if (profileUrl != null && profileUrl.isNotEmpty) 'profileUrl': profileUrl,
        if (headline != null && headline.isNotEmpty) 'headline': headline,
        if (about != null && about.isNotEmpty) 'about': about,
        if (currentRole != null && currentRole.isNotEmpty) 'currentRole': currentRole,
        if (currentCompany != null && currentCompany.isNotEmpty) 'currentCompany': currentCompany,
        if (industry != null && industry.isNotEmpty) 'industry': industry,
        if (location != null && location.isNotEmpty) 'location': location,
        if (experienceLevel != null && experienceLevel.isNotEmpty) 'experienceLevel': experienceLevel,
        if (skills != null && skills.isNotEmpty) 'skills': skills,
      },
    });
  }

  Future<Map<String, dynamic>> generateHeadlines({
    required String targetRole,
    required String currentRole,
    required List<String> skills,
    required String industry,
    String? experienceLevel,
    String? currentHeadline,
    String? tone,
  }) {
    return _run(headlinesDocument, {
      'input': {
        'targetRole': targetRole,
        'currentRole': currentRole,
        'skills': skills,
        'industry': industry,
        if (experienceLevel != null && experienceLevel.isNotEmpty) 'experienceLevel': experienceLevel,
        if (currentHeadline != null && currentHeadline.isNotEmpty) 'currentHeadline': currentHeadline,
        if (tone != null && tone.isNotEmpty) 'tone': tone,
      },
    });
  }

  Future<Map<String, dynamic>> generateAbout({
    required String targetRole,
    required String industry,
    required List<String> keyAchievements,
    required List<String> skills,
    String? currentAbout,
    int? experienceYears,
    String? tone,
  }) {
    return _run(aboutDocument, {
      'input': {
        'targetRole': targetRole,
        'industry': industry,
        'keyAchievements': keyAchievements,
        'skills': skills,
        if (currentAbout != null && currentAbout.isNotEmpty) 'currentAbout': currentAbout,
        'experienceYears': ?experienceYears,
        if (tone != null && tone.isNotEmpty) 'tone': tone,
      },
    });
  }

  Future<Map<String, dynamic>> optimizeExperience({
    required List<Map<String, dynamic>> entries,
    String? industry,
    String? tone,
  }) {
    return _run(experienceDocument, {
      'input': {
        'entries': entries,
        if (industry != null && industry.isNotEmpty) 'industry': industry,
        if (tone != null && tone.isNotEmpty) 'tone': tone,
      },
    });
  }

  Future<Map<String, dynamic>> analyzeVisibility({
    required String headline,
    required String about,
    required List<String> skills,
    required List<String> targetRoles,
    List<String>? targetLocations,
    String? industry,
    String? experienceLevel,
  }) {
    return _run(visibilityDocument, {
      'input': {
        'headline': headline,
        'about': about,
        'skills': skills,
        'targetRoles': targetRoles,
        if (targetLocations != null && targetLocations.isNotEmpty) 'targetLocations': targetLocations,
        if (industry != null && industry.isNotEmpty) 'industry': industry,
        if (experienceLevel != null && experienceLevel.isNotEmpty) 'experienceLevel': experienceLevel,
      },
    });
  }
}
