class ScrapedJob {
  final String companyName;
  final String jobTitle;
  final String? jobDescription;
  final String? jobUrl;
  final String? location;
  final String? salaryRange;
  final String? source;
  final String? sourceUrl;
  final String? sourceId;
  final String? employmentType;
  final String? workMode;
  final String? postedDate;

  ScrapedJob({
    required this.companyName,
    required this.jobTitle,
    this.jobDescription,
    this.jobUrl,
    this.location,
    this.salaryRange,
    this.source,
    this.sourceUrl,
    this.sourceId,
    this.employmentType,
    this.workMode,
    this.postedDate,
  });

  factory ScrapedJob.fromJson(Map<String, dynamic> json) {
    return ScrapedJob(
      companyName: json['companyName'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      jobDescription: json['jobDescription'] as String?,
      jobUrl: json['jobUrl'] as String?,
      location: json['location'] as String?,
      salaryRange: json['salaryRange'] as String?,
      source: json['source'] as String?,
      sourceUrl: json['sourceUrl'] as String?,
      sourceId: json['sourceId'] as String?,
      employmentType: json['employmentType'] as String?,
      workMode: json['workMode'] as String?,
      postedDate: json['postedDate'] as String?,
    );
  }
}

class ScrapeResult {
  final int total;
  final int imported;
  final List<ScrapedJob> jobs;

  ScrapeResult({
    required this.total,
    required this.imported,
    required this.jobs,
  });
}

class ImportResult {
  final int imported;
  final int skipped;

  ImportResult({required this.imported, required this.skipped});
}

const scraperSources = [
  'GREENHOUSE',
  'LEVER',
  'WORKDAY',
  'INDEED',
  'WORKOPOLIS',
  'LINKEDIN',
  'ZIPRECRUITER',
];

const postedWithinOptions = [
  'H24',
  'D3',
  'D7',
  'D14',
  'D30',
];
