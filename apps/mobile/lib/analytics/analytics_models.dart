class FunnelAnalytics {
  final int saved;
  final int applied;
  final int phoneScreen;
  final int technical;
  final int onsite;
  final int offer;
  final int rejected;
  final int accepted;

  FunnelAnalytics({
    required this.saved,
    required this.applied,
    required this.phoneScreen,
    required this.technical,
    required this.onsite,
    required this.offer,
    required this.rejected,
    required this.accepted,
  });

  factory FunnelAnalytics.fromJson(Map<String, dynamic> json) {
    int n(String key) => (json[key] as num?)?.toInt() ?? 0;
    return FunnelAnalytics(
      saved: n('saved'),
      applied: n('applied'),
      phoneScreen: n('phoneScreen'),
      technical: n('technical'),
      onsite: n('onsite'),
      offer: n('offer'),
      rejected: n('rejected'),
      accepted: n('accepted'),
    );
  }
}

class MonthlyStat {
  final String month;
  final int applications;
  final int interviews;

  MonthlyStat({
    required this.month,
    required this.applications,
    required this.interviews,
  });

  factory MonthlyStat.fromJson(Map<String, dynamic> json) {
    return MonthlyStat(
      month: json['month'] as String? ?? '',
      applications: (json['applications'] as num?)?.toInt() ?? 0,
      interviews: (json['interviews'] as num?)?.toInt() ?? 0,
    );
  }
}
