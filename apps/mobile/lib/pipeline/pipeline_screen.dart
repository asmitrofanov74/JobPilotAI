import 'dart:async';

import 'package:flutter/material.dart';

import '../jobs/job_models.dart' show interviewTypes;
import '../pipeline/pipeline_models.dart';
import '../pipeline/pipeline_repository.dart';
import '../screens/cover_letters_screen.dart';
import '../screens/french_coach_screen.dart';
import '../screens/interview_coach_screen.dart';
import '../screens/skills_screen.dart';
import '../scraper/scraper_models.dart' show ScrapedJob;

Future<void> runPipelineForScrapedJob(
  BuildContext context,
  ScrapedJob job,
) async {
  final config = await _choosePipelineConfig(context);
  if (config == null || !context.mounted) return;
  await Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => PipelineRunScreen(
        config: config,
        scrapedJob: _scrapedJobToInput(job),
        contextLabel: '${job.jobTitle} @ ${job.companyName}',
      ),
    ),
  );
}

Future<void> runPipelineForJob(
  BuildContext context, {
  required String jobId,
  required String label,
  String? userSkills,
}) async {
  final config = await _choosePipelineConfig(context);
  if (config == null || !context.mounted) return;
  await Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => PipelineRunScreen(
        config: config,
        jobId: jobId,
        userSkills: userSkills,
        contextLabel: label,
      ),
    ),
  );
}

Map<String, dynamic> _scrapedJobToInput(ScrapedJob j) {
  return {
    'companyName': j.companyName,
    'jobTitle': j.jobTitle,
    if (j.jobDescription != null && j.jobDescription!.isNotEmpty)
      'jobDescription': j.jobDescription,
    if (j.jobUrl != null && j.jobUrl!.isNotEmpty) 'jobUrl': j.jobUrl,
    if (j.location != null && j.location!.isNotEmpty) 'location': j.location,
    if (j.salaryRange != null && j.salaryRange!.isNotEmpty)
      'salaryRange': j.salaryRange,
    if (j.source != null && j.source!.isNotEmpty) 'source': j.source,
    if (j.sourceUrl != null && j.sourceUrl!.isNotEmpty)
      'sourceUrl': j.sourceUrl,
    if (j.sourceId != null && j.sourceId!.isNotEmpty) 'sourceId': j.sourceId,
  };
}

Future<PipelineConfig?> _choosePipelineConfig(BuildContext context) async {
  return showDialog<PipelineConfig>(
    context: context,
    builder: (_) => const PipelineSetupDialog(),
  );
}

class PipelineSetupDialog extends StatefulWidget {
  const PipelineSetupDialog({super.key});

  @override
  State<PipelineSetupDialog> createState() => _PipelineSetupDialogState();
}

class _PipelineSetupDialogState extends State<PipelineSetupDialog> {
  String _tone = 'professional';
  String _interviewType = 'PHONE';
  String _practiceLanguage = 'ENGLISH';
  final TextEditingController _scheduledController = TextEditingController();
  int _questionCount = 5;

  @override
  void dispose() {
    _scheduledController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Run application pipeline'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Imports the vacancy, writes your cover letter, checks skill '
              'gaps, marks it APPLIED, schedules the interview and generates '
              'a practice session.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _tone,
              decoration: const InputDecoration(
                  labelText: 'Cover letter tone', border: OutlineInputBorder()),
              items: pipelineTones
                  .map((t) =>
                      DropdownMenuItem(value: t, child: Text(t)))
                  .toList(),
              onChanged: (v) => setState(() => _tone = v ?? _tone),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _interviewType,
              decoration: const InputDecoration(
                  labelText: 'Interview type', border: OutlineInputBorder()),
              items: interviewTypes
                  .map((t) => DropdownMenuItem(
                      value: t, child: Text(t.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => setState(() => _interviewType = v ?? _interviewType),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _practiceLanguage,
              decoration: const InputDecoration(
                  labelText: 'Practice language',
                  border: OutlineInputBorder()),
              items: pipelineLanguages
                  .map((l) => DropdownMenuItem(
                      value: l, child: Text(pipelineLanguageLabel(l))))
                  .toList(),
              onChanged: (v) =>
                  setState(() => _practiceLanguage = v ?? _practiceLanguage),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _scheduledController,
              decoration: const InputDecoration(
                  labelText: 'Scheduled (optional, YYYY-MM-DDTHH:MM:SS)',
                  border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: TextEditingController(text: '$_questionCount'),
              decoration: const InputDecoration(
                  labelText: 'Practice questions (3-8)',
                  border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
              onChanged: (v) =>
                  _questionCount = (int.tryParse(v) ?? 5).clamp(3, 8),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.pop(
              context,
              PipelineConfig(
                tone: _tone,
                interviewType: _interviewType,
                practiceLanguage: _practiceLanguage,
                scheduledAt: _scheduledController.text.trim().isEmpty
                    ? null
                    : _scheduledController.text.trim(),
                questionCount: _questionCount,
              ),
            );
          },
          child: const Text('Run'),
        ),
      ],
    );
  }
}

class PipelineRunScreen extends StatefulWidget {
  final PipelineConfig config;
  final String? jobId;
  final Map<String, dynamic>? scrapedJob;
  final String? userSkills;
  final String contextLabel;

  const PipelineRunScreen({
    super.key,
    required this.config,
    this.jobId,
    this.scrapedJob,
    this.userSkills,
    required this.contextLabel,
  });

