import 'package:collection/collection.dart';
import 'package:flutter/material.dart';

import '../linkedin/linkedin_models.dart';
import '../linkedin/linkedin_repository.dart';

class LinkedinOptimizerScreen extends StatefulWidget {
  const LinkedinOptimizerScreen({super.key});

  @override
  State<LinkedinOptimizerScreen> createState() =>
      _LinkedinOptimizerScreenState();
}

class _LinkedinOptimizerScreenState extends State<LinkedinOptimizerScreen> {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('LinkedIn Optimizer'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Headlines'),
              Tab(text: 'About'),
              Tab(text: 'Experience'),
              Tab(text: 'Profile'),
              Tab(text: 'Visibility'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _HeadlinesPanel(),
            _AboutPanel(),
            _ExperiencePanel(),
            _ProfilePanel(),
            _VisibilityPanel(),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

String _str(dynamic v) => v is String ? v : (v?.toString() ?? '');
int _num(dynamic v) => (v is num) ? v.toInt() : 0;
List<dynamic> _list(dynamic v) => v is List ? v : const [];
Map<String, dynamic> _map(dynamic v) =>
    v is Map ? v.cast<String, dynamic>() : const {};

List<String> _splitList(String raw) => raw
    .split(RegExp(r'[,;\n]'))
    .map((s) => s.trim())
    .where((s) => s.isNotEmpty)
    .toList();

Widget _sectionTitle(BuildContext context, String title) => Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 6),
      child: Text(title, style: Theme.of(context).textTheme.titleSmall),
    );

Widget _infoCard(BuildContext context, IconData icon, String title, Widget child) {
  return Container(
    width: double.infinity,
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 6),
            Text(title,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 8),
        child,
      ],
    ),
  );
}

class _HistoryList extends StatelessWidget {
  final List<LinkedinOptimization> items;
  final bool loading;

  const _HistoryList({required this.items, required this.loading});

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          children: [
            Icon(Icons.history,
                size: 40, color: Theme.of(context).colorScheme.outline),
            const SizedBox(height: 8),
            const Text('No results yet. Generate your first one.'),
          ],
        ),
      );
    }
    return Column(
      children: items
          .map((o) => Card(
                child: ExpansionTile(
                  title: Text(o.typeLabel),
                  subtitle: Text(
                    '${o.createdAt.toLocal().toString().substring(0, 16)} · Score: ${o.score?.toString() ?? '—'}',
                  ),
                  children: [_OutputView(optimization: o)],
                ),
              ))
          .toList(),
    );
  }
}

class _OutputView extends StatelessWidget {
  final LinkedinOptimization optimization;

  const _OutputView({required this.optimization});

  @override
  Widget build(BuildContext context) {
    final o = optimization;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: switch (o.type) {
        'headline' => _HeadlineOutput(output: o.output),
        'about' => _AboutOutput(output: o.output),
        'experience_optimizer' => _ExperienceOutput(output: o.output),
        'profile_analysis' => _ProfileOutput(output: o.output),
        'visibility_analysis' => _VisibilityOutput(output: o.output),
        _ => Text(o.output.toString()),
      },
    );
  }
}

class _ScoreBar extends StatelessWidget {
  final int score;
  const _ScoreBar({required this.score});

  @override
  Widget build(BuildContext context) {
    final color = score >= 70
        ? Colors.green.shade600
        : score >= 40
            ? Colors.orange.shade600
            : Colors.red.shade600;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('$score/100',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color)),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(value: score / 100, color: color),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Output renderers
// ---------------------------------------------------------------------------

class _HeadlineOutput extends StatelessWidget {
  final Map<String, dynamic> output;
  const _HeadlineOutput({required this.output});

  @override
  Widget build(BuildContext context) {
    final best = _str(output['bestHeadline']);
    final headlines = _list(output['headlines']);
    final tips = _list(output['seoTips']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (best.isNotEmpty) ...[
          _sectionTitle(context, 'Best Headline'),
          _infoCard(context, Icons.star, best, const SizedBox.shrink()),
        ],
        if (headlines.isNotEmpty) ...[
          _sectionTitle(context, 'Headlines'),
          ...headlines.map((h) {
            final m = _map(h);
            return _infoCard(
              context,
              Icons.title,
              _str(m['text']),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_str(m['rationale']).isNotEmpty)
                    Text(_str(m['rationale'])),
                  if (_list(m['targetKeywords']).isNotEmpty)
                    Text(
                      'Keywords: ${_list(m['targetKeywords']).join(', ')}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            );
          }),
        ],
        if (tips.isNotEmpty) ...[
          _sectionTitle(context, 'SEO Tips'),
          _infoCard(
              context,
              Icons.tips_and_updates,
              '${tips.length} tips',
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ...tips.mapIndexed(
                      (i, t) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text('${i + 1}. ${_str(t)}'),
                          )),
                ],
              )),
        ],
      ],
    );
  }
}

