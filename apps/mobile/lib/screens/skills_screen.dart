import 'package:flutter/material.dart';

import '../skills/skill_models.dart';
import '../skills/skills_repository.dart';

class SkillsScreen extends StatefulWidget {
  const SkillsScreen({super.key});

  @override
  State<SkillsScreen> createState() => _SkillsScreenState();
}

class _SkillsScreenState extends State<SkillsScreen> {
  final SkillsRepository _repository = SkillsRepository();
  final TextEditingController _jobTitleController = TextEditingController();
  final TextEditingController _companyController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _skillsController = TextEditingController();

  List<SkillGapReport> _reports = [];
  SkillGapReport? _current;
  bool _loading = true;
  bool _analyzing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _jobTitleController.dispose();
    _companyController.dispose();
    _descriptionController.dispose();
    _skillsController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final reports = await _repository.reports();
      if (!mounted) return;
      setState(() => _reports = reports);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _analyze() async {
    final jobTitle = _jobTitleController.text.trim();
    final company = _companyController.text.trim();
    final description = _descriptionController.text.trim();
    final skills = _skillsController.text.trim();
    if (jobTitle.isEmpty || company.isEmpty || description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Job title, company, description and skills are required')),
      );
      return;
    }
    setState(() {
      _analyzing = true;
      _current = null;
    });
    try {
      final report = await _repository.analyze(
        jobTitle: jobTitle,
        companyName: company,
        jobDescription: description,
        userSkills: skills,
      );
      if (!mounted) return;
      setState(() => _current = report);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to analyze: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _analyzing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Skill Gap Analysis')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('New Analysis',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _jobTitleController,
                    decoration: const InputDecoration(
                        labelText: 'Job Title', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _companyController,
                    decoration: const InputDecoration(
                        labelText: 'Company Name',
                        border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _descriptionController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                        labelText: 'Job Description',
                        border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _skillsController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                        labelText: 'Your Skills (comma separated)',
                        border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _analyzing ? null : _analyze,
                      icon: _analyzing
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child:
                                  CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.analytics),
                      label: Text(_analyzing ? 'Analyzing...' : 'Analyze'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_current != null) ...[
            const SizedBox(height: 16),
            _buildResult(_current!),
          ],
          const SizedBox(height: 24),
          Text('Previous Reports',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            )
          else if (_reports.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text('No analyses yet. Run your first analysis.'),
            )
          else
            ..._reports.map((r) => Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: ListTile(
                    title: Text(r.jobTitle),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(r.companyName),
                        if (r.matchScore != null)
                          Text('Match: ${r.matchScore!.round()}%'),
                        if (r.missingSkills.isNotEmpty)
                          Text(
                            'Missing: ${r.missingSkills.map((m) => m.skill).take(5).join(', ')}${r.missingSkills.length > 5 ? '...' : ''}',
                            style: TextStyle(color: Colors.red.shade700),
                          ),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      setState(() => _current = r);
                      _scrollToResult();
                    },
                  ),
                )),
        ],
      ),
    );
  }

  void _scrollToResult() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Report loaded')),
    );
  }

  Widget _buildResult(SkillGapReport report) {
    final score = report.matchScore;
    final missingSkills = report.missingSkills.map((m) => m.skill).toSet();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('${report.jobTitle} · ${report.companyName}',
                      style: Theme.of(context).textTheme.titleMedium),
                ),
                if (score != null)
                  Text('${score.round()}%',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: score >= 70
                            ? Colors.green.shade600
                            : score >= 40
                                ? Colors.orange.shade600
                                : Colors.red.shade600,
                      )),
              ],
            ),
            if (score != null) ...[
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: score / 100,
                minHeight: 8,
                borderRadius: BorderRadius.circular(4),
                color: score >= 70
                    ? Colors.green.shade600
                    : score >= 40
                        ? Colors.orange.shade600
                        : Colors.red.shade600,
                backgroundColor: Colors.grey.shade200,
              ),
            ],
            const SizedBox(height: 16),
            Text('Required Skills',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: report.requiredSkills.map((r) {
                final missing = missingSkills.contains(r.skill);
                return Chip(
                  label: Text(r.skill),
                  labelStyle: TextStyle(
                    color: missing ? Colors.red.shade700 : null,
                  ),
                  side: missing
                      ? BorderSide(color: Colors.red.shade400)
                      : null,
                  backgroundColor: missing
                      ? Colors.red.shade50
                      : Colors.green.shade50,
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            if (report.missingSkills.isNotEmpty) ...[
              Text('Missing Skills',
                  style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              ...report.missingSkills.map((m) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.cancel,
                            size: 18, color: Colors.red.shade400),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m.recommendation.isNotEmpty
                                    ? '${m.skill} - ${m.recommendation}'
                                    : m.skill,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )),
            ],
            if (report.recommendations.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Recommendations',
                  style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              ...report.recommendations.map((rec) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('•  '),
                        Expanded(child: Text(rec)),
                      ],
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}
