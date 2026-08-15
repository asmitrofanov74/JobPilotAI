import 'package:flutter/material.dart';

import '../french/french_models.dart';
import '../french/french_repository.dart';
import 'french_conversation_screen.dart';

class FrenchCoachScreen extends StatefulWidget {
  const FrenchCoachScreen({super.key});

  @override
  State<FrenchCoachScreen> createState() => _FrenchCoachScreenState();
}

class _FrenchCoachScreenState extends State<FrenchCoachScreen> {
  final FrenchRepository _repository = FrenchRepository();

  List<FrenchConversation>? _conversations;
  bool _loading = true;
  String? _error;
  FrenchScenario? _selectedScenario;

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
      final conversations = await _repository.listConversations();
      if (!mounted) return;
      setState(() {
        _conversations = conversations;
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

  Future<void> _startConversation() async {
    final scenario = _selectedScenario;
    if (scenario == null) return;

    String? jobDescription;
    if (scenario.value == 'CUSTOM_JOB') {
      final controller = TextEditingController();
      jobDescription = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Job description'),
          content: TextField(
            controller: controller,
            maxLines: 5,
            decoration: const InputDecoration(
              hintText: 'Paste the job description here...',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, controller.text.trim()),
              child: const Text('Start'),
            ),
          ],
        ),
      );
    }

    if (jobDescription == null && scenario.value == 'CUSTOM_JOB') return;
    if (!mounted) return;

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => FrenchConversationScreen(
          scenario: scenario.value,
          jobDescription: jobDescription,
          isNew: true,
        ),
      ),
    ).then((_) => _load());
  }

  void _openConversation(FrenchConversation conversation) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => FrenchConversationScreen(
          conversation: conversation,
          scenario: conversation.scenario,
          isNew: false,
        ),
      ),
    ).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('French Coach'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
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
        Text('Choose a scenario', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...frenchScenarios.map((scenario) {
          final selected = _selectedScenario?.value == scenario.value;
          return Card(
            child: ListTile(
              leading: Icon(
                _scenarioIcon(scenario.value),
                color: Theme.of(context).colorScheme.primary,
              ),
              title: Text(scenario.label),
              subtitle: Text(scenario.description),
              trailing: selected
                  ? const Icon(Icons.check_circle, color: Colors.green)
                  : const Icon(Icons.radio_button_unchecked),
              onTap: () {
                setState(() => _selectedScenario = scenario);
              },
            ),
          );
        }),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: _selectedScenario == null
              ? null
              : _startConversation,
          icon: const Icon(Icons.play_arrow),
          label: const Text('Start the interview'),
        ),
        if (_conversations != null && _conversations!.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text('Past conversations', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ..._conversations!.map((conv) => Card(
                child: ListTile(
                  leading: Icon(
                    _scenarioIcon(conv.scenario),
                    color: Theme.of(context).colorScheme.secondary,
                  ),
                  title: Text(
                    scenarioFor(conv.scenario).label,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    conv.messages.isNotEmpty
                        ? conv.messages.last.content
                        : 'No messages yet',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _openConversation(conv),
                ),
              )),
        ],
      ],
    );
  }

  static IconData _scenarioIcon(String scenario) {
    switch (scenario) {
      case 'JOB_INTERVIEW':
        return Icons.record_voice_over;
      case 'RECRUITER_CALL':
        return Icons.call;
      case 'TEAM_MEETING':
        return Icons.groups;
      case 'DAILY_STANDUP':
        return Icons.wb_sunny;
      case 'OFFICE_CONVERSATION':
        return Icons.chat;
      case 'CUSTOM_JOB':
        return Icons.work;
      default:
        return Icons.forum;
    }
  }
}