class _AboutOutput extends StatelessWidget {
  final Map<String, dynamic> output;
  const _AboutOutput({required this.output});

  @override
  Widget build(BuildContext context) {
    final best = _str(output['bestSection']);
    final sections = _list(output['aboutSections']);
    final tips = _list(output['writingTips']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (best.isNotEmpty) ...[
          _sectionTitle(context, 'Best Section'),
          _infoCard(context, Icons.star, best, const SizedBox.shrink()),
        ],
        if (sections.isNotEmpty) ...[
          _sectionTitle(context, 'About Sections'),
          ...sections.map((s) {
            final m = _map(s);
            return _infoCard(
              context,
              Icons.notes,
              _str(m['style']) +
                  (_str(m['targetAudience']).isNotEmpty
                      ? ' · ${_str(m['targetAudience'])}'
                      : ''),
              Text(_str(m['content'])),
            );
          }),
        ],
        if (tips.isNotEmpty) ...[
          _sectionTitle(context, 'Writing Tips'),
          _infoCard(
              context,
              Icons.tips_and_updates,
              '${tips.length} tips',
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ...tips.mapIndexed(
                      (i, t) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text('${i + 1}. ${_str(t)}'),
                          )),
                ],
              )),
        ],
      ],
    );
  }
}

class _ExperienceOutput extends StatelessWidget {
  final Map<String, dynamic> output;
  const _ExperienceOutput({required this.output});

  @override
  Widget build(BuildContext context) {
    final entries = _list(output['optimizedEntries']);
    final tips = _list(output['overallTips']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (entries.isNotEmpty) ...[
          _sectionTitle(context, 'Optimized Entries'),
          ...entries.map((e) {
            final m = _map(e);
            return _infoCard(
              context,
              Icons.business_center,
              '${_str(m['role'])} at ${_str(m['company'])}',
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_str(m['originalDescription']).isNotEmpty)
                    Text(
                      _str(m['originalDescription']),
                      style: const TextStyle(
                          decoration: TextDecoration.lineThrough),
                    ),
                  if (_str(m['optimizedDescription']).isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(_str(m['optimizedDescription'])),
                  ],
                  if (_list(m['keyChanges']).isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: _list(m['keyChanges'])
                            .mapIndexed((i, c) => Text(
                                  '• ${_str(c)}',
                                  style:
                                      Theme.of(context).textTheme.bodySmall,
                                ))
                            .toList(),
                      ),
                    ),
                ],
              ),
            );
          }),
        ],
        if (tips.isNotEmpty) ...[
          _sectionTitle(context, 'Tips'),
          _infoCard(
              context,
              Icons.tips_and_updates,
              '${tips.length} tips',
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ...tips.mapIndexed(
                      (i, t) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text('${i + 1}. ${_str(t)}'),
                          )),
                ],
              )),
        ],
      ],
    );
  }
}

class _ProfileOutput extends StatelessWidget {
  final Map<String, dynamic> output;
  const _ProfileOutput({required this.output});

