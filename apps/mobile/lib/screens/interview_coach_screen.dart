import 'package:collection/collection.dart';
import 'package:flutter/material.dart';

import '../interview/interview_models.dart';
import '../interview/interview_repository.dart';

enum _Lang { french, english }

class InterviewCoachScreen extends StatefulWidget {
  const InterviewCoachScreen({super.key});

  @override
  State<InterviewCoachScreen> createState() => _InterviewCoachScreenState();
}

class _InterviewCoachScreenState extends State<InterviewCoachScreen> {
  final InterviewRepository _repository = InterviewRepository();
  final TextEditingController _answerController = TextEditingController();
  final TextEditingController _jobController = TextEditingController();

  _Lang _language = _Lang.english;
  String _scenario = '';
  int _questionCount = 5;

  List<PracticeInterview> _interviews = [];
  PracticeInterview? _active;
  String? _activeQuestionId;
  PracticeHint? _hint;
  bool _showResult = false;

  bool _loading = true;
  bool _generating = false;
  bool _evaluating = false;
  bool _hinting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _answerController.addListener(_onAnswerChanged);
    _load();
  }

  void _onAnswerChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _answerController.removeListener(_onAnswerChanged);
    _answerController.dispose();
    _jobController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _repository.list(french: true),
        _repository.list(french: false),
      ]);
      final all = [...results[0], ...results[1]]
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      setState(() => _interviews = all);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    if (_scenario.isEmpty) return;
    setState(() {
      _generating = true;
      _error = null;
    });
    try {
      final result = await _repository.generate(
        french: _language == _Lang.french,
        scenario: _scenario,
        questionCount: _questionCount,
        jobDescription: _jobController.text.trim(),
      );
      if (!mounted) return;
      final detail = await _fetchDetail(
        result.interview.id,
        french: _language == _Lang.french,
      );
      if (!mounted) return;
      setState(() {
        _active = detail ??
            PracticeInterview(
              id: result.interview.id,
              scenario: result.interview.scenario,
              questionCount: result.interview.questionCount,
              status: result.interview.status,
              questions: result.questions,
              answers: result.interview.answers,
              evaluations: result.interview.evaluations,
              overallScore: result.interview.overallScore,
              createdAt: result.interview.createdAt,
              french: _language == _Lang.french,
            );
        _activeQuestionId =
            result.questions.isNotEmpty ? result.questions.first.id : null;
        _hint = null;
        _showResult = false;
        _answerController.clear();
      });
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Failed to generate questions: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate questions: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Future<PracticeInterview?> _fetchDetail(String id, {required bool french}) async {
    try {
      return await _repository.get(id: id, french: french);
    } catch (_) {
      return null;
    }
  }

  Future<void> _submitAnswer() async {
    final interview = _active;
    final qid = _activeQuestionId;
    final answer = _answerController.text.trim();
    if (interview == null || qid == null || answer.isEmpty) return;
    setState(() => _evaluating = true);
    try {
      final result = await _repository.evaluate(
        french: _language == _Lang.french,
        interviewId: interview.id,
        questionId: qid,
        answer: answer,
      );
      if (!mounted) return;
      setState(() {
        _active = result.interview;
        _showResult = true;
        _answerController.clear();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to evaluate: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _evaluating = false);
    }
  }

  Future<void> _getHint() async {
    final interview = _active;
    final qid = _activeQuestionId;
    if (interview == null || qid == null) return;
    setState(() => _hinting = true);
    try {
      final hint = await _repository.hint(
        french: _language == _Lang.french,
        interviewId: interview.id,
        questionId: qid,
      );
      if (mounted) setState(() => _hint = hint);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to get hint: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _hinting = false);
    }
  }

  void _selectQuestion(String qid) {
    setState(() {
      _activeQuestionId = qid;
      _showResult = false;
      _hint = null;
      _answerController.clear();
    });
  }

  PracticeQuestion? get _question {
    final questions = _active?.questions ?? [];
    if (questions.isEmpty) return null;
    final qid = _activeQuestionId ?? questions.first.id;
    return questions.firstWhere((q) => q.id == qid, orElse: () => questions.first);
  }

  PracticeEvaluation? get _questionEvaluation {
    final qid = _activeQuestionId;
    if (qid == null || _active == null) return null;
    return _active!.evaluations
        .where((e) => e.questionId == qid)
        .firstOrNull;
  }

  String get _scenarioLabel {
    final value = _active?.scenario ?? '';
    final list = _language == _Lang.french
        ? frenchInterviewScenarios
        : englishInterviewScenarios;
    return list
            .where((s) => s.value.toLowerCase() == value.toLowerCase())
            .map((s) => s.label)
            .firstOrNull ??
        value.replaceAll('_', ' ');
  }

  int get _overallAverage {
    final evals = _active?.evaluations ?? [];
    if (evals.isEmpty) return 0;
    return (evals.map((e) => e.average).reduce((a, b) => a + b) / evals.length)
        .round();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Interview Coach'),
        leading: _active != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() {
                  _active = null;
                  _showResult = false;
                  _hint = null;
                }),
              )
            : null,
      ),
      body: _active != null
          ? _buildSession(context)
          : _buildSetup(context),
    );
  }

  Widget _buildSetup(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Practice interviews in French or English',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 12),
        SegmentedButton<_Lang>(
          segments: const [
            ButtonSegment(
              value: _Lang.french,
              label: Text('Français'),
              icon: Icon(Icons.language),
            ),
            ButtonSegment(
              value: _Lang.english,
              label: Text('English'),
              icon: Icon(Icons.translate),
            ),
          ],
          selected: {_language},
          onSelectionChanged: (s) {
            setState(() {
              _language = s.first;
              _scenario = '';
            });
          },
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('New Practice Session',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                Text('Select Scenario',
                    style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _scenarioList.map((s) {
                    final selected = _scenario == s.value;
                    return ChoiceChip(
                      label: Text(s.label),
                      selected: selected,
                      onSelected: (_) => setState(() => _scenario = s.value),
                    );
                  }).toList(),
                ),
                if (_scenario == 'CUSTOM_JOB') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _jobController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Job Description',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Text('Number of Questions',
                    style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 8),
                SegmentedButton<int>(
                  segments: const [
                    ButtonSegment(value: 3, label: Text('3')),
                    ButtonSegment(value: 5, label: Text('5')),
                    ButtonSegment(value: 8, label: Text('8')),
                  ],
                  selected: {_questionCount},
                  onSelectionChanged: (s) =>
                      setState(() => _questionCount = s.first),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed:
                        _scenario.isEmpty || _generating ? null : _generate,
                    icon: _generating
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.psychology),
                    label: Text(_generating
                        ? 'Generating...'
                        : 'Generate Questions'),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text('Past Interviews', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        if (_interviews.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: Column(
              children: [
                Icon(Icons.psychology,
                    size: 48,
                    color: Theme.of(context).colorScheme.outline),
                const SizedBox(height: 8),
                Text('No Interviews Yet',
                    style: Theme.of(context).textTheme.titleSmall),
                const Text('Start your first practice interview'),
              ],
            ),
          )
        else
          ..._interviews.map((i) {
            final score = i.evaluations.isEmpty
                ? null
                : (i.evaluations.map((e) => e.average).reduce((a, b) => a + b) /
                        i.evaluations.length)
                    .round();
            final isFrench = _isFrenchScenario(i);
            return Card(
              child: ListTile(
                leading: CircleAvatar(
                  child: Icon(
                    isFrench ? Icons.language : Icons.translate,
                  ),
                ),
                title: Text(_scenarioLabelFor(i.scenario, isFrench)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${isFrench ? "Français" : "English"} · ${i.questionCount} questions · ${i.isCompleted ? "Completed" : "In Progress"}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    if (score != null)
                      Text('Score: $score/100',
                          style: TextStyle(
                            color: score >= 70
                                ? Colors.green.shade700
                                : score >= 40
                                    ? Colors.orange.shade700
                                    : Colors.red.shade700,
                          )),
                  ],
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  var detail = await _fetchDetail(i.id, french: i.french);
                  var lang = i.french ? _Lang.french : _Lang.english;
                  if (detail == null) {
                    final other =
                        await _fetchDetail(i.id, french: !i.french);
                    if (other != null) {
                      detail = other;
                      lang = !i.french ? _Lang.french : _Lang.english;
                    }
                  }
                  if (detail == null) {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Interview not found')),
                    );
                    return;
                  }
                  final interview = detail;
                  setState(() {
                    _active = interview;
                    _language = lang;
                    _activeQuestionId = interview.questions.isNotEmpty
                        ? interview.questions.first.id
                        : null;
                    _showResult = false;
                    _hint = null;
                  });
                },
              ),
            );
          }),
      ],
    );
  }

  List<InterviewScenarioInfo> get _scenarioList => _language == _Lang.french
      ? frenchInterviewScenarios
      : englishInterviewScenarios;

  bool _isFrenchScenario(PracticeInterview i) {
    return i.french;
  }

  String _scenarioLabelFor(String value, bool isFrench) {
    final list = isFrench ? frenchInterviewScenarios : englishInterviewScenarios;
    return list
            .where((s) => s.value.toLowerCase() == value.toLowerCase())
            .map((s) => s.label)
            .firstOrNull ??
        value.replaceAll('_', ' ');
  }

  Widget _buildSession(BuildContext context) {
    final interview = _active!;
    final question = _question;
    final questions = interview.questions;
    final answeredIds = interview.answers.map((a) => a.questionId).toSet();
    final qIndex =
        question == null ? -1 : questions.indexOf(question);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(_scenarioLabel,
                  style: Theme.of(context).textTheme.titleLarge),
            ),
            Chip(
              label: Text(_language == _Lang.french ? 'Français' : 'English'),
              visualDensity: VisualDensity.compact,
            ),
            if (interview.overallScore != null) ...[
              const SizedBox(width: 8),
              Chip(
                label: Text('Score: ${interview.overallScore}/100'),
                backgroundColor: (interview.overallScore ?? 0) >= 70
                    ? Colors.green.shade100
                    : (interview.overallScore ?? 0) >= 40
                        ? Colors.orange.shade100
                        : Colors.red.shade100,
                visualDensity: VisualDensity.compact,
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: questions.map((q) {
            final answered = answeredIds.contains(q.id);
            final active = q.id == question?.id;
            return Expanded(
              child: Container(
                height: 6,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: BoxDecoration(
                  color: answered
                      ? Colors.green.shade400
                      : active
                          ? Colors.blue.shade400
                          : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        if (question != null) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Chip(
                        label: Text(question.category.replaceAll('_', ' ')),
                        visualDensity: VisualDensity.compact,
                      ),
                      const Spacer(),
                      Text(
                        'Question ${qIndex + 1} of ${questions.length}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(question.question,
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 16),
                  if (!answeredIds.contains(question.id)) ...[
                    if (_hint != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.lightbulb,
                                    size: 18, color: Colors.amber.shade700),
                                const SizedBox(width: 4),
                                Text('Hint',
                                    style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: Colors.amber.shade800)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(_hint!.hint),
                            if (_hint!.keyPoints.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text('Key Points',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: Colors.amber.shade800)),
                              Text(_hint!.keyPoints),
                            ],
                            if (_hint!.exampleAnswer.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text('Example Answer',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: Colors.amber.shade800)),
                              Text(_hint!.exampleAnswer,
                                  style: const TextStyle(
                                      fontStyle: FontStyle.italic)),
                            ],
                            TextButton(
                              onPressed: () =>
                                  setState(() => _hint = null),
                              child: const Text('Hide Hint'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                    ] else
                      OutlinedButton.icon(
                        onPressed: _hinting ? null : _getHint,
                        icon: _hinting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.lightbulb),
                        label: Text(_hinting ? '...' : 'Get Hint'),
                      ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _answerController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: _language == _Lang.french
                            ? 'Répondez en français...'
                            : 'Type your answer in English...',
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerRight,
                      child: FilledButton(
                        onPressed: _answerController.text.trim().isEmpty ||
                                _evaluating
                            ? null
                            : _submitAnswer,
                        child: Text(_evaluating ? 'Evaluating...' : 'Submit Answer'),
                      ),
                    ),
                  ] else if (_showResult && _questionEvaluation != null) ...[
                    _buildEvaluation(_questionEvaluation!),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => setState(() => _showResult = false),
                        child: const Text('Dismiss'),
                      ),
                    ),
                  ] else
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.check_circle,
                              color: Colors.green.shade600),
                          const SizedBox(width: 8),
                          const Text('Answered'),
                          const Spacer(),
                          TextButton(
                            onPressed: () => setState(() => _showResult = true),
                            child: const Text('View Result'),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: qIndex > 0
                            ? () => _selectQuestion(questions[qIndex - 1].id)
                            : null,
                        child: const Text('Previous'),
                      ),
                      TextButton(
                        onPressed: qIndex < questions.length - 1
                            ? () => _selectQuestion(questions[qIndex + 1].id)
                            : null,
                        child: const Text('Next'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (interview.isCompleted) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text('Overall Results',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _scoreTile(
                            context,
                            _overallAverage.toString(),
                            'Average',
                            _overallAverage),
                        _scoreTile(context,
                            '${interview.evaluations.length}', 'Answered', null),
                        _scoreTile(context,
                            '${interview.questions.length}', 'Total', null),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ],
    );
  }

  Widget _scoreTile(BuildContext context, String value, String label, int? colorRef) {
    final color = colorRef == null
        ? Theme.of(context).colorScheme.primary
        : colorRef >= 70
            ? Colors.green.shade600
            : colorRef >= 40
                ? Colors.orange.shade600
                : Colors.red.shade600;
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: color)),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }

  Widget _buildEvaluation(PracticeEvaluation ev) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _evalBox('Grammar', ev.grammarScore),
            const SizedBox(width: 8),
            _evalBox('Confidence', ev.confidenceScore),
            const SizedBox(width: 8),
            _evalBox('Technical', ev.technicalScore),
          ],
        ),
        if (ev.feedback.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Feedback',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.blue.shade800)),
                const SizedBox(height: 4),
                Text(ev.feedback),
              ],
            ),
          ),
        ],
        if (ev.improvedAnswer.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Improved Answer',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.green.shade800)),
                const SizedBox(height: 4),
                Text(ev.improvedAnswer),
              ],
            ),
          ),
        ],
        if (ev.corrections.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Corrections',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.amber.shade800)),
                const SizedBox(height: 8),
                ...ev.corrections.map((c) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text.rich(
                            TextSpan(
                              children: [
                                TextSpan(
                                  text: c.original,
                                  style: const TextStyle(
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                                const TextSpan(text: '  →  '),
                                TextSpan(
                                  text: c.corrected,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                          Text(c.explanation,
                              style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _evalBox(String label, int score) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(score.toString(),
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold)),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
