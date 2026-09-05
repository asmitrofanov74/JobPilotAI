import '../graphql/graphql_service.dart';
import 'pipeline_models.dart';

class PipelineRepository {
  static const String runDocument = r'''
    mutation RunApplicationPipeline($input: RunApplicationPipelineInput!) {
      runApplicationPipeline(input: $input) {
        job {
          id
          companyName
          jobTitle
          jobDescription
          status
          source
          location
        }
        coverLetter {
          id
          jobTitle
          companyName
          tone
          isGenerated
        }
        skillGapReport {
          id
          jobTitle
          companyName
          matchScore
        }
        interview {
          id
          type
          round
          scheduledAt
          jobApplicationId
        }
        practice {
          id
          language
          scenario
          questionCount
        }
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<PipelineResult> run({
    PipelineConfig config = const PipelineConfig(),
    String? jobId,
    Map<String, dynamic>? scrapedJob,
    String? userSkills,
  }) async {
    final result = await _service.mutate(
      document: runDocument,
      variables: {
        'input': config.toInput(
          jobId: jobId,
          scrapedJob: scrapedJob,
          userSkills: userSkills,
        ),
      },
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['runApplicationPipeline'];
    if (data is! Map) throw Exception('No result from server');
    return PipelineResult.fromJson(data.cast<String, dynamic>());
  }
}