  @override
  Widget build(BuildContext context) {
    final strengths = _list(output['strengths']);
    final weaknesses = _list(output['weaknesses']);
    final recommendations = _list(output['recommendations']);
    final sectionScores = _map(output['sectionScores']);
    final keyword = _map(output['keywordAnalysis']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _ScoreBar(score: _num(output['overallScore'])),
        if (strengths.isNotEmpty) ...[
          _sectionTitle(context, 'Strengths'),
          _infoCard(
              context,
              Icons.thumb_up,
              '${strengths.length} strengths',
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: strengths
                    .mapIndexed((i, s) => Padding(
                          padding: const EdgeInsets.only(bottom: 2),
                          child: Text('• ${_str(s)}'),
                        ))
                    .toList(),
              )),
        ],
        if (weaknesses.isNotEmpty) ...[
          _sectionTitle(context, 'Weaknesses'),
          _infoCard(
              context,
              Icons.thumb_down,
              '${weaknesses.length} weaknesses',
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: weaknesses
                    .mapIndexed((i, w) => Padding(
                          padding: const EdgeInsets.only(bottom: 2),
                          child: Text('• ${_str(w)}'),
                        ))
                    .toList(),
              )),
        ],
        if (recommendations.isNotEmpty) ...[
          _sectionTitle(context, 'Recommendations'),
          ...recommendations.map((r) {
            final m = _map(r);
            return _infoCard(
              context,
              Icons.recommend,
              '${_str(m['priority'])} · ${_str(m['action'])}',
              Text(_str(m['impact'])),
            );
          }),
        ],
        if (sectionScores.isNotEmpty) ...[
          _sectionTitle(context, 'Section Scores'),
          ...sectionScores.entries.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Expanded(child: Text(e.key)),
                    Text('${_num(e.value)}/100'),
                  ],
                ),
              )),
        ],
        if (keyword.isNotEmpty) ...[
          _sectionTitle(context, 'Keyword Analysis'),
          _infoCard(
              context,
              Icons.search,
              'Top: ${_list(keyword['topKeywords']).join(', ')}, Missing: ${_list(keyword['missingKeywords']).join(', ')}',
              Text('Density: ${_str(keyword['keywordDensity'])}')),
        ],
      ],
    );
  }
}

class _VisibilityOutput extends StatelessWidget {
  final Map<String, dynamic> output;
  const _VisibilityOutput({required this.output});

  @override
  Widget build(BuildContext context) {
    final coverage = _map(output['keywordCoverage']);
    final appeal = _map(output['recruiterAppeal']);
    final comparison = _list(output['competitorComparison']);
    final plan = _list(output['actionPlan']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _ScoreBar(score: _num(output['visibilityScore'])),
        if (_str(output['searchRank']).isNotEmpty)
          _infoCard(
              context,
              Icons.leaderboard,
              'Search Rank Estimate',
              Text(_str(output['searchRank']))),
        if (coverage.isNotEmpty)
          _infoCard(
              context,
              Icons.tag,
              'Keyword Coverage',
              Text(
                  'Present: ${_list(coverage['present']).join(', ')}\nMissing: ${_list(coverage['missing']).join(', ')}\nDensity: ${_str(coverage['density'])}')),
        if (appeal.isNotEmpty)
          _infoCard(
              context,
              Icons.people,
              'Recruiter Appeal: ${_num(appeal['score'])}/100',
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ..._list(appeal['strengths'])
                      .mapIndexed((i, s) => Text('• ${_str(s)}')),
                  ..._list(appeal['improvements'])
                      .mapIndexed((i, s) => Text('• ${_str(s)}')),
                ],
              )),
        if (comparison.isNotEmpty) ...[
          _sectionTitle(context, 'Competitor Comparison'),
          ...comparison.map((c) {
            final m = _map(c);
            return _infoCard(
              context,
              Icons.compare_arrows,
              _str(m['aspect']),
              Text(
                  'You: ${_str(m['yourProfile'])}\nIndustry: ${_str(m['industryStandard'])}\nGap: ${_str(m['gap'])}'),
            );
          }),
        ],
        if (plan.isNotEmpty) ...[
          _sectionTitle(context, 'Action Plan'),
          ...plan.map((p) {
            final m = _map(p);
            return _infoCard(
              context,
              Icons.checklist,
              '${_str(m['priority'])} · ${_str(m['action'])}',
              Text(
                  'Impact: ${_str(m['expectedImpact'])}\nTimeframe: ${_str(m['timeframe'])}'),
            );
          }),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Tool panels
// ---------------------------------------------------------------------------

class _ToolScaffold extends StatelessWidget {
  final List<Widget> form;
  final bool loading;
  final String? error;
  final bool generating;
  final VoidCallback onGenerate;
  final Widget? result;
  final List<LinkedinOptimization> history;

  const _ToolScaffold({
    required this.form,
    required this.loading,
    required this.error,
    required this.generating,
    required this.onGenerate,
    required this.result,
    required this.history,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...form,
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: generating ? null : onGenerate,
                    icon: generating
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.auto_awesome),
                    label: Text(generating ? 'Generating...' : 'Generate'),
                  ),
                ),
                if (error != null) ...[
                  const SizedBox(height: 8),
                  Text(error!,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.error)),
                ],
              ],
            ),
          ),
        ),
        if (result != null) ...[
          const SizedBox(height: 16),
          Text('Result', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Card(child: Padding(padding: const EdgeInsets.all(12), child: result)),
        ],
        const SizedBox(height: 16),
        Text('History', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        _HistoryList(items: history, loading: loading),
      ],
    );
  }
}

