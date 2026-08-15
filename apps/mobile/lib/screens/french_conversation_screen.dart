import 'package:flutter/material.dart';

import '../french/french_models.dart';
import '../french/french_repository.dart';
import '../french/tts_service.dart';

class FrenchConversationScreen extends StatefulWidget {
  final String scenario;
  final String? jobDescription;
  final FrenchConversation? conversation;
  final bool isNew;

  const FrenchConversationScreen({
    super.key,
    required this.scenario,
    this.jobDescription,
    this.conversation,
    required this.isNew,
  });

  @override
  State<FrenchConversationScreen> createState() => _FrenchConversationScreenState();
}

class _FrenchConversationScreenState extends State<FrenchConversationScreen> {
  final FrenchRepository _repository = FrenchRepository();
  final TtsService _tts = TtsService.instance;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<FrenchMessage> _messages = [];
  String? _conversationId;
  bool _loading = true;
  bool _sending = false;
  String? _error;
  String? _lastSpokenMessageId;

  @override
  void initState() {
    super.initState();
    _conversationId = widget.conversation?.id;
    if (widget.conversation != null) {
      _messages = List.of(widget.conversation!.messages);
    }
    _load();
  }

  Future<void> _load() async {
    if (_conversationId == null) {
      if (widget.isNew) {
        await _start();
      } else {
        setState(() => _loading = false);
      }
      return;
    }
    setState(() => _loading = true);
    try {
      final conversation = await _repository.getConversation(_conversationId!);
      if (!mounted) return;
      setState(() {
        _messages = conversation.messages;
        _loading = false;
      });
      _scrollToBottom();
      _autoSpeakLast();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _start() async {
    setState(() => _loading = true);
    try {
      final result = await _repository.start(
        scenario: widget.scenario,
        jobDescription: widget.jobDescription,
      );
      if (!mounted) return;
      setState(() {
        _conversationId = result.conversationId;
        _messages = [result.response];
        _loading = false;
      });
      _scrollToBottom();
      _autoSpeakLast();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _autoSpeakLast() {
    if (_messages.isEmpty) return;
    final last = _messages.last;
    if (last.isUser) return;
    if (last.id == _lastSpokenMessageId) return;
    _lastSpokenMessageId = last.id;
    _speak(last);
  }

  Future<void> _speak(FrenchMessage message) async {
    if (message.isUser) return;
    try {
      await _tts.speak(message.content, male: true, messageId: message.id);
    } catch (e) {
      debugPrint('TTS failed: $e');
    }
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _sending) return;
    if (_conversationId == null) return;

    setState(() {
      _sending = true;
      _error = null;
      _messages = [
        ..._messages,
        FrenchMessage(
          id: 'local-${DateTime.now().millisecondsSinceEpoch}',
          role: 'user',
          content: text,
        ),
      ];
    });
    _messageController.clear();
    _scrollToBottom();

    try {
      final result = await _repository.sendMessage(
        conversationId: _conversationId!,
        content: text,
      );
      if (!mounted) return;
      setState(() {
        _messages = [..._messages, result.response];
        _sending = false;
      });
      _scrollToBottom();
      _autoSpeakLast();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _sending = false;
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.conversation?.scenario.isNotEmpty == true
              ? scenarioFor(widget.conversation!.scenario).label
              : scenarioFor(widget.scenario).label,
        ),
      ),
      body: Column(
        children: [
          Expanded(child: _buildMessages()),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildMessages() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_messages.isEmpty) {
      return const Center(
        child: Text('Start the conversation with the recruiter.'),
      );
    }
    return ValueListenableBuilder<bool>(
      valueListenable: _tts.speaking,
      builder: (context, speaking, _) {
        return ListView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.all(16),
          itemCount: _messages.length,
          itemBuilder: (context, index) {
            final message = _messages[index];
            return _MessageBubble(
              message: message,
              speaking: speaking && _tts.isSpeaking(message.id),
              onSpeak: message.isUser ? null : () => _speak(message),
              onStop: _tts.stop,
            );
          },
        );
      },
    );
  }

  Widget _buildInputBar() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(
            top: BorderSide(color: Theme.of(context).dividerColor),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: const InputDecoration(
                  hintText: 'Type your answer...',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: _sending ? null : _send,
              icon: _sending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final FrenchMessage message;
  final bool speaking;
  final VoidCallback? onSpeak;
  final VoidCallback? onStop;

  const _MessageBubble({
    required this.message,
    required this.speaking,
    this.onSpeak,
    this.onStop,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    final scheme = Theme.of(context).colorScheme;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.8,
        ),
        decoration: BoxDecoration(
          color: isUser ? scheme.primary : scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isUser ? 16 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message.content,
              style: TextStyle(
                color: isUser ? scheme.onPrimary : scheme.onSurface,
                fontSize: 16,
                height: 1.4,
              ),
            ),
            if (message.evaluation != null) ...[
              const SizedBox(height: 8),
              _EvaluationChip(
                grammar: message.evaluation!.grammarScore,
                vocabulary: message.evaluation!.vocabularyScore,
                fluency: message.evaluation!.fluencyScore,
              ),
              if (message.evaluation!.improvedVersion?.isNotEmpty == true) ...[
                const SizedBox(height: 6),
                Text(
                  'Improved: ${message.evaluation!.improvedVersion}',
                  style: TextStyle(
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    color: isUser ? scheme.onPrimary : scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ],
            if (!isUser)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      icon: Icon(
                        speaking ? Icons.stop_circle : Icons.volume_up,
                        size: 20,
                        color: scheme.primary,
                      ),
                      onPressed: speaking ? onStop : onSpeak,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _EvaluationChip extends StatelessWidget {
  final num? grammar;
  final num? vocabulary;
  final num? fluency;

  const _EvaluationChip({
    this.grammar,
    this.vocabulary,
    this.fluency,
  });

  @override
  Widget build(BuildContext context) {
    final values = [
      if (grammar != null) ('Grammar', grammar!),
      if (vocabulary != null) ('Vocab', vocabulary!),
      if (fluency != null) ('Fluency', fluency!),
    ];
    if (values.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 8,
      children: values
          .map((e) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.secondaryContainer,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${e.$1} ${(e.$2 * 100).round()}%',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSecondaryContainer,
                  ),
                ),
              ))
          .toList(),
    );
  }
}
