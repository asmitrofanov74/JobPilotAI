import 'package:flutter/material.dart';

import '../french/french_repository.dart';
import '../vocabulary/vocabulary_models.dart';
import '../vocabulary/vocabulary_repository.dart';

class VocabularyScreen extends StatefulWidget {
  const VocabularyScreen({super.key});

  @override
  State<VocabularyScreen> createState() => _VocabularyScreenState();
}

class _VocabularyScreenState extends State<VocabularyScreen> {
  final VocabularyRepository _repository = VocabularyRepository();
  final FrenchRepository _frenchRepository = FrenchRepository();

  String _filter = 'all';
  String _difficulty = '';
  String _search = '';
  List<FrenchVocabWord>? _words;
  VocabularyStats? _stats;
  bool _loading = true;
  bool _saving = false;
  bool _extracting = false;
  String? _error;
  String? _extractResult;
  bool _reviewMode = false;
  int _reviewIndex = 0;
  bool _showAnswer = false;

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
      final results = await Future.wait([
        _repository.list(
          mastered: _filter == 'mastered'
              ? true
              : _filter == 'due'
                  ? false
                  : null,
          difficulty: _difficulty,
        ),
        _repository.stats(),
      ]);
      if (!mounted) return;
      setState(() {
        _words = results[0] as List<FrenchVocabWord>;
        _stats = results[1] as VocabularyStats;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  List<FrenchVocabWord> get _filteredWords {
    final words = _words ?? const <FrenchVocabWord>[];
    if (_search.trim().isEmpty) return words;
    final q = _search.trim().toLowerCase();
    return words
        .where((w) =>
            w.word.toLowerCase().contains(q) ||
            w.translation.toLowerCase().contains(q))
        .toList();
  }

  List<FrenchVocabWord> get _dueWords {
    final words = _words ?? const <FrenchVocabWord>[];
    final sorted = words.where((w) => !w.mastered).toList()
      ..sort((a, b) {
        final at = a.nextReviewAt?.millisecondsSinceEpoch ?? 0;
        final bt = b.nextReviewAt?.millisecondsSinceEpoch ?? 0;
        return at.compareTo(bt);
      });
    return sorted;
  }

  Future<void> _addWord({
    required String word,
    required String translation,
    String? contextSentence,
    String? note,
  }) async {
    setState(() => _saving = true);
    try {
      await _repository.add(
        word: word,
        translation: translation,
        context: contextSentence,
        note: note,
      );
      if (!mounted) return;
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add word: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteWord(FrenchVocabWord word) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete word'),
        content: Text('Delete "${word.word}" from your vocabulary?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _repository.delete(word.id);
      if (!mounted) return;
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete word: $e')),
      );
    }
  }

  Future<void> _extractFromConversation() async {
    final conversations = await _frenchRepository.listConversations();
    if (!mounted) return;
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Extract words from a conversation',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            if (conversations.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text('No conversations yet. Start a French Coach '
                    'conversation first.'),
              ),
            ...conversations.map((conv) => ListTile(
                  leading: const Icon(Icons.forum_outlined),
                  title: Text(
                    scenarioFor(conv.scenario).label,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    '${conv.messages.length} messages',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pop(context, conv.id),
                )),
          ],
        ),
      ),
    );
    if (selected == null) return;

    setState(() {
      _extracting = true;
      _extractResult = null;
    });
    try {
      final words = await _repository.extract(selected);
      if (!mounted) return;
      setState(() {
        _extracting = false;
        _extractResult = 'Extracted ${words.length} new word${words.length == 1 ? '' : 's'}!';
      });
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _extracting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Extraction failed: $e')),
      );
    }
  }

  Future<void> _showAddDialog() async {
    final wordController = TextEditingController();
    final translationController = TextEditingController();
    final contextController = TextEditingController();
    final noteController = TextEditingController();

    final submitted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Word'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: wordController,
                autofocus: true,
                decoration: const InputDecoration(labelText: 'French word'),
              ),
              TextField(
                controller: translationController,
                decoration: const InputDecoration(labelText: 'English translation'),
              ),
              TextField(
                controller: contextController,
                decoration: const InputDecoration(labelText: 'Context sentence'),
              ),
              TextField(
                controller: noteController,
                decoration: const InputDecoration(labelText: 'Personal note'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: _saving
                ? null
                : () {
                    if (wordController.text.trim().isEmpty ||
                        translationController.text.trim().isEmpty) {
                      return;
                    }
                    Navigator.pop(context, true);
                  },
            child: const Text('Save Word'),
          ),
        ],
      ),
    );

    if (submitted == true) {
      await _addWord(
        word: wordController.text.trim(),
        translation: translationController.text.trim(),
        contextSentence: contextController.text.trim(),
        note: noteController.text.trim(),
      );
    }
  }

  Future<void> _startReview() async {
    final due = _dueWords;
    if (due.isEmpty) return;
    setState(() {
      _reviewMode = true;
      _reviewIndex = 0;
      _showAnswer = false;
    });
  }

  Future<void> _rateWord(int score) async {
    final due = _dueWords;
    if (_reviewIndex >= due.length) return;
    final word = due[_reviewIndex];
    try {
      await _repository.review(wordId: word.id, score: score);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Review failed: $e')),
      );
    }
    if (!mounted) return;
    setState(() {
      _showAnswer = false;
      if (_reviewIndex < due.length - 1) {
        _reviewIndex++;
      } else {
        _reviewMode = false;
        _reviewIndex = 0;
      }
    });
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final dueCount = _dueWords.length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vocabulary Builder'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: _buildBody(dueCount),
    );
  }

  Widget _buildBody(int dueCount) {
    if (_loading && _words == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _words == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _load,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildStats(),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: FilledButton.tonalIcon(
                onPressed: _showAddDialog,
                icon: const Icon(Icons.add),
                label: const Text('Add Word'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FilledButton.tonalIcon(
                onPressed: _extractFromConversation,
                icon: _extracting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.auto_awesome),
                label: const Text('Extract'),
              ),
            ),
          ],
        ),
        if (_extractResult != null) ...[
          const SizedBox(height: 8),
          Text(
            _extractResult!,
            style: TextStyle(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
        const SizedBox(height: 16),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'all', label: Text('All')),
            ButtonSegment(value: 'due', label: Text('Due')),
            ButtonSegment(value: 'mastered', label: Text('Mastered')),
          ],
          selected: {_filter},
          onSelectionChanged: (s) {
            setState(() => _filter = s.first);
            _load();
          },
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                initialValue: _difficulty,
                decoration: const InputDecoration(
                  labelText: 'Difficulty',
                  isDense: true,
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: '', child: Text('All Levels')),
                  DropdownMenuItem(value: 'easy', child: Text('Easy')),
                  DropdownMenuItem(value: 'medium', child: Text('Medium')),
                  DropdownMenuItem(value: 'hard', child: Text('Hard')),
                ],
                onChanged: (v) {
                  setState(() => _difficulty = v ?? '');
                  _load();
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Search words…',
                  isDense: true,
                  prefixIcon: Icon(Icons.search, size: 20),
                  border: OutlineInputBorder(),
                ),
                onChanged: (v) => setState(() => _search = v),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (dueCount > 0) ...[
          FilledButton.icon(
            onPressed: _startReview,
            icon: const Icon(Icons.psychology),
            label: Text('Review ($dueCount)'),
          ),
          const SizedBox(height: 16),
        ],
        if (_reviewMode)
          _buildReviewCard()
        else if (_filteredWords.isEmpty)
          _buildEmptyState()
        else
          ..._filteredWords.map(_buildWordCard),
      ],
    );
  }

  Widget _buildStats() {
    final stats = _stats ?? const VocabularyStats();
    final breakdown = stats.difficultyBreakdown;
    return Row(
      children: [
        Expanded(
          child: _StatChip(
            icon: Icons.menu_book,
            label: 'Total',
            value: '${stats.total}',
            color: Colors.blue,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatChip(
            icon: Icons.check_circle,
            label: 'Mastered',
            value: '${stats.mastered}',
            color: Colors.green,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatChip(
            icon: Icons.schedule,
            label: 'Due',
            value: '${stats.dueForReview}',
            color: Colors.orange,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatChip(
            icon: Icons.signal_cellular_alt,
            label: 'E/M/H',
            value: '${breakdown['easy'] ?? 0} / ${breakdown['medium'] ?? 0} / ${breakdown['hard'] ?? 0}',
            color: Colors.purple,
          ),
        ),
      ],
    );
  }

  Widget _buildReviewCard() {
    final due = _dueWords;
    if (due.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(Icons.check_circle, color: Colors.green, size: 40),
              SizedBox(height: 8),
              Text('All Caught Up', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('No words due for review'),
            ],
          ),
        ),
      );
    }
    final word = due[_reviewIndex];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Review ${_reviewIndex + 1} of ${due.length}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                TextButton(
                  onPressed: () => setState(() {
                    _reviewMode = false;
                    _reviewIndex = 0;
                    _showAnswer = false;
                  }),
                  child: const Text('Exit'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              word.word,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            if (word.context != null && word.context!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                '“${word.context}”',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontStyle: FontStyle.italic,
                    ),
              ),
            ],
            const SizedBox(height: 16),
            if (!_showAnswer)
              FilledButton.icon(
                onPressed: () => setState(() => _showAnswer = true),
                icon: const Icon(Icons.visibility),
                label: const Text('Show Answer'),
              )
            else ...[
              Text(
                word.translation,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'How well do you know this?',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 8),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                children: [1, 2, 3, 4, 5].map((score) {
                  return FilledButton.tonal(
                    onPressed: () => _rateWord(score),
                    child: Text(
                      score == 1
                          ? 'Forgot'
                          : score == 5
                              ? 'Easy'
                              : '$score',
                    ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Icon(
              Icons.menu_book,
              size: 48,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 12),
            Text(
              'No Vocabulary Words',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              'Add your first word to get started',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWordCard(FrenchVocabWord word) {
    final scheme = Theme.of(context).colorScheme;
    final percent = word.timesReviewed > 0
        ? (word.timesCorrect / word.timesReviewed * 100).round()
        : 0;
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        word.word,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        word.translation,
                        style: TextStyle(color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                if (word.mastered)
                  const Padding(
                    padding: EdgeInsets.only(right: 6),
                    child: Icon(Icons.star, color: Colors.amber, size: 18),
                  ),
                _DifficultyBadge(difficulty: word.difficulty),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.delete_outline, size: 20),
                  color: scheme.outline,
                  onPressed: () => _deleteWord(word),
                ),
              ],
            ),
            if (word.context != null && word.context!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  '“${word.context}”',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontStyle: FontStyle.italic,
                        color: scheme.onSurfaceVariant,
                      ),
                ),
              ),
            if (word.note != null && word.note!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  word.note!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Reviewed ${word.timesReviewed}x · $percent% correct',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: scheme.outline,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _DifficultyBadge extends StatelessWidget {
  final String difficulty;

  const _DifficultyBadge({required this.difficulty});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg) = switch (difficulty) {
      'easy' => (Colors.green.shade100, Colors.green.shade900),
      'hard' => (Colors.red.shade100, Colors.red.shade900),
      _ => (Colors.amber.shade100, Colors.amber.shade900),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        difficulty,
        style: TextStyle(fontSize: 11, color: fg),
      ),
    );
  }
}
