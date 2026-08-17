import '../graphql/graphql_service.dart';
import 'analytics_models.dart';

class AnalyticsRepository {
  static const String funnelDocument = r'''
    query FunnelAnalytics {
      funnelAnalytics {
        saved
        applied
        phoneScreen
        technical
        onsite
        offer
        rejected
        accepted
      }
    }
  ''';

  static const String monthlyDocument = r'''
    query MonthlyStats($from: DateTime!, $to: DateTime!) {
      monthlyStats(from: $from, to: $to) {
        month
        applications
        interviews
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<FunnelAnalytics> funnel() async {
    final result = await _service.request(document: funnelDocument);
    if (result.hasException) throw result.exception!;
    final data = result.data?['funnelAnalytics'];
    if (data is! Map) throw Exception('No result from server');
    return FunnelAnalytics.fromJson(data.cast<String, dynamic>());
  }

  Future<List<MonthlyStat>> monthly({
    required DateTime from,
    required DateTime to,
  }) async {
    final result = await _service.request(
      document: monthlyDocument,
      variables: {
        'from': from.toUtc().toIso8601String(),
        'to': to.toUtc().toIso8601String(),
      },
    );
    if (result.hasException) throw result.exception!;
    return (result.data?['monthlyStats'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((m) => MonthlyStat.fromJson(m.cast<String, dynamic>()))
        .toList();
  }
}
