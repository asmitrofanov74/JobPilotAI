import '../graphql/graphql_service.dart';
import 'vocabulary_models.dart';

class VocabularyRepository {
  static const String listDocument = r'''
    query FrenchVocabulary($filter: VocabularyFilterInput) {
      frenchVocabulary(filter: $filter) {
        id
        word
        translation
        context
        note
        difficulty
        timesReviewed
        timesCorrect
        nextReviewAt
        mastered
        createdAt
        updatedAt
      }
    }
  ''';

  static const String statsDocument = r'''
    query FrenchVocabularyStats {
      frenchVocabularyStats {
        total
        mastered
        dueForReview
        difficultyBreakdown
      }
    }
  ''';

  static const String addDocument = r'''
    mutation AddFrenchVocabularyWord($input: AddVocabularyWordInput!) {
      addFrenchVocabularyWord(input: $input) {
        id
        word
        translation
        context
        note
        difficulty
        mastered
      }
    }
  ''';

  static const String reviewDocument = r'''
    mutation ReviewFrenchVocabularyWord($input: ReviewVocabularyWordInput!) {
      reviewFrenchVocabularyWord(input: $input) {
        id
        word
        difficulty
        timesReviewed
        timesCorrect
        nextReviewAt
        mastered
      }
    }
  ''';

  static const String deleteDocument = r'''
    mutation DeleteFrenchVocabularyWord($wordId: String!) {
      deleteFrenchVocabularyWord(wordId: $wordId)
    }
  ''';

  static const String extractDocument = r'''
    mutation ExtractFrenchVocabulary($conversationId: String!) {
      extractFrenchVocabulary(conversationId: $conversationId) {
        id
        word
        translation
        context
        difficulty
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<List<FrenchVocabWord>> list({
    bool? mastered,
    String? difficulty,
  }) async {
    final filter = <String, dynamic>{
      'mastered': ?mastered,
      if (difficulty != null && difficulty.isNotEmpty) 'difficulty': difficulty,
    };
    final result = await _service.request(
      document: listDocument,
      variables: {
        'filter': filter,
      },
    );
    if (result.hasException) throw result.exception!;
    final list = (result.data?['frenchVocabulary'] as List<dynamic>? ?? [])
        .map((w) => FrenchVocabWord.fromJson(w as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<VocabularyStats> stats() async {
    final result = await _service.request(document: statsDocument);
    if (result.hasException) throw result.exception!;
    final data = result.data?['frenchVocabularyStats'] as Map<String, dynamic>?;
    return VocabularyStats.fromJson(data ?? const {});
  }

  Future<FrenchVocabWord> add({
    required String word,
    required String translation,
    String? context,
    String? note,
  }) async {
    final result = await _service.mutate(
      document: addDocument,
      variables: {
        'input': {
          'word': word,
          'translation': translation,
          if (context != null && context.isNotEmpty) 'context': context,
          if (note != null && note.isNotEmpty) 'note': note,
        },
      },
    );
    if (result.hasException) throw result.exception!;
    final data =
        result.data?['addFrenchVocabularyWord'] as Map<String, dynamic>?;
    if (data == null) throw Exception('Could not add word');
    return FrenchVocabWord.fromJson(data);
  }

  Future<FrenchVocabWord> review({
    required String wordId,
    required int score,
  }) async {
    final result = await _service.mutate(
      document: reviewDocument,
      variables: {
        'input': {'wordId': wordId, 'score': score},
      },
    );
    if (result.hasException) throw result.exception!;
    final data =
        result.data?['reviewFrenchVocabularyWord'] as Map<String, dynamic>?;
    if (data == null) throw Exception('Could not review word');
    return FrenchVocabWord.fromJson(data);
  }

  Future<void> delete(String wordId) async {
    final result = await _service.mutate(
      document: deleteDocument,
      variables: {'wordId': wordId},
    );
    if (result.hasException) throw result.exception!;
  }

  Future<List<FrenchVocabWord>> extract(String conversationId) async {
    final result = await _service.mutate(
      document: extractDocument,
      variables: {'conversationId': conversationId},
    );
    if (result.hasException) throw result.exception!;
    final list = (result.data?['extractFrenchVocabulary'] as List<dynamic>? ?? [])
        .map((w) => FrenchVocabWord.fromJson(w as Map<String, dynamic>))
        .toList();
    return list;
  }
}