class _TextFieldForm extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool multiline;
  final TextInputType? keyboardType;

  const _TextFieldForm({
    required this.controller,
    required this.label,
    this.multiline = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: multiline ? 3 : 1,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }
}

class _HeadlinesPanel extends StatefulWidget {
  const _HeadlinesPanel();

  @override
  State<_HeadlinesPanel> createState() => _HeadlinesPanelState();
}

class _HeadlinesPanelState extends State<_HeadlinesPanel> {
  final LinkedinOptimizerRepository _repo = LinkedinOptimizerRepository();
  final _target = TextEditingController();
  final _current = TextEditingController();
  final _skills = TextEditingController();
  final _industry = TextEditingController();
  final _level = TextEditingController();
  final _headline = TextEditingController();
  final _tone = TextEditingController();

  List<LinkedinOptimization> _history = [];
  bool _loading = true;
  bool _generating = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_target, _current, _skills, _industry, _level, _headline, _tone]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final list = await _repo.list(type: 'headline');
      if (mounted) setState(() => _history = list);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    setState(() {
      _generating = true;
      _error = null;
    });
    try {
      final output = await _repo.generateHeadlines(
        targetRole: _target.text.trim(),
        currentRole: _current.text.trim(),
        skills: _splitList(_skills.text),
        industry: _industry.text.trim(),
        experienceLevel: _level.text.trim(),
        currentHeadline: _headline.text.trim(),
        tone: _tone.text.trim(),
      );
      if (!mounted) return;
      setState(() => _result = output);
      await _load();
    } catch (e) {
      if (mounted) setState(() => _error = 'Failed: $e');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _ToolScaffold(
      loading: _loading,
      error: _error,
      generating: _generating,
      onGenerate: _generate,
      result: _result == null ? null : _HeadlineOutput(output: _result!),
      history: _history,
      form: [
        const Text('Generate keyword-rich professional headlines.',
            style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _TextFieldForm(controller: _target, label: 'Target Role *'),
        _TextFieldForm(controller: _current, label: 'Current Role *'),
        _TextFieldForm(
            controller: _skills,
            label: 'Skills (comma separated) *',
            multiline: true),
        _TextFieldForm(controller: _industry, label: 'Industry *'),
        _TextFieldForm(controller: _level, label: 'Experience Level'),
        _TextFieldForm(controller: _headline, label: 'Current Headline'),
        _TextFieldForm(controller: _tone, label: 'Tone (e.g. professional)'),
      ],
    );
  }
}

class _AboutPanel extends StatefulWidget {
  const _AboutPanel();

  @override
  State<_AboutPanel> createState() => _AboutPanelState();
}

class _AboutPanelState extends State<_AboutPanel> {
  final LinkedinOptimizerRepository _repo = LinkedinOptimizerRepository();
  final _target = TextEditingController();
  final _industry = TextEditingController();
  final _achievements = TextEditingController();
  final _skills = TextEditingController();
  final _currentAbout = TextEditingController();
  final _years = TextEditingController();
  final _tone = TextEditingController();

  List<LinkedinOptimization> _history = [];
  bool _loading = true;
  bool _generating = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_target, _industry, _achievements, _skills, _currentAbout, _years, _tone]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final list = await _repo.list(type: 'about');
      if (mounted) setState(() => _history = list);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    setState(() {
      _generating = true;
      _error = null;
    });
    try {
      final output = await _repo.generateAbout(
        targetRole: _target.text.trim(),
        industry: _industry.text.trim(),
        keyAchievements: _splitList(_achievements.text),
        skills: _splitList(_skills.text),
        currentAbout: _currentAbout.text.trim(),
        experienceYears: int.tryParse(_years.text.trim()),
        tone: _tone.text.trim(),
      );
      if (!mounted) return;
      setState(() => _result = output);
      await _load();
    } catch (e) {
      if (mounted) setState(() => _error = 'Failed: $e');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _ToolScaffold(
      loading: _loading,
      error: _error,
      generating: _generating,
      onGenerate: _generate,
      result: _result == null ? null : _AboutOutput(output: _result!),
      history: _history,
      form: [
        const Text('Write a compelling About section.',
            style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _TextFieldForm(controller: _target, label: 'Target Role *'),
        _TextFieldForm(controller: _industry, label: 'Industry *'),
        _TextFieldForm(
            controller: _achievements,
            label: 'Key Achievements (comma separated) *',
            multiline: true),
        _TextFieldForm(
            controller: _skills,
            label: 'Skills (comma separated) *',
            multiline: true),
        _TextFieldForm(controller: _currentAbout, label: 'Current About', multiline: true),
        _TextFieldForm(
            controller: _years,
            label: 'Years of Experience',
            keyboardType: TextInputType.number),
        _TextFieldForm(controller: _tone, label: 'Tone (e.g. professional)'),
      ],
    );
  }
}

