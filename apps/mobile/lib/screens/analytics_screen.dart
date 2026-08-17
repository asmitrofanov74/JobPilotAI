import 'package:flutter/material.dart';

import '../analytics/analytics_models.dart';
import '../analytics/analytics_repository.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  final AnalyticsRepository _repository = AnalyticsRepository();

  FunnelAnalytics? _funnel;
  List<MonthlyStat> _monthly = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final now = DateTime.now();
      final from = DateTime(now.year - 1, now.month, 1);
      final results = await Future.wait([
        _repository.funnel(),
        _repository.monthly(from: from, to: now),
      ]);
      if (!mounted) return;
      setState(() {
        _funnel = results[0] as FunnelAnalytics;
        _monthly = results[1] as List<MonthlyStat>;
      });
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        _error!,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.error),
                      ),
                    ),
                  if (_funnel != null) ...[
                    Text('Application Funnel',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    _buildFunnel(_funnel!),
                    const SizedBox(height: 24),
                    Text('Monthly Trends (last 12 months)',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    _buildMonthly(_monthly),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildFunnel(FunnelAnalytics f) {
    final items = [
      ('Saved', f.saved, Colors.blue.shade700),
      ('Applied', f.applied, Colors.indigo.shade700),
      ('Phone Screen', f.phoneScreen, Colors.teal.shade700),
      ('Technical', f.technical, Colors.purple.shade700),
      ('On-site', f.onsite, Colors.deepPurple.shade700),
      ('Offer', f.offer, Colors.green.shade700),
      ('Rejected', f.rejected, Colors.red.shade700),
      ('Accepted', f.accepted, Colors.green.shade900),
    ];
    final maxValue = items.fold<int>(
        1, (max, item) => item.$2 > max ? item.$2 : max);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: items.map((item) {
            final ratio = item.$2 / maxValue;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  SizedBox(
                    width: 100,
                    child: Text(item.$1,
                        style: Theme.of(context).textTheme.bodySmall),
                  ),
                  Expanded(
                    child: Stack(
                      children: [
                        Container(
                          height: 22,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade200,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        FractionallySizedBox(
                          widthFactor: ratio == 0 ? 0.01 : ratio,
                          child: Container(
                            height: 22,
                            decoration: BoxDecoration(
                              color: item.$3,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(
                    width: 36,
                    child: Text(
                      '${item.$2}',
                      textAlign: TextAlign.right,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildMonthly(List<MonthlyStat> stats) {
    if (stats.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Text('No monthly data yet'),
      );
    }
    final maxValue = stats.fold<int>(
        1, (max, s) => s.applications > max ? s.applications : max);
    final sorted = [...stats]
      ..sort((a, b) => a.month.compareTo(b.month));
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                _legend(Colors.blue.shade600, 'Applications'),
                const SizedBox(width: 16),
                _legend(Colors.orange.shade600, 'Interviews'),
              ],
            ),
            const SizedBox(height: 12),
            ...sorted.map((s) {
              final month = _monthLabel(s.month);
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(month,
                        style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: _bar(
                              s.applications, maxValue, Colors.blue.shade600),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          width: 24,
                          child: Text(
                            '${s.applications}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: _bar(s.interviews, maxValue,
                              Colors.orange.shade600),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          width: 24,
                          child: Text(
                            '${s.interviews}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _legend(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }

  Widget _bar(int value, int maxValue, Color color) {
    final ratio = value / maxValue;
    return Container(
      height: 12,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(3),
      ),
      child: FractionallySizedBox(
        alignment: Alignment.centerLeft,
        widthFactor: ratio == 0 ? 0.01 : ratio,
        child: Container(
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
    );
  }

  String _monthLabel(String month) {
    final dt = DateTime.tryParse(month);
    if (dt == null) return month;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[dt.month - 1]} ${dt.year}';
  }
}
