import '../graphql/graphql_service.dart';
import 'scraper_models.dart';

class ScraperRepository {
  static const String scrapeDocument = r'''
    mutation ScrapeJobs($input: ScrapeJobsInput!) {
      scrapeJobs(input: $input) {
        total
        imported
        jobs {
          companyName
          jobTitle
          jobDescription
          jobUrl
          location
          salaryRange
          source
          sourceUrl
          sourceId
          employmentType
          workMode
          postedDate
        }
        stats {
          linkedin
          indeed
          workopolis
          ziprecruiter
          greenhouse
          lever
          workday
        }
      }
    }
  ''';

  static const String importDocument = r'''
    mutation ImportJobs($jobs: [CreateJobInput!]!) {
      importJobs(jobs: $jobs) {
        imported
        skipped
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<ScrapeResult> scrape({
    required String keywords,
    required String location,
    String? postedWithin,
    String? source,
  }) async {
    final result = await _service.mutate(
      document: scrapeDocument,
      variables: {
        'input': {
          'keywords': keywords,
          'location': location,
          'importAll': false,
          if (postedWithin != null && postedWithin.isNotEmpty)
            'postedWithin': postedWithin,
          if (source != null && source.isNotEmpty) 'source': source,
        },
      },
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['scrapeJobs'];
    if (data is! Map) throw Exception('No result from server');
    final map = data.cast<String, dynamic>();
    return ScrapeResult(
      total: (map['total'] as num?)?.toInt() ?? 0,
      imported: (map['imported'] as num?)?.toInt() ?? 0,
      jobs: (map['jobs'] as List<dynamic>? ?? [])
          .whereType<Map>()
          .map((m) => ScrapedJob.fromJson(m.cast<String, dynamic>()))
          .toList(),
    );
  }

  Future<ImportResult> import(List<ScrapedJob> jobs) async {
    final result = await _service.mutate(
      document: importDocument,
      variables: {
        'jobs': jobs
            .map((j) => {
                  'companyName': j.companyName,
                  'jobTitle': j.jobTitle,
                  if (j.jobDescription != null && j.jobDescription!.isNotEmpty)
                    'jobDescription': j.jobDescription,
                  if (j.jobUrl != null && j.jobUrl!.isNotEmpty) 'jobUrl': j.jobUrl,
                  if (j.location != null && j.location!.isNotEmpty)
                    'location': j.location,
                  if (j.salaryRange != null && j.salaryRange!.isNotEmpty)
                    'salaryRange': j.salaryRange,
                  if (j.source != null && j.source!.isNotEmpty)
                    'source': j.source,
                  if (j.sourceUrl != null && j.sourceUrl!.isNotEmpty)
                    'sourceUrl': j.sourceUrl,
                  if (j.sourceId != null && j.sourceId!.isNotEmpty)
                    'sourceId': j.sourceId,
                  'status': 'SAVED',
                })
            .toList(),
      },
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['importJobs'];
    if (data is! Map) throw Exception('No result from server');
    final map = data.cast<String, dynamic>();
    return ImportResult(
      imported: (map['imported'] as num?)?.toInt() ?? 0,
      skipped: (map['skipped'] as num?)?.toInt() ?? 0,
    );
  }
}