class _ExperiencePanel extends StatefulWidget {
  const _ExperiencePanel();

  @override
  State<_ExperiencePanel> createState() => _ExperiencePanelState();
}

class _ExperiencePanelState extends State<_ExperiencePanel> {
  final LinkedinOptimizerRepository _repo = LinkedinOptimizerRepository();
  final _industry = TextEditingController();
  final _tone = TextEditingController();
  final List<TextEditingController> _companies = [];
  final List<TextEditingController> _roles = [];
  final List<TextEditingController> _descriptions = [];

  List<LinkedinOptimization> _history = [];
  bool _loading = true;
  bool _generating = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _addEntry();
    _addEntry();
    _load();
  }

  @override
  void dispose() {
    for (final c in [..._companies, ..._roles, ..._descriptions, _industry, _tone]) {
      c.dispose();
    }
    super.dispose();
  }

  void _addEntry() {
    setState(() {
      _companies.add(TextEditingController());
      _roles.add(TextEditingController());
      _descriptions.add(TextEditingController());
    });
  }

  void _removeEntry(int index) {
    setState(() {
      _companies.removeAt(index).dispose();
      _roles.removeAt(index).dispose();
      _descriptions.removeAt(index).dispose();
    });
  }

  Future<void> _load() async {
    try {
      final list = await _repo.list(type: 'experience_optimizer');
      if (mounted) setState(() => _history = list);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    final entries = <Map<String, dynamic>>[];
    for (var i = 0; i < _companies.length; i++) {
      if (_descriptions[i].text.trim().isEmpty) continue;
      entries.add({
        'company': _companies[i].text.trim(),
        'role': _roles[i].text.trim(),
        'description': _descriptions[i].text.trim(),
      });
    }
    if (entries.isEmpty) {
      setState(() => _error = 'Add at least one experience entry with a description.');
      return;
    }
    setState(() {
      _generating = true;
      _error = null;
    });
    try {
      final output = await _repo.optimizeExperience(
        entries: entries,
        industry: _industry.text.trim(),
        tone: _tone.text.trim(),
      );
      if (!mounted) return;
      setState(() => _result = output);
      await _load();
    } catch (e) {
      if (mounted) setState(() => _error = 'Failed: $e');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _ToolScaffold(
      loading: _loading,
      error: _error,
      generating: _generating,
      onGenerate: _generate,
      result: _result == null ? null : _ExperienceOutput(output: _result!),
      history: _history,
      form: [
        const Text('Rewrite experience with strong action verbs.',
            style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _TextFieldForm(controller: _industry, label: 'Industry'),
        _TextFieldForm(controller: _tone, label: 'Tone (e.g. professional)'),
        ...List.generate(_companies.length, (i) {
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  _TextFieldForm(controller: _companies[i], label: 'Company'),
                  _TextFieldForm(controller: _roles[i], label: 'Role'),
                  _TextFieldForm(
                      controller: _descriptions[i],
                      label: 'Description *',
                      multiline: true),
                  if (_companies.length > 1)
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => _removeEntry(i),
                        child: const Text('Remove'),
                      ),
                    ),
                ],
              ),
            ),
          );
        }),
        Align(
          alignment: Alignment.centerLeft,
          child: OutlinedButton.icon(
            onPressed: _addEntry,
            icon: const Icon(Icons.add),
            label: const Text('Add Entry'),
          ),
        ),
      ],
    );
  }
}

class _ProfilePanel extends StatefulWidget {
  const _ProfilePanel();

  @override
  State<_ProfilePanel> createState() => _ProfilePanelState();
}

class _ProfilePanelState extends State<_ProfilePanel> {
  final LinkedinOptimizerRepository _repo = LinkedinOptimizerRepository();
  final _url = TextEditingController();
  final _headline = TextEditingController();
  final _about = TextEditingController();
  final _currentRole = TextEditingController();
  final _company = TextEditingController();
  final _industry = TextEditingController();
  final _location = TextEditingController();
  final _level = TextEditingController();
  final _skills = TextEditingController();

