import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  TtsService._();
  static final TtsService instance = TtsService._();

  final FlutterTts _tts = FlutterTts();
  bool _initialized = false;
  String _selectedVoice = '';
  String? _speakingId;
  final ValueNotifier<bool> speaking = ValueNotifier(false);

  static const _maleHints = [
    'male', 'homme', 'mister', 'mr', 'thomas', 'henri', 'jacques',
    'jean', 'pierre', 'mark', 'daniel', 'alex', 'nicolas', 'antoine',
  ];
  static const _femaleHints = [
    'female', 'femme', 'miss', 'ms', 'susan', 'zira', 'amelie',
    'marie', 'julie', 'sophie', 'amanda', 'samantha', 'emma', 'allison',
  ];
  static const _qualityHints = [
    'natural', 'neural', 'online', 'enhanced', 'premium', 'high', 'google',
  ];
  static const _roboticHints = [
    'robot', 'compact', 'mini', 'console', 'monotone',
  ];

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    await _tts.awaitSpeakCompletion(false);
    await _tts.awaitSynthCompletion(false);
    _tts.setCompletionHandler(() {
      _speakingId = null;
      speaking.value = false;
    });
    _tts.setCancelHandler(() {
      _speakingId = null;
      speaking.value = false;
    });
    _tts.setErrorHandler((message) {
      debugPrint('TTS error: $message');
      _speakingId = null;
      speaking.value = false;
    });
    _tts.setPauseHandler(() {
      speaking.value = false;
    });
    _tts.setContinueHandler(() {
      speaking.value = true;
    });
  }

  Future<List<String>> availableVoices() async {
    await init();
    try {
      final voices = await _tts.getVoices;
      if (voices is List) {
        return voices.map((v) => v.toString()).toList();
      }
    } catch (e) {
      debugPrint('getVoices failed: $e');
    }
    return [];
  }

  int _scoreVoice(String id, String name, String language, {bool male = true}) {
    final lower = '$id $name $language'.toLowerCase();
    var score = 0;

    final isMale = lower.contains('male') ||
        _maleHints.any((h) => lower.contains(h));
    final isFemale = lower.contains('female') ||
        _femaleHints.any((h) => lower.contains(h));

    if (isMale && male) score += 250;
    if (isFemale && !male) score += 250;
    if (isMale && !male) score -= 120;
    if (isFemale && male) score -= 120;

    for (final q in _qualityHints) {
      if (lower.contains(q)) score += 80;
    }
    for (final r in _roboticHints) {
      if (lower.contains(r)) score -= 100;
    }

    if (lower.contains('fr')) score += 60;
    if (lower.contains('fr-fr')) score += 60;
    if (lower.contains('fr-ca') || lower.contains('fr_CA')) score += 30;

    return score;
  }

  Future<void> _selectBestFrenchVoice({required bool male}) async {
    try {
      final voices = await availableVoices();
      if (voices.isEmpty) return;

      Map<String, String>? best;
      var bestScore = -100000;
      for (final raw in voices) {
        final lower = raw.toLowerCase();
        if (!lower.contains('fr')) continue;

        final nameMatch = RegExp("'?name'?\\s*:\\s*['\"]([^'\"]+)['\"]")
            .firstMatch(lower);
        final langMatch = RegExp("'?locale'?\\s*:\\s*['\"]([^'\"]+)['\"]")
            .firstMatch(lower);
        final idMatch = RegExp("'?id'?\\s*:\\s*['\"]([^'\"]+)['\"]")
            .firstMatch(lower);

        final id = idMatch?.group(1);
        final name = nameMatch?.group(1) ?? '';
        final lang = langMatch?.group(1) ?? '';

        final score = _scoreVoice(id ?? name, name, lang, male: male);
        if (score > bestScore) {
          bestScore = score;
          best = <String, String>{
            'name': name,
            if (lang.isNotEmpty) 'locale': lang,
          };
        }
      }

      if (best != null) {
        final marker = '${best['name']}|${best['locale']}';
        if (marker != _selectedVoice) {
          _selectedVoice = marker;
          await _tts.setVoice(best);
        }
      }
    } catch (e) {
      debugPrint('Voice selection failed: $e');
    }
  }

  Future<void> speak(String text, {required bool male, String? messageId}) async {
    await init();
    await _selectBestFrenchVoice(male: male);
    await _tts.setLanguage('fr-FR');
    await _tts.setSpeechRate(0.5);
    await _tts.setPitch(1.0);
    if (male) {
      await _tts.setPitch(0.85);
    }
    _speakingId = messageId;
    speaking.value = true;
    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
    _speakingId = null;
    speaking.value = false;
  }

  bool isSpeaking(String messageId) => _speakingId == messageId && speaking.value;

  void dispose() {
    _tts.stop();
    speaking.dispose();
  }
}
