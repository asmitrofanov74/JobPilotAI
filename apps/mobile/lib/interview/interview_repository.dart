import '../graphql/graphql_service.dart';
import 'interview_models.dart';

class GenerateQuestionsResult {
  final List<PracticeQuestion> questions;
  final PracticeInterview interview;

  const GenerateQuestionsResult({
    required this.questions,
    required this.interview,
  });
}

class EvaluateAnswerResult {
  final PracticeEvaluation evaluation;
  final PracticeInterview interview;

  const EvaluateAnswerResult({
    required this.evaluation,
    required this.interview,
  });
}

class InterviewRepository {
  static const String frenchListDocument = r'''
    query FrenchInterviews {
      frenchInterviews {
        id
        scenario
        questionCount
        status
        questions
        answers
        evaluations
        overallScore
        createdAt
      }
    }
  ''';

  static const String frenchGetDocument = r'''
    query FrenchInterview($id: String!) {
      frenchInterview(id: $id) {
        id
        scenario
        questionCount
        status
        questions
        answers
        evaluations
        overallScore
        createdAt
      }
    }
  ''';

  static const String frenchGenerateDocument = r'''
    mutation GenerateFrenchInterviewQuestions($input: GenerateInterviewQuestionsInput!) {
      generateFrenchInterviewQuestions(input: $input) {
        questions {
          id
          question
          category
        }
        interview {
          id
          scenario
          questionCount
          status
          overallScore
          createdAt
        }
      }
    }
  ''';

  static const String frenchEvaluateDocument = r'''
    mutation EvaluateFrenchInterviewAnswer($input: EvaluateInterviewAnswerInput!) {
      evaluateFrenchInterviewAnswer(input: $input) {
        evaluation {
          questionId
          grammarScore
          confidenceScore
          technicalScore
          feedback
          improvedAnswer
          corrections
        }
        interview {
          id
          status
          overallScore
          answers
          evaluations
        }
      }
    }
  ''';

  static const String frenchHintDocument = r'''
    mutation GenerateFrenchInterviewHint($input: GenerateInterviewHintInput!) {
      generateFrenchInterviewHint(input: $input) {
        hint
        keyPoints
        exampleAnswer
      }
    }
  ''';

  static const String englishListDocument = r'''
    query EnglishInterviews {
      englishInterviews {
        id
        scenario
        questionCount
        status
        questions
        answers
        evaluations
        overallScore
        createdAt
      }
    }
  ''';

  static const String englishGetDocument = r'''
    query EnglishInterview($id: String!) {
      englishInterview(id: $id) {
        id
        scenario
        questionCount
        status
        questions
        answers
        evaluations
        overallScore
        createdAt
      }
    }
  ''';

  static const String englishGenerateDocument = r'''
    mutation GenerateEnglishInterviewQuestions($input: GenerateEnglishInterviewInput!) {
      generateEnglishInterviewQuestions(input: $input) {
        questions {
          id
          question
          category
        }
        interview {
          id
          scenario
          questionCount
          status
          overallScore
          createdAt
        }
      }
    }
  ''';

  static const String englishEvaluateDocument = r'''
    mutation EvaluateEnglishInterviewAnswer($input: EvaluateEnglishAnswerInput!) {
      evaluateEnglishInterviewAnswer(input: $input) {
        evaluation {
          questionId
          grammarScore
          confidenceScore
          technicalScore
          feedback
          improvedAnswer
          corrections
        }
        interview {
          id
          status
          overallScore
          answers
          evaluations
        }
      }
    }
  ''';

  static const String englishHintDocument = r'''
    mutation GenerateEnglishInterviewHint($input: GenerateEnglishHintInput!) {
      generateEnglishInterviewHint(input: $input) {
        hint
        keyPoints
        exampleAnswer
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<List<PracticeInterview>> list({required bool french}) async {
    final result = await _service.request(
      document: french ? frenchListDocument : englishListDocument,
    );
    if (result.hasException) throw result.exception!;
    final key = french ? 'frenchInterviews' : 'englishInterviews';
    final list = (result.data?[key] as List<dynamic>? ?? [])
        .map((i) => PracticeInterview.fromJson(i as Map<String, dynamic>)
            .copyWith(french: french))
        .toList();
    return list;
  }

  Future<PracticeInterview> get({required String id, required bool french}) async {
    final result = await _service.request(
      document: french ? frenchGetDocument : englishGetDocument,
      variables: {'id': id},
    );
    if (result.hasException) throw result.exception!;
    final key = french ? 'frenchInterview' : 'englishInterview';
    final data = result.data?[key] as Map<String, dynamic>?;
    if (data == null) throw Exception('Interview not found');
    return PracticeInterview.fromJson(data).copyWith(french: french);
  }

  Future<GenerateQuestionsResult> generate({
    required bool french,
    required String scenario,
    required int questionCount,
    String? jobDescription,
  }) async {
    final result = await _service.mutate(
      document: french ? frenchGenerateDocument : englishGenerateDocument,
      variables: {
        'input': {
          'scenario': scenario,
          'questionCount': questionCount,
          if (jobDescription != null && jobDescription.isNotEmpty)
            'jobDescription': jobDescription,
        },
      },
    );
    if (result.hasException) throw result.exception!;
    final key = french
        ? 'generateFrenchInterviewQuestions'
        : 'generateEnglishInterviewQuestions';
    final data = result.data?[key] as Map<String, dynamic>?;
    if (data == null) throw Exception('Could not generate questions');
    return GenerateQuestionsResult(
      questions: (data['questions'] as List<dynamic>? ?? [])
          .map((q) => PracticeQuestion.fromJson(q as Map<String, dynamic>))
          .toList(),
      interview: PracticeInterview.fromJson(
              data['interview'] as Map<String, dynamic>)
          .copyWith(french: french),
    );
  }

  Future<EvaluateAnswerResult> evaluate({
    required bool french,
    required String interviewId,
    required String questionId,
    required String answer,
  }) async {
    final result = await _service.mutate(
      document: french ? frenchEvaluateDocument : englishEvaluateDocument,
      variables: {
        'input': {
          'interviewId': interviewId,
          'questionId': questionId,
          'answer': answer,
        },
      },
    );
    if (result.hasException) throw result.exception!;
    final key = french
        ? 'evaluateFrenchInterviewAnswer'
        : 'evaluateEnglishInterviewAnswer';
    final data = result.data?[key] as Map<String, dynamic>?;
    if (data == null) throw Exception('Could not evaluate answer');
    return EvaluateAnswerResult(
      evaluation: PracticeEvaluation.fromJson(
          data['evaluation'] as Map<String, dynamic>),
      interview: PracticeInterview.fromJson(
              data['interview'] as Map<String, dynamic>)
          .copyWith(french: french),
    );
  }

  Future<PracticeHint> hint({
    required bool french,
    required String interviewId,
    required String questionId,
  }) async {
    final result = await _service.mutate(
      document: french ? frenchHintDocument : englishHintDocument,
      variables: {
        'input': {
          'interviewId': interviewId,
          'questionId': questionId,
        },
      },
    );
    if (result.hasException) throw result.exception!;
    final key = french
        ? 'generateFrenchInterviewHint'
        : 'generateEnglishInterviewHint';
    final data = result.data?[key] as Map<String, dynamic>?;
    if (data == null) throw Exception('Could not generate hint');
    return PracticeHint.fromJson(data);
  }
}