  List<LinkedinOptimization> _history = [];
  bool _loading = true;
  bool _generating = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_url, _headline, _about, _currentRole, _company, _industry, _location, _level, _skills]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final list = await _repo.list(type: 'profile_analysis');
      if (mounted) setState(() => _history = list);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    setState(() {
      _generating = true;
      _error = null;
    });
    try {
      final output = await _repo.analyzeProfile(
        profileUrl: _url.text.trim(),
        headline: _headline.text.trim(),
        about: _about.text.trim(),
        currentRole: _currentRole.text.trim(),
        currentCompany: _company.text.trim(),
        industry: _industry.text.trim(),
        location: _location.text.trim(),
        experienceLevel: _level.text.trim(),
        skills: _splitList(_skills.text),
      );
      if (!mounted) return;
      setState(() => _result = output);
      await _load();
    } catch (e) {
      if (mounted) setState(() => _error = 'Failed: $e');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _ToolScaffold(
      loading: _loading,
      error: _error,
      generating: _generating,
      onGenerate: _generate,
      result: _result == null ? null : _ProfileOutput(output: _result!),
      history: _history,
      form: [
        const Text('Analyze your profile and get recommendations.',
            style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _TextFieldForm(controller: _url, label: 'Profile URL'),
        _TextFieldForm(controller: _headline, label: 'Headline'),
        _TextFieldForm(controller: _about, label: 'About', multiline: true),
        _TextFieldForm(controller: _currentRole, label: 'Current Role'),
        _TextFieldForm(controller: _company, label: 'Current Company'),
        _TextFieldForm(controller: _industry, label: 'Industry'),
        _TextFieldForm(controller: _location, label: 'Location'),
        _TextFieldForm(controller: _level, label: 'Experience Level'),
        _TextFieldForm(
            controller: _skills,
            label: 'Skills (comma separated)',
            multiline: true),
      ],
    );
  }
}

class _VisibilityPanel extends StatefulWidget {
  const _VisibilityPanel();

  @override
  State<_VisibilityPanel> createState() => _VisibilityPanelState();
}

class _VisibilityPanelState extends State<_VisibilityPanel> {
  final LinkedinOptimizerRepository _repo = LinkedinOptimizerRepository();
  final _headline = TextEditingController();
  final _about = TextEditingController();
  final _skills = TextEditingController();
  final _targetRoles = TextEditingController();
  final _locations = TextEditingController();
  final _industry = TextEditingController();
  final _level = TextEditingController();

  List<LinkedinOptimization> _history = [];
  bool _loading = true;
  bool _generating = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_headline, _about, _skills, _targetRoles, _locations, _industry, _level]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final list = await _repo.list(type: 'visibility_analysis');
      if (mounted) setState(() => _history = list);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    setState(() {
      _generating = true;
      _error = null;
    });
    try {
      final output = await _repo.analyzeVisibility(
        headline: _headline.text.trim(),
        about: _about.text.trim(),
        skills: _splitList(_skills.text),
        targetRoles: _splitList(_targetRoles.text),
        targetLocations: _splitList(_locations.text),
        industry: _industry.text.trim(),
        experienceLevel: _level.text.trim(),
      );
      if (!mounted) return;
      setState(() => _result = output);
      await _load();
    } catch (e) {
      if (mounted) setState(() => _error = 'Failed: $e');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _ToolScaffold(
      loading: _loading,
      error: _error,
      generating: _generating,
      onGenerate: _generate,
      result: _result == null ? null : _VisibilityOutput(output: _result!),
      history: _history,
      form: [
        const Text('Analyze recruiter search visibility.',
            style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _TextFieldForm(controller: _headline, label: 'Headline *'),
        _TextFieldForm(controller: _about, label: 'About *', multiline: true),
        _TextFieldForm(
            controller: _skills,
            label: 'Skills (comma separated) *',
            multiline: true),
        _TextFieldForm(
            controller: _targetRoles,
            label: 'Target Roles (comma separated) *',
            multiline: true),
        _TextFieldForm(controller: _locations, label: 'Target Locations'),
        _TextFieldForm(controller: _industry, label: 'Industry'),
        _TextFieldForm(controller: _level, label: 'Experience Level'),
      ],
    );
  }
}
