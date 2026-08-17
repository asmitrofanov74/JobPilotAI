import '../graphql/graphql_service.dart';
import 'skill_models.dart';

class SkillsRepository {
  static const String reportsDocument = r'''
    query SkillGapReports {
      skillGapReports {
        id
        jobDescription
        jobTitle
        companyName
        requiredSkills
        userSkills
        missingSkills
        matchScore
        recommendations
        createdAt
      }
    }
  ''';

  static const String analyzeDocument = r'''
    mutation AnalyzeSkillGap($input: SkillGapInput!) {
      analyzeSkillGap(input: $input) {
        report {
          id
          jobTitle
          companyName
          matchScore
          requiredSkills
          missingSkills
          recommendations
          createdAt
        }
        requiredSkills
        missingSkills
        matchScore
        recommendations
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<List<SkillGapReport>> reports() async {
    final result = await _service.request(document: reportsDocument);
    if (result.hasException) throw result.exception!;
    return (result.data?['skillGapReports'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((m) => SkillGapReport.fromJson(m.cast<String, dynamic>()))
        .toList();
  }

  Future<SkillGapReport> analyze({
    required String jobTitle,
    required String companyName,
    required String jobDescription,
    required String userSkills,
  }) async {
    final result = await _service.mutate(
      document: analyzeDocument,
      variables: {
        'input': {
          'jobTitle': jobTitle,
          'companyName': companyName,
          'jobDescription': jobDescription,
          'userSkills': userSkills,
        },
      },
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['analyzeSkillGap'];
    if (data is! Map) throw Exception('No result from server');
    final map = data.cast<String, dynamic>();
    final report = map['report'];
    if (report is! Map) throw Exception('No report from server');
    return SkillGapReport.fromJson(report.cast<String, dynamic>());
  }
}