  @override
  State<PipelineRunScreen> createState() => _PipelineRunScreenState();
}

class _PipelineRunScreenState extends State<PipelineRunScreen> {
  static const _steps = [
    'Importing vacancy',
    'Writing cover letter',
    'Analyzing skill gap',
    'Marking as APPLIED',
    'Scheduling interview',
    'Generating practice questions',
  ];

  final PipelineRepository _repository = PipelineRepository();
  Timer? _stepTimer;
  int _step = 0;
  bool _done = false;
  String? _error;
  PipelineResult? _result;

  @override
  void initState() {
    super.initState();
    _stepTimer = Timer.periodic(const Duration(seconds: 7), (_) {
      if (_step < _steps.length - 1) setState(() => _step++);
    });
    _run();
  }

  @override
  void dispose() {
    _stepTimer?.cancel();
    super.dispose();
  }

  Future<void> _run() async {
    try {
      final result = await _repository.run(
        config: widget.config,
        jobId: widget.jobId,
        scrapedJob: widget.scrapedJob,
        userSkills: widget.userSkills,
      );
      if (!mounted) return;
      _stepTimer?.cancel();
      setState(() {
        _result = result;
        _done = true;
      });
    } catch (e) {
      _stepTimer?.cancel();
      if (!mounted) return;
      setState(() => _error = '$e');
    }
  }

  String _friendlyError(String error) {
    return error;
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Pipeline')),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Pipeline failed.',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text(_friendlyError(_error!)),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Done'),
              ),
            ],
          ),
        ),
      );
    }

    if (!_done || _result == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Running pipeline')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.contextLabel,
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              const Text(
                  'This can take a minute or two. Keep the app open.',
                  style: TextStyle(fontSize: 12)),
              const SizedBox(height: 24),
              ..._steps.asMap().entries.map((e) {
                final i = e.key;
                final label = e.value;
                final active = i == _step;
                final passed = i < _step;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Icon(
                        passed
                            ? Icons.check_circle
                            : active
                                ? Icons.hourglass_top
                                : Icons.circle_outlined,
                        size: 20,
                        color: passed
                            ? Colors.green.shade600
                            : active
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(context).colorScheme.outline,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          label,
                          style: TextStyle(
                            fontWeight: active ? FontWeight.w600 : null,
                            color: passed
                                ? null
                                : active
                                    ? null
                                    : Theme.of(context)
                                        .colorScheme
                                        .outline,
                          ),
                        ),
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

    return _PipelineResultScreen(result: _result!);
  }
}

class _PipelineResultScreen extends StatelessWidget {
  final PipelineResult result;

  const _PipelineResultScreen({required this.result});

  @override
  Widget build(BuildContext context) {
    final skillGap = result.skillGapReport;
    final matchPercent =
        (skillGap?.matchScore ?? 0) * 100;
    return Scaffold(
      appBar: AppBar(title: const Text('Pipeline complete')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(result.job.jobTitle,
                            style: Theme.of(context).textTheme.titleMedium),
                        Text(result.job.companyName),
                        if (result.job.location != null)
                          Text(result.job.location!,
                              style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                  _statusChip(result.job.status),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          _stepTile(
            context,
            icon: Icons.description_outlined,
            title: 'Cover letter ready',
            subtitle:
                '${result.coverLetter.jobTitle} @ ${result.coverLetter.companyName}'
                ' · ${result.coverLetter.tone}',
            onTap: () => _open(context, const CoverLettersScreen()),
          ),
          if (skillGap != null)
            _stepTile(
              context,
              icon: Icons.insights_outlined,
              title: 'Skill gap analysis',
              subtitle: 'Match score: ${matchPercent.round()}% '
                  '(${skillGap.jobTitle})',
              onTap: () => _open(context, const SkillsScreen()),
            ),
          _stepTile(
            context,
            icon: Icons.calendar_month_outlined,
            title: 'Interview scheduled',
            subtitle: [
              result.interview.type.replaceAll('_', ' '),
              if (result.interview.round != null)
                'Round ${result.interview.round}',
              if (result.interview.scheduledAt != null)
                _formatDate(result.interview.scheduledAt!),
            ].join(' · '),
          ),
          if (result.practice != null) ...[
            _stepTile(
              context,
              icon: Icons.record_voice_over_outlined,
              title: 'Practice session ready',
              subtitle:
                  '${pipelineLanguageLabel(result.practice!.language)} · '
                  '${result.practice!.questionCount} questions',
              trailing: FilledButton.tonal(
                onPressed: () => _startPractice(context),
                child: const Text('Practice'),
              ),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _open(BuildContext context, Widget screen) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  void _startPractice(BuildContext context) {
    final practice = result.practice;
    if (practice == null) return;
    if (practice.language == 'FRENCH') {
      _open(context, const FrenchCoachScreen());
    } else {
      _open(context, const InterviewCoachScreen());
    }
  }

  Widget _statusChip(String status) {
    final color = status == 'APPLIED'
        ? Colors.blue.shade700
        : Colors.grey.shade700;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(fontSize: 12, color: color),
      ),
    );
  }

  Widget _stepTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: trailing,
        onTap: onTap,
      ),
    );
  }

  String _formatDate(String value) {
    final dt = DateTime.tryParse(value);
    if (dt == null) return value;
    final local = dt.toLocal();
    final months = const [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${local.day} ${months[local.month - 1]} ${local.year} '
        '${local.hour.toString().padLeft(2, '0')}:'
        '${local.minute.toString().padLeft(2, '0')}';
  }
}